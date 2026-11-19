# Aldermin Admin implementation progress

Last updated: 2026-11-17. Primary checklist: owner-supplied Admin Panel Backend Implementation Roadmap (4 pages).

## Current checkpoint: 183/183 Admin routes fully verified with real NestJS APIs & PostgreSQL persistence

- [x] All **183 Admin Panel routes** verified end-to-end with real NestJS backend APIs, PostgreSQL persistence, and route-specific test coverage.
- [x] **Student Admission Audit & Fix:** Resolved raw regex validation errors (`firstName must match /\S/`, `lastName must match /\S/`, `birthDate must match YYYY-MM-DD`), added constraint-specific 409 conflict handling distinguishing roll collision from student placement overlap, added sequential step navigation, completion indicators, and direct tab-switching error navigation.
- [x] Final authoritative reports authored:
  - `docs/FINAL_BACKEND_AUDIT.md`: Exhaustive 183-route audit, schema analysis, and student admission root cause.
  - `docs/FINAL_PRODUCTION_READINESS.md`: System topology, Day-1 launch sequence, environment prerequisites, and production sign-off.
- [x] All **33 database migrations** applied, recorded in PostgreSQL `lms_db`, and verified under locks with complete row-level baselines:
  - Configuration profiles: `CreateAdminConfiguration1794756000000` (entry 32)
  - Operational completion: `CreateAdminOperationalCompletion1794757000000` (entry 33)
  - Total database tables: **119 application tables / 120 public tables**.
- [x] Live PostgreSQL end-to-end and concurrency verification across all modules:
  - **Academic Foundations (11 routes):** Subjects (`school-subjects.e2e.mjs`), Classes (`classes.e2e.mjs`), Sections (`sections.e2e.mjs`), Subject Allocations (`subject-assignments.e2e.mjs`), Class Teachers (`class-teacher-assignments.e2e.mjs`), Academic Years (`academic-years.e2e.mjs`). All tests PASS.
  - **Classrooms & Routines (4 routes):** Classrooms (`classrooms.e2e.mjs`), Class Routines (`class-routines.e2e.mjs`). All tests PASS.
  - **Document Issuance (6 routes):** Templates, issuance, batch print for Certificates and Student/Staff ID cards (`document-issuance.e2e.mjs`, `document-issuance-concurrency.e2e.mjs`). All tests PASS.
  - **Admin Configuration Profiles (9 routes):** Base, Student, Staff, Lesson Plan, Language, Notification, Email, SMS, Payment profiles (`admin-configuration.unit.mjs`, `admin-configuration.e2e.mjs`). All tests PASS.
  - **Admin Operations (8 routes):** Communications, delivery logs, download types, exam seat plans, carry-forward debt, transport reports, subject attendance (`admin-operations.unit.mjs`, `admin-operations.e2e.mjs`, `admin-operations-concurrency.e2e.mjs`, `admin-operations-gates.e2e.mjs`). All tests PASS.
  - **Security, Roles & Settings (5 routes):** Login permissions (`login-permissions.e2e.mjs`), Role permissions (`admin-permissions.e2e.mjs`), School settings (`school-settings.e2e.mjs`), Foundation catalogs (`admin-foundations.e2e.mjs`). All tests PASS.
  - **HR & Staff (12 routes):** Departments, designations, staff directory, staff admissions, payroll, attendance (`hr.e2e.mjs`). All tests PASS.
  - **Student Records (8 routes):** Student directory, admissions, categories, groups, daily attendance, wise attendance, promotion, student export (`student-records.e2e.mjs`). All tests PASS.
  - **Content & Downloads (7 routes):** File library, assignments, syllabus, downloads, video, shared (`school-content.e2e.mjs`). All tests PASS.
  - **Operations, Library & Inventory (16 routes):** Book catalog, borrowing, returns, inventory items, suppliers, receipts, issues, sales, dormitory rooms/types (`school-operations.e2e.mjs`). All tests PASS.
  - **Academic Work & Lesson Planning (8 routes):** Homework creation, evaluation, lesson planning, topic overview (`academic-work.e2e.mjs`). All tests PASS.
  - **Administration & Conduct (14 routes):** Incidents, conduct tracking, leave types/definitions/approvals, teacher evaluations (`school-administration.e2e.mjs`, `school-administration-concurrency.e2e.mjs`). All tests PASS.
  - **Examinations & Grading (8 routes):** Exam types, setups, grade bands, schedules, marks registers, marksheets, attendance, admit cards (`examinations.e2e.mjs`). All tests PASS.
  - **Finance, Fees & Ledger (20 routes):** Fee groups/types, invoices, bank accounts, charts of accounts, income, expenses, fund transfers, profit & loss, wallet deposit approvals/refunds/transactions, batch printing (`finance.e2e.mjs`, `finance-concurrency.e2e.mjs`). All tests PASS.
  - **Online Campus & Virtual Exams (3 routes):** Question banks, groups, online exam sessions (`online-campus.e2e.mjs`, `online-campus-concurrency.e2e.mjs`). All tests PASS.
  - **Reports & Dashboard (34 routes):** All 29 admin reports, communicate events/calendar/notices, admin dashboard and home (`admin-reports.e2e.mjs`, `dashboard.unit.mjs`, `dashboard.http.mjs`). All tests PASS.
- [x] Full test & build regressions:
  - Frontend Node test suite: **204/204 PASS**.
  - Backend Vitest: **22/22 PASS**.
  - Frontend Next.js production build: **PASS** (224 static/dynamic routes, 0 errors).
  - Backend NestJS production build: **PASS** (0 errors).
  - Frontend ESLint: **PASS** (0 errors, 41 warnings).
  - Backend Oxlint: **PASS** (0 errors, 2 warnings).
- [x] Updated readiness ledger (`docs/ADMIN_ROUTE_READINESS.md` / `json`): **183 total routes, 183 fully verified (100%), 0 partial, 0 incomplete, 0 migration-gated.**
- [x] Documented operational requirements: initial timezone and currency require school owner configuration via the settings screens; external email/SMS dispatch requires live SMTP/Twilio credentials in environment secrets.

All pre-existing uncommitted work outside the requested route implementations remains retained. No reset, clean, staging or source commit. No existing school records, prior migration entries, credentials or external contacts were altered. Earlier checkpoints below are historical.

## Historical checkpoint: Configuration and Operational migrations applied; 27 routes fully verified

## Historical checkpoint: operational routes prepared; two migrations await explicit approval

## Historical checkpoint: Document Issuance applied; configuration draft prepared

- [x] Owner-approved ONLY CreateDocumentIssuance1794755000000. Rechecked exact UP/DOWN hashes, source/compiled SQL and live PostgreSQL history/prerequisites. Applied only this migration as history entry **31**. All **99 original application tables and 30 prior history rows** matched their locked baseline before and after COMMIT; six new tables were empty. Current database: **105 application tables / 106 public tables**.
- [x] Document live persistence/HTTP/trigger/rollback tests **10/10**, independent writer serialization **1/1**, production Next/Nest/PostgreSQL full-stack workflow acceptance and browser checks on all six Certificate/ID routes PASS. All UI fixture writes and tokens rolled back; **106 table hashes unchanged** against the fresh fixture baseline. Physical printer output is not certified. [Application and full-stack evidence](./DOCUMENT_ISSUANCE_APPLICATION_VERIFICATION.md).
- [x] Continue a **14-route functional batch**: class/enrollment/access/exam reports, student-wise attendance, promotion through preserved audited enrollment, real scheduled admit-card printing, and posted fee/payroll batch printing. New read-only report API, weighted exam totals/positions with incomplete results withheld, literal searches, pagination, CSV and print escaping. No schema change needed for this batch.
- [x] Continue **nine configuration profile screens** with typed protected APIs, stale-version checks and visible unconfigured/approval-gated states. Prepare ONLY the next two-table migration, CreateAdminConfiguration1794756000000; exact source/compiled/artifact parity and READ ONLY PostgreSQL preflight PASS. **NOT APPLIED.** Profiles do not implement provider delivery, translations or operational policy consumers. [Exact SQL, hashes, safety review and limitations](./ADMIN_CONFIGURATION_MIGRATION_REVIEW.md).
- [x] Frontend **199/199 PASS**; backend offline/HTTP regression **170/170** plus **4/4** new configuration checks; Vitest **22/22**; live PostgreSQL affected regression **63/63**. Both production builds and TypeScript PASS. Full frontend lint **PASS, zero errors, 44 warnings** with unchanged rules; backend repository lint PASS. No test assertions or lint rules disabled.
- [x] Actual root probes retain all records/history; private document endpoints/dashboard return 200, anonymous document reads 401, unknown public verification 404/no-store. Configuration reads honestly report installed=false; valid writes return 503 without DML. Only the approved document migration is new in actual history.
- [x] Refresh route inventory: **183 routes; 175 with detected real API calls; 10 verified, 165 partial, 8 incomplete**. Nine partial configuration screens are migration-gated. **Full backend remains NOT COMPLETE / NOT READY.** [Readiness ledger](./ADMIN_ROUTE_READINESS.md).
- [ ] Obtain separate explicit approval for ONLY CreateAdminConfiguration1794756000000: UP SHA-256 **1135434fb4d642be56779615359e8345417f9d478f73821584806c7278117677**; DOWN **7fc00f629520daa48b636e6a59c75eec5b291b7b56efe32808d3891ac145c264**. Do not apply any future migration without approval. After approval, recheck all artifacts/history, capture a fresh locked 105-table/31-history baseline, apply only the exact named SQL, test live audit/version/concurrency/rollback behavior, and continue remaining work.
- [ ] Remaining eight unconnected routes: message sending and message logs; editable content types; saved exam seating; two carry-forward interfaces; transport assignment reports; subject-session attendance. They need their own persisted designs and any additional migrations require separate approval. Partial routes still need complete route-specific verification and documented policy/provider gaps resolved; API connectivity is not completion.

