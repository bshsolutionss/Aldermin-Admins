# Class Teacher Allocations — schema and migration implemented

Status: approved, implemented, and verified. Migration
`1794355800000-CreateClassTeacherAssignments.ts` was applied after explicit
approval. This is the first slice of the roadmap item "Teacher allocations,
subject allocations, rooms, and timetable (one at a time)."

## Scope

- Allocate one class teacher to an existing class-section.
- Reuse the existing `class_sections` and `staff` records.
- Cover the active sidebar page `/admin/academics/assign-teacher`.
- Do not include subject allocations, classrooms, routines, or student enrollment.

## Inspection findings

- `/admin/academics/assign-teacher` is the active sidebar page. It currently
  reads mock assignments and mock class/section/teacher lists, appends rows with
  `Math.random()`, and does not persist anything.
- `/admin/academic/assign-class-teacher` is an older hard-coded route. It is not
  linked from the current sidebar and will remain unchanged, following the
  precedent used for legacy academic routes.
- `classes` already belong to an academic year. `class_sections` is the existing
  unique link between a class and a section and is the correct allocation target;
  storing class and section separately would allow invalid combinations.
- `staff` is the HR source of truth and already backs the active page's teacher
  selector. Staff may have no user account, so a staff foreign key is more
  reliable than `users.id`.
- `school_subject_assignments` currently references `users.id` and stores a
  free-text `section`. That is a separate later module; no existing assignment
  rows will be changed here.
- Read-only PostgreSQL inspection on 2026-11-11 found 11 applied migrations,
  the expected academic/HR tables, one class, one class-section, zero staff, two
  subject assignments, and academic year `2026` marked current. No
  `class_teacher_assignments` table exists.
- TypeORM synchronization is disabled in both the application and migration
  data sources. New tables require explicit migrations.

## Applied table: public.class_teacher_assignments

| Column | PostgreSQL type | Constraints/default |
| --- | --- | --- |
| id | uuid | Primary key, NOT NULL, DEFAULT uuid_generate_v4() |
| class_section_id | uuid | NOT NULL; unique; FK to class_sections(id) ON DELETE RESTRICT |
| staff_id | uuid | NOT NULL; FK to staff(id) ON DELETE RESTRICT |
| created_at | timestamptz | NOT NULL; DEFAULT now() |
| updated_at | timestamptz | NOT NULL; DEFAULT now(); maintained by TypeORM on application updates |

Named constraints and index:

- `PK_class_teacher_assignments` primary key.
- `UQ_class_teacher_class_section` unique on `class_section_id`; one class teacher
  per section and safe under concurrent writes.
- `FK_class_teacher_class_section` to `class_sections(id)` with `ON DELETE RESTRICT`.
- `FK_class_teacher_staff` to `staff(id)` with `ON DELETE RESTRICT`.
- `IDX_class_teacher_staff` on `staff_id` for teacher lookups and FK checks.

Applied SQL shape:

```sql
CREATE TABLE "class_teacher_assignments" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "class_section_id" uuid NOT NULL,
  "staff_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_class_teacher_assignments" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_class_teacher_class_section" UNIQUE ("class_section_id"),
  CONSTRAINT "FK_class_teacher_class_section" FOREIGN KEY ("class_section_id")
    REFERENCES "class_sections"("id") ON DELETE RESTRICT,
  CONSTRAINT "FK_class_teacher_staff" FOREIGN KEY ("staff_id")
    REFERENCES "staff"("id") ON DELETE RESTRICT
);
CREATE INDEX "IDX_class_teacher_staff"
  ON "class_teacher_assignments" ("staff_id");
```

Design choices and tradeoffs:

- The academic year is derived through `class_sections -> classes`; duplicating
  `academic_year_id` here would allow inconsistent rows.
- A staff member may be class teacher for multiple sections. Only the section is
  unique.
- Both foreign keys restrict deletion to avoid silently losing an allocation.
  Removing a section from a class or deleting a class will fail while an assigned
  teacher still references that section; the user must remove the allocation
  first. This is deliberate and follows the no-silent-deletion requirement.
