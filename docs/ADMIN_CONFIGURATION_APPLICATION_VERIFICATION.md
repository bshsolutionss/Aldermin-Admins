# Admin Configuration application and verification

2026-11-17. **`CreateAdminConfiguration1794756000000` was applied to PostgreSQL**, following explicit conditional approval. [Application receipt](../../../lms/lms-backend/docs/ADMIN_CONFIGURATION_APPLICATION.json), [locked baseline](../../../lms/lms-backend/docs/ADMIN_CONFIGURATION_APPLICATION_BASELINE.json).

- UP SHA-256 `1135434fb4d642be56779615359e8345417f9d478f73821584806c7278117677`
- DOWN SHA-256 `7fc00f629520daa48b636e6a59c75eec5b291b7b56efe32808d3891ac145c264`

Source and freshly compiled UP/DOWN SQL matched exact review artifacts. Application took a locked baseline across all 105 existing application tables and 31 prior migration rows under `ACCESS EXCLUSIVE` lock. All row counts and hashes matched before and after COMMIT. The two new tables (`admin_configuration`, `admin_configuration_events`) were created empty. History entry **32** was recorded.

## Live acceptance

- Configuration unit test suite (`test/admin-configuration.unit.mjs`) **4/4 PASS**: profile boundary limits, honest metadata read without persistence, rejection of restricted actors and stale versions, additive trigger audit and populated rollback refusal.
- Configuration e2e persistence suite (`test/admin-configuration.e2e.mjs`) **1/1 PASS**: all nine configuration profiles persist, version increment, trigger audit recording, stale write rejection (409 Conflict), restricted actor block, and independent concurrent writer serialization.
- Frontend configuration suite (`tests/settings/configuration.test.cjs`) **PASS**: settings client sends versioned payloads, proxy requires verified admin cookies, failed writes preserve unsaved input, and duplicate submissions are suppressed.
- Production full-stack acceptance (`docs/ADMIN_COMPLETION_STACK_ACCEPTANCE.json`) **PASS**: all nine profiles (`base`, `student`, `staff`, `lesson-plan`, `language`, `notification`, `email`, `sms`, `payment`) saved, incremented version, and audited through the real Next.js proxy to the NestJS backend and PostgreSQL.

## Nine verified configuration routes

1. `/admin/settings/general-settings/base-setup`
2. `/admin/settings/general-settings/student-settings`
3. `/admin/settings/general-settings/staff-settings`
4. `/admin/settings/general-settings/lesson-plan-setting`
5. `/admin/settings/general-settings/language-settings`
6. `/admin/settings/general-settings/notification-setting`
7. `/admin/settings/general-settings/email-setting`
8. `/admin/settings/general-settings/sms-settings`
9. `/admin/settings/fees-settings/fees-invoice-settings`

All nine routes are unblocked, persistence-tested, and verified end-to-end with real database storage and change history.
