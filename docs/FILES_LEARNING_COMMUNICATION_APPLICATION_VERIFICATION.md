# Files, learning and communications: approved application

Applied 2026-11-14 after explicit owner approval, in order:

1. `CreateSecureSchoolFiles1794672000000`
2. `CreateLearningCommunication1794672100000`

Only these two migrations committed. Approved UP SHA-256 `b799b413e5bef6fd18bf6181f4154b59460736dfe2981e3133a0caf0128ce4b6` and DOWN `dac10b2a3b09a580a22844f2ea09d9e4b1ee1b430c0e97ea65f19d49a92907a6` matched before execution, along with source/compiled/review SQL parity. Before COMMIT, the guarded transaction verified all **34 pre-existing application tables** against a fresh count/full-row SHA-256 baseline, all **21 earlier migration-history rows** unchanged, and all six new tables empty. Baseline included 7 users, both original subject allocations and 84 refresh tokens. [Application evidence](../../../lms/lms-backend/docs/FILES_LEARNING_COMMUNICATION_APPLICATION.json).

PostgreSQL persistence acceptance: **8/8 PASS**. Exact bytes/SHA and metadata-only audits; actor restrictions; student/staff attachment linkage, versions and clearing; material allocation FK protection; notices/events/calendar persistence/filtering; archive retention; audit-failure rollback; direct SQL integrity; and a real Nest HTTP -> JWT/roles -> service -> PostgreSQL workflow for multipart upload, private download, student attachment, scoped syllabus, notice/event publication and calendar reads. Test fixtures rolled back; all public-table counts/SHA values matched afterward. The initial RESTRICT-FK assertion was corrected to accept SQLSTATE 23001 or 23503 only with the exact `FK_materials_allocation` constraint; the constraint correctly prevented deletion in both runs.

Student/guardian/enrollment/attendance PostgreSQL regression: **11/11 PASS**. Full frontend: **139/139 PASS**. Backend Vitest: **22/22 PASS**. Related offline backend suites: **94/94 PASS**, including the new operations contract cases. Both production builds PASS; frontend TypeScript generated 223 pages. Focused frontend ESLint and repository-wide backend type-aware lint PASS without warnings/errors.

Root module startup and read-only API probe PASS: files/materials/notices/events return 200. All **41 public tables** matched before/after. The live calendar intentionally returns 503 until the owner saves General Settings with a school timezone; the calendar workflow passed against rolled-back configured fixtures. No school configuration was invented or committed for tests.

Database now: **23 migrations; 40 application tables / 41 public tables including migration history**. The grouped Library/Inventory continuation remains **prepared, not applied**; its [separate approval review](./LIBRARY_INVENTORY_MIGRATION_REVIEW.md) covers all future schema. No Git commit, reset, clean or deletion was performed.

Final snapshot note: authentication state changed after the approved commit: one refresh token was added at `2026-11-14T15:30:15.345Z` and one earlier token was revoked. The other 33 pre-existing table hashes/counts still matched the commit baseline. A read-only investigation proved the prior 84 refresh-token rows match their original hash when only that later revocation is normalized **in memory**; nothing was rewritten in the database. This is consistent with session rotation. The current 85-token state is retained in the new read-only preflight baseline; future approved application will capture another fresh baseline. The migration's before-COMMIT preservation result remains PASS.

## Lint repair and Git audit

All **151** `no-floating-promises` errors were bare top-level Node test registrations in 19 existing test files. An AST-based [repair helper](../../../lms/lms-backend/scripts/repair-test-registrations.mjs) added explicit `void` to those registration calls; Node's test runner still owns their promises and reports test failures. No assertions or tests were removed. The original lint configuration/rules are unchanged.

The three warnings were also corrected: reflection retrieves the actual controller handler identity used by guard metadata without passing an unbound callable for execution; the older SQL review helper now iterates string direction names separately from statement arrays, avoiding mixed tuple interpolation types. Repository-wide `npm run lint` now exits 0 with no diagnostics. Offline runtime regressions, PostgreSQL regressions and Vitest passed after the repair.

The [Git audit](./GIT_CHANGE_AUDIT.md) lists exact expanded path/status inventories and generated-output counts. The backend has no HEAD commit or tracked files, so its whole existing source tree appears untracked. The frontend has 480 tracked files plus accumulated uncommitted work. Ignored build/cache outputs are excluded from changed files; lockfiles and generated review SQL/checkpoint reports are intentional reviewable deliverables. Nothing was deleted, reverted, staged or committed.
