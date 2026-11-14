# Subject Allocation Reconciliation - proposal awaiting approval

Status: proposed. No migration has been authored or applied. Existing rows must
not be deleted, reset, or backfilled with invented values. Approval is required
before the schema change below is implemented.

This is the next slice of the roadmap item "Teacher allocations, subject
allocations, rooms, and timetable (one at a time)." Class teacher allocations are
implemented and verified; subject allocations are currently wired to real APIs but
still use the legacy user-based shape.

## Scope

- Reconcile `school_subject_assignments` with class-section-aware allocations.
- Replace user-account teachers with HR `staff` for new allocations.
- Replace free-text `section` with `class_section_id` for new allocations.
- Preserve both existing rows exactly as they are.
- Cover the active page `/admin/academics/assign-subject`.
- Do not include classrooms or class routines.

## Inspection findings (read-only, 2026-11-11)

- Migration history is 12; `CreateSubjectAssignments1794355300000` is applied.
- `school_subject_assignments` columns: `id`, `subject_id`, `teacher_id`,
  `section` (varchar 100), `created_at`, `updated_at`.
- Current constraints:
  - `PK` on `id`.
  - `UQ_subject_assignment` unique on `(subject_id, teacher_id, section)`.
  - `CHK_assignment_section` requires trimmed, non-blank text.
  - `FK_assignment_subject` to `school_subjects(id) ON DELETE RESTRICT`.
  - `FK_assignment_teacher` to `users(id) ON DELETE RESTRICT`.
- Current rows: two assignments, both `section = 'B'`, both assigned to user
  `Lead Instructor` (`aa90fc47-...`), whose current role is `student`.
  The subjects are `eng` and `urdu`.
- There is one class (`class 1`), one section (`Aaab`), and one class-section
  (`7ab18cd7-...`) in the current academic year `2026`.
- HR `staff` currently has zero rows. Staff columns include `status`, with active
  staff filtered as `status = 'active'` in the verified class teacher module.
- The existing two rows cannot be mapped to the current class-section or to a
  staff member. Any automatic backfill would invent data, so it is excluded.
- The frontend page already persists create/delete through
  `/api/school-subject-assignments`; it offers only user instructors (currently
  none) and hard-coded section labels `A`-`D`. Edit remains a console placeholder.

## Recommended shape: evolve the existing table

Keep the table and the legacy columns, add class-section-aware columns, and let
both shapes coexist with an explicit check. This preserves existing rows without
pretending they belong to a class-section.

### Schema changes

| Change | Detail |
| --- | --- |
| Add `class_section_id` | uuid NULL; FK to `class_sections(id) ON DELETE RESTRICT` |
| Add `staff_id` | uuid NULL; FK to `staff(id) ON DELETE RESTRICT` |
| Make `teacher_id` nullable | legacy rows keep their user reference |
| Make `section` nullable | legacy rows keep their free-text section |
| Add shape check | exactly one shape: legacy (`teacher_id` + `section`) or new (`class_section_id` + `staff_id`) |
| Add partial unique index | `(subject_id, class_section_id)` where `class_section_id IS NOT NULL`; one teacher per subject per class-section |
| Add index | `staff_id` for staff lookups and FK checks |
| Keep existing constraints | `UQ_subject_assignment`, `CHK_assignment_section`, both legacy FKs |

Proposed SQL shape:

```sql
ALTER TABLE "school_subject_assignments"
  ADD COLUMN "class_section_id" uuid NULL,
  ADD COLUMN "staff_id" uuid NULL,
  ALTER COLUMN "teacher_id" DROP NOT NULL,
  ALTER COLUMN "section" DROP NOT NULL;

ALTER TABLE "school_subject_assignments"
  ADD CONSTRAINT "FK_assignment_class_section"
    FOREIGN KEY ("class_section_id") REFERENCES "class_sections"("id")
    ON DELETE RESTRICT,
  ADD CONSTRAINT "FK_assignment_staff"
    FOREIGN KEY ("staff_id") REFERENCES "staff"("id")
    ON DELETE RESTRICT,
  ADD CONSTRAINT "CHK_assignment_shape" CHECK (
    (
      "teacher_id" IS NOT NULL AND "section" IS NOT NULL AND
      "class_section_id" IS NULL AND "staff_id" IS NULL
    ) OR (
      "teacher_id" IS NULL AND "section" IS NULL AND
      "class_section_id" IS NOT NULL AND "staff_id" IS NOT NULL
    )
  );

CREATE UNIQUE INDEX "UQ_assignment_subject_class_section"
  ON "school_subject_assignments" ("subject_id", "class_section_id")
  WHERE "class_section_id" IS NOT NULL;
CREATE INDEX "IDX_assignment_staff"
  ON "school_subject_assignments" ("staff_id");
```