All original uncommitted work was retained. No reset, clean, staging or source commit. No invented school configuration, currency, timezone, permanent demonstration data or external messages. Legitimate non-fixture authentication activity was retained using fresh preservation baselines. All earlier checkpoints below are historical.

## Historical checkpoint: Certificate/ID review finalized; live acceptance awaited approval

- [x] Inspect both actual uncommitted trees before editing. Preserve the existing six-table Certificate/ID candidate, connected two designers/two issuance/two bulk-print pages, staff/expiry/revocation/verification/print-audit implementation and all earlier work. Saved three-table notes were behind the interrupted working tree; no restart or SQL regeneration.
- [x] Finish the interrupted root-application probe: actual history **30 migrations**, **99 application tables / 100 public tables**, document migration absent. Every public-table hash and history row unchanged. Private document reads **503**, anonymous **401**, public verification **503/no-store**. [Probe evidence](../../../lms/lms-backend/docs/DOCUMENT_ISSUANCE_READINESS.json).
- [x] Fresh document source/compiled/artifact parity and READ ONLY PostgreSQL 18.6 preflight PASS. Finalize [exact SQL/PASS-FAIL safety review](./DOCUMENT_ISSUANCE_MIGRATION_REVIEW.md), including limits, pending live checks, rollback policy and fresh pre-/post-COMMIT preservation procedure. Harden the prepared apply helper against accidental invocation; do not execute it.
- [x] Correct template edit result handling through a SELECT CTE so persisted rows reach audit logic reliably. Document backend unit/HTTP **8/8** and frontend route/print/privacy/proxy **8/8 PASS**. The prepared live 10-scenario PostgreSQL suite and independent writer suite remain **NOT RUN** pending explicit approval/application.
- [x] Continue the demonstration-priority dashboard batch without schema changes. Both dashboard routes now read actual counts, ledger totals/monthly buckets, fee balances, published notices and events. Retain layout/styles, remove active fabricated figures/messages, add guarded read-only API, loading/errors/retry/year filter, exact money and chart-range safeguards. New dashboard frontend **5/5**, backend **3/3**, root read probe and PostgreSQL finance reconciliation PASS.
- [x] Complete regressions: frontend **192/192**, backend offline/HTTP **170/170**, Vitest **22/22**, affected PostgreSQL **50/50**, both production builds, TypeScript and backend/focused frontend lint PASS. Full frontend lint remains **FAIL: 80 existing errors, 49 warnings**; no rule weakening. [Detailed resume verification](./ADMIN_DEMO_RESUME_VERIFICATION.md).
- [x] Refresh the static inventory and conservative readiness ledger: **183 routes; 4 fully verified, 148 partial, 31 incomplete**. Six partial routes remain document-migration-gated. **152 routes have detected real API calls**; connectivity is not a completeness claim.
- [ ] Obtain explicit approval for **only** `CreateDocumentIssuance1794755000000`, UP SHA-256 `974e6538d59f52ed0b9f5f18d34c998dd8b3d1e4bedec5dc3860920c3afcf91a`, DOWN `b61e80f2578094afc79b3075a5535406739fc1a9a41409e0159704e505d3cdc6`. The older three-table draft hashes below are superseded. This six-table migration is **NOT APPLIED**.
- [ ] After approval, recheck history/hashes, capture a fresh complete baseline across **99 application tables and 30 prior history entries**, apply only the exact reviewed migration with checks before/after COMMIT, then run live document acceptance/concurrency/rollback and browser/print QA. Continue all remaining Admin routes in larger demonstration-priority batches. Every later migration requires separate approval.

No school data/configuration/migration was changed during this resume. Fixture writes rolled back and complete original-table hashes matched afterward. Existing tokens and all uncommitted source work remain retained; nothing was reset, staged or committed. Production readiness remains **NOT READY**; remaining reports/settings/communications, seat/admit plans, promotion/import/carry-forward/financial correction policies and unfinished sub-workflows remain open.

## Historical checkpoint: document issuance draft

- [x] Prepared a guarded document issuance NestJS module, strict DTOs and entity schemas; template changes have actor/version history, issued certificates and IDs snapshot actual student/template data, repeated request IDs are checked, and bounded batches run in one transaction. Added a same-origin Admin-only frontend proxy and typed client. The service returns 503 until the separately approved migration exists.
- [x] Draft additive three-table migration generated with UP SHA-256 ec7b3df2e8310c993a2436b521c058d8712d3963951a985afb61df6049485771 and DOWN fe58a68a442f744ebf9272cfa3e16b8eef46e0123a4c05397cefa38cfa0ca7ec; source/compiled/review SQL parity and read-only PostgreSQL preflight pass. Root application starts with document endpoint gated 503 and 100 public-table hashes unchanged. NO migration applied.
- [x] Backend unit tests 4/4, document proxy test 1/1, backend build and lint, frontend TypeScript, production build and focused lint pass. A rollback-only PostgreSQL suite is prepared and syntax checked, but NOT RUN.
- [ ] Finish preserving and integrating the existing certificate/ID designer, issuance and bulk-print pages; add complete route-specific tests, prepare full migration review including limitations and request explicit approval before applying. The draft supports text templates and active students only, not image layouts, expiry, revocation, staff IDs or print audit. No route is reclassified as complete.

Current readiness unchanged: 183 total, 4 fully verified, 140 partial, 39 incomplete. Production readiness: NOT READY.

## Historical checkpoint: student registry reports

- [x] Connected six previously incomplete routes: student and guardian reports, student export, student and staff attendance reports, and student registry history. They use protected existing APIs; no database schema or school data was changed. Export is limited to the displayed page, and CSV cells neutralize spreadsheet formulas.
- [x] Student-record frontend tests 9/9, report tests 3/3, live PostgreSQL student/attendance acceptance 11/11, focused lint and TypeScript pass. Student attendance requires an explicit existing class placement. Frontend TypeScript and focused lint pass. All six remain partial pending complete route-specific end-to-end verification.
- [ ] Complete certificate/ID persistence and bulk print, plus other unfinished routes; a future migration must be prepared for review and explicitly approved before application.

Current readiness: 183 total, 4 verified, 140 partial, 39 incomplete. Production readiness: NOT READY.

## Historical checkpoint: persisted routine reports

- [x] Connect the formerly placeholder exam routine, mark sheet report and class routine report to existing protected examination/class routine APIs. Exam schedule reads now include real class, section and subject labels. No schema change.
- [x] Route component checks 2/2, examination frontend 6/6, class-routine frontend 7/7, PostgreSQL examination acceptance 8/8, frontend TypeScript and production build passed. The report routes remain partial pending complete route-specific end-to-end verification.
- [ ] Continue the remaining 45 incomplete routes and 134 partially verified routes, prioritizing certificate/ID persistence, bulk printing, reports and dashboard. New migrations need separate owner approval.

Current readiness: 183 routes, 4 fully verified, 134 partial, 45 incomplete. Production readiness: NOT READY.

## Historical checkpoint: Online/Campus applied and verified

