# Examination operations: next separate approval

Prepared 2026-11-15; explicitly approved and **APPLIED 2026-11-16**, history ID 28. [Application/preservation and live acceptance](./EXAMINATION_APPLICATION_VERIFICATION.md). The review below retains the original pre-application evidence and exact approved hashes. Do not reapply.

Only proposed migration: `CreateExaminationOperations1794752000000`.

- Exact [UP SQL](../../../lms/lms-backend/docs/EXAMINATION_UP.sql), SHA-256: `bfa2b941c5ef347c9870d3f8d24f6329e794929e3a0daa05aae6e275bedd9725`.
- Exact [DOWN SQL](../../../lms/lms-backend/docs/EXAMINATION_DOWN.sql), SHA-256: `272747cb8384d6d3fa99e2cd113d5423866cc0aec66790b7bb6fb21b69257573`.

The [preflight helper](../../../lms/lms-backend/test/examination-migration.mjs) compares source/compiled/reviewed SQL and pinned hashes. `--emit-sql` only generates local artifacts. Default runs REPEATABLE READ, READ ONLY. **No apply mode exists.**

## PASS/FAIL review

| Check | Result and evidence scope |
|---|---|
| Exact SQL and SHA-256 | **PASS:** source, compiled migration and reviewed artifacts match both hashes. |
| Existing school data | **PASS, reviewed design:** creates seven new tables plus indexes/constraints. No existing-table changes, updates/deletes, extension installation, seeds or inferred mappings. Only the future named migration-history insert is in the UP artifact. |
| Foreign keys and unique constraints | **PASS, reviewed design:** restrictive references to actual users, allocation, staff, subject, class-section, classrooms, students and dated enrollment keys. Composite schedule/class/date, attendance/assessment/enrollment and marks/maximum-scale keys prevent cross-scope references. Unique request IDs, per-assessment schedules/attendance/marks and per-record audit versions. |
| Schedule integrity | **PASS, reviewed design/offline checks:** school-local same-day times; academic-year date bounds and dated roster capacity are service-checked. GiST exclusions prevent room and class overlaps, with adjacent time slots allowed. Recorded attendance freezes the schedule's referenced date and marking scale. |
| Attendance/results/grades | **PASS, reviewed design/offline checks:** actual enrollment on exam date; explicit attendance before matching marks; versioned writes; no future records without school timezone. Whole-number marks and inclusive whole-percentage grade bands are explicit policy; percentages round down. Absence/excusal has NULL score. Grade/pass snapshots retain the marked result across subsequent grade changes. Gaps remain ungraded; no invented defaults or result rows. Some cross-table ownership, capacity and policy checks are service-enforced. |
| Authorization/auditing | **PASS, offline HTTP/service tests:** verified unrestricted enabled Admin, request-derived actors, strict DTOs, bound values, allowlisted same-origin cookie proxy, shared authorization/write lock, optimistic versions and transactional before/after audit. Restricted, student and anonymous access fail. |
| Rollback safety | **PASS, reviewed design:** locks all seven tables, refuses rollback if any exam/catalog/audit row exists, drops children first without CASCADE. Populated systems need a forward fix. DOWN has not been executed. |
| PostgreSQL compatibility | **PASS, read-only prerequisites:** actual PostgreSQL 18.6; 27 applied migrations and 63 existing application tables. Required parent relations, REFERENCES privileges, dated-enrollment unique key, existing UUID function, btree_gist UUID/range operators, CREATE privilege and absence of collisions/RLS verified. New DDL/constraints have not been executed. |

[Read-only preflight evidence](../../../lms/lms-backend/docs/EXAMINATION_PREFLIGHT.json).

## Prepared implementation and verification

Seven new tables: `exam_types`, `exam_grades`, `exam_assessments`, `exam_schedules`, `exam_attendance`, `exam_marks`, `exam_events`. Seven existing examination pages connect to the shared protected API and actual paginated choices. Failed writes retain drafts and retry identity; duplicate submissions are blocked. Only one roster row can have an unsaved draft at a time; changing roster filters/pages is disabled until save or explicit discard. Historical results and actor history remain visible.

New backend unit/real-guard HTTP **13/13 PASS**, frontend **6/6 PASS**. Complete backend offline/HTTP **137/137**, Vitest **22/22**, frontend **159/159**, both production builds and backend/focused frontend lint PASS. Repository-wide frontend lint remains failing on inherited errors; see [verification](./CONDUCT_STAFF_ADMINISTRATION_APPLICATION_VERIFICATION.md).

Root module starts with no automatic migrations or seeding. Examination reads return 503 until approval/application; approved administration reads return 200. All 64 public-table hashes remain unchanged during the probe. The [eight-scenario PostgreSQL suite](../../../lms/lms-backend/test/examinations.e2e.mjs) is prepared and syntax-checked, **NOT RUN**. It requires newly approved empty examination tables, creates only rollback fixtures, and compares all public-table hashes afterward.

Attendance status is locked once marks exist; this batch permits score/feedback corrections with audit but does not implement a separate attendance/result void-and-replacement workflow. This batch does not claim completion of online exams, seat/admit-card plans, fractional/weighted marks, multi-subject aggregated transcripts, publication/workflow policies, or all Admin modules. Finance/wallet/accounts, payroll, dormitory/front-office, remaining settings/communications/reports and unfinished earlier-domain sub-workflows remain on the original roadmap.

## After explicit approval

Recheck live history, both SQL hashes and source parity. Apply only this named migration in one transaction, locking existing tables/history and verifying a fresh baseline across **all 63 existing application tables and all 27 prior migration-history entries before COMMIT**, with seven new tables empty. Abort on any discrepancy. Run PostgreSQL acceptance/affected regressions, resolve failures without silently changing approved SQL, and continue the complete Admin roadmap in larger batches. Every later migration requires separate explicit approval.
