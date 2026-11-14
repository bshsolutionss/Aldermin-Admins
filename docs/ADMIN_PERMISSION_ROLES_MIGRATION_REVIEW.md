# Admin permission roles: next migration approval review

**APPLIED on 2026-11-13 after separate explicit owner approval. PostgreSQL acceptance 8/8 PASS.** See [application and data-preservation verification](./ADMIN_PERMISSION_ROLES_VERIFICATION.md). The SQL and pre-approval review below are preserved as historical evidence; pending statements describe the earlier checkpoint.

Migration: `CreateAdminPermissionRoles1794500100000`.

Exact [UP SQL](../../../lms/lms-backend/docs/ADMIN_PERMISSION_ROLES_UP.sql) and [DOWN SQL](../../../lms/lms-backend/docs/ADMIN_PERMISSION_ROLES_DOWN.sql) are generated from the compiled [migration](../../../lms/lms-backend/src/database/migrations/1794500100000-CreateAdminPermissionRoles.ts) and compared statement-for-statement with source. Each reviewed script includes a transaction, 5-second lock timeout, and the exact history insert/removal.

- UP SHA-256: `fffad774dec6577cc33c1c5aaba6cc108f14cc77b81d32321d920171499ddacb`.
- DOWN SHA-256: `b28514566aff82736614e541f3f0f3c479b93cdbe66578321f7f0a27ff53a335`.

## Exact proposed schema

All columns are NOT NULL unless explicitly marked nullable.

| New table | Columns and constraints |
|---|---|
| `admin_permission_roles` | `id uuid PRIMARY KEY DEFAULT uuid_generate_v4()`, `name varchar(80)` with nonblank trimmed-name CHECK, `permissions text[] DEFAULT '{}'` with catalog-subset/no-null-elements CHECK, `version integer DEFAULT 1 CHECK >= 1`, `created_by uuid`, `updated_by uuid`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`. Both actor UUIDs reference users with ON DELETE RESTRICT. Unique index `UQ_admin_permission_role_name` on `lower(btrim(name))`. |
| `admin_permission_assignments` | `user_id uuid PRIMARY KEY`, nullable `role_id uuid`, `assigned_by uuid`, `assigned_at timestamptz DEFAULT now()`. Assignee/actor reference users; role references permission roles; all ON DELETE RESTRICT. Index `IDX_admin_permission_assignment_role` on role ID. |
| `admin_permission_events` | `id uuid PRIMARY KEY DEFAULT uuid_generate_v4()`, `actor_id uuid`, nullable `target_user_id uuid`, nullable `role_id uuid`, `action text CHECK IN ('role_created','role_updated','assignment_set')`, nullable `before_state jsonb`, `after_state jsonb`, `created_at timestamptz DEFAULT now()`. Actor/target reference users and role references roles, all ON DELETE RESTRICT. Index `IDX_admin_permission_events_created` on `(created_at,id)`. |

Three initially empty tables, three explicit indexes (including one unique index), three PKs, eight restrictive FKs and four CHECK constraints. No existing-table ALTER, seed, backfill, extension creation, school-row mutation or deletion. Adds only its one migration-history row.

## Runtime behavior and scope

- Existing fixed account roles (`admin`, `instructor`, `student`) and portal access remain unchanged. Custom permission roles restrict **admin accounts only**; they do not promote students/instructors or grant access to Admin dashboards.
- Unassigned admins (or assignments whose role ID is NULL) retain current full access. No assignments are created by the migration.
- Catalog: View and Write for 12 implemented domain APIs: academic years, classes, sections, school subjects, subject assignments, class teachers, classrooms, class routines, departments, designations, staff and courses. Write covers create/update/delete methods already provided by those APIs; this migration executes none of those actions.
- Assigned admins require an explicit grant on each guarded domain request. Permissions are read from PostgreSQL each time; removing a grant takes effect on the next request without token rotation. Unmapped guarded resources fail closed for restricted admins.
- Account roles, login permission management and permission-role administration remain exclusive to enabled unrestricted admins. Actor authority is rechecked under the same advisory lock as login/role changes. Role version and previous-assignment checks reject stale writes.
- Self-assignment changes are forbidden. Login disable/demotion and permission assignment preserve an enabled unrestricted admin. Definition and assignment changes atomically insert before/after audit events. Restoring unrestricted access updates the assignment to NULL and retains its history; no delete endpoint exists.
- The existing Manage Roles page now uses real API calls, permission checkboxes, search/pagination, error/retry states and assignment confirmation. Failed writes retain inputs and current account state. No mock fallback exists.
- Before the new migration is installed, existing role/auth behavior continues and management returns 503. Partial schema/history fails closed. The feature gate is not cached.

## Data preservation and rollback

The guarded helper performs source/compiled/SQL parity, PostgreSQL compatibility and name-collision checks in its default READ ONLY mode. It currently verifies the 16 prior migrations and both login-policy prerequisite tables.

After separate approval, its apply-only branch snapshots every existing application table, executes only this UP plus its history row in one transaction, refuses commit if any baseline row changes, and verifies all three new tables are empty. Do not run a generic migrate-all command.

DOWN exclusively locks all three new tables. It refuses if **any role, assignment or audit event exists**. When all are empty, it drops only those three tables and their own indexes/constraints and deletes only this migration-history row. No CASCADE. Later dependencies fail the transaction instead of being removed. Once used, preserve these records and use a reviewed forward fix; never delete history to force rollback.

## Verification and acceptance boundary

- Source/compiled/reviewed SQL parity: PASS.
- READ ONLY PostgreSQL compatibility/preflight: PASS; 16 migrations, 19 existing application tables (20 including migration history), prerequisites present, no new-name collisions.
- Permission service/guard/validation/migration offline cases: 11/11 PASS.
- Frontend client/proxy/dynamic route cases: 3/3 PASS.
- Login PostgreSQL regression with permission service injected and feature unapplied: 7/7 PASS.
- Backend production build and focused type-aware lint: PASS.
- Frontend production build including TypeScript: PASS; focused lint corrected and rechecked.
- New permission-role PostgreSQL acceptance: **PREPARED, NOT RUN**. The feature is not considered complete before schema approval/application and acceptance.

The [guarded helper](../../../lms/lms-backend/test/admin-permissions-migration.mjs) without flags is read-only. `--emit-sql` only generates the exact review files without connecting to PostgreSQL. Do not invoke `--approved-admin-permission-roles` until separately authorized.

After approval: apply only this migration, run `npm.cmd run test:admin-permissions` (rolled-back fixtures and whole-database baseline verification), then relevant login/auth regressions. Continue settings/uploads and student foundations in dependency order, obtaining separate approval before each further migration.
