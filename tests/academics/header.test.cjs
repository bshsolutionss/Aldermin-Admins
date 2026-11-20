async function register() {
  const { test } = await import('node:test');
  const assert = (await import('node:assert/strict')).default;
  const { loadTs } = await import('../auth/load-ts.mjs');
  test('header proxy verifies admin session and preserves backend errors without caching', async () => {
    let user = null;
    const calls = [];
    const { GET } = loadTs('app/api/admin-header/route.ts', {
      '@/lib/auth-server': {
        getVerifiedUser: async () => ({ user, accessToken: 'session-token' }),
        authFetch: async (...args) => { calls.push(args); return Response.json({ message: 'Unavailable' }, { status: 503 }); },
      },
    });
    const req = new Request('http://localhost/api/admin-header?kind=search&q=Jane');
    assert.equal((await GET(req)).status, 401);
    user = { role: 'student' };
    assert.equal((await GET(req)).status, 403);
    assert.equal(calls.length, 0);
    user = { role: 'admin' };
    const res = await GET(req);
    assert.equal(res.status, 503);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(calls[0][0], '/admin-dashboard/header?kind=search&q=Jane');
    assert.equal(calls[0][1].headers.Authorization, 'Bearer session-token');
  });
  test('header client encodes searches, supports cancellation, and surfaces service failures', async () => {
    const calls = [];
    let ok = true;
    const { getHeaderFeed } = loadTs('lib/header-client.ts', {
      './session-client': { sessionFetch: async (...args) => { calls.push(args); return ok ? Response.json({ items: [], count: 0 }) : Response.json({ message: 'Service offline' }, { status: 503 }); } },
    });
    const signal = new AbortController().signal;
    assert.deepEqual(await getHeaderFeed('search', 'a&b', signal), { items: [], count: 0 });
    assert.equal(calls[0][0], '/api/admin-header?kind=search&q=a%26b');
    assert.equal(calls[0][1].cache, 'no-store');
    assert.equal(calls[0][1].signal, signal);
    ok = false;
    await assert.rejects(getHeaderFeed('messages'), /Service offline/);
  });
  test('mail icon uses deployed delivery log with email-only filtering, actual total and delivery states', async () => {
    const calls = [];
    const { GET } = loadTs('app/api/admin-header/route.ts', {
      '@/lib/auth-server': {
        getVerifiedUser: async () => ({ user: { role: 'admin' }, accessToken: 'cookie' }),
        authFetch: async (...args) => {
          calls.push(args);
          return Response.json({ installed: true, total: 12, items: [{ id: 'mail', subject: 'Meeting', recipient: 'parent@example.test', status: 'accepted', created_at: '2026-11-21T10:00:00Z' }] });
        },
      },
    });
    const response = await GET(new Request('http://localhost/api/admin-header?kind=messages'));
    assert.equal(response.status, 200);
    const url = new URL(calls[0][0], 'http://backend');
    assert.equal(url.pathname, '/admin-operations/messages');
    assert.equal(url.searchParams.get('search'), '"channel": "email"');
    assert.equal(url.searchParams.get('pageSize'), '8');
    assert.equal(calls[0][1].headers.Authorization, 'Bearer cookie');
    assert.deepEqual(await response.json(), { count: 12, items: [{ id: 'mail', title: 'Meeting', detail: 'parent@example.test', status: 'accepted', date: '2026-11-21T10:00:00Z', href: '/admin/accounts/communicate/emailsmsandlog' }] });
  });
  test('bell icon uses deployed dashboard notices and events, with working destination links', async () => {
    const calls = [];
    const { GET } = loadTs('app/api/admin-header/route.ts', {
      '@/lib/auth-server': {
        getVerifiedUser: async () => ({ user: { role: 'admin' }, accessToken: 'cookie' }),
        authFetch: async path => {
          calls.push(path);
          return Response.json({ notices: [{ id: 'notice', title: 'Holiday', body: 'School closed', start_date: '2026-11-20' }], events: [{ id: 'event', title: 'Meeting', location: 'Hall', starts_at: '2026-11-22T09:00:00Z' }] });
        },
      },
    });
    const response = await GET(new Request('http://localhost/api/admin-header?kind=alerts'));
    assert.deepEqual(calls, ['/admin-dashboard']);
    const feed = await response.json();
    assert.equal(feed.count, 2);
    assert.deepEqual(feed.items.map(item => [item.id, item.href]), [['event', '/admin/accounts/communicate/event'], ['notice', '/admin/accounts/communicate/noticeboard']]);
  });
  test('both icons preserve genuine empty states and do not hide missing services as empty feeds', async () => {
    let body, status = 200;
    const { GET } = loadTs('app/api/admin-header/route.ts', {
      '@/lib/auth-server': {
        getVerifiedUser: async () => ({ user: { role: 'admin' }, accessToken: 'cookie' }),
        authFetch: async () => Response.json(body, { status }),
      },
    });
    const request = kind => new Request('http://localhost/api/admin-header?kind=' + kind);
    body = { installed: true, total: 0, items: [] };
    assert.deepEqual(await (await GET(request('messages'))).json(), { count: 0, items: [] });
    body = { notices: [], events: [] };
    assert.deepEqual(await (await GET(request('alerts'))).json(), { count: 0, items: [] });
    body = { installed: false, items: [], total: 0 };
    assert.equal((await GET(request('messages'))).status, 503);
    body = { message: 'Cannot GET /api/v1/private-path' }; status = 404;
    for (const kind of ['messages', 'alerts']) {
      const response = await GET(request(kind));
      assert.equal(response.status, 404);
      assert.doesNotMatch(JSON.stringify(await response.json()), /Cannot GET|private-path/);
    }
    assert.equal((await GET(request('unknown'))).status, 400);
  });
}
register();
