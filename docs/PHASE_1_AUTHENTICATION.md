# Phase 1 ? Authentication and Session Reliability

Status: implemented; final checks recorded below. Scope is authentication only. School Subjects has not started.

## Behavior delivered

- Server-rendered pages and protected API proxies verify sessions without rotating refresh tokens.
- A dedicated POST auth-refresh route persists both replacement HttpOnly cookies before acknowledging renewal.
- Browser renewal shares an in-flight promise. A Web Lock coordinates tabs and also serializes login/logout with refresh. Without Web Locks, requests are serialized within the current tab.
- Expired admin navigation restores the session through a recovery page and retains a validated internal destination. Admin authorization still verifies the actual database identity/role.
- Authentication-service outages retain cookies and show retry UI instead of being treated as sign-out.
- Admin authentication/sign-out returns to the Admin Login at /. Student/instructor Portal Login restrictions remain separate.
- Profile data uses the existing backend full-profile endpoint.
- Password recovery uses the real emailed-link flow. Legacy OTP bookmarks forward to recovery. Both login destinations remain available after reset.
- Refresh token consumption/insertion and password-reset consumption/password/session updates are transactional. Token issuance and reset lock the user row to serialize races.
- SMTP transport selects implicit TLS for port 465, with optional SMTP_SECURE override; delivery failures invalidate the unsent link and retain the generic public response.
- No schema changes, new tables, migrations, or subject/course modifications.

## Files changed for this phase

### Frontend session/authentication

- [Server verification and cookies](../lib/auth-server.ts)
- [Client renewal coordination](../lib/session-client.ts)
- [Safe recovery navigation](../lib/session-navigation.ts)
- [Central API client: authenticated retry and login/logout coordination only](../lib/api-service.ts)
- [Admin navigation proxy](../proxy.ts)
- [Admin layout](../app/admin/layout.tsx)
- [Authentication outage UI](../components/auth/SessionUnavailable.tsx)
- [Session recovery page](../app/auth/session/page.tsx)
- [Login route](../app/api/auth/login/route.ts)
- [Logout route](../app/api/auth/logout/route.ts)
- [Profile route](../app/api/auth/me/route.ts)
- [Refresh route](../app/api/auth/refresh/route.ts)
- [Forgot-password route](../app/api/auth/forgot-password/route.ts)
- [Reset-password route](../app/api/auth/reset-password/route.ts)
- [Legacy OTP route](../app/auth/otp/page.tsx)
- [Forgot-password page](../app/auth/forgot-password/page.tsx)
- [Reset-password page](../app/auth/reset-password/page.tsx)
- [Header sign-out destination](../components/layout/TopBar.tsx)
- [Sidebar sign-out destination](../components/layout/Sidebar.tsx)

The following existing proxies only lost their old implicit-refresh-cookie branches; their business operations are unchanged:

- [Users](../app/api/users/route.ts)
- [User role](../app/api/users/[id]/role/route.ts)
- [Courses](../app/api/courses/route.ts)
- [Course detail](../app/api/courses/[id]/route.ts)
- [Publish](../app/api/courses/[id]/publish/route.ts)
- [Unpublish](../app/api/courses/[id]/unpublish/route.ts)

### Backend

- [Authentication service](../../../lms/lms-backend/src/auth/auth.service.ts)
- [Password reset mail service](../../../lms/lms-backend/src/auth/password-reset-mail.service.ts)
- [Authentication service tests](../../../lms/lms-backend/src/auth/auth.service.spec.ts)
- [Authentication controller tests](../../../lms/lms-backend/src/auth/auth.controller.spec.ts)
- [Mail transport tests](../../../lms/lms-backend/src/auth/password-reset-mail.service.spec.ts)
- [HTTP/PostgreSQL authentication tests](../../../lms/lms-backend/test/auth.e2e-spec.ts)
- [Local browser-test fixture server](../../../lms/lms-backend/test/auth-browser-server.mjs)
- [API documentation](../../../lms/lms-backend/API_DOCUMENTATION.md)
- [Backend test commands](../../../lms/lms-backend/package.json)

### Verification and tracking

- [Frontend authentication regression tests](../tests/auth/session.test.cjs)
- [In-memory TypeScript test loader](../tests/auth/load-ts.cjs)
- [Production HTTP smoke checks](../tests/auth/production-smoke.cjs)
- [Frontend test command](../package.json)
- [Windows-compatible frontend build task](../.vscode/tasks.json)
- [Progress checklist](./INTEGRATION_PROGRESS.md)
- This report.

## Verification

- Frontend authentication regression suite: 31 passed.
- Backend authentication unit/mail suite: 15 passed.
- Real NestJS HTTP + PostgreSQL suite: 6 passed. Includes replay/expiry, RBAC, password changes, refresh revocation, and actual transaction rollback after injected storage failures.
- Production Next.js HTTP smoke suite: 17 checks passed.
- Browser: admin login, real profile name, JavaScript-inaccessible auth cookies, sidebar logout to Admin Login, admin rejection at Portal Login, student portal success with admin-route denial, email-link reset, both login links, and login with changed password.
- Frontend and backend TypeScript checks: passed.
- Frontend and backend production builds: passed.
- Focused frontend lint: no errors; two existing next/image suggestions on authentication logo images.
- Focused backend type-aware lint: passed.

Database suites and browser fixtures use an outer transaction with temporary unique test users. They do not send external email, run migrations, create tables, or commit fixture data.

## Running the focused checks

Frontend:

```powershell
npm.cmd run test:auth
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm.cmd run build
```

Backend:

```powershell
npm.cmd run test:auth
npm.cmd run test:auth:e2e
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm.cmd run build
```

The PostgreSQL suite uses the configured database schema but rolls back all fixture writes. Keep a test-only database configuration for unattended CI.

For production HTTP/browser checks, build both projects; start the backend fixture server with `node test/auth-browser-server.mjs`; start Next.js on port 3100 with API_URL=http://127.0.0.1:4001/api/v1; run `node tests/auth/production-smoke.cjs` from the frontend. Start fresh fixtures for each run because the checks intentionally reset a fixture password. The fixture server only listens on loopback, captures mail locally, and automatically rolls back/exits after 20 minutes. POST /__test/stop shuts it down gracefully; these test-control routes do not exist in the production backend.

## Remaining limits and next gate

- External SMTP inbox delivery was not exercised; message composition and transport configuration were tested using captured mail.
- JWT access tokens retain their existing maximum 15-minute lifetime after logout/reset; refresh tokens are revoked. Immediate global access-token revocation would require a separate approved session-policy change.
- Cross-tab serialization requires browser Web Locks (available in modern secure contexts); the fallback serializes within one tab.
- Student/instructor destination portals and School Subjects remain outside this phase.
- Existing user-creation partial-role-assignment behavior remains scheduled for User Administration; no user-creation business logic was changed.

Stop after Phase 1. School Subjects requires the user's next approval, followed by separate approval before applying its migration.