Notes:

- The legacy unique constraint remains valid because PostgreSQL allows multiple
  NULLs in a unique constraint. New rows have NULL `teacher_id` and `section`.
- New rows cannot omit subject, class-section, or staff: the check constraint and
  API validation both enforce the complete pair.
- `CHK_assignment_section` still applies only to non-null legacy values.
- No existing row is updated. The two `section = 'B'` rows remain visible and
  deletable, but are marked legacy by the API response.
- The academic year is derived through `class_sections -> classes`; no duplicated
  academic year column.

### Alternatives considered

- Replace `teacher_id` with `staff_id` in place: rejected because the two
  existing user references have no matching staff row and making the FK change
  would violate existing data or force deletion.
- New separate allocation table: clean, but splits the module and hides the
  existing assignments. Evolving the existing table keeps one source of truth
  and satisfies "preserve existing records".
- Backfill class-section from section text: rejected. Legacy `B` does not match
  the only section (`Aaab`), and no staff exists.

## API and permissions

Keep the existing admin/instructor read and admin-only write permissions.

| API | Access | Behavior |
| --- | --- | --- |
| GET /api/v1/school-subject-assignments | admin, instructor | Returns legacy and class-section-aware rows with a `legacy` flag |
| GET /api/v1/school-subject-assignments/options?academicYearId=uuid | admin, instructor | Current-year class-sections, subjects, and active staff |
| POST /api/v1/school-subject-assignments | admin | New body: `{ subjectId, classSectionId, staffId }`; legacy body rejected |
| DELETE /api/v1/school-subject-assignments/:id | admin | Deletes either shape |

- Do not add PATCH in this slice; the page has no working edit flow. Legacy rows
  are read-only except for deletion.
- Create validates existing subject, existing class-section, and an active staff
  member. Duplicate subject/class-section maps to 409.
- Response rows for new allocations include `classSectionId`, `classId`,
  `className`, `sectionId`, `sectionName`, `academicYearId`,
  `academicYearName`, `staffId`, `staffNo`, `teacherName`, and timestamps.
- Legacy rows include `legacy: true`, the old `section`, and the joined user name;
  class-section and staff fields are `null`.
- Options default to the current academic year when `academicYearId` is omitted.
  Invalid UUIDs return 400; unknown years return 404. All reads remain side-effect
  free.

## Frontend changes

- Update `SubjectAssignmentInput`, `SubjectAssignment`, and options types to the
  new IDs and legacy flag.
- Add class-section and active-staff option types and map them in
  `/admin/academics/assign-subject`; keep the existing layout and form styling.
- Replace the hard-coded section list and user instructor list with real
  class-sections and active staff.
- Display legacy rows with their old section/user text and a `Legacy` marker.
  Deleting a legacy row remains allowed; editing does not.
- Keep the existing proxy and route handlers; no new route shape is needed.
- Update `tests/subjects/assignments.test.cjs` for the new payload and a legacy
  row, including failed-input retention and delete behavior.

## Companion changes

- `SchoolSubjectsService.remove` already maps restricted assignment deletion to
  409; no change expected, but it must be regression-tested.
- Verified class teacher behavior, staff deletion protection, class-section
  preservation, and class deletion restrictions must not change.
- Do not alter `school_subjects`, `classes`, `sections`, `class_sections`, or HR
  rows in this slice.

## Migration and verification plan (after approval)

1. Preflight: confirm 12 applied migrations, the current table shape, two legacy
   rows, zero staff, one class-section, and that the new columns/constraints are
   absent. Record row hashes for `school_subject_assignments`, `school_subjects`,
   `class_sections`, and `staff`.
2. Author `1794355900000-ReconcileSubjectAssignments.ts` as an explicit additive
   migration with a working down migration. Do not run `synchronize`.
3. Apply only that migration in a transaction after approval. No seed/backfill.
4. Post-apply verify columns, nullability, both new FKs with `ON DELETE RESTRICT`,
   the shape check, the partial unique index, and unchanged legacy rows/counts.
5. Backend tests: extend `test/subject-assignments.e2e.mjs` for new create/list,
   active staff validation, duplicate mapping, legacy row visibility/deletion,
   guards, restart persistence, and direct PostgreSQL constraints.
6. Frontend tests: update `tests/subjects/assignments.test.cjs` for new payload,
   real options, legacy display, proxy routing, and failed-input retention.
7. Run focused builds and lint in both projects, then update
   `docs/INTEGRATION_PROGRESS.md` with the verification result.

## Approval requested

Approve the additive schema evolution above, or choose the separate-table
alternative. Without approval no migration will be authored or applied, and no
existing subject assignment row will be changed.
