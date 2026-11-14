# Admin permission roles: approved application and acceptance

Date: 2026-11-13. Migration: `CreateAdminPermissionRoles1794500100000`.

## Application and existing-data preservation — PASS

The owner explicitly approved only this migration. The guarded helper was invoked with `--approved-admin-permission-roles`; no generic migrate-all or DOWN was executed.

Source, compiled statements and exact reviewed SQL matched:

- UP SHA-256: `fffad774dec6577cc33c1c5aaba6cc108f14cc77b81d32321d920171499ddacb`.
- DOWN SHA-256: `b28514566aff82736614e541f3f0f3c479b93cdbe66578321f7f0a27ff53a335`.

Before commit, counts and SHA-256 row snapshots matched across **all 19 pre-existing application tables**. All 16 prior migration-history rows matched. Three new permission tables were empty. Database state became **17 migrations, 22 application tables / 23 public tables including history**.

The preserved baseline included 7 users, 81 refresh tokens, 12 password-reset tokens, 2 role-change logs, 2 original subject assignments, 3 courses, 1 academic year, 1 class, 1 section and 1 class-section. Login-policy tables and the other existing application tables were empty. Later read-only Settings preflight retained these same original-table counts/hashes, and all three permission tables were empty after test rollback. Existing uncommitted work was preserved; no existing school rows were deleted.

## PostgreSQL authorization, escalation protection and audit acceptance — 8/8 PASS

Real Nest HTTP controllers, guards and permission/login services run against PostgreSQL. The suite scopes writes to one outer transaction, rolls fixtures back and compares every public table's row count/hash, including migration history. The protected Classes handler uses a sentinel response: this suite verifies real authorization at that boundary, while domain CRUD acceptance remains in the Classes suite.

1. Anonymous/student denial, unknown/duplicate permission validation, privilege-field rejection and required assignment state.
2. Case/space-insensitive role-name uniqueness and stale edit version conflicts. Successful edits return one role object with the incremented version.
3. Restricted admins can read granted domains but cannot write ungranted domains, manage permission roles, change account roles or change login access. Self-assignment changes are rejected.
4. Grant removal takes effect on the next request; stale assignment mutations cannot overwrite current state; explicitly restoring unrestricted access succeeds.
5. Audit records retain the verified actor, target and before/after values. Role events contain object snapshots at versions 1/2/3. No-op assignments add no event. Account search is paginated and exposes no password hashes.
6. PostgreSQL CHECK/FK constraints reject unsupported grants, blank role names and dangling assignments; attempted invalid fixture writes roll back to savepoints.
7. Non-admin assignment targets and disabled actors are rejected. Unrestricted-admin counts are read from PostgreSQL.
8. Last enabled unrestricted admin cannot be demoted, self-disabled or self-assigned. Transaction-only missing-assignment overlays exercise the real count/authorization path without changing existing users; the overlays are invisible to other connections and deliberately rolled back. Original counts are restored.

### Acceptance finding resolved

The initial run exposed the driver's raw UPDATE result shape: returning a nested rows/count result could make the API/audit snapshot an array. The service now uses `WITH updated AS (UPDATE ... RETURNING ...) SELECT * FROM updated`, giving a stable single role object. Regression assertions verify the response ID/version and persisted audit objects. This was an application-code fix; **the approved migration SQL was unchanged**. The subsequent expanded suite passed all eight cases with baseline verification.

## Regression and integration evidence

- Permission offline/guard/DTO/migration cases: 11/11 PASS.
- Login access offline/HTTP cases: 6/6 PASS.
- Login access PostgreSQL regressions with permissions installed: 7/7 PASS. Last-admin assertion accepts the stronger unrestricted-admin safeguard.
- Auth service/controller/mail regressions: 17/17 PASS; auth HTTP/PostgreSQL regressions: 7/7 PASS.
- Full frontend regressions after Settings preparation: 109/109 PASS.
- Frontend/backend production builds PASS; final frontend generates 223 pages. Focused frontend/backend lint PASS.
- Root application module dependency injection/startup PASS; applied permission API returns 200 for a verified unrestricted admin; unapplied Settings API returns 503.

## Automatic roadmap continuation

Continued into General Settings: school identity/contact/timezone form, real API/proxy, singleton persistence, optimistic version checks, audit history and acceptance tests prepared. Settings offline cases 10/10 and frontend cases 6/6 PASS. The new migration **has not been applied**, and its PostgreSQL acceptance suite has not been run.

Current continuation: **175 distinct tests PASS** (42 backend permission/login/settings cases + 24 auth regressions + 109 frontend cases).

Next approval gate: [School Settings migration review](./SCHOOL_SETTINGS_MIGRATION_REVIEW.md). After explicit approval, apply only that migration, run its PostgreSQL acceptance and continue settings/uploads/student foundations under the original master roadmap. Every later migration requires separate explicit approval.
