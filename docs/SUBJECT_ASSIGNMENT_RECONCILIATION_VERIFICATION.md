# Subject Assignment reconciliation: PostgreSQL verification

Date: 2026-11-12. Explicit owner approval received in this conversation before application.

## Result: PASS

- Applied only `ReconcileSubjectAssignments1794430000000` through the guarded application script in one transaction.
- Migration SQL was checked against the reviewed UP/DOWN files before database access.
- Preflight confirmed 12 existing migrations and no reconciliation columns. Post-application migration count is 13.
- Before/after comparison of all 15 application tables passed before commit. The comparison retains every existing assignment field and excludes only the two newly added null columns.
- Both original assignment records remain unchanged: 2 existing legacy rows, with null class-section/staff references. No remapping or backfill.
- New restrictive foreign keys, shape check and unique subject/class-section index are present.
- No existing school records were deleted or changed. Integration-test cleanup was restricted to identified fixture UUIDs.

## Database integration results

| Suite | Result |
|---|---|
| Subject Assignment reconciliation | 5/5 PASS |
| School Subjects | 6/6 PASS |
| Classes and class-section relationships | 5/5 PASS |
| HR departments/designations/staff | 6/6 PASS |
| Class Teacher allocations | 8/8 PASS |

30 distinct PostgreSQL integration cases passed. Subject Assignment tests also passed again after adding the prepared classroom module to application metadata. Coverage includes committed CRUD and restart persistence, database-verified roles, DTO errors, duplicate protection, active staff options, legacy visibility/nonconversion, foreign-key restrictions, and preservation of existing assignments/courses.

The Subject Assignment rollback was NOT executed. It remains a guarded recovery procedure that refuses to discard modern allocations.

## Next dependency

Classroom code, API proxies, shared frontend state and both existing classroom routes are prepared. The classroom migration is NOT applied. Its separate approval is required before PostgreSQL acceptance. Routines will reference these classrooms and the reconciled subject allocations; no duplicate room/allocation system is planned for legacy routes.