- Staff `active` status is enforced by the API, not by a trigger. Deactivating a
  staff member later does not delete existing historical allocations; they remain
  visible and must be reassigned or removed explicitly.
- No soft-delete column, audit table, seed records, or speculative columns are
  introduced.

## Implementation result

- Backend module: `src/class-teacher-assignments` with entity, DTOs, service,
  controller, and module. The entity is registered in both application and
  migration data sources; the module is imported by `AppModule`.
- Routes are admin-only and live under `/api/v1/class-teacher-assignments`,
  including `options` and `:id` routes.
- Create/update validates existing active staff and existing class-sections,
  maps duplicate sections to 409, inactive/unknown references to 400, and missing
  assignments to 404.
- Response rows include `classSectionId`, `staffId`, `classId`, `className`,
  `sectionId`, `sectionName`, `academicYearId`, `academicYearName`, `staffNo`,
  `teacherRole`, `teacherName`, and timestamps.
- Options default to the current academic year, return class-sections for that
  year, and return active staff only with department and designation labels.
- `ClassesService.syncSections` now preserves existing class-section IDs during
  unchanged edits and deletes only removed links. Class delete/update conflicts
  accept both PostgreSQL `23503` and `23001` restriction codes.
- `StaffService.remove` maps assigned-staff deletion to
  `409 Remove class teacher allocations before deleting this staff member`.
- Frontend: `lib/class-teacher-proxy.ts`, collection/`options`/`[id]` API routes,
  typed `classTeacherAssignments` client methods, and the active
  `/admin/academics/assign-teacher` page now use real UUIDs and persist
  create/update/delete. The legacy `/admin/academic/assign-class-teacher` route
  remains unchanged.

## Required companion changes in completed modules

Two existing services must change so the restricted foreign keys do not break
normal editing or return misleading errors:

- `ClassesService.syncSections` currently deletes every class-section row and
  reinserts the submitted set. With a restricted assignment FK, renaming a class
  or saving unchanged sections would fail. Change it to a diff: load existing
  section IDs, delete only removed links, and insert only added links. Existing
  class-section IDs and their allocations then survive normal edits. Removing an
  assigned section still fails with a conflict until the allocation is removed.
- `StaffService.remove` currently maps every foreign-key failure to the
  create/update message about department, designation, or user. Add
  delete-specific mapping so an assigned staff member returns 409 with an
  actionable message such as `Remove class teacher allocations before deleting
  this staff member`.

These are behavior-preserving integrations with the new FK. Existing class and
staff success paths must be regression-tested.

## API and permissions

Dedicated NestJS module, entity, controller, service, and DTOs. Register the entity
in both data sources. All routes require admin access through the existing
`JwtAuthGuard` and `RolesGuard`.

| API | Access | Success |
| --- | --- | --- |
| GET /api/v1/class-teacher-assignments | admin | 200; assignments joined with class, section, academic year, and staff |
| GET /api/v1/class-teacher-assignments/options?academicYearId=uuid | admin | 200; eligible class-sections and active staff |
| GET /api/v1/class-teacher-assignments/:id | admin | 200; one assignment |
| POST /api/v1/class-teacher-assignments | admin | 201; persisted assignment |
| PATCH /api/v1/class-teacher-assignments/:id | admin | 200; persisted assignment |
| DELETE /api/v1/class-teacher-assignments/:id | admin | 200; `{ success: true }` |

Create body: `{ classSectionId: uuid, staffId: uuid }`.

Update body: at least one of `classSectionId` or `staffId`. An empty object is
rejected with 400. Unknown fields are rejected by the global whitelist.

Response rows contain `id`, `classSectionId`, `staffId`, `className`,
`sectionName`, `academicYearId`, `academicYearName`, `staffNo`,
`teacherName` (first + last name), and timestamps. Ordering is by academic year,
class name, section name, then id.

Options behavior:

