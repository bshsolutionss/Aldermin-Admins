# School Currency and Fee Status fixes

Verified on 2026-11-17 against the local Next.js/NestJS/PostgreSQL stack.

## Root causes

The dashboard reads `finance_settings.currency`. When the singleton setting is absent, its summary returns `currency: null` and displays the configuration warning. The warning linked to General Settings, whose form only saved `school_settings` and had no Finance control. A separate existing currency editor was available under Fees and Invoice Settings. No new database column, duplicate setting, API or migration is needed.

The Fee Status card was allocated only two of twelve grid columns at desktop widths, while its container had a fixed 400px height. Wrapped badges/amounts increased the content height beyond the container, pushing Overdue and the footer outside it.

## Changes

- General Settings now contains a Finance Settings section and a required **School Currency** dropdown, including PKR, USD, AED and the browser's supported currency list. Existing saved codes omitted by that list remain selectable. A blank configuration remains blank; no currency is assigned by default.
- General Settings retains all existing school fields, styling and history. Its Save settings action saves school details through the existing API, then saves currency through Finance. The independently versioned APIs retain their existing concurrency rules. Each result is reported separately if only one save succeeds. School details remain editable if Finance is unavailable.
- General Settings and the existing Fees and Invoice Settings page share the currency field and Finance settings hook. A success message requires a successful PUT followed by a fresh GET confirming the selected currency. Conflicts, failures and unconfirmed reads do not produce a success message.
- The warning links directly to the Finance section. Dashboard data still comes from the real no-store summary API. Currency confirmation and browser focus trigger a summary refresh when its provider is mounted; no client flag suppresses the warning.
- Fee Status now has a wider desktop column, a responsive tablet/mobile arrangement, a content-driven minimum height, non-wrapping currency amounts and a wrapping footer. Existing colors, badges, report links and real totals are preserved. Both dashboard URLs use the same corrected layout.
- The backend's existing prohibition on changing currency after monetary records exist is unchanged. No financial transactions, amounts or migrations were changed.

## Changed files

| File | Change |
| --- | --- |
| [General Settings page](../app/admin/settings/general-settings/general-settings-inner/page.tsx) | Currency section and coordinated save/reload |
| [SchoolCurrencyField](../components/modules/settings/SchoolCurrencyField.tsx) | Shared labeled dropdown |
| [useFinanceSettings](../lib/use-finance-settings.ts) | Real API reads/writes, versioning and confirmation |
| [useSchoolSettings](../lib/use-school-settings.ts) | Save returns success/failure for orchestration |
| [FinancePanel](../components/modules/finance/FinancePanel.tsx) | Existing currency screen reuses the shared implementation |
| [DashboardStatus](../components/modules/dashboard/DashboardStatus.tsx) | Configuration link targets the Finance section |
| [Dashboard provider](../lib/use-dashboard.tsx) | Refresh on currency confirmation/focus |
| [FeeStatus](../components/modules/dashboard/FeeStatus.tsx) | Responsive card, amounts and footer |
| [Admin dashboard](../app/admin/page.tsx) | Wider responsive Fee Status column |
| [Dashboard alias](../app/admin/dashboard/page.tsx) | Same responsive layout |
| [Currency regression tests](../tests/settings/currency.test.cjs) | Options, no default, save confirmation/failures, warning and integration |
| [Finance tests](../tests/academics/finance.test.cjs) | Account for shared UI dependencies in the test harness |

## Existing APIs and persistence

| Next.js API | NestJS API relative to `/api/v1` | Purpose |
| --- | --- | --- |
| `GET /api/finance/settings` | `GET /finance/settings` | Load the Finance singleton/currency/version |
| `PUT /api/finance/settings` | `PUT /finance/settings` | Save `{currency, version}` using existing authorization/audit rules |
| `GET/PUT /api/school-settings` | `GET/PUT /school-settings` | Preserve existing school details |
| `GET /api/school-settings/history` | `GET /school-settings/history` | Existing school-settings history |
| `GET /api/admin-dashboard` | `GET /admin-dashboard` | Load actual totals and persisted currency |

An authenticated browser read returned HTTP 200 for Finance settings, school settings and dashboard summary. Currency was already PKR, version 1, when live verification began; it was preserved rather than replaced or assigned as a default. Selecting PKR and submitting the existing General Settings form produced **General Settings are already up to date** and **School currency saved and reloaded**. A subsequent independent page navigation loaded PKR in the dropdown. The dashboard displayed PKR totals and no configuration warning.

Direct PostgreSQL verification used a `BEGIN READ ONLY` transaction and `SELECT currency,version FROM finance_settings WHERE singleton=true`, followed by rollback. It returned **PKR, version 1**. This confirms persistence independently of browser state. No raw database update was performed.

The access session expired later during build checks and temporarily returned 401. The existing session recovery subsequently restored authenticated HTTP 200, with Finance still returning PKR, version 1. Persistence is confirmed after page reload and renewed authentication as well as directly in PostgreSQL. A separate manual logout/password-login cycle was not executed and is not represented as a completed test.

## UI verification

Live browser checks used the real dashboard, without replacing API responses or inserting demonstration rows. At every tested size, the card had no horizontal overflow, all three currency amounts remained on one line, and all badges/amounts/footer stayed within its bounds.

| Viewport width | Fee Status width | Height | Content contained |
| --- | --- | --- | --- |
| 1440px | 262px | 400px | Yes |
| 1280px | 222px | 400px | Yes |
| 1024px | 341px | 400px | Yes |
| 768px | 213px | 400px | Yes |
| 390px | 343px | 360px | Yes |

## Automated checks

- Frontend TypeScript: passed (`tsc --noEmit --incremental false`).
- Frontend production build: passed (`next build`).
- Frontend currency, school-settings, finance, dashboard and transport regression tests: **25 passed**.
- Frontend lint: **0 errors, 42 existing warnings** outside these changes.
- Backend build: passed (`nest build`).
- Backend finance/dashboard unit and HTTP validation/guard tests: **14 passed**. These tests include absent-currency handling, exact monetary strings, authorization and the currency lock after financial records exist.
- Backend lint: passed, with **2 existing warnings** in the operational concurrency test.
- No database integration tests that create, delete or change financial fixtures were run. The live persistence check was read-only and the UI save retained the already-configured PKR value.

Regression tests use isolated fixtures as unit tests; runtime UI data and live verification use the actual backend and database.
