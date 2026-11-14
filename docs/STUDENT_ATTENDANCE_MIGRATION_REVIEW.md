# Student registry and attendance: next approval batch

Prepared 2026-11-14. **NOT APPLIED. Requires separate explicit owner approval.**

The earlier approval has been fulfilled: General Settings and Admin Foundations are applied and PostgreSQL-tested. It does not authorize this batch.

## Exact scope and SQL

Apply only these two migrations, in order, in one transaction after approval:

1. `CreateStudentRegistry1794671000000`
2. `CreateAttendanceRegisters1794671100000`

Exact [UP SQL](../../../lms/lms-backend/docs/STUDENT_ATTENDANCE_UP.sql) and [DOWN SQL](../../../lms/lms-backend/docs/STUDENT_ATTENDANCE_DOWN.sql) include all schema statements, migration-history rows and transaction/timeout settings. [Guarded helper](../../../lms/lms-backend/test/student-attendance-migration.mjs).

- UP SHA-256: `0bb80ea20a4593856819f503ec5fed0bee82e41622bdc78fb728876942a22b09`
- DOWN SHA-256: `e2c85f5b5b52088e428bb05ef6765949e7f549561067fc49464ebdfcad5b2a75`

**Six new empty tables and two supporting UNIQUE constraints on existing tables. No seeds, row rewrites, identity matching, account creation, extension installation or destructive changes.**

| Schema change | Constraints and purpose |
|---|---|
| `student_catalogs`: `UQ_student_catalogs_reference` | UNIQUE `(id,kind)`. The existing UUID primary key already ensures uniqueness. Allows composite FKs to enforce category/group kinds. Adds an index/constraint; does not update catalog rows. |
| `academic_years`: `UQ_academic_years_enrollment_dates` | UNIQUE `(id,start_date,end_date)`. Existing primary key ensures uniqueness. Pins enrollment boundaries to the actual academic-year dates, so later date changes cannot silently invalidate enrollment. |
| `students` | UUID; case-insensitive unique admission number; required trimmed legal names, birth date, enumerated gender; nullable contact/address/medical notes; optional category/group FKs with constant kind columns; active flag; version, actor FKs and timestamps. Deactivation retains the identity; there is no delete endpoint. No login account is created or linked. |
| `student_guardians` | UUID; restrictive student FK; name, relationship and optional contact fields; primary-contact flag; version and actor FKs. A partial UNIQUE index permits at most one primary contact per student. Guardian records belong explicitly to one student; no automatic merging by contact details. |
| `student_enrollments` | UUID; student, class, section and year relationships; explicit roll number and inclusive start/end dates; version/actors. Composite FKs reuse the existing routine reference constraints to enforce class/section/year consistency. A composite year-date FK and CHECK enforce enrollment within the academic year. GiST exclusions prevent overlapping placements for a student and overlapping occupation of a roll number within a class-section. |
| `school_record_events` | Append-only application audit for student, guardian, enrollment and both attendance resources. UUID target, verified actor FK, unique resource/target/version, before/after snapshots and timestamps. No deletion API. |
| `student_attendance` | UUID; one row per enrollment/date; enumerated status, bounded note, version and actors. Composite FK pins enrollment date bounds; a CHECK independently requires attendance inside those bounds. No default status. |
| `staff_attendance` | UUID; restrictive staff FK; one row per staff/date; enumerated status, note, version and actors; optional explicit local clock times. Checks reject clock-out without clock-in, reverse same-day times and clock times on absent/leave entries. No fabricated times. |

These migrations reuse the **already installed** `btree_gist` extension. The preflight confirms its UUID/text GiST operator classes, existing routine UNIQUE references, parent tables, REFERENCES privileges and UUID generation. It creates no extension.

## Preservation and rollback

Current PostgreSQL 18.6 state: **19 applied migrations, 28 application tables / 29 public tables including history**. READ ONLY preflight passes; proposed names are absent. The previous batch's baseline was rechecked after its acceptance suites and after wiring these new modules: all 22 original application-table hashes still match, and all six approved configuration tables remain empty after fixture rollback. All 7 users, both original subject assignments and 82 refresh tokens were retained.

After approval only, the helper snapshots every current application table, executes these two exact migrations and history inserts, checks all original table counts/full-row hashes and all 19 prior migration-history records before commit, and confirms all six new tables are empty. Any discrepancy or SQL error aborts the entire batch. There is no migrate-all command.

DOWN first checks both attendance tables and their audit history under exclusive locks. It then checks all registry tables and the complete school-record audit table before dropping anything in that migration. Any stored record aborts rollback. No CASCADE. Later dependencies block removal. Only this batch's exact two history rows and its own two added UNIQUE constraints are removed. Other existing constraints, extensions and rows remain untouched. Once records exist, preserve them and use a reviewed forward fix.

The UNIQUE additions may take table locks; application uses a 5-second lock timeout and 30-second statement timeout. These additions and their exact DOWN removals are included in the reviewed SQL.

