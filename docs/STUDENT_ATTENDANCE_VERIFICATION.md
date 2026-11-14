# Student Registry and Attendance: approved application verification

Applied 2026-11-14 after explicit owner approval, in this order:

1. `CreateStudentRegistry1794671000000`
2. `CreateAttendanceRegisters1794671100000`

Exact approved UP SHA-256 `0bb80ea20a4593856819f503ec5fed0bee82e41622bdc78fb728876942a22b09` and DOWN SHA-256 `e2c85f5b5b52088e428bb05ef6765949e7f549561067fc49464ebdfcad5b2a75` matched before application. Source/compiled/review SQL parity also passed.

Only these two migrations committed in one guarded transaction. Before commit, all 28 existing application tables matched their latest full-row count/SHA-256 baseline, all 19 earlier migration-history rows were unchanged, and all six new tables were empty. Baseline: 7 users, both original subject assignments and 83 refresh-token rows. The earlier 82-token baseline was not substituted for the current state. [Application evidence](../../../lms/lms-backend/docs/STUDENT_ATTENDANCE_APPLICATION.json).

PostgreSQL persistence acceptance **11/11 PASS**, including real HTTP permissions/validation; atomic student/guardian/enrollment admission; identity, catalog-kind and primary-guardian protection; profile and guardian versions; placement/roll overlap exclusion; actual unmarked student rosters; persisted student/staff attendance; explicit staff times; stale/no-op writes; atomic mixed-batch rollback; injected audit failure rollback; audit actor history; and direct SQL bypass attempts against FKs/CHECKs. Fixtures rolled back and every original public-table hash/count matched afterward.

Database state after application: **21 migrations, 34 application tables / 35 public tables including history**. No school identity, student, guardian, enrollment, staff or attendance fixture was committed. The two added supporting UNIQUE constraints are now present. Future migrations remain unauthorized until separately approved.

Post-application frontend regressions **127/127 PASS** and backend Vitest **22/22 PASS**; both production builds PASS. After the next grouped code batch, student/attendance PostgreSQL acceptance was rerun **11/11 PASS** with fixture rollback and all-table preservation, and full frontend regressions increased to **133/133 PASS**. Root-module probe confirms student/options/staff attendance APIs return 200 and all 35 public tables remain unchanged during probes.

The next grouped files/attachments, study materials/downloads and internal notices/events/calendar implementation is prepared. Its [two-migration review](./FILES_LEARNING_COMMUNICATION_MIGRATION_REVIEW.md) requires separate approval; this verification does not imply completion of all Admin modules.
