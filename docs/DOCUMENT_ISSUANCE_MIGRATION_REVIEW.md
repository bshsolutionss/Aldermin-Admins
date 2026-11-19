# Certificate / ID issuance: approval review

**Current status (2026-11-17): owner-approved and APPLIED with the exact hashes below. PostgreSQL/full-stack/browser acceptance and preservation PASS. See [application evidence](./DOCUMENT_ISSUANCE_APPLICATION_VERIFICATION.md). The following is the retained pre-application safety review.**

2026-11-17. **PASS for pre-application review. NOT APPLIED. Explicit owner approval required.**

Only proposed migration: `CreateDocumentIssuance1794755000000`.

- Exact [UP SQL](../../../lms/lms-backend/docs/DOCUMENT_ISSUANCE_UP.sql), SHA-256: `974e6538d59f52ed0b9f5f18d34c998dd8b3d1e4bedec5dc3860920c3afcf91a`.
- Exact [DOWN SQL](../../../lms/lms-backend/docs/DOCUMENT_ISSUANCE_DOWN.sql), SHA-256: `b61e80f2578094afc79b3075a5535406739fc1a9a41409e0159704e505d3cdc6`.

These are the existing **six-table** candidate's hashes. They supersede the older three-table draft hashes retained in the historical checkpoint (`ec7b…` / `fe58…`). The resumed work did not modify the candidate migration SQL or regenerate either SQL artifact. Source/compiled/artifact parity and raw-file hashes were rechecked against actual PostgreSQL prerequisites.

## Safety review

| Check | Result and scope |
|---|---|
| Exact UP/DOWN and SHA-256 | **PASS:** complete executable SQL is linked above, including transaction/search-path/timeouts and only the named history insert/delete. Source and compiled migration match. |
| Existing school data | **PASS, reviewed design:** six new tables, indexes, two new functions, six triggers and one new owned identity sequence. No existing-table changes, backfills, updates/deletes, extensions or seeds. Actual history has **30 entries** and **99 application tables**; document migration and relations are absent. |
| Foreign keys / uniqueness | **PASS, reviewed design:** restrictive user/student/staff/file references; composite template/kind/audience FK; exactly one student or staff owner; unique case-insensitive template names per kind/audience, request IDs, verification tokens, serial/document numbers, template audit versions and revocations. Print item FKs and composite PK prevent orphan/duplicate item links. |
| Document integrity | **PASS, service/offline review:** actual registry identity and dated class/guardian fields; explicit inactive-recipient option; exact retry terms; template version checks; immutable issued text/layout/artwork snapshots; bounded dates/expiry; append-only revocations and print audit. Templates cannot change identity and must advance one version. Service validates nested layout, allowed placeholders and PNG/JPEG integrity/size. JSON field structure and print-array/link consistency are service-enforced beyond the database's object/type/FK checks; arbitrary raw SQL is not fully constrained to API contracts. |
| Authorization / auditing | **PASS, offline HTTP and code review:** verified enabled unrestricted Admin, current database role/login access, request-derived actor, strict nested DTOs, same-origin cookie proxy, shared authorization/write lock and atomic batches/audits. No student or staff issuance endpoint. Public verification returns only reference/kind/dates/status, with no recipient/snapshot/artwork. |
| Rollback | **PASS, reviewed design:** locks all six tables, refuses if any template/issue/history/revocation/print row exists, drops children first without CASCADE, then only new functions and named history entry. Empty-only rollback; populated systems require a forward fix. No DOWN was run. |
| PostgreSQL compatibility | **PASS, read-only preflight:** PostgreSQL **18.6**, public schema, CREATE/REFERENCES/PLpgSQL privileges, existing UUID function, readable preservation tables, no RLS-hidden rows, no proposed relation/identity-sequence/function collisions. Generated identity/stored reference syntax reviewed. New DDL, triggers and constraints have **NOT** been executed. |
| Live document acceptance / concurrency / rollback execution | **PENDING approval/application:** prepared 10-scenario persistence/HTTP suite and independent two-connection writer suite are syntax-checked, not run. Offline/frontend tests do not establish live persistence. |

