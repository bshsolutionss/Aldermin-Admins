"use client";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import {
  campusApi,
  CampusError,
  type CampusChoice,
  type CampusInput,
  type CampusPage,
  type CampusResource,
  type CampusRow,
} from "@/lib/campus-client";
const field = "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm";
type Spec = {
  key: string;
  label: string;
  choice?: CampusChoice;
  type?: string;
  values?: string[];
  optional?: boolean;
  min?: number;
  max?: number;
};
const choice = (
  key: string,
  label: string,
  kind: CampusChoice,
  optional = false,
): Spec => ({ key, label, choice: kind, optional });
const name: Spec = { key: "name", label: "Name" },
  note: Spec = {
    key: "note",
    label: "Notes",
    type: "textarea",
    optional: true,
  };
const person: Spec[] = [name, { key: "phone", label: "Phone", optional: true }];
const specs: Record<string, Spec[]> = {
  "question-groups": [name],
  questions: [
    choice("groupId", "Question group", "question-groups"),
    choice("subjectId", "Subject", "subjects"),
    { key: "prompt", label: "Question", type: "textarea" },
    { key: "choices", label: "Answer choices (one per line)", type: "choices" },
    {
      key: "correctIndex",
      label: "Correct choice number",
      type: "correct",
      min: 1,
      max: 6,
    },
    { key: "marks", label: "Marks", type: "number", min: 1, max: 1000 },
  ],
  exams: [
    { key: "title", label: "Exam title" },
    choice("assignmentId", "Class / subject / teacher", "allocations"),
    { key: "opensAt", label: "Opens (your local time)", type: "instant" },
    { key: "closesAt", label: "Closes (your local time)", type: "instant" },
    {
      key: "durationMinutes",
      label: "Attempt duration in minutes",
      type: "number",
      min: 1,
      max: 240,
    },
    {
      key: "passPercent",
      label: "Pass percentage",
      type: "number",
      min: 0,
      max: 100,
    },
  ],
  "exam-questions": [
    choice("examId", "Exam", "exams"),
    choice("questionId", "Question for this subject", "questions"),
    {
      key: "position",
      label: "Question order",
      type: "number",
      min: 1,
      max: 100,
    },
  ],
  participants: [
    choice("examId", "Exam", "exams"),
    choice("enrollmentId", "Enrollment in this class", "enrollments"),
    choice("userId", "Student login (explicit assignment)", "users"),
  ],
  "office-catalogs": [
    name,
    {
      key: "kind",
      label: "Category type",
      values: ["purpose", "source", "complaint-type"],
    },
  ],
  inquiries: [
    ...person,
    { key: "email", label: "Email", type: "email", optional: true },
    choice("sourceId", "Inquiry source", "office-catalogs", true),
    choice("classId", "Desired class", "classes", true),
    { key: "inquiryDate", label: "Inquiry date", type: "date" },
    { key: "status", label: "Status", values: ["new", "contacted", "closed"] },
    note,
  ],
  visits: [
    ...person,
    choice("purposeId", "Visit purpose", "office-catalogs", true),
    choice("staffId", "Staff member", "staff", true),
    {
      key: "guestCount",
      label: "Number of visitors",
      type: "number",
      min: 1,
      max: 100,
    },
    { key: "enteredAt", label: "Check-in (your local time)", type: "instant" },
    note,
  ],
  correspondence: [
    name,
    {
      key: "kind",
      label: "Direction",
      values: ["phone-in", "phone-out", "post-in", "post-out"],
    },
    { key: "contact", label: "Phone / postal address", optional: true },
    { key: "reference", label: "Reference", optional: true },
    { key: "subject", label: "Subject" },
    { key: "message", label: "Details", type: "textarea", optional: true },
    { key: "recordDate", label: "Recorded date", type: "date" },
    {
      key: "durationSeconds",
      label: "Call duration in seconds",
      type: "number",
      min: 0,
      max: 86400,
    },
  ],
  complaints: [
    ...person,
    choice("categoryId", "Complaint type", "office-catalogs", true),
    choice("staffId", "Assigned staff", "staff", true),
    { key: "receivedDate", label: "Received date", type: "date" },
    { key: "summary", label: "Complaint", type: "textarea" },
    {
      key: "status",
      label: "Status",
      values: ["open", "in-progress", "resolved"],
    },
    {
      key: "resolution",
      label: "Resolution (required when resolved)",
      type: "textarea",
      optional: true,
    },
  ],
  "room-types": [name],
  buildings: [
    name,
    {
      key: "gender",
      label: "Occupancy policy",
      values: ["male", "female", "mixed"],
    },
    { key: "address", label: "Address", optional: true },
  ],
  rooms: [
    name,
    choice("buildingId", "Dormitory", "buildings"),
    choice("typeId", "Room type", "room-types"),
    {
      key: "capacity",
      label: "Number of beds",
      type: "number",
      min: 1,
      max: 1000,
    },
  ],
  allocations: [
    choice("studentId", "Student", "students"),
    choice("roomId", "Room", "rooms"),
    { key: "bedNo", label: "Bed number", type: "number", min: 1, max: 1000 },
    { key: "startDate", label: "Stay starts", type: "date" },
    { key: "endDate", label: "Stay ends (inclusive)", type: "date" },
    note,
  ],
  status: [
    { key: "status", label: "Exam status", values: ["published", "closed"] },
  ],
  checkout: [
    { key: "leftAt", label: "Check-out (your local time)", type: "instant" },
  ],
  end: [{ key: "endDate", label: "Last occupied date", type: "date" }],
  finalize: [],
  admit: [
    { key: "admissionNo", label: "Admission number" },
    { key: "firstName", label: "First name" },
    { key: "lastName", label: "Last name" },
    { key: "birthDate", label: "Birth date", type: "date" },
    { key: "gender", label: "Gender", values: ["male", "female", "other"] },
    { key: "email", label: "Email", type: "email", optional: true },
    { key: "phone", label: "Phone", optional: true },
  ],
};
const columns: Record<string, string[]> = {
  "question-groups": ["name", "archived"],
  questions: ["prompt", "choices", "correct_index", "marks", "archived"],
  exams: [
    "title",
    "opens_at",
    "closes_at",
    "duration_minutes",
    "pass_percent",
    "status",
  ],
  "exam-questions": [
    "position",
    "prompt",
    "choices",
    "correct_index",
    "marks",
    "archived",
  ],
  participants: ["student_name", "user_id", "enrollment_id", "archived"],
  attempts: [
    "exam_title",
    "student_name",
    "started_at",
    "deadline_at",
    "status",
    "score",
    "max_marks",
    "passed",
  ],
  "office-catalogs": ["kind", "name", "archived"],
  inquiries: [
    "name",
    "phone",
    "email",
    "inquiry_date",
    "status",
    "admitted_student_id",
  ],
  visits: ["name", "phone", "guest_count", "entered_at", "left_at"],
  correspondence: [
    "kind",
    "name",
    "subject",
    "contact",
    "reference",
    "record_date",
    "duration_seconds",
  ],
  complaints: ["name", "received_date", "summary", "status", "resolution"],
  "room-types": ["name", "archived"],
  buildings: ["name", "gender", "address", "archived"],
  rooms: ["building_name", "name", "type_name", "capacity", "archived"],
  allocations: [
    "student_name",
    "room_name",
    "bed_no",
    "start_date",
    "end_date",
    "note",
  ],
  history: ["resource", "record_id", "version", "actor_id", "created_at"],
  answers: ["attempt_id", "exam_question_id", "choice_index", "version"],
};
const snake = (key: string) =>
  key.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const label = (key: string) =>
  key.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