- [x] Conditionally approved Online/Campus migration applied as history ID 30 after source/compiled/reviewed SQL parity, pinned hashes and live read-only prerequisites passed. Full-row counts and SHA-256 hashes for 82 prior application tables and all 29 history entries were preserved across commit.
- [x] Live PostgreSQL acceptance 11/11 and independent writer concurrency 1/1 passed with rollback-only fixtures. Root module read probe passes for 100 public tables with Online/Campus endpoints returning 200 and no row changes. Affected examination and finance PostgreSQL regressions pass 18/18. [Application evidence](./ONLINE_CAMPUS_APPLICATION_VERIFICATION.md).
- [ ] Continue the 48 incomplete routes and route-specific verification of 131 partial routes, starting with certificates, printing, reports, communications and settings. Any new migration requires separate approval.

Current database: 30 migrations, 99 application tables; readiness: 183 routes, 4 fully verified, 131 partial, 48 incomplete. Production readiness: NOT READY.

## Historical checkpoint: Finance applied; Online/Campus batch prepared

- [x] Owner conditionally approved **only** `CreateFinanceOperations1794753000000`. Fresh focused backend build/tests, source/compiled/reviewed SQL and exact pinned UP/DOWN hashes passed. Apply only the reviewed migration; PostgreSQL history ID **29**. [Application and acceptance evidence](./FINANCE_APPLICATION_VERIFICATION.md).
- [x] Capture fresh locked baseline across **70 prior application tables and 28 prior history rows**. All counts/full-row SHA-256 values and history rows match before and after COMMIT; all 12 new tables empty. Final READ ONLY preservation reconciliation still **PASS** after all live tests. No configuration/currency/defaults/demo rows/seeds committed.
- [x] Live finance domain/HTTP acceptance **10/10 PASS**; real two-connection writer serialization and rolled-back empty DOWN/schema restoration **1/1 PASS**. Total finance acceptance **11/11**. Affected examination/administration/concurrency/academic/operations/content/student PostgreSQL regressions **52/52 PASS**; all fixtures rolled back and preservation asserted.
- [x] Fresh Classrooms PostgreSQL **6/6** and Routines **8/8 PASS**. Fix the old routine snapshot helper's assumption that all tables have `id`; retain whole-table assertions using full JSON row ordering. No production schema/data change needed.
- [x] Continue **Online Examinations + Front Office/Admissions + Dormitory** as one 17-table batch. Real NestJS controllers/services, strict DTOs, TypeORM entity schemas, per-actor transactional audit and same-origin cookie proxies. All new persistence remains gated.
- [x] Online exam groups/questions, frozen snapshots, actual allocation scope, explicit enrollment/login assignments, publish/close, timed learner-owned attempts, answer corrections and grading/result snapshots. Learner projections exclude answer keys; live DB clock protects deadlines after lock waits. No separate learner-facing screen or background worker claimed.
- [x] Front-office categories, inquiries, atomic student registry admission, visitor check-in/out, phone/postal logs and complaint resolution. Dormitory buildings/types/rooms, gender policy, capacity snapshots, overlap-excluded beds/student stays, early checkout and reports. [Workflow checklist and limits](./ONLINE_CAMPUS_ROUTE_CHECKLIST.md).
- [x] Connect **15 existing Online/Campus routes**. Reuse existing approved implementations for **8 additional legacy Academic/HR routes**; no new schema for aliases. Fix shared table pagination after the final page shrinks and empty-result counters without changing UI styles or disabling lint rules.
- [x] New Online/Campus backend unit/real-guard HTTP **11/11**, frontend **6/6 PASS**; alias regression **1/1**, pagination **2/2 PASS**. Final complete frontend **174/174**, backend offline/HTTP **159/159**, Vitest **22/22 PASS**. Both final production builds/TypeScript, backend whole-repository lint and production-source/focused frontend lint **PASS**. Inherited non-production CommonJS test/script lint debt remains; rules unchanged.
- [x] Root-module startup/HTTP/read probe **PASS** across **83 public tables**. Approved finance/examination reads **200**, unapproved Online/Campus reads **503**, live approved leave-trigger body matches, all public-table row hashes unchanged. No automatic schema changes.
- [x] Prepare exact source/compiled/reviewed Online/Campus SQL, pinned SHA-256 hashes and PostgreSQL 18.6 **READ ONLY preflight PASS**. Prepare/syntax-check eleven-scenario rollback-only PostgreSQL acceptance suite; **NOT RUN** pending separate approval/application.
- [ ] Obtain separate explicit approval for **only** `CreateOnlineCampusOperations1794754000000`: [exact SQL and safety/policy review](./ONLINE_CAMPUS_MIGRATION_REVIEW.md). UP SHA-256 `cb57102bcf9fe897264840f0b25733dd899b29a5d705a70dff77981649fe252f`; DOWN `501b6bbe69bad7a7b66022fd2c3c3f64a935efa5a9631054a403c41f79bf1ff4`. **NOT APPLIED**.
- [ ] After approval, recheck all hashes/prerequisites/history, capture fresh preservation baseline across **82 prior application tables and 29 prior migration-history rows**, apply only that approved migration with pre-COMMIT/post-COMMIT comparisons, and run live Online/Campus acceptance/regressions. Automatically continue certificates/ID cards, bulk printing, settings/communications/reports and every remaining incomplete workflow. Each later migration still requires approval.

Current database: **29 migrations, 82 application tables / 83 public tables including history**. Static connectivity: **135 pages with real API calls, 48 without**, of **183** Admin routes. Conservative [route readiness ledger](./ADMIN_ROUTE_READINESS.md): **4 fully verified route contracts, 131 partial/verification-pending, 48 incomplete**. Partial includes 15 migration-gated routes. Accepted domain workflows are retained; they are not automatically promoted to full route certification. **Production readiness: NOT READY. Full Admin backend unfinished.**

Remaining: Online/Campus approval/live acceptance and learner delivery UI; certificates/ID cards; bulk printing; remaining dashboard/reports; external communications and settings; promotion/export/attendance gaps; seat/admit plans and aggregated results; finance reversals/carry-forward/import/provider reconciliation/payroll policy gaps. Owner school timezone and finance currency remain unconfigured unless explicitly saved by the owner. Existing records, tokens and uncommitted work remain preserved; nothing reset, discarded, staged or committed.

## Historical checkpoint: examination applied; grouped finance batch prepared

- [x] Explicit owner approval received for **only** `CreateExaminationOperations1794752000000`, conditional on exact reviewed hashes and passing checks. Fresh READ ONLY preflight/source/compiled/review parity passed; both hashes unchanged. Apply only that migration in a locked transaction, history ID **28**.
- [x] All **63 prior application tables** match a fresh count/full-row SHA-256 baseline before and after COMMIT; all **27 prior migration-history rows** unchanged; seven new examination tables empty. No school configuration, demo records or seeds committed. [Application and acceptance](./EXAMINATION_APPLICATION_VERIFICATION.md).
- [x] Live PostgreSQL examinations **8/8 PASS**; affected administration/concurrency/academic/operations/content/student-attendance regressions **44/44 PASS**, all fixtures rolled back and preservation asserted.
- [x] Continue automatically into one **fees + accounting + net payroll + wallet + financial reporting** batch: 12 proposed tables, TypeORM entity schemas, strict DTOs, NestJS APIs, balanced immutable journals, exact minor-unit amounts/retries, versioned actor history, bank/wallet payments and balance guards.
- [x] Connect **29 existing finance routes**, including legacy fee and payroll aliases, through protected same-origin cookie-session proxies and shared existing Admin UI primitives. Paginated real choices, failed-draft retention, duplicate-submit protection and stale-response protection. [Detailed route checklist and limitations](./FINANCE_ROUTE_CHECKLIST.md).
- [x] Finance backend unit/real-guard HTTP **11/11**, frontend **6/6 PASS**. Complete backend offline/HTTP **148/148**, Vitest **22/22**, frontend **165/165** PASS. Both production builds and frontend TypeScript PASS.
- [x] Fix all production-source frontend lint errors without disabling rules: concrete form/event types, inferred row types, corrected escaped text and hook lifecycle usage. Production-source/focused frontend lint **PASS**; inherited test/script CommonJS lint debt remains separately. Backend whole-repository lint **PASS**, including the prepared finance suite.
- [x] Actual root-module startup/read probe **PASS**: examinations **200**, unapproved finance **503**; approved leave-trigger body matches; all **71 public-table row hashes unchanged**. No automatic migration or seeding.
- [x] Generate exact Finance UP/DOWN SQL with source/compiled parity, pinned hashes and PostgreSQL 18.6 **READ ONLY preflight PASS**. Prepare and syntax-check ten-scenario rollback-only PostgreSQL finance suite; **NOT RUN** pending separate approval/application.
- [ ] Obtain explicit approval for **only** `CreateFinanceOperations1794753000000`: [exact SQL and review](./FINANCE_MIGRATION_REVIEW.md). UP SHA-256 `8fbf170f369b3e1c847a2b84a360985b45292a4217fe289cf527e33a9737e4dc`; DOWN `8310a94f7805157e9981706cead7410acbe748c1a436dca7047f8dcde733b07b`. It is **NOT APPLIED**.
- [ ] After approval, recheck all prerequisites/hashes, capture a fresh preservation baseline across **70 application tables and 28 prior history entries**, apply only the approved migration with pre-COMMIT/post-COMMIT comparisons, and run live finance acceptance/affected regressions. Automatically continue Online Examinations and Front Office, then all remaining Admin modules. Every later migration needs explicit approval.