- `academicYearId` is optional. When omitted, the current academic year is used
  if one exists; otherwise all class-sections are returned.
- An invalid UUID returns 400; an unknown academic year returns 404.
- `classSections` contains `id`, `classId`, `className`, `sectionId`,
  `sectionName`, `academicYearId`, and `academicYearName`.
- `teachers` contains active staff only, with `id`, `staffNo`, `name`, `role`,
  `department`, and `designation`.
- Results are deterministic and GET requests never write data.

Error mapping:

- Duplicate section allocation: 409 `This class section already has a class teacher`.
- Unknown class-section or staff, inactive staff: 400 with a specific message.
- Unknown assignment on read/update/delete: 404.
- Staff deletion while assigned: conflict from the restricted foreign key.
- Class-section/class deletion while assigned: conflict; remove the allocation
  first.

## Frontend changes

- Add `lib/class-teacher-proxy.ts` using the existing admin-only, same-origin,
  cookie-forwarding proxy pattern. Validate assignment UUIDs; allow only the
  `options` suffix as a non-UUID collection route.
- Add `/api/class-teacher-assignments` collection, `[id]`, and `options` route
  handlers. Forward backend status codes and preserve error messages.
- Add typed `ClassTeacherAssignment`, `ClassTeacherAssignmentInput`,
  `ClassSectionOption`, and `StaffOption` types plus a
  `classTeacherAssignments` group in `lib/api-service.ts`.
- Rewire `/admin/academics/assign-teacher` to load real assignments and options,
  create/update/delete through the proxy, use real UUIDs, show loading/empty/error
  states, disable duplicate submits, and preserve form inputs on failure.
- Change `AssignTeacherForm` to render option objects instead of display strings.
  The form keeps its layout and styling.
- Remove the `academics.getTeacherAssignments` mock. The unrelated class, section,
  classroom, and routine mocks used by later pages remain untouched.
- Leave the legacy `/admin/academic/assign-class-teacher` route unchanged.

## Applied migration and verification

- Preflight on 2026-11-11 found 11 applied migrations, no
  `public.class_teacher_assignments`, the referenced `class_sections` and
  `staff` tables present, `uuid_generate_v4()` available, `classes=1`,
  `class_sections=1`, `staff=0`, and academic year `2026` current.
- Only `1794355800000-CreateClassTeacherAssignments.ts` was applied in a
  transaction. Migration history is now 12. No unrelated pending migration was
  applied, and no seed/backfill SQL touched existing tables.
- Post-apply verification found the expected columns, defaults, primary key,
  unique constraint, both `ON DELETE RESTRICT` foreign keys, and staff index.
  Row hashes and counts for `classes`, `class_sections`, `sections`, and `staff`
  were unchanged.
- Backend `pnpm test:class-teacher` passes 8/8: admin/anonymous role guards,
  current-year options, active staff filtering, joined create/list/get, restart
  persistence, duplicate sections, updates, validation, class-section ID
  preservation, deletion restrictions, and direct PostgreSQL constraint checks.
- Frontend `pnpm test:class-teacher` passes 5/5: API routing, proxy
  authorization/origin/UUID checks, option loading, create/edit/delete, and
  retention of failed duplicate input.
- Backend build and focused oxlint pass. Frontend production build and
  TypeScript pass; focused lint reports 0 errors and 4 pre-existing unused-argument
  warnings in `lib/api-service.ts`.
- The down migration exists but was not executed, because rollback would remove
  allocations entered after deployment.

## Deferred to later approvals

- Subject allocations: reconcile the existing `school_subject_assignments`
  (`users.id` plus free-text section) with class-section-aware allocations before
  routines depend on it.
- Classrooms: room number, capacity, and scheduling constraints.
- Class routines: day, start/end time, class-section, subject, teacher, room, plus
  conflict detection for teachers and rooms.
- HR file uploads: `/admin/hr/add-staff` currently keeps selected documents only
  in browser state because no upload endpoint exists. Track for completion with
  the shared files/content module or a dedicated upload API.
