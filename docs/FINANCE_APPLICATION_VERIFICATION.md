# Finance Operations application and acceptance

2026-11-16. Explicit conditional owner approval covered **only** `CreateFinanceOperations1794753000000`, including the previously documented policy limits. No new finance limitation or safety mismatch was found before application.

- UP SHA-256 `8fbf170f369b3e1c847a2b84a360985b45292a4217fe289cf527e33a9737e4dc`.
- DOWN SHA-256 `8310a94f7805157e9981706cead7410acbe748c1a436dca7047f8dcde733b07b`.
- Fresh backend build and focused finance unit/HTTP **11/11 PASS** before application. Exact source/compiled/reviewed SQL parity, both pinned hashes and READ ONLY PostgreSQL preflight passed.
- Apply only that named migration in one transaction after locking all 70 prior application tables and history and capturing a fresh full-row count/SHA-256 baseline. Before COMMIT, all 70 tables and all 28 earlier history rows match exactly; all 12 new tables empty. Fresh post-COMMIT preservation also passes. History ID **29**.
- No school configuration, currency, opening balances, bank accounts, demo rows or seeds committed. No existing school rows updated/deleted. No general migration runner or synchronize used.

Evidence: [fresh baseline](../../../lms/lms-backend/docs/FINANCE_APPLICATION_BASELINE.json), [application report](../../../lms/lms-backend/docs/FINANCE_APPLICATION.json), [single-use Finance-only apply helper](../../../lms/lms-backend/test/apply-finance-approved.mjs). Do not rerun the pre-application helper against the applied database.

## Live PostgreSQL verification

Finance domain/real-HTTP acceptance **10/10 PASS**: currency policy and catalogs, exact fee snapshots, invoices and balanced accruals, partial receipts and overpayment rejection, exact retries, wallet decisions/spending/refund guards, payroll and salary payment, income/expense/transfers/trial balance, immutable ledger and settled decisions, deferred unbalanced-journal rejection, actor audits, audit-failure rollback and real HTTP authorization/validation/persistence.

Additional independent-connection acceptance **1/1 PASS**: real service writers serialize under the shared authorization/write lock; their audits remain transactional; the empty approved DOWN was tested only inside a rolled-back transaction and all schema/data restored. Populated DOWN refusal is covered by the main suite. Total finance acceptance/concurrency: **11/11 PASS**. All fixtures roll back and whole-table hashes match.

Affected examination/administration/concurrency/academic work/operations/content/student-and-attendance PostgreSQL regression **52/52 PASS**. Classrooms PostgreSQL **6/6** and class routines **8/8 PASS**. The routine preservation helper needed one maintenance fix: order aggregate rows by their full JSON text instead of assuming every subsequently added table has an `id` column. Preservation assertions were retained, and the suite passes with all current application tables included.

Final READ ONLY [preservation reconciliation](../../../lms/lms-backend/docs/FINANCE_PRESERVATION.json): all **70 original application tables**, all **28 prior history rows** unchanged against the fresh approved application baseline; all 12 finance tables empty after fixture rollback. Later genuine application activity must be retained and compared against a fresh future baseline.

Root-module HTTP probe **PASS** across **83 public tables**, all row hashes unchanged. Finance and examination reads return **200**. Prepared Online/Campus reads return **503**. No automatic migration, authentication token rotation or seeding during the probe.

## Limits and continuation

The accepted [finance policy limits](./FINANCE_MIGRATION_REVIEW.md) still apply: two decimal places; explicit owner currency/timezone configuration; Admin-recorded bank/cash transactions; net payroll accrual; no payment-provider execution, opening/carry-forward import, statutory remittance accounting, bank overdraft policy or financial reversals yet. Those workflows are not marked complete.

Work continued into online examination delivery/attempts, front office/admissions and dormitory operations, preparing a separate 17-table migration and 15 route integrations. Eight other legacy Academic/HR routes now reuse approved implementations. No future migration has been applied. See the current [Integration Progress](./INTEGRATION_PROGRESS.md) and [route readiness ledger](./ADMIN_ROUTE_READINESS.md).
