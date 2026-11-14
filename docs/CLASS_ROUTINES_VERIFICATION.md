# Class Routines: approved application and verification

Date: 2026-11-12. **Result: PASS.**

Applied only `CreateClassRoutines1794430200000` after explicit owner approval. The read-only preflight rechecked the reviewed SQL against both source and compiled migration before the guarded helper executed it in one transaction. UP SHA-256: `9a658ca3f28353588dfbe939100c6b72727f844228e9c8ac3ed90233ba78d6ab`; DOWN: `fe981613a117d5d315c00ca1f5ba17170b18945cccde351960c276bc0c45715a`.

Before commit, every row across all **16 pre-existing application tables** compared equal using SHA-256 snapshots. Migration history advanced from 14 to 15. PostgreSQL now has 18 public tables including history; the routine table starts empty, all three composite reference constraints and three GiST exclusion constraints are validated, and btree_gist 1.8 is installed.

The post-test read-only verifier compares original row hashes against the pre-application baseline. All original records still match, including 76 original refresh-token records, both legacy subject assignments, seven users and all existing school records. One later auth-token row was observed and preserved; it is outside the original-record baseline. Verification never deletes later application activity.

## Acceptance and regressions

- Class Routines PostgreSQL: **8/8 PASS**, covering verified admin guards, real options and filters, CRUD/restart persistence, independent class/teacher/room overlaps, adjacency, academic-year scoping, concurrent inserts, direct exclusion/composite FK enforcement, scheduled parent restrictions, validation and persisted deletion of owned fixtures.
- Related PostgreSQL regressions: **19/19 PASS** — Class teachers 8, Classrooms 6, Subject Assignments 5.
- Authentication PostgreSQL regression: **7/7 PASS**, with fixture rollback.
- Backend routine offline/HTTP: **6/6 PASS**; Subject Assignment offline/HTTP: **11/11 PASS**.
- Frontend full regressions after the new login-permission preparation: **100/100 PASS**, including routine 7/7 and new login-permission 6/6.
- Backend production build and frontend production build (219 generated pages, including TypeScript): **PASS**. Focused frontend and backend lint: **PASS**.

The first routine acceptance run exposed PostgreSQL `23001` for an ON UPDATE RESTRICT violation. Subject Assignment error mapping now returns **409** for both `23001` and `23503` on the routine allocation FK. Regression coverage includes both driver codes; all eight PostgreSQL cases then passed.

Fixture cleanup is restricted to UUIDs created by the tests and followed by original-data comparisons. No original school data was deleted or mapped to invented relationships. Existing uncommitted work was retained. Routine DOWN was not executed; its reviewed exclusive lock and refusal to drop a nonempty table remain in place.

## Next approval gate

Account login-permission implementation is prepared with API/UI, session enforcement, audit events, session versioning, refresh revocation, self-disable protection and shared serialization with role changes. Its separate migration is **NOT applied**. See [login policy review](./USER_LOGIN_POLICIES_MIGRATION_REVIEW.md). Remaining Admin modules continue after that migration's approval and PostgreSQL acceptance; fine-grained role grants remain unfinished.
