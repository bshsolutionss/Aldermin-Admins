# School Settings: next migration approval review

**PREPARED ONLY — NOT APPLIED. Separate explicit owner approval required.**

Migration: `CreateSchoolSettings1794500200000`.

Exact [UP SQL](../../../lms/lms-backend/docs/SCHOOL_SETTINGS_UP.sql) and [DOWN SQL](../../../lms/lms-backend/docs/SCHOOL_SETTINGS_DOWN.sql) match the [source migration](../../../lms/lms-backend/src/database/migrations/1794500200000-CreateSchoolSettings.ts) and compiled statements. Both scripts include a transaction, 5-second lock timeout and the exact history insertion/removal.

- UP SHA-256: `be27ceaa1cb543a965a0a1a2a97065e058115671324058a0701d6fd6ba819041`.
- DOWN SHA-256: `49204c99793a7bf016aa987f0d33fb0d6810df90be2a6f66c70431f4e1afbb3d`.

## Exact schema and data preservation

All columns are NOT NULL unless explicitly marked nullable.

| New table | Columns and constraints |
|---|---|
| `school_settings` | `id boolean PRIMARY KEY DEFAULT true CHECK (id=true)` permits at most one record; `school_name varchar(120)` with trimmed-nonblank CHECK; nullable `school_code varchar(30)`, `contact_email varchar(254)`, `contact_phone varchar(32)`, `address varchar(500)`; `timezone varchar(64)` with trimmed-nonblank CHECK; `version integer DEFAULT 1 CHECK >=1`; `created_by uuid`, `updated_by uuid`; `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`. Both actor FKs reference users with ON DELETE RESTRICT. |
| `school_settings_events` | `id uuid PRIMARY KEY DEFAULT uuid_generate_v4()`, `settings_id boolean DEFAULT true`, `actor_id uuid`, `version integer UNIQUE CHECK >=1`, nullable `before_state jsonb`, `after_state jsonb`, `created_at timestamptz DEFAULT now()`. Settings FK references the singleton; actor FK references users; both ON DELETE RESTRICT. |

Totals: **two empty tables, two PKs, one UNIQUE constraint, five CHECKs and four restrictive FKs**. PK/UNIQUE constraints create three supporting unique indexes; no additional explicit index is needed for version-ordered audit pagination.

No existing-table ALTER, extension creation, school-row update/deletion, seed, default school identity or legacy mapping. The migration adds only these tables and its exact one history row. School name/contact/timezone remain unconfigured until an authorized administrator explicitly saves them.

The guarded apply path, only after approval, snapshots every existing application table, applies only this migration and history row in one transaction, refuses commit if any original row count/hash differs, verifies both new tables empty and preserves prior migration history.

## Authorization, versioning and audit

- General Settings and its history require a verified, enabled unrestricted admin. Restricted admins, instructors and students are denied; new permission keys are not added by this migration.
- Saves recheck actor authority under advisory lock `(1401,1)`, shared with role/permission/login changes. Client-supplied actor fields are rejected. The actor comes from the verified request.
- Version 0 creates the first explicit configuration. Subsequent writes must match the saved version; stale writes return 409. Identical input is a no-op without another event. Concurrent initial saves serialize safely.
- API validation checks contact email, field sizes, nonblank school name and named timezones; fixed numeric timezone offsets are rejected. Only a nonblank timezone is enforced by the database CHECK; IANA validity is an application validation.
- A changed save and its before/after event commit atomically. Audit-storage failure rolls the settings update back. Existing user/account/school records are not rewritten by settings saves. There is no delete/reset API.
- The existing General Settings page retains its header/card layout and now uses real form inputs, persisted versions, paginated human-readable history, error/retry states and duplicate-save protection. Failed writes retain the draft. A history-read failure after a successful save is explicitly reported as a history failure while retaining the saved result.
- While unapplied, the API returns 503 and the UI reports a retryable error without invented school data. Partial schema/history or a missing permission prerequisite fails closed.

Scope of this slice: school identity, contact details and timezone persistence. Provider email/SMS/payment settings, holidays/weekends, secure uploads and student foundations remain on the master checklist for subsequent implementation and separately approved migrations.

## Rollback safety

DOWN locks both tables in ACCESS EXCLUSIVE mode and refuses if **either contains any settings or audit record**. If both are empty, it drops only these tables and their own indexes/constraints, then deletes only this exact migration-history row. No CASCADE. Later dependencies abort the transaction instead of being removed. Once configured, preserve settings/history and use a reviewed forward fix or compatible application rollback. Never delete records to force DOWN.

## Verification before approval

| Check | Result |
|---|---|
| Source/compiled/reviewed SQL parity | PASS; hashes above |
| PostgreSQL compatibility, READ ONLY | PASS: PostgreSQL 18.6; public schema; UUID generator; CREATE/REFERENCES privileges |
| Prior migrations/prerequisites | PASS: 17 migrations, latest Admin Permission Roles; both login-policy and all three permission tables present |
| Existing data baseline | PASS: 22 application tables / 23 public tables including history; original school-table hashes match the permission-migration baseline |
| Proposed name collisions | PASS: table/index/constraint names absent |
| Settings offline/validation/migration cases | PASS: 10/10 |
| Settings frontend client/proxy/state cases | PASS: 6/6; full frontend 109/109 |
| Permission PostgreSQL / login PostgreSQL | PASS: 8/8 and 7/7 with Settings code registered |
| Frontend/backend production builds and focused lint | PASS |
| Root module wiring / unapplied endpoint | PASS; permission API 200, Settings API 503 |
| New Settings PostgreSQL acceptance | PREPARED, NOT RUN; separate schema approval required |

Use the [guarded helper](../../../lms/lms-backend/test/school-settings-migration.mjs) without flags for read-only preflight. `--emit-sql` generates review files without connecting to PostgreSQL. Only after separate approval may `--approved-school-settings` apply the exact reviewed UP. Do not use a generic migrate-all command.

After approval, run `npm.cmd run test:school-settings`, which requires empty newly applied settings, uses rolled-back fixtures and verifies every existing table afterward. It covers real HTTP permissions, initial persistence, validation/escalation rejection, stale/no-op writes, versioned audit history, injected audit-storage failure rollback and PostgreSQL singleton/FK constraints. Continue the original master roadmap afterward, with explicit approval before every later migration.