function localDate(value: unknown) {
  if (!value) return "";
  const d = new Date(String(value));
  return Number.isFinite(d.getTime())
    ? new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";
}
function Pager({
  page,
  total,
  change,
  disabled,
}: {
  page: number;
  total: number;
  change: (p: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || page === 1}
        onClick={() => change(page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {page} · {total} records
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || page * 20 >= total}
        onClick={() => change(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
function Choice({
  kind,
  value,
  change,
  disabled,
  optional,
}: {
  kind: CampusChoice;
  value: string;
  change: (id: string) => void;
  disabled: boolean;
  optional: boolean;
}) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0),
    [data, setData] = useState<{
      items: { id: string; label: string }[];
      total: number;
    }>({ items: [], total: 0 }),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      try {
        const result = await campusApi.options(kind, page, search);
        if (active) setData(result);
      } catch (e) {
        if (active) {
          setData({ items: [], total: 0 });
          setError(e instanceof Error ? e.message : "Unable to load choices");
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [kind, page, search, retry]);
  return (
    <div className="space-y-2">
      <input
        aria-label={"Search " + kind}
        className={field}
        placeholder="Search choices"
        value={search}
        disabled={disabled}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <select
        className={field}
        required={!optional}
        value={value}
        disabled={disabled || loading || !!error}
        onChange={(e) => change(e.target.value)}
      >
        <option value="">{optional ? "None" : "Choose a record"}</option>
        {value && !data.items.some((r) => r.id === value) && (
          <option value={value}>Selected: {value}</option>
        )}
        {data.items.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert">
          {error}{" "}
          <button type="button" onClick={() => setRetry((v) => v + 1)}>
            Retry choices
          </button>
        </p>
      )}
      <Pager
        page={page}
        total={data.total}
        change={setPage}
        disabled={disabled || loading}
      />
    </div>
  );
}
type Draft = {
  operation: string;
  resource: CampusResource;
  id?: string;
  input: CampusInput;
};
function blank(
  resource: CampusResource,
  operation: string = resource,
  kind?: string,
  examId?: string,
  roomId?: string,
): Draft {
  const input: CampusInput = {
    version: 0,
    requestId: crypto.randomUUID(),
    name: "",
    archived: false,
    kind: kind ?? "purpose",
    status:
      resource === "complaints"
        ? "open"
        : resource === "inquiries"
          ? "new"
          : "published",
    phone: "",
    email: "",
    note: "",
    reference: "",
    contact: "",
    message: "",
    resolution: "",
    address: "",
    choices: ["", ""],
    correctIndex: 0,
    marks: 1,
    position: 1,
    durationMinutes: 60,
    passPercent: 50,
    guestCount: 1,
    durationSeconds: 0,
    capacity: 1,
    bedNo: 1,
  };
  for (const s of specs[operation] ?? [])
    if (!(s.key in input)) input[s.key] = s.choice && s.optional ? null : "";
  if (examId) input.examId = examId;
  if (roomId) input.roomId = roomId;
  return { resource, operation, input };
}
export default function CampusPanel({
  title,
  resource,
  kind,
  kinds,
  readOnly = false,
  examId,
  roomId,
  embedded = false,
  onDraftChange,
}: {
  title: string;
  resource: CampusResource;
  kind?: string;
  kinds?: string[];
  readOnly?: boolean;
  examId?: string;
  roomId?: string;
  embedded?: boolean;
  onDraftChange?: (dirty: boolean) => void;
}) {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [filterKind, setFilterKind] = useState(kind ?? kinds?.[0] ?? ""),
    [reload, setReload] = useState(0),
    [data, setData] = useState<CampusPage>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [gate, setGate] = useState(false),
    [notice, setNotice] = useState(""),
    [saveError, setSaveError] = useState(""),
    [draft, setDraft] = useState<Draft | null>(null),
    [busy, setBusy] = useState(false),
    [detail, setDetail] = useState<CampusRow | null>(null),
    [tab, setTab] = useState<CampusResource>("exam-questions"),
    [childDirty, setChildDirty] = useState(false);
  const lock = useRef(false);
  useEffect(() => () => onDraftChange?.(false), [onDraftChange]);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      try {
        const result = await campusApi.list(resource, {
          page: String(page),
          pageSize: "20",
          search,
          ...(filterKind ? { kind: filterKind } : {}),
          ...(examId ? { examId } : {}),
          ...(roomId ? { roomId } : {}),
        });
        if (active) {
          setData(result);
          setGate(false);
        }
      } catch (e) {
        if (active) {
          setData({ items: [], total: 0, page: 1, pageSize: 20 });
          setError(e instanceof Error ? e.message : "Unable to load records");
          setGate(e instanceof CampusError && e.status === 503);
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [resource, page, search, filterKind, examId, roomId, reload]);
  const change = (key: string, value: CampusInput[string]) => {
    if (draft) setDraft({ ...draft, input: { ...draft.input, [key]: value } });
  };
  const start = (next: Draft) => {
    setDraft(next);
    setSaveError("");
    setNotice("");
    onDraftChange?.(true);
  };
  const begin = (row: CampusRow, operation: string) => {
    const next = blank(resource, operation, filterKind, examId, roomId);
    next.id = row.id;
    next.input.version = row.version;
    if (operation === "status")
      next.input.status = row.status === "draft" ? "published" : "closed";
    if (operation === "end") next.input.endDate = String(row.end_date);
    start(next);
  };
  const edit = (row: CampusRow) => {
    const next = blank(resource, resource, filterKind, examId, roomId);
    next.id = row.id;
    for (const s of specs[resource] ?? []) {
      const value = row[snake(s.key)];
      if (value !== undefined) next.input[s.key] = value as CampusInput[string];
    }
    next.input.version = row.version;
    next.input.requestId = String(row.request_id ?? next.input.requestId);
    next.input.archived = !!row.archived;
    start(next);
  };
  const locked = !!draft || busy || childDirty,
    mutable = !readOnly,
    editable =
      mutable &&
      !!specs[resource] &&
      !["visits", "allocations"].includes(resource),
    hasActions = mutable && (!!specs[resource] || resource === "attempts");
  const keys = columns[resource] ?? ["id"];
  const header = (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">{embedded ? title : ""}</h2>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading || locked || !!error}
          onClick={() => window.print()}
        >
          Print current page
        </Button>
        {mutable && specs[resource] && (
          <Button
            type="button"
            disabled={loading || gate || locked || !!error}
            onClick={() =>
              start(blank(resource, resource, filterKind, examId, roomId))
            }
          >
            New record
          </Button>
        )}
      </div>
    </div>
  );
  return (
    <div
      className={embedded ? "space-y-6" : "container mx-auto space-y-8 pb-10"}
    >
      {embedded ? (
        header
      ) : (
        <PageHeader
          title={title}
          subtitle="School operations"
          action={header}
        />
      )}
      <AdminCard className="p-6 space-y-4">
        <fieldset disabled={locked} className="flex flex-wrap gap-3">
          <input
            className={field + " max-w-sm"}
            aria-label="Search school records"
            placeholder="Search records"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {kinds && (
            <select
              className={field + " max-w-sm"}
              aria-label="Direction"
              value={filterKind}
              onChange={(e) => {
                setFilterKind(e.target.value);
                setPage(1);
              }}
            >
              {kinds.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setReload((v) => v + 1)}
          >
            Refresh
          </Button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {resource === "exams" && (
          <p className="text-sm text-gray-500">
            Create a draft, add question snapshots and explicitly assign student
            logins, then publish. Published assignments and questions remain
            frozen.
          </p>
        )}
        {loading ? (
          <p role="status">Loading records…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {keys.map((k) => (
                    <th key={k} className="p-3 text-left">
                      {k === "correct_index" ? "Correct choice" : label(k)}
                    </th>
                  ))}
                  {hasActions && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id} className="border-t">
                    {keys.map((k) => (
                      <td key={k} className="p-3">
                        {k === "correct_index"
                          ? Number(row[k]) + 1
                          : Array.isArray(row[k])
                            ? (row[k] as string[])
                                .map((v, i) => `${i + 1}. ${v}`)
                                .join(" | ")
                            : typeof row[k] === "boolean"
                              ? row[k]
                                ? "Yes"
                                : "No"
                              : String(row[k] ?? "—")}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {editable &&
                            !(resource === "exams" && row.status !== "draft") &&
                            !(
                              resource === "inquiries" &&
                              row.status === "admitted"
                            ) && (
                              <Button
                                type="button"
                                variant="outline"
                                disabled={locked || gate}
                                onClick={() => edit(row)}
                              >
                                Edit
                              </Button>
                            )}
                          {resource === "exams" && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={locked}
                                onClick={() => {
                                  setDetail(row);
                                  setTab("exam-questions");
                                }}
                              >
                                Manage exam
                              </Button>
                              {row.status !== "closed" && (
                                <Button
                                  type="button"
                                  disabled={locked || gate}
                                  onClick={() => begin(row, "status")}
                                >
                                  {row.status === "draft"
                                    ? "Publish"
                                    : "Close exam"}
                                </Button>
                              )}
                            </>
                          )}
                          {resource === "inquiries" &&
                            ["new", "contacted"].includes(
                              String(row.status),
                            ) && (
                              <Button
                                type="button"
                                disabled={locked || gate}
                                onClick={() => begin(row, "admit")}
                              >
                                Admit student
                              </Button>
                            )}
                          {resource === "visits" && !row.left_at && (
                            <Button
                              type="button"
                              disabled={locked || gate}
                              onClick={() => begin(row, "checkout")}
                            >
                              Check out
                            </Button>
                          )}
                          {resource === "rooms" && (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={locked}
                              onClick={() => setDetail(row)}
                            >
                              Bed assignments
                            </Button>
                          )}
                          {resource === "allocations" && (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={locked || gate}
                              onClick={() => begin(row, "end")}
                            >
                              End stay
                            </Button>
                          )}
                          {resource === "attempts" &&
                            row.status === "active" && (
                              <Button
                                type="button"
                                disabled={locked || gate}
                                onClick={() => begin(row, "finalize")}
                              >
                                Finalize overdue attempt
                              </Button>
                            )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!data.items.length && !error && (
                  <tr>
                    <td className="p-6 text-center" colSpan={keys.length + 1}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pager
          page={page}
          total={data.total}
          change={setPage}
          disabled={locked || loading}
        />
      </AdminCard>
      {draft && (
        <AdminCard className="p-6">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (lock.current || gate) return;
              lock.current = true;
              setBusy(true);
              setSaveError("");
              try {
                if (draft.operation === "admit")
                  await campusApi.admit(draft.id!, draft.input);
                else if (
                  ["status", "checkout", "end", "finalize"].includes(
                    draft.operation,
                  )
                )
                  await campusApi.action(
                    draft.resource,
                    draft.id!,
                    draft.operation as
                      "status" | "checkout" | "end" | "finalize",
                    draft.input,
                  );
                else
                  await campusApi.save(draft.resource, draft.input, draft.id);
                setDraft(null);
                onDraftChange?.(false);
                setNotice("Record saved");
                setReload((v) => v + 1);
                setDetail(null);
              } catch (e) {
                setSaveError(e instanceof Error ? e.message : "Unable to save");
              } finally {
                lock.current = false;
                setBusy(false);
              }
            }}
          >
            <h2 className="text-lg font-semibold">
              {draft.operation === "admit"
                ? "Create admitted student"
                : draft.operation === "finalize"
                  ? "Finalize using only previously saved answers"
                  : draft.id
                    ? "Update record"
                    : "New record"}
            </h2>
            <fieldset
              disabled={busy}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {(specs[draft.operation] ?? [])
                .filter(
                  (s) =>
                    !(s.key === "examId" && examId) &&
                    !(s.key === "roomId" && roomId),
                )
                .map((s) => (
                  <label key={s.key} className="block space-y-2">
                    <span>{s.label}</span>
                    {s.choice ? (
                      <Choice
                        kind={s.choice}
                        value={String(draft.input[s.key] ?? "")}
                        optional={!!s.optional}
                        disabled={busy}
                        change={(value) =>
                          change(s.key, value || (s.optional ? null : ""))
                        }
                      />
                    ) : s.values ? (
                      <select
                        required
                        className={field}
                        value={String(draft.input[s.key] ?? "")}
                        onChange={(e) => change(s.key, e.target.value)}
                      >
                        <option value="">Choose</option>
                        {s.values.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    ) : ["textarea", "choices"].includes(s.type ?? "") ? (
                      <textarea
                        className={field}
                        required={!s.optional}
                        maxLength={4000}
                        value={
                          s.type === "choices"
                            ? (draft.input[s.key] as string[]).join("\n")
                            : String(draft.input[s.key] ?? "")
                        }
                        onChange={(e) =>
                          change(
                            s.key,
                            s.type === "choices"
                              ? e.target.value.split("\n")
                              : e.target.value,
                          )
                        }
                      />
                    ) : (
                      <input
                        className={field}
                        required={!s.optional}
                        maxLength={
                          s.key === "phone" ? 32 : s.key === "note" ? 2000 : 200
                        }
                        type={
                          s.type === "instant"
                            ? "datetime-local"
                            : s.type === "correct"
                              ? "number"
                              : (s.type ?? "text")
                        }
                        min={s.min}
                        max={s.max}
                        step={
                          s.type === "number" || s.type === "correct"
                            ? 1
                            : undefined
                        }
                        value={
                          s.type === "instant"
                            ? localDate(draft.input[s.key])
                            : s.type === "correct"
                              ? Number(draft.input[s.key]) + 1
                              : String(draft.input[s.key] ?? "")
                        }
                        onChange={(e) =>
                          change(
                            s.key,
                            s.type === "instant"
                              ? e.target.value
                                ? new Date(e.target.value).toISOString()
                                : ""
                              : s.type === "correct"
                                ? Number(e.target.value) - 1
                                : s.type === "number"
                                  ? Number(e.target.value)
                                  : e.target.value,
                          )
                        }
                      />
                    )}
                  </label>
                ))}
              {draft.id &&
                [
                  "question-groups",
                  "questions",
                  "exam-questions",
                  "participants",
                  "office-catalogs",
                  "room-types",
                  "buildings",
                  "rooms",
                ].includes(draft.resource) &&
                !["status", "checkout", "end", "finalize", "admit"].includes(
                  draft.operation,
                ) && (
                  <label>
                    <input
                      type="checkbox"
                      checked={!!draft.input.archived}
                      onChange={(e) => change("archived", e.target.checked)}
                    />{" "}
                    Archived
                  </label>
                )}
            </fieldset>
            {saveError && (
              <p role="alert">{saveError} Your draft is retained.</p>
            )}
            <div className="flex gap-3">
              <Button disabled={busy || gate}>
                {busy ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setDraft(null);
                  setSaveError("");
                  onDraftChange?.(false);
                }}
              >
                Discard draft
              </Button>
            </div>
          </form>
        </AdminCard>
      )}
      {detail && resource === "exams" && (
        <section className="space-y-4">
          <select
            aria-label="Exam management view"
            className={field}
            disabled={locked}
            value={tab}
            onChange={(e) => setTab(e.target.value as CampusResource)}
          >
            <option value="exam-questions">Question snapshots</option>
            <option value="participants">Student login assignments</option>
            <option value="attempts">Attempts and results</option>
          </select>
          <CampusPanel
            key={detail.id + tab}
            title={String(detail.title)}
            resource={tab}
            examId={detail.id}
            readOnly={tab !== "attempts" && detail.status !== "draft"}
            embedded
            onDraftChange={setChildDirty}
          />
        </section>
      )}
      {detail && resource === "rooms" && (
        <CampusPanel
          key={detail.id}
          title={"Bed assignments: " + String(detail.name)}
          resource="allocations"
          roomId={detail.id}
          embedded
          onDraftChange={setChildDirty}
        />
      )}
    </div>
  );
}
