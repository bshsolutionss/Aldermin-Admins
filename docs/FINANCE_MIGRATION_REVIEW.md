# Finance Operations: separate migration approval

Prepared and explicitly approved/applied 2026-11-16, history ID **29**. [Application/preservation and live acceptance](./FINANCE_APPLICATION_VERIFICATION.md). The review below retains original pre-application evidence and the exact approved hashes. **Do not reapply.**

Only proposed migration in this batch: `CreateFinanceOperations1794753000000`. This groups fees, receivables/payments, accounting, payroll, wallet and their financial reports under one consistent ledger.

- Exact [UP SQL](../../../lms/lms-backend/docs/FINANCE_UP.sql), SHA-256 `8fbf170f369b3e1c847a2b84a360985b45292a4217fe289cf527e33a9737e4dc`.
- Exact [DOWN SQL](../../../lms/lms-backend/docs/FINANCE_DOWN.sql), SHA-256 `8310a94f7805157e9981706cead7410acbe748c1a436dca7047f8dcde733b07b`.
- [READ ONLY preflight evidence](../../../lms/lms-backend/docs/FINANCE_PREFLIGHT.json). [Helper](../../../lms/lms-backend/test/finance-migration.mjs) has SQL emission and read-only modes only; no apply mode.

## Safety and verification

| Check | Result and scope |
|---|---|
| Source/compiled/reviewed SQL and hashes | **PASS**, exact parity and pinned hashes. |
| Existing data | **PASS, design review:** creates 12 new tables, indexes, four trigger functions and associated triggers. No existing-table alterations, existing-row updates/deletes, extension installation, settings defaults, demo records or seeds. Future UP also inserts only its own history entry. |
| Preconditions | **PASS, READ ONLY PostgreSQL 18.6:** 28 migrations, 70 existing application tables; required parent REFERENCES/CREATE privileges, UUID and transaction-ID functions, no relation/function collisions and no RLS hiding baseline rows. |
| Accounting integrity | **PASS, design/offline:** positive bounded integer minor units, different debit/credit accounts, deferred balance checks requiring at least two balanced lines; immutable journals, lines, invoices, payments, wallet movements and audit events. Cannot append lines to a journal from an earlier transaction. New trigger functions/DDL have **not** run. |
| Receipts and wallet | **PASS, offline service checks:** exact retry terms, invoice lock and overpayment guard; actual student IDs; wallet balances from signed movements; no service-level overdrafts or backdated wallet postings; pending to approved/rejected only, next-version checks, immutable terms, one journal per request. Some ownership/chronology/balance rules are service-enforced. |
| Payroll | **PASS, design/offline:** active staff, unique staff/period, explicit gross/deduction and positive net, net accrual journal and one recorded salary payment, immutable principal terms, generated to paid only. |
| Authorization and validation | **PASS:** real JWT/role HTTP guards, strict DTOs, verified enabled unrestricted Admin, shared authorization/write lock, request-derived actor, bound SQL values, allowlisted same-origin cookie-session proxy. |
| Rollback | **PASS, design:** lock all 12 tables, refuse DOWN if any row or audit history exists, children first without CASCADE. DOWN has not been run. A populated ledger requires a forward correction. |
| Backend offline/HTTP | **11/11 PASS**, plus complete offline/HTTP **148/148** and Vitest **22/22**. |
| Frontend | **6/6 finance tests PASS**; complete frontend **165/165**. Production build and TypeScript pass. Existing page headers/cards/buttons and Admin navigation shell are reused. |
| Root application | **PASS:** real root-module startup, examinations 200, finance 503 gates; all **71 public-table row hashes unchanged**. No automatic schema changes. |
| Finance PostgreSQL persistence | **PENDING approval/application.** Ten-scenario [acceptance suite](../../../lms/lms-backend/test/finance.e2e.mjs) is prepared and syntax-checked, **NOT RUN**. It refuses absent migration or populated finance tables; fixtures roll back and all public tables are hashed before/after. |

## Prepared functionality and policy limits

Twelve tables: finance settings, fee groups/types, chart/bank accounts, immutable journal headers/lines, invoices, payments, payroll, wallet requests/movements and actor events. TypeORM entity schemas are registered with synchronization disabled. NestJS services/controllers/DTOs and Next cookie-session proxy/client connect **29 existing routes**, including legacy fee aliases; see the [route checklist](./FINANCE_ROUTE_CHECKLIST.md).

Owner must explicitly configure currency and school timezone. Amounts use **two decimal places**; this batch does not infer currency, opening balances, taxes, fees, staff salaries or bank accounts. Fee amount, waiver and fine are snapshotted at issue; net invoice is posted to receivable/income accounts. Partial bank/cash or wallet payments reduce outstanding dues. Invoices, receipts and journal terms cannot be edited after posting. Catalog changes retain history.

Bank/cash receipts, transfers, salary payments, wallet deposits and refunds are **Admin-recorded transactions**, not external bank/payment-provider execution. Wallet approval requires an Admin decision/reason; no student self-service deposit integration is claimed. Payroll posts the **net** amount after the explicit deduction; statutory tax/remittance accounting, benefits and gross/deduction liability splitting are not implemented.

Reports provide paginated trial-balance/profit-loss account movements, current outstanding dues, payments/payroll and wallet balances. Date-filtered wallet reports explicitly show net movement in that interval; dues show current unpaid amounts on invoices issued in the selected interval. Amounts are scoped to the displayed records; no fabricated school-wide totals. Print is the **current displayed page**, not a completed bulk-template printing workflow.

Outstanding work includes financial reversals/credit notes, payment-provider reconciliation, historical opening/carry-forward imports, recurring/bulk invoice generation and configurable payroll policies. Those are not marked complete. Online exams/attempts, front office, dormitory, certificates/ID cards, bulk printing, external communication, other settings/reports and earlier-domain gaps remain on the full roadmap.

Bank/cash account balances are ledger-derived; a configurable overdraft/cash-availability policy is not implemented. Wallet spending/refunds do enforce available student balances. Application-source frontend lint errors are cleared without changing rules; repository-wide lint still includes inherited CommonJS test/script import errors, which are not production-source errors.

## After separate approval

Recheck exact source/compiled/reviewed SQL and hashes, live history/prerequisites and absent proposed objects. Capture a **fresh baseline of all 70 existing application tables and all 28 prior history entries** under locks. Apply only this reviewed migration, compare full-row counts/hashes and prior history **before COMMIT**, require all 12 new tables empty, then verify post-COMMIT preservation. Abort before applying on mismatch/failed check. Run live finance acceptance and affected regressions, then automatically continue Online Examinations and Front Office in larger batches. Every later migration still needs explicit approval.
