# Phase 3: Academic Year

Completed Academic Year only. Classes, Sections, and portals were not changed.

- Applied the approved `CreateAcademicYears1794355400000` migration after confirming the table was absent and all seven prior migrations were applied. Reviewed SQL contains only CREATE TABLE and two CREATE UNIQUE INDEX statements; no seeds, changes to existing tables, or automatic synchronization.
- Table: UUID, trimmed name (100 characters), start/end dates, current flag, and timezone-aware timestamps. PostgreSQL enforces case-insensitive unique names, valid date ordering, and at most one current year.
- Admin-only list/detail/create/update/delete APIs and transactional current-year switching. Mutations serialize across server instances; deleting the current year returns 409.
- Existing Academic Year route, header, card and styling preserved. Placeholder replaced with shared form/table components, search, edit/cancel, current-year and delete actions, and loading/empty/error states. Lists reload from the API after writes; failed saves retain inputs.
- Existing Admin Login, HttpOnly cookies, database role checks, session handling and logout reused without changes.

## Verification

- Six NestJS HTTP/PostgreSQL tests passed: CRUD and committed persistence through an independent connection and backend application restart; all endpoint permissions; validation/UUID/404 handling; concurrent case-insensitive duplicate creation; concurrent current-year switching and deletion restrictions; direct database constraints.
- Three frontend integration tests passed: real API routing, admin proxy/CSRF/error behavior, data reload on mount/after writes, current-year deletion disabled, and failed-save input preservation.
- Production browser passed: Admin Login, create/edit, navigation away/back, refresh, current-year switching and reload, non-current deletion and refresh, and logout (profile becomes 401).
- Frontend/backend TypeScript and production builds passed. Focused frontend and backend lint passed.
- Migration snapshots and database tests confirmed existing LMS Courses, School Subjects, and Subject Assignments unchanged. Only exact test fixture IDs were cleaned up; browser/user fixtures rolled back. Final inspection found no test records left behind.

Run focused checks with `npm.cmd run test:academic-years` in each project. The backend command builds before running its HTTP/database tests. Current-year integration tests refuse to run if a pre-existing year is current, to avoid switching real application settings.

No known remaining issues in Academic Year. Stop here; await approval before starting another module.
