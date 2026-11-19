# Library/Inventory application and acceptance

Verified 2026-11-15 against PostgreSQL 18.6, database `lms_db`, schema `public`.

## Actual history and approved application

The first inspection used `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY` and queried `public.migrations`, public relations and trigger functions. There were 23 history entries. Neither requested migration, none of the nine operations tables, and neither trigger function existed. This was direct database evidence, not a conclusion from the progress log.

The owner confirmed prior approval of the revised batch. Before any database write, both unapplied statuses and the exact reviewed hashes were reported in the conversation. Source, compiled statements and reviewed SQL matched; the guarded read-only preflight passed. Only the approved named batch was applied, in order:

| History ID | Timestamp | Name |
|---|---|---|
| 24 | 1794673000000 | CreateLibraryOperations1794673000000 |
| 25 | 1794673100000 | CreateInventoryOperations1794673100000 |

- UP SHA-256: `6a67df564a448cb3524eb6aeffe9f0e6748f3477f2b6498f17c90f35ca67bcc5`.
- DOWN SHA-256: `8334fdee5e90d91250713e9615ef12a5c5121bebe1b51a5093c596c4da007119`.
- No generic migration runner, schema synchronization, seeding or rollback was executed.
- Before COMMIT, full-row count/SHA comparisons matched across all 40 existing application tables. All 23 prior migration rows were unchanged. The nine new tables were empty.
- Preserved baseline: 7 users, 86 refresh tokens, both original subject allocations, and all other existing records.
- Guarded application evidence: [JSON](../../../lms/lms-backend/docs/LIBRARY_INVENTORY_APPLICATION.json).

## Acceptance and service correction

The PostgreSQL operations suite passed **8/8**, covering catalog/owner relationships, restricted actors, retry-safe loans and stock requests, capacity, versioned returns, receipts/issues/partial returns/sales, chronology, immutable ledger/loan history, archives, audit-failure rollback and whole-public-table preservation after fixture rollback.

The first run passed seven scenarios and exposed raw UPDATE result handling during archive. TypeORM returns `[rows, count]` for that operation. The service now selects the returned ID through a CTE, producing the row shape used by inserts and audits. The existing archive acceptance scenario failed before this fix and passed afterward. Approved migration SQL was unchanged.

Root-module startup passed. Live trigger bodies, language and pinned search path match the approved compiled definitions. Authenticated Library/Inventory book/member/item/movement/stock reads return 200. The academic-work APIs return 503 because their separate migration remains unapplied. Every public-table count/hash matched the probe's fresh before/after baseline. [Probe evidence](../../../lms/lms-backend/docs/OPERATIONS_ACADEMIC_STARTUP.json).

Broader checks in this continuation:

- PostgreSQL operations/content/student-and-attendance regressions: **27/27 PASS** (8 + 8 + 11); rollback-only fixtures and preservation comparisons passed.
- Backend offline/HTTP suites: **111/111 PASS**; backend Vitest: **22/22 PASS**.
- Frontend regressions: **145/145 PASS**, including operations 6/6 and academic work 6/6.
- Both production builds PASS. Backend repository-wide lint and focused frontend/source/audit-script lint PASS. Final frontend TypeScript check PASS.

These runs establish the listed acceptance scenarios. A separate multi-connection contention suite and a live DOWN execution were not run. Financial posting, library fines/reservations/copy serials and inventory purchase/transfer documents remain open scope.

## Subsequent authentication activity

After the approved COMMIT, the refresh-token count became 87. Read-only inspection isolated one newly created token and one older token's later revocation. Removing the new row and restoring only that revocation **in memory** reproduces the original 86-row SHA exactly. All 39 other prior application tables still match the application baseline. The activity's initiator was not established. Both token changes were retained; no corrective database action occurred.

## Continuation

Homework, evaluations, lessons, topics and dated plans are prepared across nine existing routes. Their separate [academic-work migration review](./ACADEMIC_WORK_MIGRATION_REVIEW.md) is the next schema gate. The full Admin backend remains unfinished. Continue the original roadmap after that checkpoint; later migrations require separate approval.
