# Finance route checklist

2026-11-16. Finance migration **APPLIED**, history ID 29; finance PostgreSQL domain/HTTP/concurrency acceptance **11/11 PASS**. These 29 routes are connected to the applied schema. The migration gate is cleared. Full route functionality still depends on stated policy limits, owner configuration and route-specific verification. [Current application evidence](./FINANCE_APPLICATION_VERIFICATION.md).

| Integration | Existing route | Prepared workflow |
|---|---|---|
| [x] applied | `/admin/fees/group` | Fee groups; versioned edit/archive |
| [x] applied | `/admin/fees/type` | Fee amounts; real group choices; versioned edit/archive |
| [x] applied | `/admin/fees/invoice` | Issue invoice, snapshots, partial bank/wallet payment |
| [x] applied | `/admin/fee/group` | Same fee-group service, legacy alias |
| [x] applied | `/admin/fee/type` | Same fee-type service, legacy alias |
| [x] applied | `/admin/fee/invoice-report` | Read persisted invoices/payments, legacy alias |
| [x] applied | `/admin/accounts/accounts/chartofaccount` | Chart of accounts, immutable classification/code |
| [x] applied | `/admin/accounts/accounts/bankaccount` | Filter/create bank and cash accounts |
| [x] applied | `/admin/accounts/accounts/income` | Record bank/cash income journal |
| [x] applied | `/admin/accounts/accounts/expence` | Record expense journal |
| [x] applied | `/admin/accounts/accounts/fundtransfer` | Record two-account bank/cash transfer |
| [x] applied | `/admin/accounts/accounts/profitandlost` | Posted income/expense movements |
| [x] applied | `/admin/hr/payroll` | Generate net payroll; record salary payment |
| [x] applied | `/admin/human-resource/payroll` | Same payroll service, legacy alias |
| [x] applied | `/admin/accounts/wallet/pendingdeposit` | Record/review deposit request |
| [x] applied | `/admin/accounts/wallet/approveddeposit` | Persisted approved deposits |
| [x] applied | `/admin/accounts/wallet/rejectdeposit` | Persisted rejected deposits |
| [x] applied | `/admin/accounts/wallet/refundrequest` | Create/review refund request; balance guard |
| [x] applied | `/admin/accounts/wallet/wallettransaction` | Immutable student wallet movements |
| [x] applied | `/admin/reports/feesreports/payment-report` | Payment records and date filters |
| [x] applied | `/admin/reports/feesreports/fees-due-report` | Current unpaid invoices |
| [x] applied | `/admin/reports/feesreports/balance-report` | Current unpaid invoice balances |
| [x] applied | `/admin/reports/feesreports/waiver-report` | Persisted invoice waiver snapshots |
| [x] applied | `/admin/reports/feesreports/fine-report` | Persisted invoice fine snapshots |
| [x] applied | `/admin/reports/accountsreports/transaction` | Immutable journals and posted amounts |
| [x] applied | `/admin/reports/accountsreports/wallet-report` | Student wallet balances/date-scoped movement |
| [x] applied | `/admin/reports/accountsreports/payroll-report` | Persisted payroll report |
| [x] applied | `/admin/reports/staffreports/payroll-report` | Same payroll report |
| [x] applied | `/admin/settings/fees-settings/fees-invoice-settings` | Explicit currency and optimistic version |

- [x] Explicit migration approval, preserved-data application, live PostgreSQL acceptance/concurrency 11/11 and affected regressions 52/52.
- [ ] Financial corrections/reversals, opening/carry-forward import, recurring/bulk billing, external payment providers/reconciliation and configurable payroll deductions.
- [ ] `/admin/fee/carry-forward`, `/admin/fees/carry-forward`, fees/payroll bulk printing remain incomplete.
- [ ] Online examinations/question bank/attempts/results; front-office/admissions; dormitory; certificates/IDs; bulk templates; external communications; remaining settings/reports and all incomplete earlier-domain sub-workflows.

The [full static route inventory](./ADMIN_ROUTE_AUDIT.md) separately records import/API evidence and incomplete routes. Static API connectivity does not establish workflow completeness.
