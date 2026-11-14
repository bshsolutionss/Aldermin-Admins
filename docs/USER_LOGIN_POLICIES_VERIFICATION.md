# Login policies: approved application and PostgreSQL acceptance

Date: 2026-11-13. Migration: `CreateUserLoginPolicies1794500000000`.

## Application and data preservation — PASS

The owner explicitly approved this migration in the conversation. Only the guarded helper's `--approved-user-login-policies` path was executed; no generic migrate-all command was used.

Source, compiled statements and reviewed SQL matched before application:

- UP SHA-256: `fdcbe21d96690d4ef838547f52022bec0faed998c987b7ae8f19d8c9bc6436c6`.
- DOWN SHA-256: `90f710aebbeba64b69ae4710ae4436185f002446a02cf84e4d551fac15bb8aea`.

The transaction compared counts and SHA-256 row snapshots across **all 17 pre-existing application tables** before committing. Every existing row and all 15 prior migration-history rows were unchanged. Both new tables were empty. Database state became **16 migrations, 20 public tables including migration history**. No rollback was executed.

The preserved baseline included 7 users, 79 refresh tokens, 12 password reset tokens, 2 role-change logs, 2 original subject assignments, 3 courses, 1 academic year, 1 class, 1 section and 1 class-section. Remaining existing tables were empty.

## PostgreSQL acceptance — 7/7 PASS

The suite uses real Nest HTTP guards, services and PostgreSQL, scoped to one outer transaction. Fixture rows and audit records are rolled back; post-cleanup counts/hashes of every table match the suite's baseline.

1. Authentication, admin-only access and DTO/UUID validation.
2. Disable persists policy, correct actor/target audit event and version increment; refresh-token `revoked_at` values are persisted; login, refresh and old access tokens are rejected.
3. Re-enable persists across application recreation, permits fresh login, never revives old access/refresh tokens, and records the opposite audit transition. No-op writes add no audit event.
4. Search/pagination expose persisted access state without password hashes.
5. Self-disable and mutations by disabled/stale admin actors are rejected.
6. SQL enabled-admin counts include enabled users without policies and exclude disabled users.
7. Actual last-enabled-admin self-disable and demotion are rejected. To exercise this without changing existing user rows, the test inserts missing login-policy overlays inside a nested savepoint; these are invisible to other connections and deliberately rolled back. No existing policy is overwritten and no school sessions are revoked by the overlays. Counts are restored before suite cleanup.

The suite was subsequently rerun with the prepared permission-role service injected, confirming its unapplied schema preserves current login behavior.

## Other verification

- Login-access offline/HTTP suite: 6/6 PASS.
- Auth service/controller/mail regressions: 17/17 PASS.
- Auth HTTP/PostgreSQL regressions: 7/7 PASS.
- Frontend authentication/login-access regressions: 46/46 PASS before the next module was prepared.
- Backend production build PASS.

## Later authentication activity

A later read-only snapshot contained 80 refresh tokens. Compared with the migration's 79-token baseline, the original-row hash can be reproduced exactly by reversing **one `revoked_at` change in memory only**; the observed timestamp was `2026-11-13T04:05:54.387+05:00`. One new token was also present. This is an observed authentication-token rotation after the migration, not an unchanged-current-token-table claim. Its initiator was not established. No database correction, deletion or revocation was performed. Other existing school-table hashes remained equal to the application baseline in the later preflight; both login-policy tables remained empty after test cleanup.

## Continuation

Custom admin permission roles are prepared next. Their separate migration is **NOT APPLIED**. See [next migration review](./ADMIN_PERMISSION_ROLES_MIGRATION_REVIEW.md). Continue the original master roadmap after its separate approval; request explicit approval before every subsequent migration.