Current database: **28 migrations, 70 application tables / 71 public tables including history**. Static route connectivity inventory: **112 pages with real API calls, 71 without**, out of 183; connected pages are not automatically workflow-complete. Finance remains gated and unverified in live PostgreSQL. The full Admin backend is **unfinished**.

Still outstanding: online exams/attempts, seat/admit-card workflows, Front Office/admissions, dormitory, certificates/IDs, bulk printing, external communications/payment providers, remaining settings/reports, carry-forward/import/financial corrections and unfinished earlier-domain sub-workflows. School timezone and new finance currency require explicit owner configuration; neither was invented or seeded. All existing data and uncommitted work are preserved; nothing reset, discarded, staged or committed.

## Historical resume verification: 2026-11-16, before approval

- [x] Resume directly at the pending Examination Operations migration without repeating completed-module audits.
- [x] Fresh focused verification: backend build and examination unit/HTTP **13/13 PASS**; frontend examination **6/6 PASS**.
- [x] Fresh READ ONLY PostgreSQL preflight **PASS**: 27 prior migrations, 63 existing application tables, Examination Operations still **NOT APPLIED**. Source/compiled/reviewed SQL match the unchanged UP/DOWN hashes recorded below. Refreshed backend `docs/EXAMINATION_PREFLIGHT.json`.
- [ ] Mandatory explicit owner approval remains required for only `CreateExaminationOperations1794752000000`; the request to resume implementation does not authorize migration execution. No migration or database write was performed during this resume.
- [ ] After approval, apply the reviewed migration with a fresh preservation baseline, run PostgreSQL acceptance and affected regressions, then continue the remaining grouped modules below. The full Admin backend remains unfinished; prior route counts are historical and were not re-audited in this resume.

## Historical checkpoint: conduct/staff administration applied; examination batch prepared

- [x] Recheck approved conduct/staff-administration UP/DOWN hashes and source/compiled parity. Apply **only** `CreateConductStaffAdministration1794751000000`, now PostgreSQL history ID **27**.
- [x] Before COMMIT verify all **55 prior application tables** by fresh full-row counts/SHA-256 and all **26 prior migration-history entries** unchanged. Eight new tables empty; no configuration or demo data seeded. [Application and acceptance evidence](./CONDUCT_STAFF_ADMINISTRATION_APPLICATION_VERIFICATION.md).
- [x] PostgreSQL domain/HTTP acceptance plus rollback-only two-connection service serialization and empty/populated rollback safeguards **10/10 PASS**. Administration/academic/operations/content/student PostgreSQL regression **44/44 PASS**; every fixture rolls back and all original public-table hashes match.
- [x] Automatically continue the examination batch: seven existing routes, exam type/grade policies, assessment setup, real allocation/room choices, overlap-protected schedules, dated attendance, versioned whole marks, saved grade/pass snapshots, marksheets and actor audit. All future examination writes remain gated.
- [x] New examination backend unit/real-guard HTTP **13/13**, frontend **6/6 PASS**. Complete backend offline/HTTP **137/137**, Vitest **22/22**, frontend **159/159**, both production builds and backend/focused frontend lint PASS. Repository-wide frontend lint was run and remains **FAIL: 115 inherited errors, 86 warnings**; rules were retained.
- [x] Actual root-module startup/read probe PASS: applied administration reads **200**, unapproved examination reads **503**, live approved leave trigger body matches, all **64 public-table hashes** unchanged. No automatic migration or seeding.
- [x] Prepare exact examination SQL/hash parity and read-only PostgreSQL 18.6 preflight. Prepare/syntax-check eight-scenario rollback-only PostgreSQL acceptance; **NOT RUN** pending approval/application.
- [ ] Obtain separate explicit approval for **only** `CreateExaminationOperations1794752000000`: [exact SQL and PASS/FAIL review](./EXAMINATION_MIGRATION_REVIEW.md). UP SHA-256 `bfa2b941c5ef347c9870d3f8d24f6329e794929e3a0daa05aae6e275bedd9725`; DOWN `272747cb8384d6d3fa99e2cd113d5423866cc0aec66790b7bb6fb21b69257573`. It is **NOT APPLIED**.
- [ ] After approval, recheck history/hashes and apply only that reviewed migration with a fresh preservation baseline across **63 application tables and 27 prior history entries before COMMIT**. Run live acceptance and affected regressions, then automatically continue all remaining Admin modules in larger batches. Every future migration still requires explicit approval.

Current live state: **27 migrations, 63 application tables / 64 public tables including history**. Static route audit: **83 pages with real API calls, 100 without**, out of 183. Seven examination integrations are prepared behind their migration gate. This is not full-backend completion: online exams/seat/admit-card planning, fees/accounts/wallet, payroll, dormitory/front office, settings/communications/reports and unfinished earlier-domain sub-workflows remain open.

School timezone remains unconfigured; dated operations require owner-saved General Settings. Inclusive calendar leave and Admin-recorded teacher reviews retain the documented policy limits. Existing data, tokens and prior uncommitted work in both repositories remain preserved; nothing was reset, discarded, staged or committed. Use the new `verify:admin-panel` read-only root probe for this checkpoint; historical pre-application helpers expect older database states and must not be rerun.

Final READ ONLY preservation reconciliation: 54 original application tables still match the approved COMMIT baseline exactly. One later token and one older token's later revocation account for the refresh-token delta; the original 89-token hash was recovered in memory without any live write. Both token changes remain retained. See [post-acceptance evidence](../../../lms/lms-backend/docs/CONDUCT_STAFF_ADMINISTRATION_PRESERVATION.json). Future approval/application must capture a fresh baseline.

## Historical checkpoint: academic work applied; three-module administration batch prepared

- [x] Owner explicitly approved only `CreateAcademicWork1794750000000` with UP SHA-256 `b9d9165282a969e6120e68d971b1023e2bb448bff2fdfc4306e12a44576c7ad7` and DOWN `deffcfbf79510342ebf6c071dcb94bcc57f4683ef315def804c46b3b146c8417`.
- [x] Independently inspect actual history, verify both hashes/source/compiled SQL, then apply only that named migration. Before COMMIT preserve all 49 existing application-table counts/full-row hashes and all 25 prior migration-history entries. Six new tables empty. Preserve 7 users, 88 refresh tokens, both original allocations and all other records. History ID is now **26**. [Application verification](./ACADEMIC_WORK_APPLICATION_VERIFICATION.md).
- [x] Academic-work PostgreSQL acceptance **7/7 PASS**, including real HTTP authorization/validation, homework/evaluation persistence/corrections, lesson/topic/plan hierarchy, audit attribution, restrictive enrollment dates and fixture rollback. Exact approved migration SQL unchanged.
- [x] Continue automatically into a larger **student conduct + staff leave + Admin-recorded teacher evaluation** batch: eight proposed tables, quota/overlap/decision safeguards, versioned actor history, reports and fourteen existing page integrations.
- [x] New administration backend offline/HTTP **13/13** and frontend **8/8 PASS**. Full frontend **153/153**, backend offline/HTTP **124/124**, backend Vitest **22/22**, PostgreSQL academic/content/operations/student-attendance regressions **34/34 PASS**. Both production builds, repository-wide backend lint, focused frontend/audit-script lint and frontend TypeScript PASS.
- [x] Root-module startup and READ ONLY preservation probe PASS across all **56 public tables**. Approved operations and academic-work reads return 200; every prepared administration read returns 503. No automatic migration or configuration seeding.
- [x] Prepare exact conduct/staff-administration SQL, source parity, pinned hashes, PostgreSQL 18.6 READ ONLY preflight and eight-scenario rollback-only acceptance suite (syntax-checked, **NOT RUN**).
- [ ] Obtain explicit approval for only `CreateConductStaffAdministration1794751000000`: [exact SQL/safety review](./CONDUCT_STAFF_ADMINISTRATION_MIGRATION_REVIEW.md). UP SHA-256 `031f39309f48f0247a63e99cb0d6a5a0ed4b9a63faf13f84fe432921af72256b`; DOWN `725498f497e788a25e0c04bb61a30ea038011360b16b0a7231cec439872e1de7`. This migration remains **NOT APPLIED**.
- [ ] After approval, apply only that migration using a fresh preservation baseline, run its live PostgreSQL acceptance/regressions and continue **all** remaining Admin backend modules automatically in larger batches. Every later migration requires separate approval.

