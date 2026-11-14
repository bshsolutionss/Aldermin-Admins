const { test, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { NextRequest } = require("next/server");
const { loadTs } = require("./load-ts.cjs");
afterEach(() => mock.restoreAll());
const profile = { id: "user-id", name: "Real Administrator", email: "admin@example.test", role: "admin" };
const cookieStore = values => ({ get: key => values[key] ? { value: values[key] } : undefined, has: key => !!values[key] });
function helper(values = {}) { return loadTs("lib/auth-server.ts", { "next/headers": { cookies: async () => cookieStore(values) } }); }
const request = (url = "/api/auth/refresh", body, cookie = "refresh_token=old-refresh") => new NextRequest("http://localhost:3000" + url, {
  method: "POST", headers: { origin: "http://localhost:3000", cookie, "content-type": "application/json" },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
test("verification uses full profile without rotating tokens", async () => {
  mock.method(globalThis, "fetch", async url => { assert.match(url, /\/users\/me$/); return Response.json(profile); });
  assert.deepEqual(await helper({ access_token: "access", refresh_token: "old" }).getVerifiedUser(), { user: profile, accessToken: "access" });
  assert.equal(fetch.mock.callCount(), 1);
});
test("missing access cookie never consumes the refresh cookie", async () => {
  mock.method(globalThis, "fetch", async () => { throw new Error("must not fetch"); });
  assert.equal((await helper({ refresh_token: "old" }).getVerifiedUser()).user, null);
  assert.equal(fetch.mock.callCount(), 0);
});
test("an invalid access token returns unauthenticated without rotation", async () => {
  mock.method(globalThis, "fetch", async () => new Response(null, { status: 401 }));
  assert.equal((await helper({ access_token: "expired", refresh_token: "old" }).getVerifiedUser()).user, null);
  assert.equal(fetch.mock.callCount(), 1);
});
for (const failure of ["network", "server", "malformed"]) test("profile failure is not mistaken for logout: " + failure, async () => {
  mock.method(globalThis, "fetch", async () => {
    if (failure === "network") throw new Error("offline");
    return failure === "server" ? new Response(null, { status: 503 }) : Response.json({});
  });
  const h = helper({ access_token: "access" });
  await assert.rejects(h.getVerifiedUser(), h.AuthServiceUnavailableError);
});
test("refresh saves both HttpOnly cookies and never exposes tokens as JSON", async () => {
  const h = helper();
  mock.method(globalThis, "fetch", async () => Response.json({ accessToken: "new-access", refreshToken: "new-refresh", expiresIn: 900 }));
  const route = loadTs("app/api/auth/refresh/route.ts", { "@/lib/auth-server": h });
  const res = await route.POST(request());
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { message: "Session renewed" });
  for (const name of ["access_token", "refresh_token"]) {
    const c = res.cookies.get(name);
    assert.equal(c.httpOnly, true); assert.equal(c.sameSite, "lax"); assert.equal(c.path, "/");
  }
  assert.equal(res.cookies.get("refresh_token").value, "new-refresh");
  assert.equal(res.headers.get("cache-control"), "no-store");
});
test("invalid refresh clears both cookies", async () => {
  mock.method(globalThis, "fetch", async () => new Response(null, { status: 401 }));
  const res = await loadTs("app/api/auth/refresh/route.ts", { "@/lib/auth-server": helper() }).POST(request());
  assert.equal(res.status, 401);
  assert.equal(res.cookies.get("access_token").maxAge, 0);
  assert.equal(res.cookies.get("refresh_token").maxAge, 0);
});
test("backend refresh outage preserves cookies for retry", async () => {
  mock.method(globalThis, "fetch", async () => { throw new Error("offline"); });
  const res = await loadTs("app/api/auth/refresh/route.ts", { "@/lib/auth-server": helper() }).POST(request());
  assert.equal(res.status, 503);
  assert.equal(res.headers.get("set-cookie"), null);
});
test("cross-origin refresh is rejected before backend access", async () => {
  mock.method(globalThis, "fetch", async () => { throw new Error("must not fetch"); });
  const req = new NextRequest("http://localhost:3000/api/auth/refresh", { method: "POST", headers: { origin: "https://other.test" } });
  const res = await loadTs("app/api/auth/refresh/route.ts", { "@/lib/auth-server": helper() }).POST(req);
  assert.equal(res.status, 403); assert.equal(fetch.mock.callCount(), 0);
});
for (const role of ["admin", "student", "instructor"]) for (const portal of ["admin", "portal"]) {
  test("login restriction: " + portal + " / " + role, async () => {
    mock.method(globalThis, "fetch", async url => url.endsWith("/logout") ? Response.json({}) : Response.json({
      accessToken: "a", refreshToken: "r", user: { ...profile, role },
    }));
    const res = await loadTs("app/api/auth/login/route.ts", { "@/lib/auth-server": helper() }).POST(request("/api/auth/login", {
      email: " ADMIN@example.test ", password: "password123", portal,
    }));
    const allowed = portal === "admin" ? role === "admin" : role !== "admin";
    assert.equal(res.status, allowed ? 200 : 403);
    assert.equal(res.cookies.get("access_token").value, allowed ? "a" : "");
    assert.equal(fetch.mock.callCount(), allowed ? 1 : 2);
    const sent = JSON.parse(fetch.mock.calls[0].arguments[1].body);
    assert.equal(sent.email, "admin@example.test");
  });
}
test("omitting the portal cannot bypass login restrictions", async () => {
  mock.method(globalThis, "fetch", async () => { throw new Error(); });
  const res = await loadTs("app/api/auth/login/route.ts", { "@/lib/auth-server": helper() }).POST(request("/api/auth/login", {
    email: profile.email, password: "password123",
  }));
  assert.equal(res.status, 400); assert.equal(fetch.mock.callCount(), 0);
});
test("logout clears browser cookies but reports backend revocation failure", async () => {
  mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
  const res = await loadTs("app/api/auth/logout/route.ts", { "@/lib/auth-server": helper() }).POST(request("/api/auth/logout"));
  assert.equal(res.status, 503); assert.equal(res.cookies.get("refresh_token").maxAge, 0);
});
test("successful password reset clears browser session cookies", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ message: "Password reset successfully" }));
  const res = await loadTs("app/api/auth/reset-password/route.ts", { "@/lib/auth-server": helper() }).POST(request("/api/auth/reset-password", {
    token: "reset-token", newPassword: "newPassword123",
  }));
  assert.equal(res.status, 200); assert.equal(res.cookies.get("access_token").maxAge, 0);
});
test("failed password reset does not clear an unrelated current session", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ message: "Invalid token" }, { status: 401 }));
  const res = await loadTs("app/api/auth/reset-password/route.ts", { "@/lib/auth-server": helper() }).POST(request("/api/auth/reset-password", {
    token: "bad", newPassword: "newPassword123",
  }));
  assert.equal(res.status, 401); assert.equal(res.headers.get("set-cookie"), null);
});
test("parallel expired API requests share a single refresh and retry once", async () => {
  let valid = false, refreshes = 0, attempts = 0;
  mock.method(globalThis, "fetch", async url => {
    if (url === "/api/auth/refresh") { refreshes++; valid = true; return Response.json({}); }
    if (url === "/api/users") attempts++;
    return valid ? Response.json(profile) : new Response(null, { status: 401 });
  });
  const client = loadTs("lib/session-client.ts");
  const res = await Promise.all([client.sessionFetch("/api/users", {}), client.sessionFetch("/api/users", {})]);
  assert.equal(refreshes, 1); assert.equal(attempts, 4); assert.ok(res.every(r => r.ok));
});
test("session coordination across tabs rechecks under a shared lock", async () => {
  let tail = Promise.resolve(), valid = false, refreshes = 0;
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: { request: (_, action) => {
    const next = tail.then(action); tail = next.catch(() => {}); return next;
  } } } });
  try {
    mock.method(globalThis, "fetch", async url => {
      if (url === "/api/auth/refresh") { refreshes++; valid = true; return Response.json({}); }
      return valid ? Response.json(profile) : new Response(null, { status: 401 });
    });
    const tab1 = loadTs("lib/session-client.ts"), tab2 = loadTs("lib/session-client.ts");
    assert.deepEqual(await Promise.all([tab1.ensureSession(), tab2.ensureSession()]), [true, true]);
    assert.equal(refreshes, 1);
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else delete globalThis.navigator;
  }
});
test("profile outages never trigger refresh", async () => {
  mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
  await assert.rejects(loadTs("lib/session-client.ts").ensureSession(), /temporarily unavailable/);
  assert.equal(fetch.mock.callCount(), 1);
});
test("invalid sessions stop after one failed refresh without a retry loop", async () => {
  let calls = 0;
  mock.method(globalThis, "fetch", async () => { calls++; return new Response(null, { status: 401 }); });
  assert.equal((await loadTs("lib/session-client.ts").sessionFetch("/api/users", {})).status, 401);
  assert.equal(calls, 3);
});
test("navigation preserves internal destination and rejects external redirects", () => {
  const nav = loadTs("lib/session-navigation.ts");
  assert.equal(nav.safeAdminReturnTo("/admin/dashboard?tab=1"), "/admin/dashboard?tab=1");
  for (const value of ["//evil.test", "https://evil.test", "/admin/../../auth/login", "/admin\\evil", "/auth/login"]) {
    assert.equal(nav.safeAdminReturnTo(value), "/admin");
  }
});
test("admin navigation sends expired sessions to recovery without rotating", () => {
  const nav = loadTs("lib/session-navigation.ts");
  const { proxy } = loadTs("proxy.ts", { "./lib/session-navigation": nav });
  const req = new NextRequest("http://localhost:3000/admin/dashboard?tab=1", { headers: { cookie: "refresh_token=old" } });
  const res = proxy(req);
  assert.equal(res.status, 307);
  assert.match(res.headers.get("location"), /auth\/session\?returnTo=%2Fadmin%2Fdashboard%3Ftab%3D1/);
  assert.equal(res.headers.get("set-cookie"), null);
});
test("admin layout rejects student access and redirects anonymous visitors to Admin Login", async () => {
  for (const user of [null, { ...profile, role: "student" }, { ...profile, role: "instructor" }]) {
    const layout = loadTs("app/admin/layout.tsx", {
      "@/components/layout/AdminLayout": { default: () => null },
      "@/components/auth/SessionUnavailable": { SessionUnavailable: () => null },
      "@/lib/auth-server": { getVerifiedUser: async () => ({ user }) },
      "@/lib/session-navigation": loadTs("lib/session-navigation.ts"),
      "next/headers": { cookies: async () => cookieStore({}), headers: async () => new Headers() },
      "next/navigation": { redirect: url => { throw new Error("redirect:" + url); } },
    });
    await assert.rejects(layout.default({ children: null }), /^Error: redirect:\/$/);
  }
});
test("legacy OTP route delegates to supported password recovery", () => {
  const page = loadTs("app/auth/otp/page.tsx", { "next/navigation": { redirect: url => { throw new Error(url); } } });
  assert.throws(() => page.default(), /\/auth\/forgot-password/);
});