[Fresh preflight](../../../lms/lms-backend/docs/DOCUMENT_ISSUANCE_PREFLIGHT.json), [root-application readiness probe](../../../lms/lms-backend/docs/DOCUMENT_ISSUANCE_READINESS.json), [prepared acceptance](../../../lms/lms-backend/test/document-issuance.e2e.mjs), [prepared concurrency check](../../../lms/lms-backend/test/document-issuance-concurrency.e2e.mjs).

## Implemented workflows and limits

The two existing designers, two issuance screens and two bulk-print routes retain their layouts and now use protected real APIs: student/staff audiences, typed layouts, artwork/signature uploads, previews, pagination/search, versioned edits/history, explicit issuance/expiry dates, revocation, immutable references, print and HTML export. Failed or uncertain requests retain the same retry IDs. Prints wait for fonts/images and require the browser popup to open; their audit records a **request**, not confirmed physical printing.

- Validity/expiry uses **UTC calendar dates**, independently of configured school timezone; reference generation uses one shared identity sequence with `CERT-` / `ID-` prefixes. Rollbacks can leave sequence gaps. No custom numbering/reset policy or expiry extension is implemented; corrections require revocation/new issuance.
- Layout is constrained to three generic font families, size/alignment, dimensions and selected fields, with PNG/JPEG background/signature/portrait snapshots. No arbitrary HTML/CSS/SVG, custom fonts, QR encoding, image-editor coordinates or printer calibration. Browser/device/physical print QA remains open until live issuance is approved.
- Missing guardian/class/profile values remain explicitly unrecorded. Existing students/staff are not modified to fill missing fields. Images are capped at 512 KiB, issuance batches at 50 and print/export requests at 20 documents.
- Verification exposes status/reference by a high-entropy token but does not authenticate the presenter, recall saved/printed copies or currently provide application-level rate limiting.

Root application starts without migrations or seeding. Document reads/public verification return **503**, anonymous Admin reads **401**; dashboard reads **200**. All **100 public-table row hashes and all 30 history rows** remain unchanged during the probe.

## Exact application procedure after explicit approval

1. Recheck both full hashes, source/compiled SQL parity, current history and all prerequisites; stop on any difference. Never invoke a general pending-migrations runner.
2. The prepared [single-migration apply helper](../../../lms/lms-backend/test/apply-document-issuance-approved.mjs) now refuses execution without its explicit approval flag. The flag is only an accidental-execution guard; it does not replace the owner's approval.
3. Acquire the shared Admin write lock and migration lock; use public/pg_temp search path, 5-second lock timeout and 30-second statement timeout. The helper takes ACCESS EXCLUSIVE locks on the 99 existing application tables and migration history while capturing/verifying data; this briefly blocks other reads/writes and aborts on lock timeout.
4. Capture a fresh complete count/full-row SHA-256 baseline and all **30 prior history entries**, including any legitimate authentication activity since earlier probes. Execute only this migration's reviewed UP statements. Verify all original tables/history unchanged and all six new tables empty **before COMMIT**, and add only the named history row.
5. Keep the session's shared lock through a post-COMMIT preservation comparison, then release the connection. If a post-COMMIT check fails, investigate without reverting user data or automatically running DOWN.
6. Run document PostgreSQL acceptance, two-connection serialization and populated rollback refusal using isolated rollback fixtures. Compare every public table afterward; test trigger retention, snapshots, expiry/revocation, exact retries, batch/audit failure, PNG/JPEG assets, print links and public privacy. Then run affected regressions, tests/lint/builds and browser/print QA.
7. Continue all remaining Admin routes in demonstration-priority batches. Every later migration still requires separate explicit approval.

No migration was applied during this resume. Existing school data and all pre-existing uncommitted work were retained. Current test counts and remaining scope are recorded in [resume verification](./ADMIN_DEMO_RESUME_VERIFICATION.md).
