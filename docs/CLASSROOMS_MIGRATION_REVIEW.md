# Classrooms: migration approval review

Status: APPLIED after explicit owner approval on 2026-11-12. Classroom PostgreSQL tests passed 6/6 and all existing rows were preserved; see [verification](./CLASSROOMS_VERIFICATION.md). The remainder records the approved review.

## Scope

One `classrooms` table backs both existing pages, `/admin/academics/classroom` and `/admin/academic/class-room`. Existing layout, styling, navigation and routes are preserved. The module stores room numbers and positive integer capacities, with case-insensitive room-number uniqueness.

Admin-only GET/list, GET by UUID, POST, PATCH and DELETE endpoints use existing JWT/database-role guards. DTOs reject null/blank/oversized room names, nonpositive/fractional/oversized capacities, extra fields and empty updates. A missing classroom table returns an actionable 503 until approval/application; no success or room list is fabricated.

## Exact SQL to approve

- [UP SQL](../../../lms/lms-backend/docs/CLASSROOMS_UP.sql)
- [DOWN SQL](../../../lms/lms-backend/docs/CLASSROOMS_DOWN.sql)
- [Migration source](../../../lms/lms-backend/src/database/migrations/1794430100000-CreateClassrooms.ts)

UP creates only the new empty classroom table and a unique index, then records the migration. It does not update, delete, seed, backfill or alter existing school tables/records. Current read-only inspection confirms the classroom table does not exist.

The prepared application script requires separate explicit approval, checks for exactly 13 prior migrations and an absent classroom table, then compares every pre-existing application table before commit. All statements run in one transaction with a 5-second lock timeout.

## Rollback strategy

DOWN locks the new table, checks whether it contains any records, and refuses to proceed if any exist. With an empty table it removes only the new table/index and this migration's tracking entry. It uses no CASCADE; future dependent objects also prevent an unsafe drop. If classroom data exists, retain the additive schema and use a compatible application rollback or separately reviewed forward fix. Never delete classrooms to force rollback. DOWN is a recovery plan, not permission to execute it automatically.

## Verification

- Backend and frontend production builds: PASS.
- Backend classroom HTTP/service/migration-review tests: 5/5 PASS (repository fixtures; no schema changes).
- Frontend classroom tests: 6/6 PASS (one API for both routes, CRUD, remount persistence, error/input retention, retry, validation, proxy authorization/CSRF, existing controls).
- Focused backend lint: PASS. Frontend lint: 0 errors; 4 existing unused-argument warnings in the shared API service.
- PostgreSQL classroom suite: subsequently passed 6/6 after explicit approval and application.

Approved application, PostgreSQL acceptance and data-preservation checks are complete. Routine implementation is prepared next; its migration requires separate approval.