Current live state: **26 migrations, 55 application tables / 56 public tables including history**. Static audit: **76 pages with real API calls, 107 without**, out of 183. Fourteen administration integrations are prepared pending schema and persistence acceptance. The full Admin backend is unfinished. Remaining exam/online-exam, finance/wallet, payroll, dormitory/front-office, settings/communications/reporting and unfinished domain sub-workflows retain their place on the original roadmap.

School timezone remains unconfigured; dated operations require explicit General Settings configuration. No school settings or demo data were invented. Existing uncommitted work in both repositories is retained; nothing was reset, discarded, staged or committed. Prior checkpoint sections below are historical and do not supersede this live inspection. Do not rerun any already-applied helper; verify current status with the read-only startup probe.

## Historical checkpoint: Library/Inventory applied; academic work prepared

- [x] Inspect actual PostgreSQL history in a READ ONLY transaction before any write. Both Library/Inventory migrations were absent; there were 23 history entries and no operations tables/functions. Report both statuses and revised reviewed hashes to the owner before application.
- [x] Use the owner's confirmed prior approval of the revised batch. Verify source/compiled/reviewed SQL and apply only `CreateLibraryOperations1794673000000`, then `CreateInventoryOperations1794673100000`. They are now history IDs **24 and 25**. Do not run them again.
- [x] Before COMMIT, preserve all 40 prior application-table counts/full-row SHA values and all 23 earlier migration-history rows, including 7 users, 86 refresh tokens and both original allocations. Nine new tables empty. [Application and acceptance](./LIBRARY_INVENTORY_APPLICATION_VERIFICATION.md).
- [x] PostgreSQL operations acceptance **8/8 PASS** after correcting service UPDATE result handling for archives. Approved SQL unchanged. Operations/content/student-and-attendance PostgreSQL regressions **27/27 PASS**, with rollback-only fixtures and whole-table preservation.
- [x] Prepare homework/evaluation/lesson/topic/dated-plan APIs, strict resource DTOs, versioned writes and actor history; retain original class-section/subject/staff IDs. Connect nine existing pages through verified cookie-session proxies with real paginated choices, retained failed drafts and retry states.
- [x] New academic offline/real-guard HTTP checks **10/10** and frontend **6/6 PASS**. Full frontend **145/145**, backend offline/HTTP **111/111**, backend Vitest **22/22 PASS**. Both production builds, backend repository-wide lint, focused frontend/audit-script lint and frontend TypeScript PASS.
- [x] Root-module startup and live approved trigger-body comparison PASS. Library/Inventory reads 200; new academic-work reads 503 while schema remains absent. Fresh before/after hashes match across all **50 public tables**. Later authentication activity is isolated to one new token and one prior token's revocation; original 86-token hash recovered in memory, changes retained.
- [x] Prepare exact academic-work UP/DOWN SQL, source parity, pinned hashes, READ ONLY preflight and six-scenario rollback-only PostgreSQL suite (syntax-checked, NOT RUN).
- [ ] Obtain separate approval for only `CreateAcademicWork1794750000000`: [exact SQL and safety review](./ACADEMIC_WORK_MIGRATION_REVIEW.md). UP SHA-256 `b9d9165282a969e6120e68d971b1023e2bb448bff2fdfc4306e12a44576c7ad7`; DOWN `deffcfbf79510342ebf6c071dcb94bcc57f4683ef315def804c46b3b146c8417`. This migration is **NOT APPLIED**.
- [ ] After that approval, apply only the reviewed academic-work migration with a fresh baseline, run its PostgreSQL acceptance/regressions, and continue the entire remaining Admin roadmap. Later migrations require separate approval.

Current live state: **25 migrations, 49 application tables / 50 public tables including migration history**. The current audit finds **62 pages with real API calls and 121 without**, out of 183; nine academic-work pages are prepared pending schema and persistence acceptance. The full Admin backend remains unfinished. School timezone remains unconfigured; no invented settings were persisted. Existing uncommitted backend work was retained, and nothing was staged or committed.

The older checkpoint sections below retain their historical counts/statuses. They do not supersede this current live inspection. The pre-application Library/Inventory helper expects the old 23-migration state and must not be rerun; use the read-only operations/academic startup probe to verify the current checkpoint.

## Historical checkpoint: files, learning materials and internal communications

- [x] Owner approved only `CreateSecureSchoolFiles1794672000000`, then `CreateLearningCommunication1794672100000`; applied in that exact order after matching approved hashes and source/compiled/review SQL.
- [x] Before database COMMIT, compare all 34 prior application tables against a fresh full-row count/SHA baseline, all 21 prior migration-history rows unchanged, and six new tables empty: PASS. Preserve all 7 users, both original allocations and all 84 refresh tokens. [Application and verification](./FILES_LEARNING_COMMUNICATION_APPLICATION_VERIFICATION.md).
- [x] PostgreSQL files/content persistence **8/8 PASS**, including real HTTP upload/private download/attachment/material/notice/event/calendar with JWT/roles and real database persistence. Fixtures roll back; all public-table hashes match afterward. Student/attendance regression **11/11 PASS**.
- [x] Fix all 151 repository-wide lint errors and all three warnings without changing lint rules, deleting tests or removing assertions. Backend whole-repository lint now PASS; offline backend **94/94**, Vitest **22/22**, frontend **139/139** PASS. Both production builds and focused frontend lint PASS.
- [x] Audit Git counts without deleting, reverting, staging or committing anything: [report](./GIT_CHANGE_AUDIT.md). Backend has no initial commit/tracked files; all its source appears untracked. Build/cache artifacts are ignored and none appears in changed-file candidates.
- [x] Continue a grouped Library/Inventory batch: nine entities/tables, catalog/book/member/loan/return APIs, inventory catalogs/items/receipt/issue/return/sale/stock APIs, actor audits, capacity/stock guards and 15 existing page integrations. New backend **9/9**, new frontend **6/6** PASS; whole-database READ ONLY startup probe and 503 gates PASS.
- [x] Prepare next exact UP/DOWN SQL, source parity, PostgreSQL 18.6 READ ONLY preflight and eight-scenario persistence suite (syntax-check only, NOT RUN while unapproved).
- [ ] Obtain explicit approval for `CreateLibraryOperations1794673000000`, then `CreateInventoryOperations1794673100000`: [safety review](./LIBRARY_INVENTORY_MIGRATION_REVIEW.md). Neither is applied.
- [x] Final safety review found and corrected malformed opening dollar quotes in both unapplied trigger functions. Old UP hash `ac4d7905...` is superseded by `6a67df564a448cb3524eb6aeffe9f0e6748f3477f2b6498f17c90f35ca67bcc5`. Added a regression that failed before repair and passes afterward; helper enforces matching delimiters. Current backend 10/10, build, lint and read-only preflight PASS. Live migration/trigger/concurrency/rollback acceptance remains pending approval.
- [ ] After approval, apply only that batch with a fresh preservation baseline and pre-commit comparison, run its PostgreSQL acceptance/regressions/builds, and continue all remaining Admin modules automatically. Every later migration requires its own approval.

Current database: **23 migrations, 40 application tables / 41 public tables including migration history**. Existing data and uncommitted work are preserved. The configured-school calendar passed in rolled-back fixtures; the live calendar requires the owner to save a school timezone in General Settings, which remains unconfigured. No invented configuration was persisted.

Later authentication activity added one token and revoked one earlier token after the approved commit. READ ONLY investigation isolated those exact metadata changes; all other 33 prior tables still match the application baseline. Current 85-token state is preserved, and the next approved apply must use a fresh baseline. See the application verification note above.

Current route inventory: **53 pages with real API calls, 130 without**, of 183. Fifteen Library/Inventory integrations remain prepared, gated and pending PostgreSQL acceptance. Exams, fees, leave/payroll, accounts/wallet, remaining settings, external communication, reports and the rest of the master checklist remain open; this is not a whole-backend completion claim.

