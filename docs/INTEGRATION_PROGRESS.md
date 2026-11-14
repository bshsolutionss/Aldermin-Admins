# Aldermin Admin implementation progress

Last updated: 2026-11-14. Primary checklist: owner-supplied Admin Panel Backend Implementation Roadmap (4 pages).

## Latest approved checkpoint: files, learning materials and internal communications

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
| Homework | Static/mock; no backend | Persist assignments, targeting and evaluation used by Admin |
| Lesson planning | Static/mock; no backend | Lessons/topics/plans and overview queries |
| Examinations/exam plans | Static/mock; no backend | Types/setup, grades, schedules, marks/results, attendance, admit/seat plans |
| Online examinations | Static/mock; no backend | Question groups/bank, exam lifecycle and Admin-visible results |
| Behaviour | Static/mock; no backend | Incident records/assignments and class/student reports |
| Teacher evaluation | Static/mock; no backend | Settings, submissions/review and aggregates |
| Fees | Mock service and static pages; no financial tables/controllers | Shared model for fee/fees aliases; invoices/collection/receipts/carry-forward; transaction integrity |
| Accounts | Mock/static; no ledger APIs | Chart/accounts, balanced ledger, income/expense/transfers, profit/loss |
| Wallet | Static/mock; no backend | Audited approvals/refunds and atomic balances |
| Inventory | Catalogs/suppliers/stores/items, immutable receipt/issue/return/sale ledger, stock balances and eight routes PREPARED; separate migration NOT applied. | Approve and run persistence/concurrency acceptance; monetary posting, purchase/transfer documents and remaining workflows stay open. |
| Leave/payroll | Static/mock; no backend | Types/policies/applications, balances, approval and payroll |
| Library | Catalog/book/member/loan/return/availability/overdue APIs and seven routes PREPARED; separate migration NOT applied. | Approve/test persistence/capacity guards; fines/reservations/copy serial workflows remain open. |
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
