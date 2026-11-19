# Conduct, staff leave and teacher evaluation: approved application

Verified 2026-11-15. **APPLIED after explicit owner approval.** Do not rerun the pre-application helper.

Only `CreateConductStaffAdministration1794751000000` was applied, now actual PostgreSQL history entry **27**. Source, compiled migration and exact reviewed SQL matched before execution:

- [UP SQL](../../../lms/lms-backend/docs/CONDUCT_STAFF_ADMINISTRATION_UP.sql): SHA-256 `031f39309f48f0247a63e99cb0d6a5a0ed4b9a63faf13f84fe432921af72256b`.
- [DOWN SQL](../../../lms/lms-backend/docs/CONDUCT_STAFF_ADMINISTRATION_DOWN.sql): SHA-256 `725498f497e788a25e0c04bb61a30ea038011360b16b0a7231cec439872e1de7`.

## Before COMMIT

PASS: all **55 existing application tables** retained their fresh row counts and full-row SHA-256 values; all **26 earlier migration-history entries** retained exact values. All eight new tables were empty. The helper asserted the exact table count, locked earlier application tables in SHARE mode, and locked migration history against concurrent migration writes. Only the named history row was inserted. No school configuration, legacy mappings or demo data were seeded.

[Application evidence](../../../lms/lms-backend/docs/CONDUCT_STAFF_ADMINISTRATION_APPLICATION.json). The JSON includes the preserved baseline and explicit pre-COMMIT results. It was normalized to UTF-8 after PowerShell initially saved its console output as UTF-16; the SQL artifacts were unchanged.

## PostgreSQL acceptance

**10/10 PASS** across [domain acceptance](../../../lms/lms-backend/test/school-administration.e2e.mjs) and [multi-connection/rollback acceptance](../../../lms/lms-backend/test/school-administration-concurrency.e2e.mjs):

- Conduct creation, request retries, snapshot points, reports, stale decisions and retained void/audit history.
- Leave entitlement/date overlap, generated inclusive days, pending/approved quota reservations, exhausted quota and reductions below reservations, immutable terms, approval/cancellation and released balance.
- Teacher evaluation source/guardian ownership, explicit policy, approval, scale snapshots and approved-only normalized reporting.
- Real JWT/role/DTO guards and unrestricted-actor checks; real persisted HTTP writes and actor history.
- Injected audit failure rolls back the leave write and restores quota.
- Populated DOWN refuses before dropping anything. Empty DOWN is executed inside a transaction and then rolled back, restoring the schema and retaining the applied migration entry.
- Two independent PostgreSQL connections run real service writes. The second waits for the first connection's shared advisory transaction lock; after the first rolls back, the second saves with its atomic audit, then also rolls back. This proves service-write serialization; it is not a claim that committed, raw-SQL multi-session quota races were exercised.

The overlap fixture initially also exceeded quota and correctly failed with 400 before the exclusion constraint. Its second request was shortened to isolate overlap; no service or approved SQL change was needed. Final suites run with `--test-concurrency=1` so schema rollback probes cannot interfere with other fixture suites.

Every fixture remains inside an outer rollback-only transaction. All public-table hashes match afterward. Existing school rows, tokens and prior uncommitted source work were retained; nothing was staged, committed or reset.

## Broader verification and continuation

- PostgreSQL administration/academic/operations/content/student regression: **44/44 PASS**.
- Backend offline/real-guard HTTP: **137/137 PASS**; Vitest **22/22 PASS**.
- Frontend: **159/159 PASS**, including six examination contract/state tests.
- Backend repository-wide lint PASS; focused new frontend/API/audit-script lint PASS. Frontend repository-wide lint **FAIL: 115 existing errors and 86 warnings** across unrelated existing pages and CommonJS test harnesses (initial run before examination changes: 116 errors/91 warnings). Rules were not disabled or weakened.
- Both production builds PASS. Root-module startup PASS. Approved administration read endpoints return 200; future examination endpoints return 503. All **64 public-table hashes** remain unchanged during the probe; the live leave trigger body matches the approved migration.

[Root startup evidence](../../../lms/lms-backend/docs/ADMIN_PANEL_STARTUP.json). Live database: **27 migrations, 63 application tables / 64 public tables including history**, PostgreSQL 18.6.

Final READ ONLY comparison against the actual COMMIT baseline found **54/55 application tables still exactly unchanged**. The remaining table, `refresh_tokens`, had one later-created token and one older token's later revocation. Filtering the new token and undoing only that revocation **in memory** recovered the original 89-token count and exact hash. Both live changes were retained; no tokens were reset, revoked or deleted by the reconciliation. [Post-acceptance preservation evidence](../../../lms/lms-backend/docs/CONDUCT_STAFF_ADMINISTRATION_PRESERVATION.json) and [read-only verifier](../../../lms/lms-backend/test/verify-administration-preservation.mjs). A future approved migration must take a fresh baseline including this activity.

Continuation was implemented in a grouped examination batch: seven existing examination pages, guarded APIs, versioned audit, dated rosters, schedules, attendance, marks and historical grade/pass snapshots. Its [separate SQL review](./EXAMINATION_MIGRATION_REVIEW.md) is ready. `CreateExaminationOperations1794752000000` remains **UNAPPLIED**. Its prepared PostgreSQL acceptance suite has **NOT RUN**; it must wait for explicit approval/application. Other Admin modules and unfinished sub-workflows remain open.
