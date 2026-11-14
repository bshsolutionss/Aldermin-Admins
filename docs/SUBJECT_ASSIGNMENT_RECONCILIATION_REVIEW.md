# Subject Assignment reconciliation: approval review

Status: APPLIED on 2026-11-12 after explicit owner approval. Existing records preserved and PostgreSQL tests passed; see [verification](./SUBJECT_ASSIGNMENT_RECONCILIATION_VERIFICATION.md). The review below records the approved SQL and recovery strategy.

## Exact SQL

- [UP SQL](../../../lms/lms-backend/docs/SUBJECT_ASSIGNMENT_RECONCILIATION_UP.sql)
- [DOWN SQL](../../../lms/lms-backend/docs/SUBJECT_ASSIGNMENT_RECONCILIATION_DOWN.sql)
- [Migration source](../../../lms/lms-backend/src/database/migrations/1794430000000-ReconcileSubjectAssignments.ts)

These links are relative to the frontend docs directory; backend absolute location: `C:/Users/USAID JAVED/Documents/lms/lms-backend`. The SQL files were generated from the compiled migration; they include transaction boundaries, a 5-second lock timeout and the exact migration-history insert/delete. No SQL was executed during generation.

## Objects and existing rows

Only `school_subject_assignments` changes: add nullable `class_section_id` and `staff_id`, relax legacy column nullability, add restrictive foreign keys, mutually exclusive shape check, one subject per class-section unique partial index and staff lookup index. The migration also records its name/timestamp in the existing migrations table.

All existing assignment values remain unchanged. Both legacy rows retain their user and free-text section. No automatic mapping or data backfill. Existing FKs, uniqueness and legacy text check stay in place. No duplicate table and no change to LMS courses.

New allocations reference an existing school subject, class-section and active HR staff member. The academic year is derived through class-section -> class. Reads preserve admin/instructor permissions; writes are admin-only. New legacy-shaped POSTs are rejected. PATCH supports modern rows; legacy PATCH is refused with 409. Existing legacy rows remain visible and deletable through the existing API.

Both `/admin/academics/assign-subject` and `/admin/academic/assign-subject` use the same API and database table, keeping their existing layouts. The old legacy page's demo rows and invented teacher/section choices are removed.

## Rollback and release order

1. Apply UP only after explicit approval, in one transaction. A lock timeout or failed preflight aborts the transaction. Compare existing-row snapshots before commit.
2. Only then release/start the matching application and run PostgreSQL acceptance tests. The prepared code depends on the added columns and must not be deployed against the old schema.
3. Before any new allocations exist, DOWN can restore the prior schema transactionally. It locks the table and checks every row before dropping indexes/columns. Original data and migrations remain unchanged except removal of this migration's history entry.
4. Once modern rows exist, DOWN raises an exception and rolls back completely. Do not delete those allocations or fabricate legacy mappings to force rollback. Keep the additive schema and use an application rollback compatible with it, or approve a separate forward fix. The original application can read legacy rows through its joins; modern rows require the reconciled application to manage them.
5. DOWN is a reviewed recovery strategy, not authorization to execute rollback automatically.

## Evidence

Production builds pass for both repositories. Backend offline reconciliation tests pass 10/10; frontend allocation tests pass 8/8; existing frontend regressions pass 73/73; backend authentication tests pass 15/15. PostgreSQL integration tests subsequently passed 5/5; related PostgreSQL suites passed 25/25. Original records remain unchanged.

Approved execution and regression checks are complete. Classroom preparation is the next slice; any classroom or later migration requires separate explicit approval.