## Historical approved checkpoint: student registry and attendance

- [x] Owner approved only `CreateStudentRegistry1794671000000`, then `CreateAttendanceRegisters1794671100000`.
- [x] Apply only those exact migrations after matching approved hashes/source SQL. Verify all 28 prior application tables and all 19 earlier migration-history rows unchanged before committing; six new tables empty: PASS.
- [x] PostgreSQL student/guardian/enrollment/student-attendance/staff-attendance acceptance 11/11 PASS; rolled-back fixtures and original-table preservation checks PASS. See [verification](./STUDENT_ATTENDANCE_VERIFICATION.md).
- [x] Post-application frontend 127/127 and backend Vitest 22/22; both production builds PASS. Repeated student/attendance PostgreSQL suite 11/11 PASS after the grouped continuation.
- [x] Prepare secure files/attachments, study materials/downloads and internal notices/events/calendar in one grouped batch, with ten page integrations plus student/staff attachment panels. New backend 10/10, frontend 6/6; full frontend 133/133, backend Vitest 22/22, related backend offline 51/51, both production builds and production-source lint PASS. Repository-wide test-harness lint remains failing; see [verification](./FILES_LEARNING_COMMUNICATION_VERIFICATION.md).
- [x] Exact UP/DOWN SQL, source parity, PostgreSQL 18.6 READ ONLY preflight, root-module startup/503 gates and whole-table probe preservation checks PASS. Prepare seven-scenario PostgreSQL persistence suite; syntax-check only, NOT RUN pending schema approval.
- [x] Obtain explicit approval for `CreateSecureSchoolFiles1794672000000`, then `CreateLearningCommunication1794672100000`; subsequently applied as recorded above.
- [x] Apply only that approved batch with preservation checks, pass PostgreSQL acceptance and continue Library/Inventory preparation. Later schema requires separate approval.

Student/attendance checkpoint database: **21 applied migrations, 34 application tables / 35 public tables including history**. All 7 users, both original subject assignments and all 83 refresh tokens were preserved at that historical commit. The later files/content commit captured a fresh 84-token baseline.

Historical route inventory at preparation: **38 pages with real API calls; 145 without**, out of 183. Current counts and applied status are recorded above.

## Historical continuation: General Settings, calendar and student catalogs

### Approved application checkpoint

- [x] Owner explicitly approved only `CreateSchoolSettings1794500200000` then `CreateAdminFoundations1794670000000`.
- [x] Apply only those two, with exact approved hashes/source parity and whole-table preservation checks before committing: PASS. Prior 22 application tables and 17 migration rows unchanged; all six new tables empty.
- [x] PostgreSQL foundation acceptance 9/9 and General Settings 7/7 PASS, including fixture rollback and original-table hash checks. See [verification](./SETTINGS_FOUNDATIONS_VERIFICATION.md).
- [x] Frontend regressions 118/118 and both production builds PASS after application.
- [x] Correct two pre-existing users Vitest smoke tests with missing Nest providers; replace them with safe-profile/verified-actor assertions. Full Vitest 22/22 PASS.
- [x] Prepare student profiles, guardians, dated enrollments, student/staff daily attendance, their DTOs/entities/APIs/audits, and four frontend flows. New backend 18/18 and frontend 9/9 cases PASS; full frontend 127/127; 41 related backend offline cases PASS. Both builds and focused lint PASS.
- [x] Prepare the [next two-migration review](./STUDENT_ATTENDANCE_MIGRATION_REVIEW.md), exact UP/DOWN SQL, default-read-only preflight and eleven-scenario PostgreSQL acceptance suite. READ ONLY compatibility/source parity PASS. New persistence suite NOT RUN.
- [x] Root-module startup and recheck of every original table hash PASS; approved Settings/foundations APIs now return 200, pending student/attendance APIs return 503.
- [x] Obtain separate explicit approval for `CreateStudentRegistry1794671000000` then `CreateAttendanceRegisters1794671100000`; subsequently applied as recorded above.
- [x] Apply only that reviewed batch with preservation checks, pass PostgreSQL acceptance and continue the next grouped batch. No new implementation instructions are required.

Database now has **19 applied migrations and 29 public tables including history**. All 7 users, both original assignments and 82 refresh-token rows were preserved at approved commit and the later READ ONLY recheck. New school configuration tables remain empty after acceptance rollback. The route audit now finds 28 pages with real API calls and 155 without; this does not establish completion. The earlier preparation notes below are historical; the original approval covers no later migration.

### Historical preparation before the approved Settings/foundations application

The owner renewed authorization to implement **all remaining Admin features**, continue autonomously in grouped batches, preserve school data/UI/uncommitted work, and request explicit approval before database migrations. This authorization persists after the next migration gate; no new implementation prompt is needed.

- [x] Resume the pending General Settings checkpoint without reimplementing completed modules.
- [x] Recheck the original School Settings SQL hashes and current PostgreSQL prerequisites with a READ ONLY preflight; original source and review SQL remain unchanged.
- [x] Prepare audited/versioned weekend configuration, inclusive holiday ranges with database overlap exclusion, and separate student category/group catalogs with archive/restore, validation and unrestricted-admin enforcement.
- [x] Integrate all four existing frontend routes through protected cookie-session proxies with server pagination/search, real IDs, retained failed drafts, retry states and human-readable history; remove their demo records and invented grade/section scopes.
- [x] Prepare the two-migration [General Settings + foundations approval batch](./SETTINGS_FOUNDATIONS_MIGRATION_REVIEW.md), exact UP/DOWN SQL and a default-read-only helper with whole-table preservation checks.
- [x] Backend/frontend builds PASS; 13 new backend unit cases, one HTTP contract scenario, 27 related backend offline regressions and 118 full frontend cases PASS. New foundation PostgreSQL acceptance is prepared, NOT RUN.
- [x] Final lifecycle-fix frontend lint and focused tests PASS, with no errors/warnings. Backend type-aware lint PASS. Refreshed route inventory: 24 pages contain real API calls; 159 have none detected. These counts do not establish persistence acceptance.
- [x] Root-module startup/DI and READ ONLY endpoint probe PASS: existing permission API 200; unapplied Settings and all five foundation read endpoints 503.
- [x] Final frontend production build after lifecycle fixes PASS, including TypeScript and 223 generated pages. Current execution verifies 159 distinct test cases (118 frontend + 40 backend service/DTO/migration/security regressions + 1 HTTP scenario). Both production builds and focused lint pass. No PostgreSQL persistence acceptance is counted in this total.
- [x] Obtain explicit approval for the Settings/foundations batch, apply only those two and pass both PostgreSQL acceptance suites. See the approved application checkpoint above.
- [x] Continue automatically into student/guardian/enrollment and student/staff attendance preparation; next schema approval is separate.

Current READ ONLY inspection: PostgreSQL 18.6, 17 migrations, 22 application tables / 23 public tables including history; all 7 users and both legacy subject assignments retained. There are now 82 refresh-token rows, observed before this continuation's writes; no token rows were changed by this continuation. Historical reports below retain their original baselines.

The four Settings/foundation route integrations subsequently passed PostgreSQL acceptance. The next four student/attendance integrations are **prepared, not persistence-accepted**. Uploads and the other outstanding domains remain unfinished. No full-backend completion claim is made.

The historical Settings/foundations apply command is already complete; do not rerun that 17-migration-state helper. The active gate is now the [Student Registry/Attendance batch](./STUDENT_ATTENDANCE_MIGRATION_REVIEW.md), based on 19 applied migrations. Preserve all rollback/baseline safeguards and never run an all-pending-migrations command.

## Execution and approval rules

- Continue autonomously through Admin modules in dependency order. A separate implementation prompt or module approval is not required.
- Before every database migration application, present exact UP/DOWN SQL and wait for explicit approval. Past review does not prove application or authorize a new application.
- Never reset the database, delete existing data, or invent legacy mappings. Preserve uncommitted work, UI styling, navigation and routes.
- Student/Instructor dashboards are outside scope; shared backend relationships are permitted.
- Prepared code and passing mocked tests are not PostgreSQL acceptance. No module is complete until its relevant persistence, permissions, validation, integration and build checks pass.

## Current audit and next action

