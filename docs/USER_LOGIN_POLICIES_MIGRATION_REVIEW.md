# Account login permissions: migration approval review

**Status: APPLIED on 2026-11-13 after separate explicit owner approval. PostgreSQL acceptance 7/7 PASS.** See [application and data-preservation verification](./USER_LOGIN_POLICIES_VERIFICATION.md). The SQL/review below is retained as the exact pre-application review; its pending statements describe that earlier checkpoint.

Migration: `CreateUserLoginPolicies1794500000000`.

Exact [UP SQL](../../../lms/lms-backend/docs/USER_LOGIN_POLICIES_UP.sql) and [DOWN SQL](../../../lms/lms-backend/docs/USER_LOGIN_POLICIES_DOWN.sql) match the [source](../../../lms/lms-backend/src/database/migrations/1794500000000-CreateUserLoginPolicies.ts) and fresh compiled migration statement-for-statement, including transaction, 5-second lock timeout and exact history insertion/removal.

- UP SHA-256: `fdcbe21d96690d4ef838547f52022bec0faed998c987b7ae8f19d8c9bc6436c6`
- DOWN SHA-256: `90f710aebbeba64b69ae4710ae4436185f002446a02cf84e4d551fac15bb8aea`

## Proposed schema and data safety

UP creates two initially empty tables: `user_login_policies` (one rule per existing user, enabled flag, nonnegative session version, actor and timestamp) and `user_login_policy_events` (previous/new flag, target, actor and timestamp). Four restrictive FKs reference existing user UUIDs. One audit lookup index is created. It adds exactly one history row, with **no new extension, ALTER of existing tables, seed, school-row update, deletion or backfill**.

Existing users have no policy row and retain enabled access. A changed account receives a policy/audit row only when an enabled admin performs that explicit action. Disabling revokes that account's refresh tokens and increments its session version, so old access tokens stay invalid even after re-enabling. A fresh sign-in is required. This runtime token update is not performed by the migration.

The API rejects self-disable, checks the actor's current database role/access after a shared advisory lock, and serializes disable operations with role changes and the last-enabled-admin check. Login and refresh hold the target user lock before issuing tokens. Standard and optional authenticated guards enforce current login status and token version. The `/admin/role&permission/loginpermission` page uses server search/pagination and real mutation/error responses, with confirmation before disabling. No user-delete API is introduced.

While the feature migration has never been installed, existing authentication retains its established behavior and the new management endpoint returns 503. A partial schema, or missing table with the feature history row present, fails closed. Feature checks are not cached, so approval/application activates the feature without changing configuration. Fixed account roles remain unchanged; this is **not** completion of custom roles, fine-grained grants, account CRUD or the entire permissions roadmap.

## Rollback

DOWN exclusively locks both new tables and **refuses if either policy or audit rows exist**. With both empty, it drops only those tables and their own constraints/index, then deletes only the exact migration-history row. There is no CASCADE. Later dependencies fail the transaction rather than being removed. Once rules or audit history exist, use a reviewed forward fix or compatible application rollback; never delete policy/audit records to force DOWN.

## Historical verification before approval

| Check | Result |
|---|---|
| Exact source/compiled/reviewed UP and DOWN | PASS |
| Live database compatibility, READ ONLY | PASS: PostgreSQL 18.6, UUID generator, public schema CREATE and user REFERENCES privileges |
| Prerequisites and collisions | PASS: 15 prior migrations, latest Class Routines; new table/index/constraint names absent; users.id UUID primary key |
| Current data safety | PASS: snapshot of all 17 current application tables; migration contains no existing-row mutation |
| Offline service/HTTP login tests | PASS: 6/6, including schema gate, disabling/re-enabling, old-session rejection, audit/revocation, actor/self/admin protection and validation |
| Authentication service regression | PASS: 17/17, including login/refresh denial and versioned token issuance |
| Frontend regressions | PASS: 100/100, including 6 new login access cases |
| Frontend/backend builds and focused lint | PASS |
| Login policy PostgreSQL acceptance | PREPARED, NOT RUN: schema approval required |

Use the [guarded helper](../../../lms/lms-backend/test/user-login-policy-migration.mjs) with no flags for read-only preflight. SQL generation alone uses `--emit-sql` and does not connect to PostgreSQL. Only after explicit approval may `--approved-user-login-policies` apply the reviewed UP in one transaction, assert all existing records unchanged, verify both new tables empty and commit. No generic migrate-all command is used.

After approval, run `npm.cmd run test:login-permissions` and relevant auth/regression checks. The prepared PostgreSQL suite uses an outer fixture transaction, rolls it back and compares existing row hashes. It has not been invoked before approval. Then continue fine-grained permissions/settings/upload dependencies and student foundations in roadmap order, with separate review/approval for every later migration.
