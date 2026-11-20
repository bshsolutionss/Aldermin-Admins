"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Button } from "@/components/ui/button";
import {
  examinationsApi,
  type ExamMode,
  type ExamResource,
  type ExamRow,
  type ExamRoster,
  type ExamEvent,
} from "@/lib/examinations-client";
import { useExaminations } from "@/lib/use-examinations";
import type { Page } from "@/lib/school-records-client";
const field = "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm";
function Pager({
  page,
  total,
  change,
  disabled = false,
}: {
  page: number;
  total: number;
  change: (p: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
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
  label,
  onChange,
  disabled = false,
}: {
  kind: "types" | "assessments" | "allocations" | "rooms";
  value: string;
  label: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [data, setData] = useState<Page<{ id: string; label: string }>>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      try {
        const result = await examinationsApi.options(kind, page, search);
        if (active) setData(result);
      } catch (e) {
        if (active) {
          setData({ items: [], total: 0, page: 1, pageSize: 20 });
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
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="font-medium">{label}</legend>
      <input
        className={field}
        aria-label={"Search " + label}
        placeholder={"Search " + label}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <select
        required
        className={field}
        aria-label={label}
        value={value}
        disabled={disabled || loading || !!error}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose {label.toLowerCase()}</option>
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
        disabled={disabled || loading}
        change={setPage}
      />
    </fieldset>
  );
}
function History() {
  const [data, setData] = useState<Page<ExamEvent>>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }),
    [page, setPage] = useState(1),
    [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    if (open)
      void examinationsApi.history(page).then(
        (v) => {
          if (active) {
            setData(v);
            setError("");
          }
        },
        (e) => {
          if (active)
            setError(e instanceof Error ? e.message : "History unavailable");
        },
      );
    return () => {
      active = false;
    };
  }, [open, page, retry]);
  return (
    <AdminCard title="Audit history">
      <Button
        variant="outline"
        onClick={() => {
          setOpen((v) => !v);
          setRetry((v) => v + 1);
        }}
      >
        {open ? "Hide" : "View"} history
      </Button>
      {open && (
        <>
          {error && (
            <p role="alert">
              {error}{" "}
              <button onClick={() => setRetry((v) => v + 1)}>Retry</button>
            </p>
          )}
          {data.items.map((e) => (
            <details className="p-3 border-b" key={e.id}>
              <summary>
                {e.resource} · version {e.version} · {e.actorName} ·{" "}
                {new Date(e.createdAt).toLocaleString()}
              </summary>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  Before
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(e.beforeState, null, 2)}
                  </pre>
                </div>
                <div>
                  After
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(e.afterState, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          ))}
          <Pager page={page} total={data.total} change={setPage} />
        </>
      )}
    </AdminCard>
  );
}
function Registry({ resource }: { resource: ExamResource }) {
  const s = useExaminations(resource),
    d = s.draft,
    disabled = s.saving || !s.ready;
  const text = (
    key:
      "name" | "title" | "description" | "examDate" | "startTime" | "endTime",
    label: string,
    type = "text",
    required = true,
  ) => (
    <label className="block space-y-1">
      {label}
      <input
        className={field}
        type={type}
        required={required}
        maxLength={
          key === "description"
            ? 2000
            : key === "name" && resource === "grades"
              ? 40
              : key === "title"
                ? 200
                : 160
        }
        value={d[key]}
        onChange={(e) => s.setDraft({ ...d, [key]: e.target.value })}
      />
    </label>
  );
  const number = (
    key: "minPercent" | "maxPercent" | "maxMarks" | "passMarks",
    label: string,
    max: number,
  ) => (
    <label className="block space-y-1">
      {label}
      <input
        className={field}
        type="number"
        required
        min={key === "maxMarks" ? 1 : 0}
        max={max}
        step="1"
        value={d[key]}
        onChange={(e) => s.setDraft({ ...d, [key]: Number(e.target.value) })}
      />
    </label>
  );
  const choice = (
    kind: "types" | "allocations" | "assessments" | "rooms",
    key: "typeId" | "assignmentId" | "assessmentId" | "classroomId",
    label: string,
    immutable = false,
  ) => (
    <Choice
      kind={kind}
      value={d[key]}
      label={label}
      disabled={disabled || (immutable && !!s.editing)}
      onChange={(value) => s.setDraft({ ...d, [key]: value })}
    />
  );
  const label = (row: ExamRow) =>
    row.name || row.title || row.assessmentTitle || "Scheduled examination";
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <input
          className={field + " max-w-sm"}
          placeholder="Search saved examinations"
          aria-label="Search saved examinations"
          value={s.search}
          disabled={s.saving}
          onChange={(e) => {
            s.setSearch(e.target.value);
            s.setPage(1);
          }}
        />
        {resource !== "schedules" && (
          <label>
            <input
              type="checkbox"
              checked={s.archived}
              disabled={s.saving}
              onChange={(e) => {
                s.setArchived(e.target.checked);
                s.setPage(1);
              }}
            />{" "}
            Archived
          </label>
        )}
        <Button
          variant="outline"
          disabled={s.saving}
          onClick={() => void s.load()}
        >
          Refresh
        </Button>
      </div>
      {s.error && <p role="alert">{s.error}</p>}
      {s.notice && <p role="status">{s.notice}</p>}
      <div className="grid xl:grid-cols-12 gap-8">
        <AdminCard
          className="xl:col-span-4"
          title={
            s.editing ? "Edit saved examination" : "New examination record"
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void s.save();
            }}
          >
            <fieldset disabled={disabled} className="space-y-4">
              {resource === "types" && (
                <>
                  {text("name", "Name")}
                  {text("description", "Description", "text", false)}
                </>
              )}
              {resource === "grades" && (
                <>
                  {choice("types", "typeId", "Exam type", true)}
                  {text("name", "Grade name")}
                  {number("minPercent", "Minimum whole percentage", 100)}
                  {number("maxPercent", "Maximum whole percentage", 100)}
                  <p className="text-sm">
                    Bands use inclusive whole percentages. Results use the whole
                    percentage rounded down. Unconfigured bands remain ungraded.
                  </p>
                </>
              )}
              {resource === "assessments" && (
                <>
                  {choice("types", "typeId", "Exam type", true)}
                  {choice(
                    "allocations",
                    "assignmentId",
                    "Teacher / subject / class",
                    true,
                  )}
                  {text("title", "Title")}
                  {number("maxMarks", "Maximum whole marks", 10000)}
                  {number("passMarks", "Pass marks", d.maxMarks)}
                </>
              )}
              {resource === "schedules" && (
                <>
                  {choice("assessments", "assessmentId", "Assessment", true)}
                  {choice("rooms", "classroomId", "Classroom")}
                  {text("examDate", "Exam date", "date")}
                  {text("startTime", "Start time", "time")}
                  {text("endTime", "End time", "time")}
                  <p className="text-sm">
                    Uses school-local date and time. The room must fit the dated
                    roster; class and room times cannot overlap.
                  </p>
                </>
              )}
              {resource !== "schedules" && (
                <label>
                  <input
                    type="checkbox"
                    checked={d.archived}
                    onChange={(e) =>
                      s.setDraft({ ...d, archived: e.target.checked })
                    }
                  />{" "}
                  Archived
                </label>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit">{s.saving ? "Saving…" : "Save"}</Button>
                <Button type="button" variant="outline" onClick={s.cancel}>
                  Clear
                </Button>
              </div>
            </fieldset>
          </form>
        </AdminCard>
        <AdminCard className="xl:col-span-8" title="Saved records">
          {s.loading ? (
            <p>Loading…</p>
          ) : s.data.items.length === 0 ? (
            <p>No saved records.</p>
          ) : (
            <div role="region" aria-label="Scrollable records" tabIndex={0} className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-left">Examination</th>
                    <th className="p-3 text-left">Details</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {s.data.items.map((row) => (
                    <tr className="border-t" key={row.id}>
                      <td className="p-3">
                        {label(row)}
                        <div className="text-gray-500">
                          {[
                            row.typeName,
                            row.className,
                            row.sectionName,
                            row.subjectName,
                            row.teacherName,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </td>
                      <td className="p-3">
                        {resource === "grades"
                          ? `${row.minPercent}%–${row.maxPercent}%`
                          : resource === "assessments"
                            ? `${row.maxMarks} marks · pass ${row.passMarks}`
                            : resource === "schedules"
                              ? `${row.examDate} ${row.startTime?.slice(0, 5)}–${row.endTime?.slice(0, 5)} · ${row.roomNumber ?? ""}`
                              : row.description}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          disabled={disabled}
                          onClick={() => s.edit(row)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager
            page={s.page}
            total={s.data.total}
            change={s.setPage}
            disabled={s.saving || s.loading}
          />
        </AdminCard>
      </div>
      <History />
    </>
  );
}
function StudentResult({
  row,
  mode,
  disabled,
  save,
  dirty,
}: {
  row: ExamRoster;
  mode: "attendance" | "marks";
  disabled: boolean;
  save: (input: {
    enrollmentId: string;
    status: string;
    version: number;
    note?: string;
    score?: number | null;
    feedback?: string;
  }) => Promise<boolean>;
  dirty: (id: string, value: boolean) => void;
}) {
  const initialStatus =
      mode === "attendance" ? (row.attendanceStatus ?? "") : (row.status ?? ""),
    initialText =
      mode === "attendance" ? (row.note ?? "") : (row.feedback ?? "");
  const [status, setStatus] = useState(initialStatus),
    [score, setScore] = useState(row.score === null ? "" : String(row.score)),
    [text, setText] = useState(initialText);
  function changed(nextStatus: string, nextScore: string, nextText: string) {
    dirty(
      row.enrollmentId,
      nextStatus !== initialStatus ||
        nextScore !== (row.score === null ? "" : String(row.score)) ||
        nextText !== initialText,
    );
  }
  return (
    <form
      className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3 border-b p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void save({
          enrollmentId: row.enrollmentId,
          status,
          version:
            mode === "attendance" ? row.attendanceVersion : row.markVersion,
          ...(mode === "attendance"
            ? { note: text }
            : {
                score: status === "graded" ? Number(score) : null,
                feedback: text,
              }),
        }).then((ok) => {
          if (ok) dirty(row.enrollmentId, false);
        });
      }}
    >
      <div>
        {row.name}
        <div className="text-xs">
          {row.admissionNo} · Roll {row.rollNo}
        </div>
        {mode === "marks" && (
          <div className="text-xs">
            Attendance: {row.attendanceStatus ?? "Unmarked"}
          </div>
        )}
      </div>
      <select
        className={field}
        aria-label={"Status for " + row.name}
        required
        value={status}
        disabled={disabled}
        onChange={(e) => {
          setStatus(e.target.value);
          changed(e.target.value, score, text);
        }}
      >
        <option value="">Choose status</option>
        {(mode === "attendance"
          ? ["present", "absent", "excused"]
          : ["graded", "absent", "excused"]
        ).map((v) => (
          <option value={v} key={v}>
            {v}
          </option>
        ))}
      </select>
      {mode === "marks" && (
        <input
          className={field}
          aria-label={"Score for " + row.name}
          type="number"
          min="0"
          step="1"
          max={row.maxMarks ?? 10000}
          required={status === "graded"}
          disabled={disabled || status !== "graded"}
          value={score}
          onChange={(e) => {
            setScore(e.target.value);
            changed(status, e.target.value, text);
          }}
        />
      )}
      <input
        className={field}
        aria-label={"Note for " + row.name}
        placeholder={mode === "attendance" ? "Note" : "Feedback"}
        maxLength={2000}
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          changed(status, score, e.target.value);
        }}
      />
      <Button disabled={disabled || !status} type="submit">
        Save
      </Button>
    </form>
  );
}
function Register({ mode }: { mode: "attendance" | "marks" | "report" }) {
  const [assessment, setAssessment] = useState(""),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [revision, setRevision] = useState(0),
    [data, setData] = useState<
      Page<ExamRoster> & { assessment?: ExamRow; schedule?: { date: string } }
    >({ items: [], total: 0, page: 1, pageSize: 20 }),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [ready, setReady] = useState(false),
    [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [dirtyRows, setDirtyRows] = useState<Record<string, boolean>>({});
  const seq = useRef(0),
    busy = useRef(false),
    locked = Object.values(dirtyRows).some(Boolean);
  const load = useCallback(async () => {
    const token = ++seq.current;
    setReady(false);
    setError("");
    if (!assessment) {
      setData({ items: [], total: 0, page: 1, pageSize: 20 });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await examinationsApi.roster(assessment, page, search);
      if (token === seq.current) {
        setData(result);
        setReady(true);
      }
    } catch (e) {
      if (token === seq.current)
        setError(e instanceof Error ? e.message : "Unable to load exam roster");
    } finally {
      if (token === seq.current) setLoading(false);
    }
  }, [assessment, page, search]);
  const invalidate = useCallback(() => {
    ++seq.current;
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return load();
    });
    return () => {
      active = false;
      invalidate();
    };
  }, [load, invalidate]);
  async function save(input: Parameters<typeof examinationsApi.record>[2]) {
    if (busy.current || !ready) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    ++seq.current;
    try {
      await examinationsApi.record(
        assessment,
        mode as "attendance" | "marks",
        input,
      );
      setNotice("Saved.");
      setDirtyRows((rows) => ({ ...rows, [input.enrollmentId]: false }));
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save result");
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  function discard() {
    setDirtyRows({});
    setRevision((v) => v + 1);
    void load();
  }
  const dirty = (id: string, value: boolean) =>
    setDirtyRows((rows) => ({ ...rows, [id]: value }));
  return (
    <>
      <Choice
        kind="assessments"
        value={assessment}
        label="Assessment"
        disabled={saving || locked}
        onChange={(id) => {
          setAssessment(id);
          setPage(1);
          setNotice("");
        }}
      />
      <div className="flex flex-wrap gap-3">
        <input
          className={field + " max-w-sm"}
          aria-label="Search students"
          placeholder="Search students"
          value={search}
          disabled={saving || locked}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Button
          variant="outline"
          disabled={saving || locked}
          onClick={() => void load()}
        >
          Refresh
        </Button>
        {locked && (
          <Button variant="outline" disabled={saving} onClick={discard}>
            Discard unsaved row changes
          </Button>
        )}
      </div>
      {locked && <p>Save or discard row changes before changing the roster.</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <AdminCard
        title={data.assessment?.title ?? "Examination roster"}
        description={
          data.schedule
            ? "Exam date: " + data.schedule.date
            : "Choose a scheduled assessment"
        }
      >
        {loading ? (
          <p>Loading…</p>
        ) : data.items.length === 0 ? (
          <p>No eligible students loaded.</p>
        ) : mode === "report" ? (
          <div role="region" aria-label="Scrollable records" tabIndex={0} className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Attendance</th>
                  <th>Result</th>
                  <th>Score</th>
                  <th>Whole %</th>
                  <th>Grade</th>
                  <th>Pass</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr className="border-t" key={row.enrollmentId}>
                    <td className="p-3">
                      {row.name} · {row.admissionNo}
                    </td>
                    <td>{row.attendanceStatus ?? "Unmarked"}</td>
                    <td>{row.status ?? "Unmarked"}</td>
                    <td>
                      {row.score === null
                        ? "—"
                        : `${row.score}/${row.maxMarks}`}
                    </td>
                    <td>{row.percentage ?? "—"}</td>
                    <td>{row.grade ?? "Unconfigured"}</td>
                    <td>
                      {row.passed === null ? "—" : row.passed ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          data.items.map((row) => (
            <StudentResult
              key={`${row.enrollmentId}-${mode === "attendance" ? row.attendanceVersion : row.markVersion}-${revision}`}
              row={{
                ...row,
                maxMarks: row.maxMarks ?? data.assessment?.maxMarks ?? null,
              }}
              mode={mode}
              disabled={
                saving || !ready || (locked && !dirtyRows[row.enrollmentId])
              }
              save={save}
              dirty={dirty}
            />
          ))
        )}
        <Pager
          page={page}
          total={data.total}
          disabled={saving || loading || locked}
          change={setPage}
        />
      </AdminCard>
      <History />
    </>
  );
}
const titles: Record<ExamMode, string> = {
  types: "Exam types",
  grades: "Marks grades",
  assessments: "Examination setup",
  schedules: "Examination schedules",
  attendance: "Examination attendance",
  marks: "Marks register",
  report: "Examination marksheet",
};
export function ExaminationPanel({ mode }: { mode: ExamMode }) {
  return (
    <div className="container mx-auto space-y-6 pb-10">
      <PageHeader title={titles[mode]} subtitle="School examination records" />
      {["attendance", "marks", "report"].includes(mode) ? (
        <Register key={mode} mode={mode as "attendance" | "marks" | "report"} />
      ) : (
        <Registry key={mode} resource={mode as ExamResource} />
      )}
    </div>
  );
}
