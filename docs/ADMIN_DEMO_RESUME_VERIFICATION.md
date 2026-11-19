# Admin demonstration resume: 2026-11-17

Resumed from the actual uncommitted Certificate/ID implementation. No reset, checkout, staging, source commit, migration application, database cleanup or seed was performed. The actual working tree was ahead of its saved checkpoint; the existing six-table document candidate and connected screens were retained.

## Interrupted checks completed

- Backend build and root-application probe PASS. Actual PostgreSQL **18.6**, **30 migrations**, latest `CreateOnlineCampusOperations1794754000000`, **99 application tables / 100 public tables**. Document migration remains absent. All 100 public-table row hashes and all 30 history rows match before/after the probe.
- Document private endpoints correctly return **503**, anonymous Admin document reads **401**, and public verification **503/no-store** until approval/application. New dashboard endpoint returns **200/no-store**, anonymous requests **401**, malformed year **400**.
- Exact document source/compiled/UP/DOWN parity and fresh READ ONLY prerequisites PASS. [Evidence](../../../lms/lms-backend/docs/DOCUMENT_ISSUANCE_PREFLIGHT.json), [application probe](../../../lms/lms-backend/docs/DOCUMENT_ISSUANCE_READINESS.json).
- Document backend unit/real-guard HTTP **8/8 PASS**; existing six-route frontend/printing/privacy checks and proxy **8/8 PASS**. These are pre-application checks, not live document persistence acceptance.
- Corrected document template UPDATE result handling using a SELECT CTE, matching the repository's TypeORM/PostgreSQL result contract. Adjusted its offline audit-failure fixture accordingly. No migration SQL changed. Added populated rollback refusal to the prepared PostgreSQL suite, which remains unexecuted.
- Prepared single-migration apply helper now refuses execution without its explicit approval flag. This is an accidental-execution guard, never a substitute for owner approval. It was not executed.

## Demonstration-priority continuation

Both existing dashboard routes now use one protected read-only summary over already-applied schemas. Their grid, cards and styling remain intact. Student/staff counts, gender counts, calendar-year income/expense, twelve monthly ledger buckets, fee collections/outstanding/overdue balances, current notices and upcoming/ongoing events come from persisted records. The original invented counts, money, notice text and message previews are not used by the active dashboard. The old message preview card is replaced in the dashboard with actual events; a personal messaging inbox is not implemented.

Financial totals reconcile against real rollback-only finance fixtures and the existing profit/loss report, preserving exact minor-unit strings. Plotting is skipped for integers outside safe JavaScript chart range; exact totals remain available. Currency stays unconfigured until explicitly saved. Dates default to UTC when school timezone is missing, shown in dashboard metadata; the calendar widget is explicitly browser-local. No fake school name, notices, people or configuration was inserted. Dashboard loading/error/retry and stale-response guards are tested. Existing card controls link to the relevant persisted management/report routes.

New dashboard frontend **5/5** and backend unit/real-guard HTTP **3/3 PASS**. PostgreSQL reconciliation is included in the finance acceptance suite.

## Regression results

| Verification | Result |
|---|---|
| Complete frontend Node suite | **192/192 PASS** |
| Backend offline unit/real-guard HTTP suite | **170/170 PASS** |
| Backend Vitest | **22/22 PASS** |
| Finance PostgreSQL suite, including new dashboard reconciliation | **11/11 PASS** |
| Examination, Online/Campus, finance writer concurrency, student/attendance and school-content PostgreSQL suites | **39/39 PASS** |
| Both production builds | **PASS** |
| Frontend TypeScript | **PASS** |
| Backend repository-wide lint | **PASS** |
| Focused dashboard/document/API/audit/readiness lint | **PASS: 0 errors**, one existing WelcomeCard image optimization warning |
| Frontend repository-wide lint | **FAIL: 80 existing errors, 49 warnings**; rules retained |

The **50 executed PostgreSQL cases** use rollback-only fixtures and compare complete original public-table hashes afterward. No live document persistence/concurrency/trigger/rollback suite was run while its schema was unapproved. Its 10-scenario persistence/HTTP suite plus independent writer suite are prepared and syntax checked.

## Approval and remaining scope

[Certificate/ID safety review and exact SQL](./DOCUMENT_ISSUANCE_MIGRATION_REVIEW.md) is finalized. Only `CreateDocumentIssuance1794755000000` is proposed:

- UP SHA-256 `974e6538d59f52ed0b9f5f18d34c998dd8b3d1e4bedec5dc3860920c3afcf91a`.
- DOWN SHA-256 `b61e80f2578094afc79b3075a5535406739fc1a9a41409e0159704e505d3cdc6`.

Explicit approval is required before application. Then capture fresh preservation baselines for all **99 existing application tables and 30 prior history entries**, apply only that exact migration, verify before/after COMMIT, run live document acceptance and browser/print QA, then continue the rest of the Admin roadmap. Do not repeat older migration helpers or invoke an all-pending runner.

Updated connectivity inventory: **152/183 routes with detected real API calls, 31 without**. Conservative readiness remains **4 fully verified, 148 partial, 31 incomplete**, including **six migration-gated document routes** among the partial group. No route was promoted to fully verified during this resume. Backend and production readiness are **NOT COMPLETE / NOT READY**.

For the demonstration, existing approved registry/attendance, academic, finance, Online/Campus, front-office/dormitory and read-only dashboard workflows can be exercised with owner-configured settings and actual data. Certificate/ID issuance/printing is gated until approval and acceptance. Browser/physical printing, seat/admit-card plans, remaining reports/settings/external communications, promotion/import/carry-forward and financial correction/reconciliation policies remain open. No small-batch completion is presented as completion of the original task.
