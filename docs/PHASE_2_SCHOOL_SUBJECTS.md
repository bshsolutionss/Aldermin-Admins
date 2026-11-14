# Phase 2: School Subjects

Implemented the dedicated school subject catalog. Migration approval was granted after review of [the schema and migration proposal](./PHASE_2_SCHOOL_SUBJECTS_PLAN.md). Scope ends at School Subjects.

## Delivered

- Standalone PostgreSQL `school_subjects` table and TypeORM entity, with UUID primary key, trimmed name, optional normalized unique code, Theory/Practical type, and timezone-aware timestamps.
- Dedicated NestJS module/controller/service and create/update DTOs. Strict validation, UUID checks, empty PATCH rejection, 404 for missing subjects, and 409 for duplicate codes including concurrent requests.
- Existing database-backed JWT and RBAC guards: admins have CRUD access; instructors read only; students denied; unauthenticated requests rejected.
- Authenticated, same-origin mutation proxies and typed API-client methods. The academic subject getter delegates to this catalog with no Courses mapping, mock fallback, or fabricated write success.
- Both academic subject catalog routes retain their URLs, styling, and layouts and now support real create, edit, delete, reload, loading/empty/error states, retry, cancel edit, and duplicate-submit protection.
- Both subject assignment selectors use the real subject catalog. Assignment writes, sections/staff dependencies, and Library taxonomy remain in their separate roadmap phases.

## Database application and preservation

- Immediately before application: confirmed `public.school_subjects` did not exist and the five prior migrations were applied.
- Reviewed the migration's `up` statement: exactly one CREATE TABLE, no references or writes to existing tables. Applied only `CreateSchoolSubjects1794355200000` in a transaction. No seeds, copying from courses, or synchronization.
- Verified resulting column definitions, defaults, and named primary-key, unique, and check constraints.
- All three pre-existing LMS course rows and their schema/constraints/indexes matched the before/after SHA-256 snapshot: `caf2fed3da900aa48948bba7190aff72c5f3f8f87831cff54bb15625a3a48f72`.
- Database tests use committed subject fixtures to demonstrate persistence through an independent connection, then delete only fixture UUIDs returned by their POST requests. User fixtures roll back. Pre-existing subject rows and all course data/schema remain unchanged.
- A down migration exists for review but was not executed. It drops only the new table and would remove its subject data.

## Verification

- School Subjects frontend client/proxy/shared-state/route tests: 12 passed.
- School Subjects NestJS HTTP + PostgreSQL suites: 6 passed. Includes CRUD, actual committed persistence, direct database constraints, normalization, optional codes, duplicate-code races, malformed inputs, missing records, all roles, anonymous access, and database role enforcement against a forged token role.
- Existing frontend authentication regression tests: 31 passed.
- Existing backend authentication unit/mail tests: 15 passed.
- Existing authentication HTTP + PostgreSQL tests: 6 passed.
- Frontend and backend TypeScript checks and production builds: passed, including the final frontend build after responsive layout corrections.
- Focused frontend lint and backend type-aware lint passed after corrections.
- Production browser: create/edit/delete and persistence after page reload passed on both catalog routes; shared records appeared across routes; both assignment selectors used the real catalog. Create/delete also passed at a narrow 892 x 385 viewport.
- Browser checks found a narrow-screen sticky-form overlap; sticky positioning is now limited to the desktop two-column layout. Fieldsets retain a zero minimum width. Existing routes and visual design remain intact.
- Temporary browser servers were stopped and all browser fixture writes rolled back. Final database inspection confirmed the applied migration, zero test subjects/users left behind, and the original three courses and schema unchanged.

## Repeatable checks

Frontend:

```powershell
npm.cmd run test:subjects
npm.cmd run test:auth
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm.cmd run build
```

Backend (build before running the production-module HTTP/database suite):

```powershell
npm.cmd run test:subjects
npm.cmd run test:auth
npm.cmd run test:auth:e2e
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

The loopback-only browser fixture server is [school-subjects-browser-server.mjs](../../../lms/lms-backend/test/school-subjects-browser-server.mjs). It uses an outer transaction for all browser writes and rolls them back on shutdown. It is not a production server.

The approved migration application helper refuses to run if the table exists or migration history differs from the inspected five-migration baseline. Do not rerun it on an already migrated database. Normal application startup retains `synchronize: false` and does not automatically run migrations.
