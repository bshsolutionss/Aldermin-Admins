# Approved Settings/foundations batch verification

Applied on 2026-11-14 after the owner's explicit approval, in this exact order:

1. `CreateSchoolSettings1794500200000`
2. `CreateAdminFoundations1794670000000`

Approved UP SHA-256 `1cfd299d9abb3642be1b0c9a4e835761faedc8e4e7e64c9d57f7b382b2b2db52` and DOWN SHA-256 `e3c425be4436853ddad3d0869ecf1c24bdcefa45c32401cdaf49b082f8346cbb` matched before application. The helper also checked source/compiled/reviewed SQL equality.

The two migrations committed together only after full-row count/SHA-256 equality across all 22 pre-existing application tables, unchanged prior 17 migration-history records, and confirmation that the six new tables were empty. The baseline retained all 7 users, both original subject assignments and 82 refresh tokens. No other migration was run. [Machine-readable application evidence](../../../lms/lms-backend/docs/SETTINGS_FOUNDATIONS_APPLICATION.json).

PostgreSQL acceptance: foundation suite **9/9 PASS**, General Settings **7/7 PASS**. Fixtures ran inside rolled-back transactions; each suite checked every original public table's count/hash after cleanup. Cases covered real HTTP authorization/validation, persistence, catalog kind isolation, archive/restore, optimistic versions, no-op saves, inclusive holiday overlap exclusion, weekday masks, singleton/FK/CHECK/uniqueness constraints, audit history, and injected audit-storage failure rollback.

Frontend regression suite initially **118/118 PASS**, later **127/127 PASS** with the next batch prepared. Backend and frontend production builds **PASS**, frontend generated 223 pages. The full Vitest run initially found two existing users smoke tests missing providers; those setups were corrected and replaced with meaningful safe-profile/verified-actor assertions. Final Vitest result: **22/22 PASS**. These initial failures were test dependency wiring, not database acceptance failures.

General Settings and calendar remain explicitly unconfigured: the tests did not commit a school name, contact, timezone, holiday or weekend selection. No user account or student identity was invented.

Continue automatically with student registry/guardians/enrollments and student/staff attendance as a prepared batch. Those future migrations are **not authorized by this approval**. The complete Admin backend remains unfinished.
