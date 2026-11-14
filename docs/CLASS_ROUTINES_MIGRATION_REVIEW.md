# Class routines: migration approval review

Status: APPLIED after explicit owner approval on 2026-11-12. Class Routines PostgreSQL acceptance: 8/8 PASS. See [application verification](./CLASS_ROUTINES_VERIFICATION.md). The review below records the originally approved scope; its pre-application statements are historical.

## Implementation

Both existing pages, `/admin/academics/routine` and `/admin/academic/class-routine`, use one admin-only API and shared state logic. Existing layout, navigation and styling remain. Forms use real academic years, reconciled subject allocations, assigned HR teachers and classrooms. Hard-coded sample routines and browser-only create/edit/delete are removed. Teacher selection follows the subject allocation; clients cannot submit invented class/staff/year resource keys.

API: list/filter, options by academic year, read by UUID, create, partial update and delete. DTOs validate UUIDs, day 1-7, exact HH:mm times, unknown fields and nulls. End time must exceed start time on the same day. Overlaps return 409 and preserve form inputs. Both builds and the focused frontend/backend tests pass. PostgreSQL routine acceptance is prepared but has NOT run because migration approval is pending.

## Exact SQL

- [UP SQL](../../../lms/lms-backend/docs/CLASS_ROUTINES_UP.sql)
- [DOWN SQL](../../../lms/lms-backend/docs/CLASS_ROUTINES_DOWN.sql)
- [Migration source](../../../lms/lms-backend/src/database/migrations/1794430200000-CreateClassRoutines.ts)

## Objects and existing data

This migration is broader than the classroom migration. It does all of the following, requiring explicit approval:

1. Enables the available PostgreSQL `btree_gist` extension if not installed. Current read-only inspection confirms it is available but not installed. No extension was enabled during implementation.
2. Adds three UNIQUE constraints to existing tables: `school_subject_assignments(id,class_section_id,staff_id)`, `class_sections(id,class_id)`, and `classes(id,academic_year_id)`. Each includes its table's existing primary key, so existing rows already satisfy uniqueness. These add schema/index metadata without updating row values.
3. Creates a new, initially empty `class_routines` table, its indexes, time/day checks and restrictive composite foreign keys. The resource-key columns are derived from the allocation; composite FKs prevent them drifting from the actual allocation, class section and academic year.
4. Creates three GiST exclusion constraints. Within the same academic year and weekday, overlapping time ranges cannot share a class-section, teacher or classroom, including concurrent direct SQL writes. Adjacent slots are permitted because ranges exclude their ending boundary. Different academic years have separate weekly schedules.
5. Adds exactly one migration-history record. No seeds, backfills, updates or deletions of school records.

Existing foreign keys and checks are retained. Once routines exist, changing a scheduled allocation's teacher/class-section, a referenced class-section's class, or a referenced class's academic year is restricted until its routines are explicitly adjusted/removed. API error handling reports these restrictions as conflicts. This prevents silent schedule drift. No duplicate tables are created for legacy pages.

## Rollback strategy

DOWN locks the routine table and refuses to proceed if any routine rows exist. With an empty table, it removes that new table/indexes and the three specifically named UNIQUE constraints introduced by UP, then removes only this migration's tracking record. It uses no CASCADE. Unexpected later dependencies cause the transaction to fail instead of being deleted.

The `btree_gist` extension is deliberately retained on rollback because it may be shared by other features. DOWN therefore restores the prior school-table structure but does not uninstall this additive extension. If routines exist, keep the schema and use a compatible application rollback or a separately reviewed forward fix; never delete records just to force rollback.

## Approval and verification gate

The prepared application script requires explicit routine approval, verifies exactly 14 prior migrations, checks table/constraint names and extension availability, and compares SHA-256 snapshots of every existing application table before committing. All statements run in one transaction with a 5-second lock timeout. It has not been invoked.

Backend offline/HTTP routine suite: 6/6 PASS. Frontend routine suite: 7/7 PASS. Backend and frontend builds pass; focused lint has no new warnings/errors. The pending PostgreSQL suite covers real CRUD/restart persistence, independent class/teacher/room conflicts, adjacent slots, year scoping, concurrent inserts, direct exclusion/FK enforcement, parent edit/delete restrictions, inactive/legacy options, validation, and preservation of all pre-existing application data.

After explicit approval: apply only this migration, run backend `npm.cmd run test:class-routines`, verify data preservation, then continue the roadmap automatically. Approval does not cover any later migration. Student/Instructor dashboards remain outside scope.