## APIs and integrated behavior

All routes require a verified enabled **unrestricted admin**. Restricted admins receive no implicit new grants. Service methods also recheck live authority; writes use the shared advisory lock `(1401,1)` so role/login changes cannot race authorization checks.

| Routes | Behavior |
|---|---|
| `/api/v1/student-records/options` | Real class-section/year choices, active catalogs and configured school-local today; no invented academic years or class IDs. |
| `/api/v1/student-records/students` GET/POST | Paginated active/inactive search and atomic admission. Profile, optional first guardian, initial enrollment and all associated audit rows commit together. |
| `/api/v1/student-records/students/:id` GET/PUT | Retrieve profile/guardians/enrollment history; update profile with current version. Birth-date changes cannot contradict existing enrollment starts. |
| `/students/:id/guardians` POST and `/:guardianId` PUT | Explicit versioned guardian maintenance; ownership and at-most-one-primary-contact protection. Switching primary contact requires explicit saves rather than silent reassignment. |
| `/students/:id/enrollments` POST and `/:enrollmentId` PUT | Add a dated placement/promotion without overwriting history; versioned shortening of an unused enrollment period. |
| `/api/v1/school-attendance/students` GET/PUT | Class-section/date roster with actual enrollment UUIDs and roll numbers; atomic batches of 1–100 distinct targets. |
| `/api/v1/school-attendance/staff` GET/PUT | Staff/date roster; explicit status/notes/local times and atomic versioned batches. |
| `/api/v1/student-records/history` GET | Paginated before/after history with verified actor names. |

The existing admission/edit, directory, student attendance and staff attendance routes now use same-origin authenticated Next proxies and real backend clients. Headers, card/tab layouts and navigation are retained. Placeholder data, synthetic roll numbers, automatic Present statuses, fixed academic years and fabricated clock times are removed from these four flows. Failed writes preserve drafts; duplicate submissions are suppressed; attendance date/page changes are blocked while there are unsaved edits, with an explicit discard/reload action. Statistics describe shown rows rather than fabricated school totals.

General Settings must be explicitly configured with the school timezone before attendance can be saved. Missing timezone returns 503; future school dates are rejected. Weekend/holiday context is displayed without inventing defaults or automatically converting an unmarked row into an absence. Historical marked attendance remains visible for inactive people and can be corrected with its current version.

## Verification and limits

| Check | Current result |
|---|---|
| Exact source/compiled/review SQL equality | PASS, hashes above |
| PostgreSQL compatibility/prerequisites/name collisions | PASS, READ ONLY |
| New service/DTO/migration cases | 18/18 PASS |
| New frontend client/proxy/admission/attendance cases | 9/9 PASS |
| Full frontend regression suite | 127/127 PASS |
| Backend Vitest suite | 22/22 PASS; two old smoke tests now have correct dependencies and meaningful safe-profile/actor assertions |
| Related backend offline service/HTTP regressions | 41/41 PASS |
| Frontend/backend production builds | PASS; frontend 223 generated pages |
| Focused frontend lint and backend type-aware lint | PASS, no errors/warnings |
| Root-module startup / original-data checks | PASS; approved Settings/foundations read APIs return 200; unapplied registry/attendance read APIs return 503 |
| New PostgreSQL persistence acceptance | **PREPARED, NOT RUN**; separate migration approval required |

The [prepared acceptance suite](../../../lms/lms-backend/test/student-records.e2e.mjs) has eleven scenarios covering real HTTP guards/validation, atomic admission, identity/catalog constraints, guardians, date/roll overlap exclusions, unmarked rosters, persisted attendance versions/times, mixed-batch rollback, injected audit failure, history and direct SQL constraint bypass attempts. Fixtures roll back; all public-table hashes are compared afterward. The suite refuses to run unless these migrations are already applied and the new tables are empty. Syntax has been checked; neither migration nor persistence suite has been executed.

This batch does **not** complete the full student lifecycle or Admin backend. Explicit limitations: an enrollment period already referenced by attendance cannot be shortened with this API; use a separately reviewed correction workflow. Transfers within non-overlapping periods are supported for unreferenced periods; bulk promotion, exports, subject attendance and attendance aggregates remain separate work. Staff clock intervals are same-day local times; overnight shifts and payroll calculations are not implemented here. Secure uploads/portraits, remaining settings/providers, learning/exams, finance/payroll/accounts, library/inventory, communication and reports remain on the master checklist. Continue those larger batches automatically after approved application and acceptance, requesting separate approval before each later migration batch.

## After approval

Use the guarded helper with `--approved-student-attendance-batch` only after approval of these exact hashes, then run `npm.cmd run test:student-records`. Without flags the helper is read-only; `--emit-sql` only generates review files. Do not rerun the previous 17-migration-state apply helper, and do not run all pending migrations. Recheck exact SQL and preservation before committing, run relevant tests/builds, save the checkpoint, and continue the master task.
