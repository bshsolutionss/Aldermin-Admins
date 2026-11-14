# Class Routines approval preflight — 2026-11-12

**Overall: PASS for pre-application review. Migration NOT applied.**

| Check | Result | Evidence |
|---|---|---|
| Exact UP/DOWN SQL | PASS | Complete SQL documents match source-generated statements, transaction wrappers, 5-second lock timeout and migration-history statements. Fresh compiled migration also matches source. |
| Database compatibility | PASS | Live PostgreSQL 18.6; public schema; UUID generator and integer-range function available; btree_gist 1.8 available, trusted and not installed. Required database/schema and parent-table ownership privileges verified. |
| Existing schema/data | PASS | Exactly 14 migrations, latest Classroom; proposed table/index/constraint names absent. Referenced columns are UUIDs; all four parent tables have id primary keys; no duplicate proposed reference keys. Snapshot covers all 17 public tables, including migration history (16 application tables). Two existing assignments are legacy rows; no changes or invented mappings required. No competing parent-table locks observed at inspection time. |
| UP safety | PASS — code review | No application-row insert/update/delete/backfill. Adds extension, three UNIQUE constraints, empty routine table, restrictive composite foreign keys, day/time checks and three overlap exclusions. Approved application helper uses one transaction, aborts on unexpected migration state or changed application-row snapshots, and rolls back on failure. |
| DOWN protection | PASS — code review | Exclusive table lock precedes nonempty-table refusal. Drops only the new table and three named constraints; no CASCADE. Unexpected dependencies fail the transaction. Exact migration-history row removed; shared btree_gist intentionally retained. |
| Build and offline tests | PASS | Fresh backend build; routine unit/HTTP suite 6/6. |
| Live migration/rollback and PostgreSQL routine acceptance | NOT RUN | Awaiting explicit approval. No migration statements, including rolled-back DDL, executed during this preflight. |

SQL reviewed: [UP](../../../lms/lms-backend/docs/CLASS_ROUTINES_UP.sql), [DOWN](../../../lms/lms-backend/docs/CLASS_ROUTINES_DOWN.sql). Approval scope and rollback caveats: [migration review](./CLASS_ROUTINES_MIGRATION_REVIEW.md).

SHA-256 of the reviewed file bytes:

- UP: `9a658ca3f28353588dfbe939100c6b72727f844228e9c8ac3ed90233ba78d6ab`
- DOWN: `fe981613a117d5d315c00ca1f5ba17170b18945cccde351960c276bc0c45715a`

Reproduce after building the backend: `node test/preflight-class-routines.mjs` in the backend repository. The script enforces a repeatable-read READ ONLY transaction and prints only metadata, counts and hashes, never credentials or row contents. Source/compiled migration methods run against a statement collector, never the database.

Limits: this is a read-only prerequisite check and source review, not proof of executed DDL or live rollback. Brief exclusive locks are needed for parent constraints; lock contention can change after inspection, and the approved application must abort on lock timeout. The retained extension means DOWN is intentionally not a complete extension-level reversal. Runtime PostgreSQL acceptance remains required after approval. PostgreSQL documents the relevant [GiST types and trusted-extension installation](https://www.postgresql.org/docs/18/btree-gist.html) and [constraint behavior](https://www.postgresql.org/docs/18/ddl-constraints.html).

Existing uncommitted source changes were preserved. Added only this report and the backend read-only preflight script; the backend build refreshed generated output. After explicit routine approval: rerun preflight, apply only the reviewed migration using the guarded helper, run PostgreSQL acceptance, then continue roadmap dependencies automatically. Any later database migration still requires its own exact SQL review and approval.
