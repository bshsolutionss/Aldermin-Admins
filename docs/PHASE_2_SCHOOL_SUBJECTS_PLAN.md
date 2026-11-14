# Phase 2: School Subjects — schema and migration proposal

Status: approved by the user on 2026-11-10; implemented. See [verification report](./PHASE_2_SCHOOL_SUBJECTS.md). Inspection findings below describe the state before implementation.

## Inspection findings

- Both academic catalog routes, `/admin/academic/subject` and `/admin/academics/subjects`, read subjects through `academics.getSubjects` but create, publish, and delete LMS Courses. Failed operations can produce fabricated local success. The first route initially displays mock records and ignores empty API results. Edit controls are currently inactive.
- The shared API service maps course titles/status into subject names/types and fabricates codes; it falls back to mock subjects on empty results and failures.
- `/admin/academics/assign-subject` consumes that catalog for its selector; the older `/admin/academic/assign-subject` has a hard-coded selector that will also use the real catalog. Assignment writes and its other dependencies are mocks belonging to later roadmap modules.
- `/admin/library/subject` is a separate library taxonomy with title/category/code fields, not the academic catalog. The approved roadmap places Library in a later phase; it will remain separate.
- NestJS already has JWT verification, database-backed role verification, RolesGuard, strict global ValidationPipe, and TypeORM repositories. Current roles are admin, instructor, and student. Existing authentication/session behavior will be reused.
- Live PostgreSQL was inspected in a read-only transaction on 2026-11-10. Public tables: users, refresh_tokens, password_reset_tokens, role_change_logs, courses, migrations. No school subject table exists. All five existing migrations are applied. There are three course records.
- Both application and migration data-source configurations explicitly disable synchronization.

## Proposed table: public.school_subjects

| Column | PostgreSQL type | Constraints/default |
| --- | --- | --- |
| id | uuid | Primary key, NOT NULL, DEFAULT uuid_generate_v4() (already used by existing tables) |
| name | varchar(200) | NOT NULL; trimmed; at least one non-whitespace character |
| code | varchar(50) | Nullable; when supplied, nonblank, trimmed, uppercase, unique |
| type | varchar(20) | NOT NULL; DEFAULT 'Theory'; CHECK IN ('Theory', 'Practical') |
| created_at | timestamptz | NOT NULL; DEFAULT now() |
| updated_at | timestamptz | NOT NULL; DEFAULT now(); maintained on application updates by TypeORM |

Named constraints: `PK_school_subjects`, `UQ_school_subjects_code`, `CHK_school_subjects_name`, `CHK_school_subjects_code`, `CHK_school_subjects_type`.

- Name CHECK: `name = btrim(name) AND name ~ '[^[:space:]]'`.
- Code CHECK: `code IS NULL OR (code = upper(btrim(code)) AND code ~ '[^[:space:]]')`.
- Code uniqueness is enforced by PostgreSQL, including concurrent writes. Uppercase storage makes case variants conflict. Multiple NULL codes are allowed.
- DTOs trim names and codes, uppercase codes, and map blank optional codes to NULL. Codes remain optional to preserve the existing academic form. Names/types cannot be NULL. PATCH distinguishes omitted fields from explicit NULL; only code can be cleared.
- Subject names need not be unique: a Theory and Practical entry may share a name with distinct codes.
- No course IDs, instructor ownership, foreign keys, joins, inheritance, publish status, or cascades. Subject deletion affects only its own row. Future allocations will require their own approved relationships and deletion rules.
- No new extension or PostgreSQL enum is required. No speculative category, class, section, year, or allocation columns.

## APIs and permissions

Dedicated NestJS SchoolSubjectsModule, entity, controller, service, create/update DTOs; register the entity in the application and CLI data source.

| API | Access | Success |
| --- | --- | --- |
| GET /api/v1/school-subjects | admin, instructor | 200; subject array, deterministic ordering |
| GET /api/v1/school-subjects/:id | admin, instructor | 200; subject |
| POST /api/v1/school-subjects | admin | 201; persisted subject |
| PATCH /api/v1/school-subjects/:id | admin | 200; persisted subject |
| DELETE /api/v1/school-subjects/:id | admin | 200; success result |

Anonymous access returns 401; students and unauthorized writes return 403. Invalid UUIDs, invalid fields, and empty PATCH requests return 400; missing records return 404; duplicate codes return 409. Whitelisting rejects course fields and other unknown properties. GET requests do not write data.

Frontend session-aware proxies under `/api/school-subjects` forward the existing HttpOnly access token and backend status codes. Mutation proxies validate same-origin requests. The shared API service gets typed subject CRUD methods; its existing academic subject getter delegates to the real catalog for all consumers. No requests from School Subjects will target Courses.

Both academic catalog routes retain their layouts, styles, and URLs, and receive real create/edit/delete flows, loading/empty/error states, and duplicate-submit protection. A failed write preserves form/list data and displays an error; it never invents success. Empty results remain empty. The assignment selector uses the real catalog; assignment persistence remains a later phase. Library taxonomy remains a later, separate module.

## Migration plan requiring approval

1. After approval, author one explicit additive TypeORM migration containing only CREATE TABLE school_subjects with the constraints above. Review its SQL against this proposal; do not auto-generate unrelated schema changes.
2. Check migration history immediately before application. Apply only this migration in a transaction; do not apply unrelated pending migrations. Leave synchronize and automatic migration execution disabled.
3. Create no seed records and perform no course-to-subject conversion, UPDATE, DELETE, or copy. The catalog begins empty.
4. Verify the actual columns, defaults, constraints, and migration-history entry after commit. Compare the existing course schema and full course-row snapshot before/after without exposing row contents.
5. Provide a down migration that drops only school_subjects. Do not execute rollback as part of normal verification. A later rollback would require preserving any subjects entered since deployment and explicit authorization because it removes that table's data.

## Verification after implementation and approved migration

- Unit and HTTP tests for DTO normalization, malformed IDs, unknown fields, missing records, duplicate codes (including case variants), empty PATCH, CRUD, and all three roles plus anonymous access.
- Real PostgreSQL tests for constraints and CRUD through NestJS. Verify committed test-subject changes using a separate database connection; delete only uniquely identified test subjects during cleanup. Use isolated/rolled-back user fixtures without changing existing users.
- Confirm existing course rows and schema remain identical after migration and tests.
- Frontend tests for client/proxy routing, error/status propagation, authenticated access, both catalog routes, real edit/delete, empty results, and absence of course or mock fallbacks. Verify catalog refresh after writes and page reload.
- Run frontend/backend TypeScript and production build checks and relevant authentication regression tests. Record actual passes and limitations rather than claiming unexecuted browser checks.
- Report this module's results and stop before the next phase.
