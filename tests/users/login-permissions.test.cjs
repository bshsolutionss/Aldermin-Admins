async function register() {
const { test } = await import("node:test");
const assert = (await import("node:assert/strict")).default;
const { loadTs } = await import("../auth/load-ts.mjs");
const id = '11111111-1111-4111-8111-111111111111';
const user = { id, name: 'A user', email: 'user@example.invalid', role: 'student', loginEnabled: true, updatedAt: null };
const page = { items: [user], total: 1, page: 1, pageSize: 25 };

test('login access client uses encoded search/pagination and boolean mutation bodies', async () => {
  const calls = [];
  const { apiService } = loadTs('lib/api-service.ts', { './session-client': {
    sessionFetch: async (path, options) => { calls.push([path, options]); return Response.json(page); }, withSessionLock: fn => fn(),
  } });
  await apiService.users.getLoginPermissions('a+b@example.invalid', 2);
  await apiService.users.updateLoginPermission(id, false);
  assert.match(calls[0][0], /search=a%2Bb%40example.invalid&page=2&pageSize=25/);
  assert.equal(calls[1][0], '/api/users/' + id + '/login-permission');
  assert.deepEqual(JSON.parse(calls[1][1].body), { loginEnabled: false });
});

test('user access proxy requires verified admin, same-origin mutations, valid IDs/JSON and preserves backend conflicts', async () => {
  let verified = { role: 'admin' }, origin = true, calls = [];
  const { proxyUserAccess } = loadTs('lib/user-access-proxy.ts', { '@/lib/auth-server': {
    getVerifiedUser: async () => ({ user: verified, accessToken: 'cookie-token' }), isSameOrigin: () => origin,
    authFetch: async (path, options) => { calls.push([path, options]); return Response.json({ message: 'Cannot disable self' }, { status: 403 }); },
  } });
  const get = () => new Request('http://localhost/api/users/login-permissions?page=2');
  verified = null; assert.equal((await proxyUserAccess(get(), 'login-permissions')).status, 401);
  for (const role of ['student', 'instructor']) { verified = { role }; assert.equal((await proxyUserAccess(get(), 'login-permissions')).status, 403); }
  verified = { role: 'admin' };
  const patch = body => new Request('http://localhost/api/users/' + id + '/login-permission', { method: 'PATCH', body });
  origin = false; assert.equal((await proxyUserAccess(patch('{}'), 'login-permission', id)).status, 403); origin = true;
  assert.equal((await proxyUserAccess(patch('{}'), 'login-permission', 'bad')).status, 400);
  assert.equal((await proxyUserAccess(patch('bad'), 'login-permission', id)).status, 400);
  assert.equal(calls.length, 0);
  const res = await proxyUserAccess(get(), 'login-permissions');
  assert.equal(res.status, 403); assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(calls[0][0], '/users/login-permissions?page=2');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer cookie-token');
  await proxyUserAccess(patch(JSON.stringify({ role: 'instructor' })), 'role', id);
  assert.equal(calls[1][0], '/users/' + id + '/role');
});

function mount(api) {
  const state = [], effects = []; let cursor = 0;
  const react = {
    useState(value) { const k = cursor++; if (!(k in state)) state[k] = value; return [state[k], next => { state[k] = typeof next === 'function' ? next(state[k]) : next; }]; },
    useRef(value) { const k = cursor++; if (!(k in state)) state[k] = { current: value }; return state[k]; },
    useEffect(fn) { const k = cursor++; if (!(k in state)) { state[k] = true; effects.push(fn); } },
  };
  const { useLoginPermissions } = loadTs('lib/use-login-permissions.ts', { react, './api-service': { apiService: { users: api } } });
  const render = () => { cursor = 0; return useLoginPermissions(); };
  return { render, start: async () => { render(); effects.splice(0).forEach(fn => fn()); await new Promise(setImmediate); } };
}

test('failed access writes retain current values; successful writes update only the persisted account', async () => {
  let fail = true;
  const hook = mount({ getLoginPermissions: async () => page, updateLoginPermission: async () => {
    if (fail) throw Error('Cannot disable account'); return { id, loginEnabled: false, changed: true };
  } });
  await hook.start(); await hook.render().toggle(user);
  assert.equal(hook.render().data.items[0].loginEnabled, true); assert.equal(hook.render().error, 'Cannot disable account');
  fail = false; await hook.render().toggle(user);
  assert.equal(hook.render().data.items[0].loginEnabled, false); assert.match(hook.render().notice, /disabled/);
});

test('service outages show a retryable error without demo data and stale searches cannot overwrite later results', async () => {
  let fail = true, oldResolve;
  const hook = mount({ getLoginPermissions: async filter => {
    if (fail) throw Error('Migration awaiting approval');
    if (filter === 'old') return new Promise(resolve => { oldResolve = resolve; });
    return { ...page, items: [{ ...user, name: 'Newest result' }] };
  } });
  await hook.start(); assert.equal(hook.render().data.items.length, 0); assert.match(hook.render().error, /approval/);
  fail = false;
  const old = hook.render().load(1, 'old'); await hook.render().load(1, 'new');
  oldResolve(page); await old;
  assert.equal(hook.render().data.items[0].name, 'Newest result');
});

test('duplicate toggle clicks cannot submit concurrent writes', async () => {
  let resolve, writes = 0;
  const hook = mount({ getLoginPermissions: async () => page, updateLoginPermission: () => { writes++; return new Promise(done => { resolve = done; }); } });
  await hook.start(); const first = hook.render().toggle(user); await hook.render().toggle(user);
  assert.equal(writes, 1); resolve({ id, loginEnabled: false }); await first;
});

test('dynamic user route wrappers await params and delegate to the guarded proxy', async () => {
  for (const [file, action] of [['app/api/users/[id]/role/route.ts', 'role'], ['app/api/users/[id]/login-permission/route.ts', 'login-permission']]) {
    let args;
    const route = loadTs(file, { '@/lib/user-access-proxy': { proxyUserAccess: async (...values) => { args = values; return Response.json({}); } } });
    const request = new Request('http://localhost/api/users/' + id + '/' + action, { method: 'PATCH' });
    await route.PATCH(request, { params: Promise.resolve({ id }) });
    assert.deepEqual(args, [request, action, id]);
  }
});

}
void register();