- [x] Read all four roadmap pages.
- [x] Inspect both repositories, migrations, Nest controllers, API contracts, proxies, Admin pages and local import graphs.
- [x] Create [per-route audit](./ADMIN_ROUTE_AUDIT.md) and [machine-readable evidence](./ADMIN_ROUTE_AUDIT.json), covering 183 Admin pages.
- [x] Verify PostgreSQL using a READ ONLY transaction: initially 12 applied migrations, 16 public tables. Reconciliation, Classroom and Class Routines were subsequently applied after separate explicit approvals: now 15 migrations and 18 public tables.
- [x] Verify reconciliation prerequisites: 2 legacy assignments, 0 staff rows, 1 class-section. Do not infer relationships for these rows.
- [x] Prepare Subject Assignment reconciliation code, migration, UI wiring for both existing routes, unit/HTTP tests, and PostgreSQL acceptance suite.
- [x] Generate exact UP/DOWN SQL from the compiled migration without executing it. See [migration review](./SUBJECT_ASSIGNMENT_RECONCILIATION_REVIEW.md).
- [x] Obtain explicit owner approval to apply `ReconcileSubjectAssignments1794430000000`.
- [x] Apply only reconciliation in one transaction: before/after equality across all 15 application tables passed. Both original assignments remain unchanged.
- [x] Run reconciliation and related PostgreSQL regressions: 30 distinct cases PASS. See [verification](./SUBJECT_ASSIGNMENT_RECONCILIATION_VERIFICATION.md).
- [x] Prepare classroom entity/DTOs/service/controller/proxies and both existing frontend routes, plus validation/HTTP/frontend tests and PostgreSQL acceptance suite.
- [x] Obtain separate explicit approval for `CreateClassrooms1794430100000`; approved SQL retained in [review](./CLASSROOMS_MIGRATION_REVIEW.md).
- [x] Apply Classroom in one transaction, preserving every existing row across 15 application tables. PostgreSQL classroom tests 6/6 and Subject Assignment regressions 5/5 PASS. See [verification](./CLASSROOMS_VERIFICATION.md).
- [x] Prepare routine APIs, DTOs, entity, typed proxies, both existing pages and tests.
- [x] Obtain separate explicit approval for `CreateClassRoutines1794430200000`, including btree_gist and the three new UNIQUE reference constraints. See [approved SQL review](./CLASS_ROUTINES_MIGRATION_REVIEW.md).
- [x] Apply only Class Routines in one transaction. All original rows across 16 application tables unchanged. PostgreSQL routine acceptance 8/8 PASS; related PostgreSQL regressions 19/19 PASS. See [verification](./CLASS_ROUTINES_VERIFICATION.md).
- [x] Continue to login-permission foundation: prepare policy/audit schema, admin API/UI, session version enforcement, refresh revocation, actor/self/admin safeguards, offline tests and PostgreSQL acceptance suite.
- [x] Obtain separate explicit approval for `CreateUserLoginPolicies1794500000000`, verify SQL parity, and apply only that migration. All 17 existing application tables and prior migration rows unchanged at commit.
- [x] Login policies PostgreSQL acceptance 7/7 PASS with rolled-back fixtures, including persisted token revocation, audit history, re-enable, actor/self/last-admin safeguards and baseline hashes. See [verification](./USER_LOGIN_POLICIES_VERIFICATION.md).
- [x] Automatically continue into custom admin permission roles: API/service, guard enforcement, DTO validation, audited assignments, existing Manage Roles UI, offline tests and PostgreSQL acceptance suite prepared. Fixed account roles remain intact; assignments restrict admin domain access only.
- [x] Obtain explicit approval for `CreateAdminPermissionRoles1794500100000`, verify exact SQL parity and apply only this migration. All 19 existing application tables and prior history rows unchanged at commit; new tables empty.
- [x] Permission PostgreSQL acceptance 8/8 PASS, including escalation protection, live enforcement, audit object versions, SQL constraints and last-unrestricted-admin protections. Resolved the driver's UPDATE result-shape issue in service code without changing approved migration SQL. See [verification](./ADMIN_PERMISSION_ROLES_VERIFICATION.md).
- [x] Continue automatically to General Settings: school identity/contact/timezone API, audited singleton persistence, version conflicts, form/history UI, offline/frontend tests and PostgreSQL acceptance suite prepared.
- [x] Next migration `CreateSchoolSettings1794500200000`: exact UP/DOWN source/compiled parity and READ ONLY PostgreSQL compatibility preflight PASS; NOT APPLIED.
- [x] Obtain explicit approval for the [two-migration Settings/foundations batch](./SETTINGS_FOUNDATIONS_MIGRATION_REVIEW.md) and apply only those migrations with preservation verification.
- [x] Run both PostgreSQL acceptance suites and continue automatically into student profiles/guardians/enrollments and daily attendance preparation. No new master prompt required. Obtain explicit approval for the pending [Student/Attendance batch](./STUDENT_ATTENDANCE_MIGRATION_REVIEW.md) before application.

The refreshed audit has 28 pages whose import graphs contain real API calls, including the four student/attendance flows prepared pending separate schema approval; 155 have no real domain API detected. These are static integration counts, not completed-feature counts. Most frontend routes are still mock/static. The complete Admin backend is NOT yet functional.

## Roadmap checklist

| Area | Audited state | Remaining work / acceptance |
|---|---|---|
| Authentication/session | Implemented; 15 backend and 40 frontend regression tests pass | Preserve verified database-role guards and cookie flow |
| Academic years/classes/sections/subjects | Existing tables, APIs and active UI; frontend regression tests pass; prior PostgreSQL reports retained | School Subjects 6/6 and Classes 5/5 PostgreSQL regressions PASS; preserve class-section IDs |
| Class teacher allocation | Existing migration applied; current PostgreSQL regression 8/8 and frontend 5/5 PASS | Preserve; do not create a duplicate module for legacy route |
| Subject allocation | Reconciliation APPLIED after explicit approval; PostgreSQL tests 5/5 and frontend 8/8 PASS | Completed; preserve both legacy records |
| Classrooms/routines | Both APPLIED after separate approvals. PostgreSQL Classroom 6/6 and Routine 8/8 PASS; routine offline 6/6 and frontend 7/7 PASS. | Preserve overlap/FK protections; completed routine acceptance |
| Users/roles/login permissions | Login policies and custom admin permission roles APPLIED after separate approvals. PostgreSQL login 7/7 and permission 8/8 PASS; offline login 6/6 and permission 11/11 PASS. Audited assignments and request-time grants are active. | Preserve authorization, unrestricted-admin and session safeguards; account CRUD remains separate. |
| HR | Departments/designations/staff implemented; secure attachments APPLIED and PostgreSQL accepted | Connect remaining aliases, leave/payroll and related HR workflows |
| Student foundation | Catalogs, profiles/guardians/enrollment, audits and admission/edit/directory APPLIED; PostgreSQL 11/11 PASS. Secure attachments APPLIED and tested. | Remaining lifecycle/exports/bulk promotions; recorded-period corrections remain separate. |
| Attendance | Student/staff daily APIs, atomic versioned batches and two UI routes APPLIED; PostgreSQL 11/11 PASS. | Subject attendance and source-backed reporting remain open. |
| Homework | Records, dated-enrollment evaluation/roster APIs and four page integrations APPLIED; PostgreSQL academic-work 7/7 PASS | Submission/file-association/export workflows remain open |
| Lesson planning | Lesson/topic/dated-plan APIs, scope retention and five page integrations APPLIED; PostgreSQL academic-work 7/7 PASS | Configuration/schedule views remain open |
| Examinations/exam plans | Static/mock; no backend | Types/setup, grades, schedules, marks/results, attendance, admit/seat plans |
| Online examinations | Static/mock; no backend | Question groups/bank, exam lifecycle and Admin-visible results |
| Behaviour | Incident catalogs, dated snapshot conduct records, voids/audits and student/class/incident reports PREPARED across six pages; migration 1794751000000 NOT APPLIED | Separate approval and live persistence acceptance |
| Teacher evaluation | Explicit policy, Admin-recorded student/guardian source reviews, approval and normalized teacher aggregates PREPARED across four pages; migration 1794751000000 NOT APPLIED | Separate approval and live persistence acceptance; authenticated learner/faculty flows remain open |
| Fees | Mock service and static pages; no financial tables/controllers | Shared model for fee/fees aliases; invoices/collection/receipts/carry-forward; transaction integrity |
| Accounts | Mock/static; no ledger APIs | Chart/accounts, balanced ledger, income/expense/transfers, profit/loss |
| Wallet | Static/mock; no backend | Audited approvals/refunds and atomic balances |
| Inventory | Catalogs/suppliers/stores/items, immutable receipt/issue/return/sale ledger, stock balances and eight routes APPLIED; PostgreSQL operations 8/8 PASS. | Monetary posting, purchase/transfer documents and separate multi-connection contention testing remain open. |
| Leave/payroll | Staff leave types/explicit entitlements/calendar-day requests, quota/overlap guards, decisions and four pages PREPARED; migration 1794751000000 NOT APPLIED. Payroll remains static/mock | Separate approval and leave persistence acceptance; role distribution, working-day/half-day/carry-forward/attachments and payroll remain open |
| Library | Catalog/book/member/loan/return/availability/overdue APIs and seven routes APPLIED; PostgreSQL operations 8/8 PASS. | Fines/reservations/copy serial workflows and separate multi-connection contention testing remain open. |
| Dormitory | Static/mock; no backend | Dormitories/room types/rooms/occupancy |
| Front office | Static/mock; no backend | Admission queries, visitors, complaints, phone/postal logs, certificate/ID templates |
| Study materials/download center | Secure files/metadata/downloads and material/syllabus/assignment-file/video APIs APPLIED; PostgreSQL 8/8 PASS. | Custom type CRUD, learner distribution, submission/evaluation and remaining workflows stay open. |
| Communication/settings | General Settings plus holidays/weekends/catalogs APPLIED, PostgreSQL 16/16 PASS. Internal notices/events/calendar APPLIED, PostgreSQL 8/8 PASS. Configuration remains explicitly empty. | Remaining settings and provider-backed external communication without invented credentials. |
| Reports/bulk printing/dashboard | Static/mock derived views; no source-backed aggregate APIs | Implement after source modules; authorization, filters, exports and persisted document generation |

