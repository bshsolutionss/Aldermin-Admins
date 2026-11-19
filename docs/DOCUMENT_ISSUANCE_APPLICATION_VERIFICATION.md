# Document Issuance application and continued implementation

2026-11-17. **Only `CreateDocumentIssuance1794755000000` was applied**, after the owner's conditional approval. [Application receipt](../../../lms/lms-backend/docs/DOCUMENT_ISSUANCE_APPLICATION.json), [locked original-table baseline and history](../../../lms/lms-backend/docs/DOCUMENT_ISSUANCE_APPLICATION_BASELINE.json).

- UP SHA-256 `974e6538d59f52ed0b9f5f18d34c998dd8b3d1e4bedec5dc3860920c3afcf91a`.
- DOWN SHA-256 `b61e80f2578094afc79b3075a5535406739fc1a9a41409e0159704e505d3cdc6`.

Fresh source/compiled/artifact parity, raw hashes and READ ONLY PostgreSQL 18.6 preflight passed. The single-migration helper captured all **99 original application-table counts/full-row hashes and all 30 prior history entries under locks**. They matched before commit and again after commit. Six new tables were empty. Only named history entry **31** was added. Database now has **105 application tables / 106 public tables**, including history. No subsequent migration was applied.

## Acceptance

- Document PostgreSQL persistence/HTTP/trigger/rollback suite **10/10 PASS**, independent two-connection writer serialization **1/1 PASS**. Covers students and staff, actual registry/guardian fields, frozen layouts/assets, exact retries, versions, inactive-recipient policy, atomic mixed-batch and audit failures, print item links, expiry/future dates, revocation, immutable history and populated rollback refusal. Every fixture rolls back and compares complete public-table hashes.
- [Production Next + actual Nest + PostgreSQL full-stack acceptance](./DOCUMENT_STACK_ACCEPTANCE.json) **PASS** for both kinds and all six route responses: protected login cookies, create/versioned template edits, issuance retries, frozen snapshots, print/HTML export retries, actor history, anonymous verification privacy and revocation blocking reprint.
- Browser acceptance **PASS** on the six actual screens: created a student certificate template and staff ID template, issued from actual rolled-back registry profiles, reloaded persisted registries/history, and requested print and HTML export from both bulk-print routes. UI showed the recorded print/export result; physical printer output was not certified. The integrated browser did not expose the detached print window as a Playwright popup event; HTML safety/layout and font/image waits are additionally checked by the frontend suite.
- The application fixture used only temporary `ROLLBACK`-labelled users/students/staff inside one outer transaction, including login tokens and UI writes. It expired cleanly and rolled back. **All 106 public-table hashes matched its fresh starting baseline**, including migration history and authentication tables. [Preservation receipt](../../../lms/lms-backend/docs/DOCUMENT_STACK_ACCEPTANCE_PRESERVATION.json). A legitimate non-fixture refresh token created between the application baseline and the UI fixture was retained; old baselines were not used to delete or revert legitimate authentication activity.
- Fresh read-only root probes **PASS**: authenticated document lists/options/history and dashboard return 200, anonymous document reads 401, unknown issue/public verification 404, invalid missing artwork 400; all table rows/history unchanged. [Document readiness](../../../lms/lms-backend/docs/DOCUMENT_ISSUANCE_READINESS.json), [root module startup](../../../lms/lms-backend/docs/ADMIN_PANEL_STARTUP.json).

The document limitations in the [review](./DOCUMENT_ISSUANCE_MIGRATION_REVIEW.md) still apply: UTC validity dates, bounded print/issuance and image sizes, constrained layouts, no inferred missing fields, no physical-print completion claim, and no recall of exported copies. Rollback remains empty-only. No existing school settings or records were filled with demonstration defaults.

## Continued batch

Fourteen additional existing routes now use real APIs: nine class/enrollment/access/exam summary reports, student-wise attendance, student promotion, examination admit cards, and two financial print queues. Reports use read-only transactions, bound searches, pagination, CSV escaping and stale-response protection. Exam totals/weighted percentages/dense positions require every applicable subject to be graded; missing/absent/excused marks retain an unscored aggregate. Admission printouts use actual scheduled room/time and dated enrollment, without inventing seating or fee clearance. Promotion reuses versioned, audited enrollment creation while preserving prior placements; bulk promotion is not implemented. Fee/payroll printing uses posted records and exact minor units; a generated payroll is not described as paid.

Nine settings routes now use typed protected configuration-profile APIs. Their new migration is drafted and **NOT APPLIED**; saving/live acceptance is approval-gated. These are profile stores, not full provider or operational policy integration. [Next migration review and limitations](./ADMIN_CONFIGURATION_MIGRATION_REVIEW.md).

The static inventory now detects real API calls on **175 of 183** routes. The conservative ledger has **10 verified, 165 partial and 8 incomplete**, including **9 migration-gated** profiles within partial. All Admin functionality is **not yet complete**. [Remaining route ledger](./ADMIN_ROUTE_READINESS.md).

Frontend lint errors were fixed by converting test/tool imports to actual ESM imports, retaining the in-memory CommonJS compilation needed for TS fixture mocks, and removing the forbidden local `module` binding. No lint rules, ignores or tests were disabled. Full lint passes with zero errors; remaining warnings are tracked separately. Existing uncommitted work was retained; nothing was staged, reset or source-committed.

## Final regression results

| Check | Result |
|---|---|
| Frontend Node suite | 199/199 PASS |
| Backend offline/HTTP | 170/170 regression plus 4/4 new configuration checks PASS |
| Backend Vitest | 22/22 PASS |
| Live PostgreSQL affected suites | 63/63 PASS |
| Frontend and backend production builds | PASS |
| Frontend TypeScript | PASS |
| Frontend full lint | PASS: 0 errors, 44 warnings; rules unchanged |
| Backend full lint | PASS |
| Root startup/read probes and all-table preservation | PASS |

New configuration DDL/trigger/persistence/concurrency/rollback execution remains pending separate approval. Its read-only PostgreSQL preflight and actual root API gates are verified. All 63 executed live cases concern already-approved schemas.
