# Admin Configuration: next migration review

2026-11-17. **PASS for the additive schema review; NOT APPLIED. Separate explicit approval required.** This is a two-table profile store for nine settings screens, not completion of every remaining Admin workflow.

Only proposed migration: `CreateAdminConfiguration1794756000000`.

- Exact [UP SQL](../../../lms/lms-backend/docs/ADMIN_CONFIGURATION_UP.sql), SHA-256 `1135434fb4d642be56779615359e8345417f9d478f73821584806c7278117677`.
- Exact [DOWN SQL](../../../lms/lms-backend/docs/ADMIN_CONFIGURATION_DOWN.sql), SHA-256 `7fc00f629520daa48b636e6a59c75eec5b291b7b56efe32808d3891ac145c264`.
- [Source migration](../../../lms/lms-backend/src/database/migrations/1794756000000-CreateAdminConfiguration.ts), [source/compiled/artifact parity and READ ONLY preflight](../../../lms/lms-backend/test/admin-configuration-migration.mjs), [latest preflight](../../../lms/lms-backend/docs/ADMIN_CONFIGURATION_PREFLIGHT.json).

| Safety check | Result |
|---|---|
| Exact SQL and hashes | **PASS:** source and freshly compiled UP/DOWN statements equal the complete review artifacts, including transaction, timeouts, search path and only the named history insert/delete. Raw-file SHA-256 values are pinned by the preflight. |
| Existing school records and history | **PASS, design/preflight:** UP contains CREATE statements only. It creates two new tables, two functions and three triggers. No existing-table DDL/DML, seed, backfill, extension or configuration default. Current PostgreSQL has 31 applied migrations and 106 public tables; this migration and all proposed names are absent. Application must take a new locked baseline over all 105 existing application tables and 31 history entries and compare before/after commit. |
| Foreign keys and uniqueness | **PASS:** scope primary key has nine allowlisted values; every creator/updater/actor references an existing user with DELETE RESTRICT. Audit scope references its parent with DELETE RESTRICT; `(scope,version)` is unique, versions are positive. JSON settings must be objects and at most 8192 bytes. |
| Integrity and audit retention | **PASS, reviewed implementation:** automatic AFTER INSERT/UPDATE trigger writes before/after state and actor in the same transaction. New profiles start at version 1 with matching creator/updater; updates must advance exactly one version and retain scope, creator and creation time. Config deletion and audit UPDATE/DELETE raise 23514. No separate application audit insert can be forgotten. |
| Authorization | **PASS, pre-application checks:** JWT guard verifies actual user role/login policy; service rechecks unrestricted Admin authority inside transactions. Writes acquire the shared Admin lock before authorization and schema checks. Same-origin cookie proxy, strict outer DTO and exact profile field allowlists reject forged actors, unknown fields, credentials and invalid versions/values. A stale version returns 409. |
| Rollback | **PASS, design:** locks both tables, refuses if either has any row, drops child before parent and only its two functions, without CASCADE. Once any profile/audit exists, preserve it and use a forward fix. No DOWN has been run. |
| PostgreSQL | **PASS, static compatibility/READ ONLY prerequisites:** PostgreSQL 18.6, UUID function, PL/pgSQL and CREATE/REFERENCES privileges present; no proposed relation/index/function collisions. This uses ordinary JSONB, FKs and PL/pgSQL trigger syntax. Its DDL and trigger behavior have not been executed. |
| Live configuration persistence/concurrency/trigger/rollback | **PENDING approval/application:** no candidate DDL was executed, including in a scratch schema. Four offline checks and live root API gate checks pass; those do not substitute for post-approval PostgreSQL acceptance. |

## Exact scope and limitations

Nine protected profile forms cover base report display preferences, student/staff terminology, lesson planning terminology/week start, date/number locale and direction, notification channel preferences, email/SMS sender profiles, and receipt heading/footer. The APIs expose the typed field manifest and a clear `installed:false`/unconfigured state while the migration is absent; PUT returns 503 and forms cannot save. Recent history is bounded to the latest 20 changes.

These are **profile records**. Wider consumer wiring remains open: they do not currently translate the application, change student admission/attendance/authorization rules, renumber financial records, activate payment gateways, send email/SMS, or provide a delivery worker. Sender profiles contain no passwords, tokens, SMTP credentials or payment secrets. Provider credentials must remain in the runtime secret configuration; saving a profile is not provider activation. JSON field semantics are validated by the API; unrestricted raw SQL is constrained structurally, not by each profile's field contract.

This approval would authorize **only this exact two-table migration**. It would not authorize external communications, financial postings, changes to existing school configuration, any other migration, or production deployment. School timezone and finance currency remain explicitly owner-configured through their existing screens.

Fresh read-only preflight on this resume again confirms the exact hashes above, 31 prior migrations, 106 public tables and absence of the configuration objects. The separate [operational completion review](./ADMIN_OPERATIONS_MIGRATION_REVIEW.md) now covers the prepared APIs/screens for the eight former placeholders; that migration has its own hashes and also requires explicit approval.

After approval: recheck hashes/history/prerequisites, apply only the explicitly approved named migration with complete locked preservation checks, then run isolated live PostgreSQL create/edit/stale-version/concurrent-writer/audit-trigger/populated-rollback checks and continue remaining modules. Configuration consumer wiring remains open and is not resolved by schema approval alone.
