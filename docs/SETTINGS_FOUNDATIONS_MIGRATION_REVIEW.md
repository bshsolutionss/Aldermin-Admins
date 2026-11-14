# General Settings, school calendar and student catalogs: approval batch

Prepared on 2026-11-14. **NOT APPLIED. Explicit owner approval is required.**

This batch contains exactly two migrations, applied in order in one transaction:

1. `CreateSchoolSettings1794500200000`: the previously reviewed school identity/contact/timezone singleton and audit history. Its migration source is unchanged. The [original review](./SCHOOL_SETTINGS_MIGRATION_REVIEW.md) still applies.
2. `CreateAdminFoundations1794670000000`: holidays, weekends, student categories/groups and their audit history.

Review the exact [batch UP SQL](../../../lms/lms-backend/docs/SETTINGS_FOUNDATIONS_UP.sql) and [batch DOWN SQL](../../../lms/lms-backend/docs/SETTINGS_FOUNDATIONS_DOWN.sql). These include transaction boundaries, lock/statement timeouts, all schema statements and the exact migration-history inserts/deletes. The [guarded helper](../../../lms/lms-backend/test/settings-foundations-migration.mjs) checks source/compiled/reviewed SQL equality before any database connection.

- UP SHA-256: `1cfd299d9abb3642be1b0c9a4e835761faedc8e4e7e64c9d57f7b382b2b2db52`
- DOWN SHA-256: `e3c425be4436853ddad3d0869ecf1c24bdcefa45c32401cdaf49b082f8346cbb`

## Schema and preservation

| New table | Behavior and constraints |
|---|---|
| `school_settings` | Explicit school identity/contact/timezone; boolean singleton, version, restrictive creator/updater FKs; no seed. |
| `school_settings_events` | Atomic before/after snapshots, actor FK, unique settings version; no seed. |
| `school_weekends` | Boolean singleton; integer day mask 0–126 encodes distinct days Sunday=0 through Saturday=6, excluding an all-week weekend; version and restrictive updater FK. Empty means unconfigured. Mask 0 explicitly means no weekend days. |
| `school_holidays` | UUID, trimmed nonblank name up to 120 characters, inclusive date-only start/end between 1900-01-01 and 9999-12-31, archive state, version, restrictive actor FKs and timestamps. A GiST exclusion constraint rejects overlapping active date ranges, including concurrent inserts. Archived ranges may overlap; restoration must satisfy the same exclusion. Uses PostgreSQL's built-in range operator class, with no new extension. |
| `student_catalogs` | UUID, kind restricted to categories/groups, trimmed nonblank name up to 120 characters, archive state, version, restrictive actor FKs and timestamps. A unique `(kind,lower(name))` index reserves names even after archive; categories and groups may independently share a name. Catalogs are global, without invented grade/section mappings. |
| `admin_foundation_events` | UUID, calendar/catalog resource, record identifier, restrictive verified actor FK, version, before/after JSON snapshots and timestamp. Unique resource/record/version; ordered-history index. No delete API. |

All six tables start empty. There are **no existing-table alterations, school-row updates/deletes, seeds, extensions, credential changes or legacy relationship guesses**. Archive/restore retains UUIDs and existing history. No student, guardian, enrollment or attendance records are created by this batch.

The helper defaults to a `REPEATABLE READ READ ONLY` transaction. Preflight on PostgreSQL 18.6 passed against 17 applied migrations and 22 application tables / 23 public tables including migration history. Proposed names are absent, UUID generation and parent-key/privilege prerequisites are present. The baseline contains all 7 users, both original subject assignments and 82 refresh tokens. That token count is the current observed state; the historical 81-token permission-migration baseline is not overwritten or presented as current.

Only after approval, the helper applies these two migrations together, compares every pre-existing application table's full-row count/SHA-256 and all previous migration-history rows before commit, and verifies every new table is empty. A mismatch aborts the transaction. There is no migrate-all operation.

## API, authorization and frontend behavior

