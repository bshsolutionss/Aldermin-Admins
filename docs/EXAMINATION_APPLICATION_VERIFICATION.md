# Examination Operations application and acceptance

Applied 2026-11-16 after explicit approval of **only** `CreateExaminationOperations1794752000000`, conditional on exact reviewed SQL/hashes and passing safety checks. History entry: **28**.

- UP SHA-256: `bfa2b941c5ef347c9870d3f8d24f6329e794929e3a0daa05aae6e275bedd9725`.
- DOWN SHA-256: `272747cb8384d6d3fa99e2cd113d5423866cc0aec66790b7bb6fb21b69257573`.
- Fresh READ ONLY prerequisite checks, source/compiled/reviewed SQL parity and both pinned hashes passed before application.
- Only the named migration executed, in one transaction with bounded lock/statement timeouts. No general migration runner, synchronize, seeds, inferred settings, existing-row updates/deletes, or DOWN execution.
- Lock all 63 pre-existing application tables and migration history; capture fresh full-row count/SHA-256 baseline. Before COMMIT, all 63 tables and all 27 prior history entries match exactly, and all seven examination tables are empty. Fresh post-COMMIT comparison also passes.

Machine evidence: [application report](../../../lms/lms-backend/docs/EXAMINATION_APPLICATION.json), [fresh application baseline](../../../lms/lms-backend/docs/EXAMINATION_APPLICATION_BASELINE.json). The [single-use apply helper](../../../lms/lms-backend/test/apply-examination-approved.mjs) cannot apply again: its READ ONLY preflight requires the pre-application history and absent proposed tables.

Final READ ONLY reconciliation after acceptance and finance preparation: **PASS**. All 63 original application tables still match that exact fresh application baseline, all 27 earlier history rows are unchanged, and all seven examination tables are empty after fixture rollback. [Final preservation evidence](../../../lms/lms-backend/docs/EXAMINATION_PRESERVATION.json).

## Live acceptance

[PostgreSQL examination suite](../../../lms/lms-backend/test/examinations.e2e.mjs): **8/8 PASS**. Tests cover real allocation choices, restricted-actor denial, grade-band exclusions, assessment ownership and exact retries, room/class overlap, dated attendance, whole marks, optimistic versions, saved grade/pass snapshots, absence without fabricated scores, actor audits, audit-failure rollback, populated DOWN refusal and real HTTP validation/persistence. All fixtures roll back; every public-table hash matches after teardown.

Affected PostgreSQL administration/concurrency, academic work, library/inventory, content/files and student/attendance regression: **44/44 PASS**, with rolled-back fixtures and preservation assertions.

Root-app HTTP/read probe: **PASS** across **71 public tables**, all row hashes unchanged. Examination reads now return **200**. Newly prepared finance reads return **503** until separately approved. Live approved leave-trigger body still matches its reviewed source. No login/refresh calls or token rotation during the probe.

Fresh focused examinations backend **13/13**, frontend **6/6** passed before application. After continuation: backend offline/HTTP **148/148**, Vitest **22/22**, frontend **165/165**, backend and frontend production builds passed. Finance live acceptance remains pending its separate approval. These checks do not establish completion of the entire Admin Panel.

School timezone still requires owner configuration in General Settings. No invented school settings or demo data were committed. Uncommitted work in both repositories is retained.
