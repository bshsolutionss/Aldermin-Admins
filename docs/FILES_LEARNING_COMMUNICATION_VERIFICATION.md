# Files, learning and internal communications checkpoint

Historical preparation checkpoint, 2026-11-14. The batch was subsequently approved/applied and the lint failures below were fixed. See [current application verification](./FILES_LEARNING_COMMUNICATION_APPLICATION_VERIFICATION.md). This is not a whole-backend completion claim.

- Backend production build: PASS, including new module registration and six entity mappings.
- Backend Vitest: **22/22 PASS**.
- New offline backend acceptance: **10/10 PASS** (8 service/validation cases, one real Nest HTTP/multipart scenario, one migration SQL invariant scenario). Related settings/foundations/student/content offline run: **51/51 PASS**, followed by the additional migration scenario; counts overlap and must not be added as independent suites.
- Full frontend regression inventory: **133/133 PASS**, including six new proxy/hook cases and the existing 127 tests.
- Frontend production build: PASS, TypeScript and 223 generated pages.
- Changed frontend files ESLint: PASS; backend production-source type-aware lint: PASS. Final recheck: repository-wide lint remains FAIL with 151 `no-floating-promises` errors, one `unbound-method` warning and two `restrict-template-expressions` warnings, all in existing test/helper files. None are in production source or the new content tests/helper. Most errors are unawaited `node:test` registration promises. This blocks any lint-required CI gate, but does not constitute failed runtime tests. No broad unrelated test rewrite was made.
- Root AppModule startup/DI and READ ONLY API probe: PASS. Approved student/options/staff attendance and foundation APIs return 200; all four unapplied content resources and calendar return 503. Every one of the 35 public-table count/SHA values matched before/after the probe.
- New SQL source/compiled/review parity and PostgreSQL 18.6 READ ONLY prerequisites: PASS. New content DDL application, populated rollback execution and PostgreSQL persistence: **NOT RUN**, pending approval.
- Prepared PostgreSQL suite: seven scenarios; syntax-check PASS. Covers exact binary round trips, actor restrictions, student/staff attachment versions and clearing, allocation pinning, publication/calendar/archive persistence, byte retention, injected audit rollback and direct SQL integrity. All fixtures must roll back and original public-table hashes must match.

Integrated pages: Asset Repository; Institutional Syllabus; Assignments; Downloads; Download Center list/shared materials; video links; Noticeboard; Events; Calendar. Student profile and staff editing now use real file links. New staff/student records must first be saved to obtain their real UUID before attaching files. Legacy staff document URL columns remain intact.

Scope limits: custom download-type management, submission/evaluation workflows, email/SMS dispatch, finance/payment posting, payroll, reports, inventory/library and other roadmap items remain incomplete. The refreshed [route audit](./ADMIN_ROUTE_AUDIT.md) finds **38/183** pages with real API calls and **145** without; import-graph evidence does not prove complete feature behavior. The new files/content APIs remain gated until the [separate migration batch](./FILES_LEARNING_COMMUNICATION_MIGRATION_REVIEW.md) is approved and persistence-tested.
