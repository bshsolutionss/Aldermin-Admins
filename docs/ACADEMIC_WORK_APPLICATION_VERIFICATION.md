# Academic work: approved application and PostgreSQL acceptance

Verified 2026-11-15. Only `CreateAcademicWork1794750000000` was applied after the owner's explicit approval of these exact versions:

- UP SHA-256: `b9d9165282a969e6120e68d971b1023e2bb448bff2fdfc4306e12a44576c7ad7`.
- DOWN SHA-256: `deffcfbf79510342ebf6c071dcb94bcc57f4683ef315def804c46b3b146c8417`.

## Application and preservation — PASS

The apply wrapper independently checked both hashes and actual PostgreSQL history before calling only the named guarded helper. Source/compiled/reviewed SQL parity and the pinned hashes matched. No generic migration runner, synchronization, seeding or DOWN execution occurred.

The helper captured a fresh baseline, held SHARE locks on all existing application tables and refused COMMIT unless all **49 prior application-table full-row counts/SHA values** and **25 earlier migration-history entries** were unchanged. All six new tables were empty. Preserved: **7 users, 88 refresh tokens, both original subject allocations and all other existing school records**.

Live history now contains ID **26**, timestamp **1794750000000**, name **CreateAcademicWork1794750000000**. Current schema has **55 application tables / 56 public tables including history**. [Application baseline and prior history](../../../lms/lms-backend/docs/ACADEMIC_WORK_APPLICATION.json).

## PostgreSQL acceptance — 7/7 PASS

1. Real allocation options and denied restricted admins.
2. Homework persistence, dated-enrollment roster, stale versions and academic-year bounds.
3. Persisted evaluations, enrollment eligibility, score/date/version guards, exact no-op retries and frozen evaluated homework terms.
4. Lesson/topic hierarchy, matching scope, dated plans/completion and overview counts.
5. Archive/restore without loss of evaluation history; verified actor and versioned audits.
6. Injected audit failure rolls back real writes; direct SQL rejects inconsistent completion state.
7. Real HTTP guards/DTOs with PostgreSQL: anonymous/student/restricted denial, injected-identity rejection, homework creation, score persistence/correction, audit attribution and restrictive dated-enrollment protection.

All fixtures use an outer transaction and roll back. Every public table's row count/SHA matches the suite baseline afterward. No test credentials or fixture records were committed. The first run exposed an overlong fixture roll number, corrected to fit the existing 30-character bound. The HTTP extension also verified PostgreSQL's RESTRICT error code and named constraint. Approved migration SQL and production service behavior were unchanged.

## Broader verification — PASS

- PostgreSQL academic/content/operations/student-and-attendance suites **34/34**.
- Frontend regressions **153/153**, including the next batch's eight new cases.
- Backend offline/HTTP regressions **124/124**, including the next batch's thirteen new cases.
- Backend Vitest **22/22**.
- Both production builds, backend repository-wide lint, focused frontend/audit-script lint, frontend TypeScript and diff whitespace checks PASS.
- Root-module startup PASS. Applied academic-work and operations reads return 200. All next-batch administration reads return 503 with its schema absent. All **56 public tables** unchanged during the fresh read-only probe. [Startup evidence](../../../lms/lms-backend/docs/ACADEMIC_WORK_STARTUP.json).

The school's timezone remains unconfigured in live General Settings; dated operations require the owner to save it. Only rollback-only fixtures supply a timezone. No school configuration was invented or persisted. Source work in both repositories remains uncommitted and was not reset, discarded or staged.

## Automatic continuation

Continued into a grouped **student conduct + staff leave + Admin-recorded teacher evaluation** batch, preparing eight tables, guarded APIs, reports, audit/state/quota safeguards and fourteen existing page integrations. Its separate [migration review](./CONDUCT_STAFF_ADMINISTRATION_MIGRATION_REVIEW.md) is the next approval gate. The full Admin roadmap remains open; later schema changes require their own explicit approval.
