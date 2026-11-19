async function register() {
const { test } = await import("node:test");
const assert = (await import("node:assert/strict")).default;
const { loadTs } = await import("../auth/load-ts.mjs");
test('document proxy restricts routes, methods, cross-origin writes and roles', async () => {
  let user = { role: 'admin' }, origin = true, calls = 0;
  const { proxyDocuments } = loadTs('lib/documents-proxy.ts', { './auth-server': { getVerifiedUser: async () => ({ user, accessToken: 'token' }), isSameOrigin: () => origin, authFetch: async () => { calls++; return Response.json({ items: [] }); } } });
  const req = (method = 'GET') => new Request('http://localhost/api/documents/templates', { method, ...(method === 'GET' ? {} : { body: '{}' }) });
  assert.equal((await proxyDocuments(req(), ['unknown'])).status, 404);
  assert.equal((await proxyDocuments(req('PUT'), ['issues', '11111111-1111-4111-8111-111111111111'])).status, 404);
  origin = false;
  assert.equal((await proxyDocuments(req('POST'), ['issues'])).status, 403);
  origin = true; user = { role: 'student' };
  assert.equal((await proxyDocuments(req(), ['templates'])).status, 403);
  user = { role: 'admin' };
  assert.equal((await proxyDocuments(req(), ['templates'])).status, 200);
  assert.equal(calls, 1);
});

}
void register();
