# Conduct, staff leave and teacher evaluations: approved review

**Current status: APPLIED after explicit approval on 2026-11-15, migration ID 27.** Both reviewed hashes below remained unchanged. PostgreSQL acceptance including two-connection serialization and rollback safeguards passed 10/10. [Application and verification](./CONDUCT_STAFF_ADMINISTRATION_APPLICATION_VERIFICATION.md). The following preparation review is historical; its NOT APPLIED statements describe the pre-approval checkpoint. The next separate approval gate is the [examination review](./EXAMINATION_MIGRATION_REVIEW.md).

Prepared 2026-11-15. **NOT APPLIED. Separate explicit owner approval required.**

Only proposed migration: `CreateConductStaffAdministration1794751000000`.

Exact [UP SQL](../../../lms/lms-backend/docs/CONDUCT_STAFF_ADMINISTRATION_UP.sql) and [DOWN SQL](../../../lms/lms-backend/docs/CONDUCT_STAFF_ADMINISTRATION_DOWN.sql):

- UP SHA-256: `031f39309f48f0247a63e99cb0d6a5a0ed4b9a63faf13f84fe432921af72256b`.
- DOWN SHA-256: `725498f497e788a25e0c04bb61a30ea038011360b16b0a7231cec439872e1de7`.

The [helper](../../../lms/lms-backend/test/conduct-staff-administration-migration.mjs) defaults to a REPEATABLE READ, READ ONLY transaction. Source, compiled migration and exact reviewed SQL match; both hashes are pinned. Generation cannot apply. The explicit `--approved-conduct-staff-administration` path has **not** been executed.

## Safety review

| Check | Result and scope |
|---|---|
| Exact SQL/hash parity | **PASS** — source/compiled/reviewed UP and DOWN match the hashes above. Function delimiters are balanced. |
| Existing data preservation | **PASS, reviewed design** — eight new tables, indexes, one trigger function and two triggers on new tables only. No existing-table alteration, existing-record update/delete, seeding, extension installation or legacy mapping. Only one new migration-history row is inserted. |
| Foreign keys/uniqueness | **PASS, reviewed design** — restrictive user/staff/student/guardian/allocation references; dated enrollment FKs; leave request composite staff/type/entitlement-period FK; unique request IDs, catalog names and audit versions. GiST exclusions prevent overlapping staff/type entitlement periods and overlapping pending/approved leave for one staff member. |
| Domain integrity | **PASS, reviewed design/offline tests** — conduct retains original incident name/points; voiding preserves history. Leave stores inclusive calendar days, reserves pending/approved quota, freezes request terms, rejects quota reduction below reserved days and rejects reopening completed decisions. Teacher reviews retain rating scale/settings version and original teacher/class/subject scope; service validates dated enrollment and parent/guardian ownership. Some cross-table ownership and reviewer-policy checks are service checks, not a claim that arbitrary raw SQL cannot bypass them. |
| Authorization/audits | **PASS, offline HTTP/service contracts** — verified enabled unrestricted admins, strict resource-specific DTOs, allowlisted same-origin cookie proxies, request-derived actor IDs, current versions and shared admin-change serialization. Audit failure rejects the transaction. No student, instructor or public submission endpoint is added. |
| Rollback | **PASS, reviewed design** — locks all eight tables, refuses any stored record/history, removes children before parents and finally the function. No CASCADE. DOWN is not executed; populated systems require a forward fix. |
| PostgreSQL compatibility | **PASS, read-only prerequisites** — actual PostgreSQL 18.6, 26 migrations and 55 application tables; all proposed tables/index/constraint/function/trigger names absent. Parent relations/REFERENCES privileges, dated-enrollment key, UUID generation, existing btree_gist, UUID and polymorphic range GiST operator classes, and PL/pgSQL privilege verified. No RLS hides preservation rows. DDL/trigger/constraint execution remains pending approval. |

## Preservation before the next COMMIT

The apply helper requires the expected live 26-migration history and refuses a duplicate/conflicting named migration. It locks prior application tables in SHARE mode, captures fresh row counts/SHA values and refuses COMMIT unless **all 55 prior application tables and all 26 prior history entries** remain unchanged, and all eight new tables are empty. Lock timeout is 5 seconds; statement timeout is 30 seconds. It never applies all pending migrations.

[Read-only preflight evidence](../../../lms/lms-backend/docs/CONDUCT_STAFF_ADMINISTRATION_PREFLIGHT.json). Existing data and all uncommitted source work remain preserved.

## Prepared tables and workflows

1. `conduct_incidents`: signed whole points, names/descriptions, archive and versions.
2. `conduct_records`: dated student-enrollment attribution, snapshot points, stable request IDs, void decisions and retained history.
3. `staff_leave_types`: owner-defined leave categories, archive and versions.
4. `staff_leave_entitlements`: explicit staff/type/period/quota, overlap prevention and balance reporting.
5. `staff_leave_requests`: pending/approved/rejected/cancelled requests, inclusive generated calendar days, immutable terms and quota/overlap guards.
6. `teacher_evaluation_settings`: explicitly saved policy, allowed source types, anonymity marker, approval requirement and maximum rating. No default row is seeded.
7. `teacher_evaluations`: Admin-recorded student/guardian source reviews tied to a real enrollment and teacher allocation, rating-scale snapshots, review decisions and approved-only normalized reports.
8. `school_administration_events`: verified actor, version and before/after history for all three modules.

Fourteen existing routes are wired: six Behaviour pages, four Leave pages and four Teacher Evaluation pages. They use the existing PageHeader/AdminCard/Button design components, searchable/paginated real choices, date/status filters, versioned saves, retained failed drafts, stable retry IDs, retry states and decision reasons. Reports use persisted conduct or approved evaluations, without invented performance bands or demo records.

## Verification and limits

- New backend service/real-guard HTTP contracts **13/13 PASS**. New frontend proxy/client/state/route tests **8/8 PASS**.
- Full frontend **153/153**, backend offline/HTTP **124/124**, backend Vitest **22/22**, existing PostgreSQL regressions **34/34**, both production builds and relevant lint/type checks PASS.
- Root module starts. Applied academic-work reads return 200; all prepared administration reads return 503. No automatic migration or seeding occurs; all 56 public-table hashes remain unchanged during the probe.
- The [eight-scenario PostgreSQL suite](../../../lms/lms-backend/test/school-administration.e2e.mjs) is prepared and syntax-checked, **NOT RUN**. It never applies DDL, requires newly approved empty administration tables, uses isolated rollback-only fixtures and compares every public-table hash afterward. Live quota/trigger/exclusion/rollback persistence acceptance and separate multi-connection contention testing remain pending.
- Leave uses **inclusive calendar days**. Working-day calendars, half days, role-based automatic entitlement distribution, carry-forward, medical attachments and payroll/financial posting remain open. No policy is silently inferred from staff roles or school holidays.
- Teacher reviews are explicitly **entered by an administrator from a student/guardian source**. They are not authenticated learner submissions. The anonymity flag is retained for future faculty views; current endpoints are unrestricted-Admin-only and expose source information to those admins. Public/learner submission flows, faculty views, attachments and additional evaluation policy workflows remain open.

## After explicit approval

Apply only this reviewed migration with a fresh preservation baseline, run PostgreSQL acceptance, resolve failures without silently modifying approved SQL, rerun affected checks and continue the entire original Admin backend roadmap automatically. Exams/online exams, fees/accounts/wallet, payroll, dormitory/front office, remaining settings/communications/reports and unfinished sub-workflows remain open. Every future database migration requires separate approval; Student/Instructor dashboards remain outside scope.
