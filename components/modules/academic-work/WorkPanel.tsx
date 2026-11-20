"use client";

import { Input as LmsInput } from "@/components/ui/input";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Button } from "@/components/ui/button";
import {
  academicWorkApi,
  type Allocation,
  type WorkResource,
  type WorkRow,
  type WorkEvent,
  type RosterRow,
  type EvaluationInput,
} from "@/lib/academic-work-client";
import { useAcademicWork } from "@/lib/use-academic-work";
import type { Page } from "@/lib/school-records-client";
const field = "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm";
function scopeLabel(row: Allocation | WorkRow) {
  return [
    row.yearName,
    row.className,
    row.sectionName,
    row.subjectName,
    row.teacherName,
  ]
    .filter(Boolean)
    .join(" · ");
}
function Pager({
  page,
  total,
  onPage,
  disabled = false,
}: {
  page: number;
  total: number;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || page === 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm">
        Page {page} · {total} records
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || page * 20 >= total}
        onClick={() => onPage(page + 1)}
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
  assignmentId = "",
  disabled,
  onChange,
}: {
  kind: "options" | WorkResource;
  value: string;
  label: string;
  assignmentId?: string;
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [data, setData] = useState<Page<Allocation | WorkRow>>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      try {
        const rows =
          kind === "options"
            ? await academicWorkApi.options(page, search)
            : await academicWorkApi.list(
                kind,
                page,
                search,
                false,
                assignmentId,
              );
        if (active) setData(rows);
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Unable to load choices");
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [kind, page, search, assignmentId, retry]);
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <input
        aria-label={"Search " + label}
        className={field}
        placeholder="Search records"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}{" "}
          <button type="button" onClick={() => setRetry((x) => x + 1)}>
            Retry choices
          </button>
        </p>
      ) : null}
      <select
        aria-label={label}
        required
        className={field}
        value={value}
        disabled={disabled || loading || !!error}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{loading ? "Loading…" : "Select a record"}</option>
        {value && !data.items.some((row) => row.id === value) ? (
          <option value={value}>Current selection · {value}</option>
        ) : null}
        {data.items.map((row) => (
          <option key={row.id} value={row.id}>
            {"title" in row ? row.title + " · " : ""}
            {scopeLabel(row)}
          </option>
        ))}
      </select>
      <Pager
        page={page}
        total={data.total}
        onPage={setPage}
        disabled={loading || disabled}
      />
    </fieldset>
  );
}
function History({ resource }: { resource: WorkResource }) {
  const [data, setData] = useState<Page<WorkEvent>>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [shown, setShown] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!shown) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      try {
        const rows = await academicWorkApi.history(resource, page);
        if (active) setData(rows);
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Unable to load history");
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [resource, page, shown, retry]);
  return (
    <AdminCard title="Change history">
      <Button
        variant="outline"
        onClick={() => {
          setShown((x) => !x);
          setRetry((x) => x + 1);
        }}
      >
        {shown ? "Hide history" : "Show history"}
      </Button>
      {shown ? (
        <div>
          {error ? (
            <p role="alert">
              {error}
              <button onClick={() => setRetry((x) => x + 1)}>
                Retry history
              </button>
            </p>
          ) : null}
          {data.items.map((row) => (
            <details className="py-3 border-b" key={row.id}>
              <summary>
                {row.actorName} · {row.resource} · version {row.version} ·{" "}
                {new Date(row.createdAt).toLocaleString()}
              </summary>
              <p>Record: {row.recordId}</p>
              <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
                {[row.beforeState, row.afterState].map((state, i) => (
                  <div key={i}>
                    <strong>{i ? "After" : "Before"}</strong>
                    {state ? (
                      Object.entries(state).map(([key, value]) => (
                        <p key={key} className="text-sm break-words">
                          {key}: {String(value ?? "—")}
                        </p>
                      ))
                    ) : (
                      <p>New record</p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          ))}
          {!loading && !error && !data.total ? (
            <p>No changes recorded.</p>
          ) : null}
          <Pager
            page={page}
            total={data.total}
            onPage={setPage}
            disabled={loading}
          />
        </div>
      ) : null}
    </AdminCard>
  );
}
export function WorkPanel({
  resource,
  title,
  readOnly = false,
}: {
  resource: WorkResource;
  title: string;
  readOnly?: boolean;
}) {
  const h = useAcademicWork(resource);
  const d = h.draft;
  const update = (patch: Partial<typeof d>) =>
    h.setDraft((prev) => ({ ...prev, ...patch }));
  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader title={title} subtitle="Academic planning" />
      {h.error ? (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {h.error}{" "}
          <Button
            variant="outline"
            onClick={() => void h.load()}
            disabled={h.loading || h.saving}
          >
            Retry
          </Button>
        </div>
      ) : null}
      {h.notice ? <p role="status">{h.notice}</p> : null}
      {!readOnly ? (
        <AdminCard title={h.editing ? "Edit record" : "New record"}>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void h.save();
            }}
          >
            <fieldset
              disabled={h.saving || !h.ready}
              className="grid md:grid-cols-2 gap-6"
            >
              <Choice
                key={h.editing ?? "new"}
                kind="options"
                value={d.assignmentId}
                label="Subject allocation"
                disabled={!!h.editing}
                onChange={(id) =>
                  update({ assignmentId: id, lessonId: "", topicId: "" })
                }
              />
              <label className="space-y-2">
                Title
                <input
                  required
                  maxLength={200}
                  className={field}
                  value={d.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </label>
              {resource === "topics" ? (
                <Choice
                  key={d.assignmentId + "lesson"}
                  kind="lessons"
                  value={d.lessonId}
                  label="Lesson"
                  assignmentId={d.assignmentId}
                  disabled={!d.assignmentId || !!h.editing}
                  onChange={(id) => update({ lessonId: id })}
                />
              ) : null}
              {resource === "plans" ? (
                <>
                  <Choice
                    key={d.assignmentId + "topic"}
                    kind="topics"
                    value={d.topicId}
                    label="Topic"
                    assignmentId={d.assignmentId}
                    disabled={!d.assignmentId || !!h.editing}
                    onChange={(id) => update({ topicId: id })}
                  />
                  <label>
                    Planned date
                    <LmsInput
                      required
                      type="date"
                      className={field}
                      value={d.plannedOn}
                      onChange={(e) => update({ plannedOn: e.target.value })}
                    />
                  </label>
                  <label>
                    Status
                    <select
                      className={field}
                      value={d.status}
                      onChange={(e) =>
                        update({
                          status: e.target.value as typeof d.status,
                          completedOn:
                            e.target.value === "completed"
                              ? d.completedOn
                              : null,
                        })
                      }
                    >
                      <option value="planned">Planned</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                  {d.status === "completed" ? (
                    <label>
                      Completed date
                      <LmsInput
                        required
                        type="date"
                        min={d.plannedOn}
                        className={field}
                        value={d.completedOn ?? ""}
                        onChange={(e) =>
                          update({ completedOn: e.target.value })
                        }
                      />
                    </label>
                  ) : null}
                </>
              ) : null}
              {resource === "homework" ? (
                <>
                  <label>
                    Homework date
                    <LmsInput
                      required
                      type="date"
                      className={field}
                      value={d.assignedOn}
                      onChange={(e) => update({ assignedOn: e.target.value })}
                    />
                  </label>
                  <label>
                    Submission deadline
                    <LmsInput
                      required
                      type="date"
                      min={d.assignedOn}
                      className={field}
                      value={d.dueOn}
                      onChange={(e) => update({ dueOn: e.target.value })}
                    />
                  </label>
                  <label>
                    Maximum points
                    <input
                      required
                      type="number"
                      min={1}
                      max={10000}
                      step={1}
                      className={field}
                      value={d.maxPoints}
                      onChange={(e) =>
                        update({ maxPoints: Number(e.target.value) })
                      }
                    />
                  </label>
                </>
              ) : null}
              <label className="md:col-span-2">
                Description
                <textarea
                  maxLength={5000}
                  rows={4}
                  className={field}
                  value={d.description}
                  onChange={(e) => update({ description: e.target.value })}
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={!d.assignmentId}>
                  {h.saving ? "Saving…" : "Save"}
                </Button>
                <Button variant="outline" type="button" onClick={h.cancel}>
                  Clear draft
                </Button>
              </div>
            </fieldset>
          </form>
        </AdminCard>
      ) : null}
      <AdminCard title="Records">
        <div className="flex flex-wrap gap-4">
          <input
            aria-label="Search records"
            className={field + " max-w-md"}
            placeholder="Search title, subject or class"
            value={h.search}
            disabled={h.saving}
            onChange={(e) => {
              h.setSearch(e.target.value);
              h.setPage(1);
            }}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={h.archived}
              disabled={h.saving}
              onChange={(e) => {
                h.setArchived(e.target.checked);
                h.setPage(1);
              }}
            />
            Archived records
          </label>
        </div>
        {h.loading ? <p role="status">Loading…</p> : null}
        <div role="region" aria-label="Scrollable records" tabIndex={0} className="overflow-x-auto">
          <table className="w-full text-sm my-5">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Title / allocation</th>
                <th className="p-3">Details</th>
                {!readOnly ? <th className="p-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {h.data.items.map((row) => (
                <tr className="border-b" key={row.id}>
                  <td className="p-3">
                    <strong>{row.title}</strong>
                    <p>{scopeLabel(row)}</p>
                    <p className="whitespace-pre-wrap">{row.description}</p>
                  </td>
                  <td className="p-3">
                    {resource === "homework" ? (
                      <>
                        {row.assignedOn} → {row.dueOn}
                        <p>
                          {row.evaluatedCount} of {row.targetCount} evaluated ·{" "}
                          {row.maxPoints} points
                        </p>
                      </>
                    ) : resource === "lessons" ? (
                      <>{row.topicCount} active topics</>
                    ) : resource === "topics" ? (
                      <>
                        {row.completedCount} completed / {row.planCount} active
                        plans
                      </>
                    ) : (
                      <>
                        {row.plannedOn} · {row.status}
                        <p>{row.completedOn}</p>
                      </>
                    )}
                  </td>
                  {!readOnly ? (
                    <td className="p-3 space-x-2">
                      <Button
                        variant="outline"
                        disabled={h.saving || !h.ready}
                        onClick={() => h.edit(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        disabled={h.saving || !h.ready}
                        onClick={() => void h.save(row)}
                      >
                        {row.archived ? "Restore" : "Archive"}
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!h.loading && h.ready && !h.data.total ? (
          <p>No records found.</p>
        ) : null}
        <Pager
          page={h.page}
          total={h.data.total}
          onPage={h.setPage}
          disabled={h.loading || h.saving}
        />
      </AdminCard>
      <History resource={resource} />
    </div>
  );
}
export function HomeworkEvaluationPanel() {
  const [homeworkId, setHomeworkId] = useState(""),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [data, setData] = useState<
      (Page<RosterRow> & { homework: WorkRow }) | null
    >(null),
    [draft, setDraft] = useState<EvaluationInput | null>(null),
    [name, setName] = useState(""),
    [loading, setLoading] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);
  const busy = useRef(false),
    sequence = useRef(0);
  const load = useCallback(async () => {
    const token = ++sequence.current;
    setReady(false);
    setError("");
    if (!homeworkId) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const rows = await academicWorkApi.roster(homeworkId, page, search);
      if (token === sequence.current) {
        setData(rows);
        setReady(true);
      }
    } catch (e) {
      if (token === sequence.current)
        setError(e instanceof Error ? e.message : "Unable to load roster");
    } finally {
      if (token === sequence.current) setLoading(false);
    }
  }, [homeworkId, page, search]);
  const invalidate = useCallback(() => {
    ++sequence.current;
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
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current || !draft || !ready) return;
    busy.current = true;
    setSaving(true);
    setError("");
    ++sequence.current;
    try {
      await academicWorkApi.evaluate(homeworkId, draft);
      setDraft(null);
      setNotice("Evaluation saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save evaluation");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title="Homework evaluations"
        subtitle="Enrollment and assignment records"
      />
      <AdminCard title="Choose homework">
        <Choice
          kind="homework"
          label="Homework"
          value={homeworkId}
          disabled={saving || !!draft}
          onChange={(id) => {
            setHomeworkId(id);
            setPage(1);
            setData(null);
            setNotice("");
          }}
        />
      </AdminCard>
      {error ? (
        <p role="alert">
          {error}{" "}
          <Button
            variant="outline"
            disabled={loading || saving}
            onClick={() => void load()}
          >
            Retry
          </Button>
        </p>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
      {data ? (
        <AdminCard
          title={data.homework.title}
          description={scopeLabel(data.homework)}
        >
          <p>
            {data.homework.assignedOn} → {data.homework.dueOn} · maximum{" "}
            {data.homework.maxPoints} points
          </p>
          <input
            aria-label="Search enrolled students"
            className={field}
            placeholder="Search student or roll number"
            value={search}
            disabled={saving}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {loading ? <p>Loading…</p> : null}
          <div className="max-w-full overflow-x-auto" role="region" aria-label="Records table" tabIndex={0}><table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th>Student</th>
                <th>Status / points</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.enrollmentId} className="border-b">
                  <td className="py-4">
                    {row.name}
                    <p>
                      {row.admissionNo} · {row.rollNo}
                    </p>
                  </td>
                  <td>
                    {row.status ?? "Not evaluated"} · {row.points ?? "—"}
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      disabled={saving || !ready || !!draft || data.homework.archived}
                      onClick={() => {
                        if (draft && draft.enrollmentId !== row.enrollmentId)
                          return;
                        setName(row.name);
                        setDraft({
                          enrollmentId: row.enrollmentId,
                          status: row.status ?? "submitted",
                          points: row.points ?? 0,
                          feedback: row.feedback ?? "",
                          evaluatedOn: row.evaluatedOn ?? "",
                          version: row.version,
                        });
                      }}
                    >
                      Evaluate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {ready && !data.total ? (
            <p>No students were enrolled for this homework date.</p>
          ) : null}
          <Pager
            page={page}
            total={data.total}
            onPage={setPage}
            disabled={loading || saving}
          />
        </AdminCard>
      ) : null}
      {draft && data ? (
        <AdminCard title={"Evaluate " + name}>
          <form onSubmit={submit}>
            <fieldset
              disabled={saving || !ready}
              className="grid md:grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <label>
                Status
                <select
                  className={field}
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      status: e.target.value as EvaluationInput["status"],
                      points: e.target.value === "submitted" ? draft.points : 0,
                    })
                  }
                >
                  <option value="submitted">Submitted</option>
                  <option value="missing">Missing</option>
                  <option value="excused">Excused</option>
                </select>
              </label>
              <label>
                Points
                <input
                  required
                  type="number"
                  min={0}
                  max={data.homework.maxPoints}
                  step={1}
                  disabled={draft.status !== "submitted"}
                  className={field}
                  value={draft.points}
                  onChange={(e) =>
                    setDraft({ ...draft, points: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Evaluation date
                <LmsInput
                  required
                  type="date"
                  min={data.homework.assignedOn}
                  className={field}
                  value={draft.evaluatedOn}
                  onChange={(e) =>
                    setDraft({ ...draft, evaluatedOn: e.target.value })
                  }
                />
              </label>
              <label>
                Feedback
                <textarea
                  className={field}
                  maxLength={2000}
                  value={draft.feedback}
                  onChange={(e) =>
                    setDraft({ ...draft, feedback: e.target.value })
                  }
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">
                  {saving ? "Saving…" : "Save evaluation"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </Button>
              </div>
            </fieldset>
          </form>
        </AdminCard>
      ) : null}
      <History resource="homework" />
    </div>
  );
}