General Settings retains its existing API/form/history implementation. New routes are under `/api/v1/admin-foundations`:

| Route | Methods | Contract |
|---|---|---|
| `/holidays` | GET, POST | Paginated active/archived search; create a validated date range. |
| `/holidays/:id` | PUT | Update/archive/restore with a UUID and current version. |
| `/categories`, `/groups` | GET, POST | Paginated active/archived search; create a named category/group. |
| `/categories/:id`, `/groups/:id` | PUT | Update/archive/restore with a UUID and current version; kind isolation. |
| `/weekends` | GET, PUT | Explicit unconfigured result; save distinct days and current version (0 for first save). |
| `/history` | GET | Paginated history across these four resources; verified actor names and before/after state. |

These new administrative configuration APIs require enabled unrestricted admins. Restricted admins have no new implicit grants; instructors/students are denied. Mutations recheck live authority under the same advisory lock `(1401,1)` used by permission/login changes. Input whitelist validation rejects actor/version type injection and unbounded pagination. Database constraints independently enforce important invariants.

Calendar/catalog writes and their events commit atomically. Stale versions return 409; unchanged writes create no new events. Missing schema/permission prerequisites fail closed. Holiday overlap and catalog uniqueness return actionable 409 responses.

The existing four routes keep their navigation, headers, card styling and form/list layout. Their actions now use authenticated same-origin Next.js proxies, server search/pagination, real UUIDs/versions, archive/restore, human-readable history and retryable errors. No demo records are substituted. Failed saves retain drafts; duplicate submissions and stale load responses are suppressed. Category/group grade and section mock values were removed because those relationships are not persisted yet.

## Rollback

DOWN checks the foundations tables first, then General Settings. It locks affected tables and refuses to drop them if any settings, calendar, catalog or audit row exists. No CASCADE. Later dependencies abort rollback instead of being removed. Only the two exact batch history rows are removed, inside the same transaction. Once configured, preserve the records and use a reviewed forward fix.

## Verification and application gate

- Backend production build: PASS.
- Frontend production build: PASS; 223 generated pages.
- New backend service/DTO/migration cases: 13/13 PASS.
- New HTTP contract/authorization scenario: PASS, covering all resource routes and failure paths.
- Related backend settings/permissions/login offline regressions: 27/27 PASS.
- Full frontend regressions: 118/118 PASS, including 9 new foundation client/proxy/state cases.
- Focused backend type-aware lint and frontend lint: PASS, no errors or warnings after lifecycle fixes.
- Root-module dependency injection/startup and live READ ONLY API probe: PASS. Existing permission-role API returns 200; unapplied General Settings and all five foundation read endpoints return 503 as designed.
- Exact source/compiled/review SQL equality and READ ONLY PostgreSQL preflight: PASS.
- [New PostgreSQL acceptance suite](../../../lms/lms-backend/test/admin-foundations.e2e.mjs): PREPARED, NOT RUN. Nine cases cover real persistence, HTTP authorization/validation, kind isolation, versioning, archive/restore, exclusion/uniqueness/FK/check constraints and atomic audit-failure rollback. Fixtures roll back and every public table is compared afterward.
- Existing [General Settings acceptance suite](../../../lms/lms-backend/test/school-settings.e2e.mjs): PREPARED, NOT RUN; still requires schema approval.

After explicit approval of this exact batch, run the guarded helper with `--approved-settings-foundations-batch`, then the General Settings and foundation PostgreSQL suites. The helper without flags is read-only; `--emit-sql` only generates review files and cannot be combined with approval.

This is a foundation checkpoint, **not completion of the full Admin backend**. The owner has already authorized continuous implementation of the remaining roadmap. After approved application and acceptance, continue uploads, student/guardian/enrollment, attendance/learning/exams, transactional finance/HR/payroll, library/inventory/dormitory/front-office, communication and source-backed reporting. Prepare later migration batches for separate review; no new implementation prompt is needed.
