# Online Examinations, Front Office and Dormitory: separate approval

Prepared and reviewed 2026-11-16. **APPLIED** after conditional owner approval; see [application and acceptance evidence](./ONLINE_CAMPUS_APPLICATION_VERIFICATION.md). Subsequent migrations require separate approval.

Only proposed migration: `CreateOnlineCampusOperations1794754000000`.

- Exact [UP SQL](../../../lms/lms-backend/docs/ONLINE_CAMPUS_UP.sql), SHA-256 `cb57102bcf9fe897264840f0b25733dd899b29a5d705a70dff77981649fe252f`.
- Exact [DOWN SQL](../../../lms/lms-backend/docs/ONLINE_CAMPUS_DOWN.sql), SHA-256 `501b6bbe69bad7a7b66022fd2c3c3f64a935efa5a9631054a403c41f79bf1ff4`.
- [Read-only preflight evidence](../../../lms/lms-backend/docs/ONLINE_CAMPUS_PREFLIGHT.json). [Helper](../../../lms/lms-backend/test/online-campus-migration.mjs) only emits SQL or runs READ ONLY checks; it cannot apply anything.

## Safety and evidence

| Check | Status / exact scope |
|---|---|
| SQL identity | **PASS**: reviewed/source/compiled parity and both pinned SHA-256 hashes. |
| Existing data | **PASS, design**: creates 17 new tables, indexes, three trigger functions and associated triggers. No existing-table alterations, data rewrites, updates/deletes, extension installation, inferred account/student mappings, configuration defaults or seeds. Future UP inserts only its own migration-history row. |
| Preconditions | **PASS, READ ONLY PostgreSQL 18.6**: 29 migrations, 82 application tables; parent REFERENCES/CREATE privileges, UUID function, GiST UUID/int4/range operators, no proposed relation/function collisions and no RLS hiding preservation baselines. |
| Authorization | **PASS, offline/real-guard HTTP**: enabled unrestricted Admin for management; enabled student role for learner endpoints; explicit user-to-enrollment assignments; per-attempt ownership; same-origin cookie proxies and strict body/path allowlists. |
| Online integrity | **PASS, design/offline**: actual allocation scope, academic-year window, 2–6 distinct choices, 1–100 frozen question snapshots, one attempt per participant, deadlines bounded by exam close/duration, current enrollment at start, versioned saved answers, no late answer writes, immutable settled attempts and actor audit. Correct-choice indices are excluded from learner projections. Some cross-table policies are service-enforced. |
| Front office | **PASS, offline/design**: typed category references, request identity, real staff/classes, recorded dates, versioned visitor checkout and complaint resolution. Admission calls the existing student registry inside the same transaction; failed admission/audit cannot partially commit. |
| Dormitory | **PASS, offline/design**: real student/building/type references, explicit gender policy, bed-capacity snapshot, GiST exclusions for overlapping bed occupancy and simultaneous student stays, immutable used capacity, versioned shortening of stay with history. |
| Rollback | **PASS, design**: lock all 17 tables; refuse DOWN if any record or actor event exists; children first without CASCADE. DOWN not run. Populated systems need forward correction. |
| Offline/HTTP tests | New backend **11/11 PASS**, frontend **6/6 PASS**; strict actor/score injection, ownership, key secrecy, deadlines, bad scope/beds, schema gates, failed drafts, duplicate submits and late-response guards. |
| Final regression/build checks | **PASS**: frontend **174/174**, backend offline/HTTP **159/159**, Vitest **22/22**; both production builds/TypeScript, backend repository lint and production-source/focused frontend lint. Inherited non-production CommonJS lint debt is retained separately; no rules disabled. |
| Root application | **PASS**: approved finance/examination reads 200, new Online/Campus reads 503; all **83 public-table row hashes unchanged**. Synchronize/automatic migrations disabled. |
| New PostgreSQL acceptance | **PASS after approval/application: 11/11**, plus independent concurrency 1/1. The eleven-scenario [suite](../../../lms/lms-backend/test/online-campus.e2e.mjs) ran successfully with rollback-only fixtures. It requires the migration and empty new tables, rolls back fixtures and compares every public-table hash. DDL and trigger execution were exercised against PostgreSQL. |

## Prepared workflows

Online: question groups/bank; single-choice questions with whole marks; actual teacher/subject/class exam drafts; explicit student-login assignments; question snapshots; publishing/closure; learner-owned timed start, read, save/correct answers and submit APIs; Admin overdue finalization; result/pass snapshots and reports. Time checks use the live database clock after lock acquisition. Question-bank edits do not rewrite published snapshots or existing results.

Front Office: purpose/source/complaint categories; inquiries and status corrections; transactional creation of a real admitted student through existing registry validation; visitor check-in/out; phone and postal logs; assigned complaints and resolution history. Phone/postal records are **logs**, not external sending. The admission UI creates the student profile; guardian/enrollment completion remains available through the existing registry, and the nested admission API also accepts its existing optional guardian/enrollment contracts.

Dormitory: room types, buildings and explicit occupancy policy, rooms and capacities, date/bed allocations, no overlapping student/bed stays, early checkout and a student dormitory report. End dates are **inclusive**. Booking requires an active student profile; it does not infer fees or require a current academic enrollment. Used room capacity and allocated building gender policy remain frozen to preserve history.

Seventeen tables: seven online-exam tables, five front-office tables, four dormitory tables and shared actor events. TypeORM entity schemas registered with synchronization disabled. Fifteen existing Admin pages connect through protected real APIs; eight additional legacy Academic/HR aliases reuse already applied modules without schema changes. [Detailed checklist](./ONLINE_CAMPUS_ROUTE_CHECKLIST.md).

## Explicit limits

- Single-choice questions, whole marks, one attempt per assigned login/enrollment, no negative marking, retakes, essay grading, randomization, proctoring or external LMS imports. Published question and participant scope cannot be edited.
- Learner session APIs are implemented with protected cookie proxies; a separate learner-facing examination screen is **not** added to this Admin Panel. Delivery UI integration outside Admin remains a separate workflow.
- Expired attempts finalize through explicit learner submission or Admin action; no background grading worker or fabricated automatic results. Unanswered questions contribute zero only when an actual attempt is finalized.
- Inquiry conversion creates a new student profile; existing-student merge/reconciliation and fee collection during intake are not implemented.
- Dormitory charges, deposits, billing integration, transport and detailed incident/housekeeping workflows are not implemented.
- This does not complete certificates/ID cards, bulk printing, remaining settings/communications/reports, promotion/export, examination seat/admit plans or financial carry-forward/reversals/provider integration.

## After approval

Recheck exact SQL/hashes/source parity and all live prerequisites. Capture a fresh full-row count/SHA-256 baseline across **82 prior application tables and 29 prior history entries**, with locks. Apply only this named migration; before COMMIT require all prior tables/history unchanged and all 17 new tables empty; compare again after COMMIT. Abort on mismatch or failed check. Run live PostgreSQL Online/Campus acceptance and affected regressions, then continue certificates/ID cards, bulk printing, reports/settings/communications and remaining routes. Every later migration requires separate approval.
