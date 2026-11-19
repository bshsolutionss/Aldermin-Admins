# Library and Inventory: approved migration review

**Applied 2026-11-15 using the owner's confirmed prior approval of the revised batch.** Actual PostgreSQL history IDs are 24 (`CreateLibraryOperations1794673000000`) and 25 (`CreateInventoryOperations1794673100000`). Do not rerun either migration. PostgreSQL operations acceptance passed 8/8; see [application, preservation and verification](./LIBRARY_INVENTORY_APPLICATION_VERIFICATION.md).

The review below is the original preparation evidence from 2026-11-14. Its references to pending application/testing describe that historical checkpoint. The reviewed UP/DOWN SQL and hashes remain unchanged. The current next approval gate is [academic work](./ACADEMIC_WORK_MIGRATION_REVIEW.md).

## Original revised review (historical)

Exact order:

1. `CreateLibraryOperations1794673000000`
2. `CreateInventoryOperations1794673100000`

Exact [UP SQL](../../../lms/lms-backend/docs/LIBRARY_INVENTORY_UP.sql) and reverse-order [DOWN SQL](../../../lms/lms-backend/docs/LIBRARY_INVENTORY_DOWN.sql) use one transaction with 5-second lock and 30-second statement timeouts. Source/compiled/review SQL parity PASS. **Revised UP SHA-256:** `6a67df564a448cb3524eb6aeffe9f0e6748f3477f2b6498f17c90f35ca67bcc5`; unchanged DOWN: `8334fdee5e90d91250713e9615ef12a5c5121bebe1b51a5093c596c4da007119`.

Final-review correction: the earlier UP hash `ac4d7905eed0a4fcec59d15d487b1848be3b236019d73314458fc47d2b579447` **failed review and is superseded**. Both trigger-function opening delimiters were a single `$` instead of `$$`. The two unapplied source definitions and emitted UP SQL are corrected. A new regression test failed against the old SQL and passes against the corrected SQL; the migration helper now refuses malformed/unbalanced function delimiters before generation or application. No schema was applied during discovery or repair. Approval must refer to this revised SQL.

| Safety check | Result and precise scope |
|---|---|
| Existing data | PASS, static review. Creates nine new tables, their indexes, two trigger functions and three triggers attached only to new tables. No existing-table alteration, existing-record update/delete, seeding, extension creation or automatic backfill. Only the two new migration-history entries are inserted. |
| Foreign keys | PASS, reviewed. Restrictive user/student/staff/catalog/book/member/source-issue references. Composite catalog-kind FKs prevent category/store/supplier/subject substitution. Exactly one student/staff library-member owner and issue recipient. |
| Unique constraints | PASS, reviewed. Case-insensitive catalog names and book/item/member codes, unique member-owner indexes, retry request UUIDs, and per-resource audit versions. |
| Capacity/stock integrity | PASS, offline/static only. Loan trigger locks book rows, prevents over-issuing, prevents lowering copies below outstanding loans, retains returned loan history and immutable issue terms. Stock trigger locks items, prevents negative stock, freezes ledger records, prevents backdating before latest movement, and caps returns at the original issue's unreturned quantity with matching item/store/date. Trigger functions pin search_path. Live concurrent/trigger execution is NOT verified until approval. |
| Rollback | PASS, reviewed guards. Reverse order takes exclusive locks and refuses any library/inventory records or audit history. Empty-only DROP order removes dependent tables before parents/functions. No CASCADE. Populated systems require a forward fix. DOWN has not been executed. |
| PostgreSQL compatibility | PASS for revised static review and READ ONLY prerequisite checks. PostgreSQL 18.6, UUID function/types, parent PKs, schema/REFERENCES/PLpgSQL privileges and relation/constraint/function name availability. Function dollar-quote regression and source parity verified. DDL/trigger/rollback execution and live concurrency remain pending approval; this is not a live persistence PASS. |
| Access | PASS, offline contracts. Every API requires verified enabled unrestricted admins; cookie proxy enforces same-origin mutations and allowlisted actions. DTOs reject injected identities, invalid UUIDs, versions, dates, fractional/unbounded quantities and unknown properties. School-timezone configuration is required for dated operations. |

[Default-read-only helper](../../../lms/lms-backend/test/library-inventory-migration.mjs) and [preflight evidence](../../../lms/lms-backend/docs/LIBRARY_INVENTORY_PREFLIGHT.json): **23 current migrations, 40 application tables**, next schema absent. After approval, the apply helper captures a fresh baseline and refuses COMMIT unless every pre-existing table's full-row count/SHA and all 23 prior migration-history rows remain unchanged; all nine new tables must be empty.

Prepared functionality: library categories/subjects/books and availability; real student/staff membership; retry-safe one-copy loans, overdue filtering, versioned returns; inventory categories/stores/suppliers/items; retry-safe receipts, student/staff issues, partial returns and physical sales; stock by store; archive/restore of master data; actor audit history. Fifteen existing pages use the new APIs with the existing design components, pagination/search, failed-draft retention and retry states. The APIs return 503 while schema remains unapproved.

Current final-review verification: revised backend build, repository-wide lint and new backend **10/10 PASS**, including the added function-quoting regression; read-only PostgreSQL preflight PASS. Earlier broader checks remain historical: new frontend **6/6 PASS**, full frontend **139/139 PASS**, backend Vitest **22/22 PASS**, related offline backend **94/94 PASS**, both production builds and lint PASS. The [eight-scenario PostgreSQL suite](../../../lms/lms-backend/test/school-operations.e2e.mjs) is syntax-checked but **NOT RUN**; it never applies migrations and rolls back all fixtures with whole-database preservation checks.

Scope limits remain explicit: no monetary ledger posting, invoice/refund processing, library fines, reservation engine, barcode/copy serial tracking, multi-item purchase documents or inter-store transfer documents are claimed. Inventory quantities are whole physical units; a sale requires its external reference and records stock only. Those workflows and the remaining master roadmap stay open until implemented and verified.

After approval: apply only these two in order with pre-commit preservation checks, run PostgreSQL acceptance, address any failures, rerun regressions/builds, then continue remaining Admin features in larger batches. Every later migration needs its own approval.
