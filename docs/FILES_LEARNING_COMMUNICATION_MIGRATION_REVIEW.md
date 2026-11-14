# Files, learning materials and internal communications approval batch

Prepared 2026-11-14; subsequently **APPLIED after explicit owner approval**. See [approved application and current verification](./FILES_LEARNING_COMMUNICATION_APPLICATION_VERIFICATION.md). The preparation/review below is retained as historical evidence; it is not approval for future migrations.

Apply in this exact order only:

1. `CreateSecureSchoolFiles1794672000000`
2. `CreateLearningCommunication1794672100000`

Exact [UP SQL](../../../lms/lms-backend/docs/FILES_LEARNING_COMMUNICATION_UP.sql) and reverse-order [DOWN SQL](../../../lms/lms-backend/docs/FILES_LEARNING_COMMUNICATION_DOWN.sql) include transaction boundaries, 5-second lock timeout, 30-second statement timeout and only these migration-history entries. Source/compiled/review SQL parity is checked by the [default-read-only helper](../../../lms/lms-backend/test/files-learning-communication-migration.mjs).

| Review | Result | Evidence / effect |
|---|---|---|
| Exact UP/DOWN | PASS, static/source parity | UP SHA-256 `b799b413e5bef6fd18bf6181f4154b59460736dfe2981e3133a0caf0128ce4b6`; DOWN `dac10b2a3b09a580a22844f2ea09d9e4b1ee1b430c0e97ea65f19d49a92907a6`. |
| Existing school records | PASS, additive SQL | No UPDATE, DELETE, TRUNCATE, seed, data conversion or legacy URL rewrite. Six new tables. The only existing-table alteration adds a composite UNIQUE constraint to subject assignments; its existing UUID primary key already guarantees uniqueness. |
| Foreign keys | PASS, reviewed | Owner, file, actor and allocation references use UUIDs and RESTRICT. Material scope pins assignment, subject and class-section together with a composite FK and all-null/all-present CHECK. Existing allocations cannot be silently remapped or deleted once referenced. |
| Constraints | PASS, reviewed/offline | Exactly one student/staff attachment owner; unique owner+slot indexes; student slots restricted; file size/content length/MIME/purpose/SHA shape; notice date/audience checks; positive versions; unique audit versions; event end after start; file/link vs video material shape. |
| Rollback safety | PASS, guarded | Reverse order locks affected tables and refuses rollback if any relevant records or audit history exist. No CASCADE. Empty-only rollback also removes its added subject-allocation UNIQUE. Populated databases require a forward fix. |
| PostgreSQL compatibility | PASS, READ ONLY preflight | PostgreSQL 18.6; public schema, UUID function, UUID parent columns/primary keys, REFERENCES/CREATE privileges and relation/constraint name availability checked. Current history remains 21 migrations. **DDL execution/rollback and persistence acceptance are not yet run for this batch.** |

[Read-only preflight evidence](../../../lms/lms-backend/docs/FILES_LEARNING_COMMUNICATION_PREFLIGHT.json) records all 34 current application-table counts/SHA-256 hashes. School activity may continue; the approved apply helper must capture a fresh baseline in its own transaction, compare every pre-existing row/table and all 21 prior history rows before COMMIT, then confirm all six new tables empty. It never substitutes a historical token or catalog count for current data.

The prepared code covers bounded PostgreSQL `bytea` storage (5 MiB/file), authenticated downloads with byte-length/SHA verification, versioned portrait/document attachments, materials/syllabi/assignment files/downloads/video links, notices/events and a school-timezone calendar. Archive/clear actions retain stored bytes/history. Upload checks validate types/signatures/dimensions and plain UTF-8 text; they do not claim full document decoding or antivirus scanning. Notices are internal records with audience metadata; external email/SMS delivery and learner-facing distribution are not implemented by this batch.

Ten page integrations and student/staff attachment panels retain the existing design components. Backend unit/HTTP checks, frontend proxy/state tests and production builds pass; see [verification](./FILES_LEARNING_COMMUNICATION_VERIFICATION.md). The [seven-scenario PostgreSQL acceptance suite](../../../lms/lms-backend/test/school-content.e2e.mjs) is prepared and syntax-checked, **NOT RUN** while schema is unapproved. It uses real services, direct database integrity checks, rolled-back fixtures and all-public-table preservation comparisons.

After explicit approval: verify these hashes again, apply only the two named migrations in order with preservation checks before commit, run PostgreSQL acceptance, rerun regressions/builds and continue the remaining Admin roadmap in larger batches. No approval of later schema is implied.

## Final pre-approval security recheck

Rechecked without applying schema: source/compiled/exact UP/DOWN parity PASS; READ ONLY PostgreSQL 18.6 preflight PASS; all 34 application-table hashes/counts match the saved preflight baseline; history remains 21 migrations. Offline content service/HTTP/migration tests rerun **10/10 PASS**; production-source lint PASS.

| Access check | Result | Exact scope |
|---|---|---|
| File ownership | PASS | Uploader identity comes from verified server authentication. Attachment owner must be exactly one existing student or staff UUID; unique owner/slot indexes and restrictive FKs protect associations. Student slots and portrait purpose are validated. A stored file may be reused by an unrestricted admin across owners; links are associations, not per-owner access grants. |
| Upload authorization | PASS | JWT checks the current database user/role and enabled login/session. Admin role guard and service-level enabled unrestricted-admin check apply. Browser mutation proxy also enforces same origin. Identity fields cannot be supplied in DTOs. |
| Private file access | PASS for central Admin scope | Bytes reside in PostgreSQL, not a public static directory. All file metadata/history/link/download endpoints require authorization; unrestricted admins can access all school files. Students, guardians, instructors and restricted admin roles have no access through these APIs. Downloads verify byte length/SHA and use attachment, no-store, nosniff and sandbox headers. No uploader-only or learner-facing ACL is claimed. |
| File size/type | PASS within defined validation | One nonempty file, maximum 5 MiB; multipart interceptor plus service size check, database content-length/size checks, PDF/PNG/JPEG/TXT allowlist, extension/signature checks, bounded image dimensions and UTF-8 text validation. These are signature checks, not a full decoder or malware scan. |
| Notices/materials permissions | PASS for central Admin scope | Reads, writes, archive/restore, options and calendar all require enabled unrestricted admins; versions and actor audit are enforced. Audience/class scope describes the publication but does not expose learner/public access. No external email/SMS dispatch occurs. |

Repository-wide backend lint is **FAIL**: **151 `typescript/no-floating-promises` errors**, plus **one `typescript/unbound-method` and two `typescript/restrict-template-expressions` warnings**. Every diagnostic is in existing test/helper files, none in production source or the new content tests/helper. Most errors are bare `node:test` registrations whose returned promises are not explicitly awaited or marked `void`. The warnings concern an unbound fixture method and template interpolation types in an older migration helper. This fails the repository lint command/any CI gate requiring it; it does not demonstrate failed test execution. Production-source lint passes, the new 10 tests pass, and the previous full test/build results remain as recorded. No lint suppressions or unrelated harness rewrites were added during this review.
