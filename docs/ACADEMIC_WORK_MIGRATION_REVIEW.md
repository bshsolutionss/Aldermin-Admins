# Homework and lesson planning: migration review

**Applied 2026-11-15 after explicit approval of the exact hashes below.** Actual PostgreSQL history ID **26**. Do not rerun. PostgreSQL acceptance is **7/7 PASS**, including real HTTP guards, persistence and audit checks; [application verification](./ACADEMIC_WORK_APPLICATION_VERIFICATION.md).

The original preparation review below is historical. Its pending-application statements describe the pre-approval checkpoint. Exact approved SQL and hashes remain unchanged. The current next gate is [conduct/staff administration](./CONDUCT_STAFF_ADMINISTRATION_MIGRATION_REVIEW.md).

## Original preparation review (historical)

Only migration: `CreateAcademicWork1794750000000`.

Exact [UP SQL](../../../lms/lms-backend/docs/ACADEMIC_WORK_UP.sql) and [DOWN SQL](../../../lms/lms-backend/docs/ACADEMIC_WORK_DOWN.sql):

- UP SHA-256: `b9d9165282a969e6120e68d971b1023e2bb448bff2fdfc4306e12a44576c7ad7`.
- DOWN SHA-256: `deffcfbf79510342ebf6c071dcb94bcc57f4683ef315def804c46b3b146c8417`.

The [guarded helper](../../../lms/lms-backend/test/academic-work-migration.mjs) defaults to READ ONLY. It compares source/compiled/review SQL, pins both reviewed hashes, checks actual history and rejects an already-applied or conflicting migration. Its only write mode is the explicit `--approved-academic-work` flag; that mode has **not** been executed.

## Changes and preservation

Creates six tables and their constraints/indexes:

1. `academic_homework`: allocation-scoped title/instructions, assigned/deadline dates, maximum points, archive and version.
2. `academic_lessons`: lesson registry with retained class-section/subject/staff IDs.
3. `academic_topics`: lesson-bound topics with matching allocation and retained scope.
4. `academic_plans`: topic-bound dated plans with planned/completed/cancelled status and completion date.
5. `academic_evaluations`: one versioned result per homework/enrollment, submitted/missing/excused status, whole points, feedback and evaluation date.
6. `academic_work_events`: actor, record version and before/after history.

No existing table, record, column, function, trigger, extension or legacy mapping is altered or backfilled. No configuration, students, assignments or marks are seeded. One named migration-history row is added.

Restrictive references preserve users, allocations, class sections, subjects, staff and dated enrollments. Composite topic/lesson and plan/topic foreign keys require matching allocation and retained scope. Evaluations reference the existing `(id,start_date,end_date)` enrollment key, so a recorded enrollment's dates cannot silently change after evaluation. Unique constraints prevent duplicate evaluation targets, lesson/topic names in their scope, and audit versions.

SQL enforces bounded whole points, status/zero-point rules, date ranges, completion-state consistency, nonblank titles and references. The service additionally verifies active real allocations, academic-year dates, configured school timezone, original dated enrollment, homework-specific maximum points, past evaluation/completion dates, immutable allocation/parent IDs, matching retained scope, and frozen homework dates/maximum once evaluated. These service checks are transactionally serialized with existing admin access changes. Cross-table score/date rules are service checks, not a claim that every raw SQL bypass is prevented by a trigger.

The apply helper captures a **fresh** baseline and locks prior application tables in SHARE mode during the short transaction (5-second lock timeout, 30-second statement timeout). It refuses COMMIT unless all 49 prior application-table row counts/SHA values and all 25 prior migration rows match, and all six new tables are empty. No migrate-all command is used.

DOWN locks all six new tables and refuses to drop anything if any academic work or history exists. It removes children before parents and uses no CASCADE. It has not been executed; populated systems require a forward correction.

## Current verification

- Source/compiled/exact SQL parity and pinned hash verification PASS.
- PostgreSQL 18.6 READ ONLY preflight PASS: actual history is 25 migrations; 49 existing application tables; all six proposed tables/index names absent; parent relations, privileges and dated-enrollment unique key present. [Evidence](../../../lms/lms-backend/docs/ACADEMIC_WORK_PREFLIGHT.json).
- New backend validation/service/real-guard HTTP contracts **10/10 PASS**. New frontend proxy/client/state tests **6/6 PASS**.
- Full frontend **145/145**, backend offline/HTTP **111/111**, Vitest **22/22**, existing PostgreSQL regressions **27/27** PASS. Both production builds, backend repository-wide lint, focused frontend lint and frontend TypeScript PASS.
- Root module starts with the new controller/service. Every new resource read returns 503 while schema is absent; applied Library/Inventory reads return 200. All 50 public tables unchanged during the probe.
- The [six-scenario PostgreSQL academic-work suite](../../../lms/lms-backend/test/academic-work.e2e.mjs) is prepared and syntax-checked, **NOT RUN**. It never executes schema, creates only isolated fixture identities, and rolls back with whole-public-table hash comparisons. Live persistence/constraint acceptance remains pending approval.

## Prepared Admin routes and limits

The existing homework add/list/report routes, lesson/topic/plan routes, both overview routes and the homework-evaluation report alias use protected cookie-session proxies. Real allocation/parent choices are searchable and paginated. Failed drafts remain, duplicate submissions are suppressed, stale loads cannot overwrite newer searches, writes use saved versions, and archives retain history. No demo classes, subjects, teachers or students are supplied when records are absent.

This batch covers administrative homework records/evaluation and lesson/topic/planning workflows. Learner submission/upload flows, homework file attachment association, configurable lesson-planning rules, schedule/calendar visualizations, bulk exports and the other roadmap modules remain open. Student/Instructor dashboards remain outside scope. No whole-backend completion is claimed.

## After approval

Apply **only** `CreateAcademicWork1794750000000` using the pinned helper and a fresh preservation baseline. Run the prepared PostgreSQL suite, fix any acceptance failures without modifying approved SQL silently, rerun affected regressions/builds, and continue the original full Admin task. Exams, behaviour, teacher evaluation, fees/accounts/wallet, leave/payroll, dormitory/front office, remaining settings/communications/reports and unfinished sub-workflows remain on the roadmap. Every later schema change requires separate approval.
