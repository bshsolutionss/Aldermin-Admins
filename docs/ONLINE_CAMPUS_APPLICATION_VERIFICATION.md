# Online/Campus migration application and verification

2026-11-16: owner conditionally approved only CreateOnlineCampusOperations1794754000000. Source, compiled migration and reviewed SQL matched. UP SHA-256: cb57102bcf9fe897264840f0b25733dd899b29a5d705a70dff77981649fe252f; DOWN: 501b6bbe69bad7a7b66022fd2c3c3f64a935efa5a9631054a403c41f79bf1ff4. Read-only PostgreSQL preflight passed.

Migration applied as history ID 30. Locked full-row counts and SHA-256 hashes for all 82 prior application tables and all 29 prior migration records matched before commit; the table hashes also matched afterward. Seventeen new tables were empty. No fixture data was committed. [Machine-readable evidence](../../../lms/lms-backend/docs/ONLINE_CAMPUS_APPLICATION.json).

Live PostgreSQL acceptance: 11/11 scenarios passed. Two real concurrent service writers serialized and retained atomic audit records (1/1); tests rolled back and compared every public table. Affected examination and finance PostgreSQL regressions passed 18/18. Root application startup and protected read probes passed with 100 public tables unchanged, including six Online/Campus reads. [Startup evidence](../../../lms/lms-backend/docs/ADMIN_PANEL_STARTUP.json).

The documented workflow limitations in the [review](./ONLINE_CAMPUS_MIGRATION_REVIEW.md) continue to apply. Route-level verification remains incomplete; this evidence does not establish production readiness. Future migrations require separate approval.
