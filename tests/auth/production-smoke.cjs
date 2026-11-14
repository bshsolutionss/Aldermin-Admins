const assert = require("node:assert/strict");
const base = process.env.AUTH_FRONTEND_URL || "http://localhost:3100";
const backend = process.env.AUTH_BACKEND_URL || "http://127.0.0.1:4001";
const jar = new Map();
let passed = 0;
async function check(name, run) { await run(); passed++; console.log("PASS " + name); }
async function call(path, body, options = {}) {
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST", redirect: "manual",
    headers: { "content-type": "application/json", origin: base, cookie: [...jar].map(([k,v]) => k+"="+v).join("; "), ...options.headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  for (const value of response.headers.getSetCookie()) {
    const [pair] = value.split(";"), equals = pair.indexOf("="), key = pair.slice(0,equals);
    if (/max-age=0/i.test(value)) jar.delete(key); else jar.set(key, pair.slice(equals+1));
  }
  return response;
}
(async () => {
  const fixtures = await (await fetch(backend + "/__test/fixtures")).json();
  await check("anonymous admin access returns to Admin Login", async () => {
    const response = await call("/admin/dashboard"); assert.ok([307,308].includes(response.status));
    assert.equal(new URL(response.headers.get("location"), base).pathname, "/");
  });
  for (const role of ["admin","student","instructor"]) for (const portal of ["admin","portal"]) {
    await check(portal+" login restriction for "+role, async () => {
      const fixture = fixtures[role];
      const response = await call("/api/auth/login", { email: fixture.email, password: fixture.password, portal });
      assert.equal(response.status, portal === "admin" ? (role === "admin" ? 200:403) : (role === "admin" ?403:200));
    });
  }
  await check("valid login stores secure HttpOnly cookie pair without exposing tokens", async () => {
    const response = await call("/api/auth/login", { ...fixtures.admin, portal:"admin" });
    assert.equal(response.status,200);
    const body = await response.json(); assert.equal(body.user.name, fixtures.admin.name);
    assert.equal(body.accessToken,undefined); assert.equal(body.refreshToken,undefined);
    assert.equal(response.headers.getSetCookie().length,2);
    for(const value of response.headers.getSetCookie()) { assert.match(value,/HttpOnly/i);assert.match(value,/Secure/i);assert.match(value,/SameSite=lax/i); }
  });
  await check("full profile uses actual database name", async () => {
    const response=await call("/api/auth/me");assert.equal(response.status,200);assert.equal((await response.json()).name,fixtures.admin.name);
  });
  const oldRefresh=jar.get("refresh_token");
  await check("expired access routes to recovery with original destination", async () => {
    jar.set("access_token",fixtures.admin.expiredAccessToken);
    const response=await call("/admin/dashboard?view=auth-test");assert.equal(response.status,307);
    const url=new URL(response.headers.get("location"),base);assert.equal(url.pathname,"/auth/session");assert.equal(url.searchParams.get("returnTo"),"/admin/dashboard?view=auth-test");
  });
  await check("refresh persists replacement cookies and restores protected requests", async () => {
    const response=await call("/api/auth/refresh",{});assert.equal(response.status,200);
    assert.notEqual(jar.get("refresh_token"),oldRefresh);assert.equal((await call("/api/auth/me")).status,200);
    assert.equal((await call("/admin/dashboard")).status,200);
  });
  await check("old refresh token is rejected by real backend", async () => {
    const response=await fetch(backend+"/api/v1/auth/refresh",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({refreshToken:oldRefresh})});
    assert.equal(response.status,401);
  });
  await check("cross-origin refresh is denied without consuming session", async () => {
    assert.equal((await call("/api/auth/refresh",{}, {headers:{origin:"https://other.example.test"}})).status,403);
    assert.equal((await call("/api/auth/me")).status,200);
  });
  await check("legacy OTP delegates to password recovery", async () => {
    const response=await call("/auth/otp");assert.ok([307,308].includes(response.status));assert.equal(new URL(response.headers.get("location"),base).pathname,"/auth/forgot-password");
  });
  await check("email reset alias preserves encoded tokens", async () => {
    const response=await call("/reset-password?token=test%2Btoken");assert.ok([307,308].includes(response.status));
    const url=new URL(response.headers.get("location"),base);assert.equal(url.pathname,"/auth/reset-password");assert.equal(url.searchParams.get("token"),"test+token");
  });
  await check("reset-link flow changes credentials and rejects reuse", async () => {
    const fixture=fixtures.instructor;
    assert.equal((await call("/api/auth/forgot-password",{email:fixture.email})).status,200);
    const {token}=await(await fetch(backend+"/__test/reset-token")).json();assert.ok(token);
    const body={token,newPassword:"PhaseOne-Changed-Password123"};
    assert.equal((await call("/api/auth/reset-password",body)).status,200);assert.equal(jar.size,0);
    assert.equal((await call("/api/auth/reset-password",body)).status,401);
    assert.equal((await call("/api/auth/login",{email:fixture.email,password:fixture.password,portal:"portal"})).status,401);
    assert.equal((await call("/api/auth/login",{email:fixture.email,password:body.newPassword,portal:"portal"})).status,200);
    assert.equal((await call("/api/users")).status,403);
  });
  await check("logout clears browser session and protected profile access", async () => {
    const refresh=jar.get("refresh_token");assert.equal((await call("/api/auth/logout",{})).status,200);assert.equal(jar.size,0);
    assert.equal((await call("/api/auth/me")).status,401);
    const response=await fetch(backend+"/api/v1/auth/refresh",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({refreshToken:refresh})});assert.equal(response.status,401);
  });
  console.log("PRODUCTION_AUTH_SMOKE: "+passed+" checks passed");
})().catch(error=>{console.error(error);process.exitCode=1;});
