# Online/Campus integration checklist

2026-11-16. Fifteen routes below are **implemented and offline-tested but migration-gated**, not live persistence accepted.

| Integration | Route | Prepared workflow |
|---|---|---|
| [x] gated | `/admin/online-exam/question-group` | Versioned groups and archive |
| [x] gated | `/admin/online-exam/question-bank` | Real subjects/groups; choice validation; saved keys and marks |
| [x] gated | `/admin/online-exam/exam` | Drafts, snapshots, participant login assignments, publish/close, overdue finalization |
| [x] gated | `/admin/reports/examreports/online-exam-report` | Persisted attempts and result snapshots |
| [x] gated | `/admin/admin-section/setup` | Typed purpose/source/complaint categories |
| [x] gated | `/admin/admin-section/admission-query` | Inquiry CRUD/status and transactional student admission |
| [x] gated | `/admin/admin-section/visitor-book` | Check-in and versioned checkout |
| [x] gated | `/admin/admin-section/phone-log` | Inbound/outbound call records |
| [x] gated | `/admin/admin-section/postal-receive` | Inbound postal records |
| [x] gated | `/admin/admin-section/postal-dispatch` | Outbound postal records |
| [x] gated | `/admin/admin-section/complaint` | Assigned complaints, status and resolution |
| [x] gated | `/admin/dormitory/roomtype` | Room types and archive |
| [x] gated | `/admin/dormitory/dormitory` | Buildings and explicit occupancy policy |
| [x] gated | `/admin/dormitory/dormitoryrooms` | Rooms/capacity, bed assignment and early checkout |
| [x] gated | `/admin/reports/studentreports/student-dormitory-report` | Saved student bed/stay records |

Eight additional legacy routes now reuse approved implementations, with a focused alias regression test:

- [x] `/admin/academic/assign-class-teacher` → existing class-teacher assignment page.
- [x] `/admin/academic/class` → existing class management page.
- [x] `/admin/academic/section` → existing section management page.
- [x] `/admin/human-resource/department` → existing HR departments.
- [x] `/admin/human-resource/designation` → existing HR designations.
- [x] `/admin/human-resource/staff` → existing staff registry.
- [x] `/admin/human-resource/staff/add` → existing staff admission form/attachments.
- [x] `/admin/human-resource/staff-attendance` → existing staff attendance register.

- [ ] Approve/apply exact Online/Campus migration and run live PostgreSQL acceptance before marking the fifteen gated routes persistence accepted.
- [ ] Complete learner-facing delivery UI, retake/essay/proctoring policies if required; inquiry reconciliation; dormitory billing and remaining earlier-domain gaps.
- [ ] Complete certificates/ID cards, bulk printing, remaining reports/settings/external communication, student promotion/export and all other incomplete routes in the [readiness ledger](./ADMIN_ROUTE_READINESS.md).