test("production cookie attributes include Secure and explicit lifetimes", () => {
  const old = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const { NextResponse } = require("next/server");
    const response = NextResponse.json({});
    helper().setAuthCookies(response, { accessToken: "a", refreshToken: "r", expiresIn: 900 });
    assert.equal(response.cookies.get("access_token").secure, true);
    assert.equal(response.cookies.get("access_token").maxAge, 900);
    assert.equal(response.cookies.get("refresh_token").maxAge, 604800);
  } finally { if (old === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = old; }
});
test("malformed refresh responses cannot issue partial cookies", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ accessToken: "a" }));
  const response = await loadTs("app/api/auth/refresh/route.ts", { "@/lib/auth-server": helper() }).POST(request());
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("set-cookie"), null);
});
test("admin layout preserves session and displays retry UI during backend outage", async () => {
  const h = helper();
  const layout = loadTs("app/admin/layout.tsx", {
    "@/components/layout/AdminLayout": { default: () => null },
    "@/components/auth/SessionUnavailable": { SessionUnavailable: () => null },
    "@/lib/auth-server": { ...h, getVerifiedUser: async () => { throw new h.AuthServiceUnavailableError(); } },
    "@/lib/session-navigation": loadTs("lib/session-navigation.ts"),
    "next/headers": { cookies: async () => cookieStore({}), headers: async () => new Headers() },
    "next/navigation": { redirect: () => { throw new Error("must not redirect"); } },
  });
  const result = await layout.default({ children: null });
  assert.equal(result.type.name, "SessionUnavailable");
});