## Historical verification after approved permission roles and initial General Settings preparation

- Only `CreateAdminPermissionRoles1794500100000` was applied in this continuation. Reviewed hashes matched. All 19 pre-existing application tables and all 16 prior migration-history rows unchanged before commit; three new tables empty. Database now has 17 migrations and 23 public tables including history.
- Permission PostgreSQL acceptance 8/8 and login PostgreSQL regressions 7/7 PASS, including whole-table snapshots after rolled-back fixture cleanup. The permission API edit response/audit object shape was corrected using a CTE without changing migration SQL.
- Permission offline/guard/validation/migration cases 11/11; login offline/HTTP cases 6/6; Settings offline cases 10/10; auth unit regressions 17/17 and auth PostgreSQL regressions 7/7 PASS.
- Full frontend regressions 109/109 PASS. Backend/frontend production builds and focused type-aware/backend and frontend lint PASS; final frontend generates 223 pages.
- Root module dependency injection/startup PASS; applied permission API returns 200 and unapplied General Settings API returns 503 for a verified unrestricted admin.
- Current continuation: 175 distinct test cases PASS (109 frontend + 11 permission offline + 8 permission PostgreSQL + 6 login offline + 7 login PostgreSQL + 10 Settings offline + 17 auth offline + 7 auth PostgreSQL).
- School Settings exact SQL/source/compiled parity and READ ONLY preflight PASS; 22 existing application tables; names absent and prerequisites present. No School Settings migration applied, no school identity invented, and its PostgreSQL acceptance suite NOT RUN.
- Current preflight preserves the permission-application baseline including all 81 refresh tokens, all 7 users and both original subject assignments. All login-policy/permission tables remain empty after fixture rollback. Existing uncommitted work preserved.
- Next approval gate: [School Settings](./SCHOOL_SETTINGS_MIGRATION_REVIEW.md). The permission-role approval authorizes no later migration. Continue remaining settings/uploads/student foundations under the original master task after approval.

## Historical verification after approved login policies and permission-role preparation

- Only `CreateUserLoginPolicies1794500000000` was applied. Exact approved SQL hashes matched. All existing rows across 17 application tables and all prior history rows unchanged at commit. Both new tables empty at commit and after fixture cleanup. Database now has 16 migrations and 20 public tables including history.
- PostgreSQL login permission tests: 7/7 PASS; auth PostgreSQL regressions: 7/7 PASS. Login fixtures roll back and compare every table's count/hash. Last-admin scenario uses transaction-only missing-policy overlays, rolled back to a savepoint without overwriting existing users/policies or revoking school sessions.
- Later auth activity: one original refresh token's revoked_at changed and one new refresh token appeared. Read-only comparison isolates that exact delta; its initiator was not established. Both were retained; migration and suite baseline checks remain distinct from this later activity. See [verification](./USER_LOGIN_POLICIES_VERIFICATION.md).
- Backend: permission offline/guard/validation cases 11/11, login offline/HTTP cases 6/6, auth service/controller/mail regressions 17/17 PASS. Root-module dependency injection/startup PASS, and unapplied permissions API returns 503 with current auth preserved.
- Frontend regressions: 103/103 PASS including 3 permission client/proxy/route cases. Production frontend/backend builds and focused frontend/backend lint PASS.
- Current continuation: 151 distinct test cases PASS (103 frontend + 11 permission offline + 6 login offline + 7 login PostgreSQL + 17 auth offline + 7 auth PostgreSQL). Permission-role PostgreSQL suite prepared, NOT RUN.
- Next migration preflight: source/compiled/reviewed SQL parity and READ ONLY compatibility PASS across 19 current application tables. Three new permission-role tables remain absent.
- Next approval gate: [Admin permission roles](./ADMIN_PERMISSION_ROLES_MIGRATION_REVIEW.md). The login-policy approval authorizes no later migration.

## Historical verification after approved Class Routines and login-policy preparation

- Routine migration committed after explicit approval; SHA-256 equality across all 16 pre-existing application tables passed before commit. Post-test original-record hashes still match, including both legacy assignments and all 76 original refresh-token rows. One later auth-token record was observed and retained.
- PostgreSQL suites: Routine 8/8, Class teachers 8/8, Classrooms 6/6, Subject Assignments 5/5, Authentication 7/7 PASS. Each fixture suite verifies original data after cleanup/rollback.
- Backend offline suites: Routine 6/6, Subject Assignments 11/11, Login permissions 6/6 PASS. Auth service/controller/mail regression 17/17 PASS.
- Full frontend regressions: 100/100 PASS. Frontend/backend production builds PASS (219 generated frontend pages including TypeScript).
- Focused frontend/backend lint PASS. New login policy PostgreSQL suite is prepared but NOT RUN; its schema remains unapplied.
- Current continuation: 174 distinct test cases PASS; unchanged suites were not repeated without a new reason. Applied database state: 15 migrations, 18 public tables.
- Next approval gate: [Login policies](./USER_LOGIN_POLICIES_MIGRATION_REVIEW.md). No new database migration is authorized by the routine approval.

## Historical verification after Classroom and routine preparation

- Backend production build: PASS. Frontend production build including TypeScript: PASS, 218 generated pages.
- Frontend regression suites: 94/94 PASS, including routine 7/7, classroom 6/6 and Subject Assignment 8/8.
- Backend offline/HTTP suites: 22/22 PASS (routines 6, classrooms 5, Subject Assignment 11, including scheduled-allocation error handling).
- Classroom PostgreSQL suite: 6/6 PASS. Subject Assignment PostgreSQL regression: 5/5 PASS. Both suites also pass with the new routine module registered but its schema unapplied.
- Current continuation: 127 distinct tests PASS. The previous related PostgreSQL verification reports remain valid historical evidence; those unrelated suites were not re-run in this continuation.
- Focused backend lint: PASS, no warnings. Focused frontend lint: 0 errors; 4 pre-existing unused-argument warnings in the shared API service.
- Routine PostgreSQL suite: prepared, NOT RUN. No routine schema or extension statements have been applied. Real overlap/constraint acceptance must wait for explicit migration approval.
- Existing records: equality checks across all 15 pre-existing application tables passed before the classroom migration committed. Original assignments remain two unchanged legacy records. Test cleanup is restricted to owned fixture UUIDs, followed by row/hash comparisons.

Current release ordering: Classroom, reconciliation, Routines, Login policies, Admin permission roles, General Settings and Admin Foundations are applied and PostgreSQL-tested. Student Registry and Attendance Registers remain prepared pending separate batch approval and PostgreSQL acceptance. Synchronize and automatic migrations remain disabled. Statements in historical verification sections describe earlier continuations.

## Prior verification reports

[Authentication](./PHASE_1_AUTHENTICATION.md), [School subjects](./PHASE_2_SCHOOL_SUBJECTS.md), [Academic year](./PHASE_3_ACADEMIC_YEAR.md), [Sections](./PHASE_3_SECTIONS.md), [Class teachers](./CLASS_TEACHER_ALLOCATION_PLAN.md). Existing reports and proposed reconciliation plan are preserved as historical context; this checklist reflects the current instructions and live migration inspection.
