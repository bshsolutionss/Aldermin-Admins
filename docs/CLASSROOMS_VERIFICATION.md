# Classroom migration: PostgreSQL verification

Date: 2026-11-12. Explicit owner approval received before application.

## Result: PASS

- Applied only `CreateClassrooms1794430100000` in a transaction after verifying the compiled UP/DOWN statements match the reviewed SQL.
- Preflight confirmed 13 prior migrations and no classroom table. Migration count is now 14; the new table starts empty.
- Every pre-existing application row across all 15 application tables compared equal before commit. No existing table values, assignments, class sections, staff, users or LMS courses were modified by the migration.
- Both original Subject Assignment records remain unchanged; the classroom database suite also compares existing assignment, staff and class-section row hashes after its fixture cleanup.

## Database tests: PASS

Classrooms: 6/6 integration cases passed: verified admin authorization, real CRUD, PostgreSQL persistence and application restart, case-insensitive uniqueness, simultaneous duplicate requests, validation, direct database constraints and persisted deletion.

Subject Assignment regression: 5/5 passed after the classroom migration. Test cleanup deletes only UUIDs created by each test suite, followed by an existing-data comparison. No reset, backfill or deletion of existing records occurred.

The classroom rollback was not executed. It remains protected by a table lock and an empty-table requirement.

## Next module

Class routine implementation is prepared, including real APIs and both existing frontend routes. Its migration remains unapplied and requires separate approval for the routine table, three composite reference constraints and the `btree_gist` extension. See [routine review](./CLASS_ROUTINES_MIGRATION_REVIEW.md).
