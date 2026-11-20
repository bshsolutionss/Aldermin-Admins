"use client";

import { Input as LmsInput } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Button } from "@/components/ui/button";
import {
  schoolAdministrationApi,
  administrationFields,
  type AdministrationScope,
  type AdministrationResource,
  type AdministrationRow,
  type AdministrationField,
  type AdministrationDraft,
} from "@/lib/school-administration-client";
import { useSchoolAdministration } from "@/lib/use-school-administration";
import type { Page } from "@/lib/school-records-client";
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm";
const text = (value: unknown) =>
  value === null || value === undefined ? "—" : String(value);
const human = (value: string) =>
  value.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
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
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || page <= 1}
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
  field,
  value,
  draft,
  disabled,
  onChange,
}: {
  field: AdministrationField;
  value: string;
  draft: AdministrationDraft;
  disabled?: boolean;
  onChange: (row: AdministrationRow) => void;
}) {
  const [data, setData] = useState<Page<AdministrationRow>>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const path = field.choices!,
    targetId =
      path === "options/guardians" ? String(draft.studentId ?? "") : "",
    date =
      path === "options/enrollments"
        ? String(draft.occurredOn || draft.reviewedOn || "")
        : "";
  const unavailable = path === "options/guardians" && !targetId;
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active || unavailable) return;
      setLoading(true);
      setError("");
      try {
        const rows = await schoolAdministrationApi.choices(path, {
          page,
          search,
          targetId,
          from: date,
        });
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
  }, [path, page, search, targetId, date, retry, unavailable]);
  if (unavailable)
    return (
      <p className="text-sm text-gray-600">
        Choose a student enrollment before selecting a guardian.
      </p>
    );
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-sm font-medium">{field.label}</legend>
      <input
        aria-label={"Search " + field.label}
        className={inputClass}
        value={search}
        placeholder="Search actual records"
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      {error ? (
        <p role="alert" className="text-red-600">
          {error}{" "}
          <button type="button" onClick={() => setRetry((x) => x + 1)}>
            Retry choices
          </button>
        </p>
      ) : null}
      <select
        required
        aria-label={field.label}
        className={inputClass}
        value={value}
        disabled={disabled || loading || !!error}
        onChange={(e) => {
          const row = data.items.find((row) => row.id === e.target.value);
          if (row) onChange(row);
        }}
      >
        <option value="">{loading ? "Loading…" : "Select a record"}</option>
        {value && !data.items.some((row) => row.id === value) ? (
          <option value={value}>Current selection · {value}</option>
        ) : null}
        {data.items.map((row) => (
          <option key={row.id} value={row.id}>
            {text(row.name ?? row.incidentName ?? row.id)}
            {row.availableDays !== undefined
              ? " · " + text(row.availableDays) + " days available"
              : ""}
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
function History({ resource }: { resource: AdministrationResource }) {
  const [shown, setShown] = useState(false),
    [page, setPage] = useState(1),
    [data, setData] = useState<Page<AdministrationRow>>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!shown) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      try {
        const rows = await schoolAdministrationApi.history(resource, page);
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
  }, [shown, resource, page, retry]);
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
              {error}{" "}
              <button onClick={() => setRetry((x) => x + 1)}>
                Retry history
              </button>
            </p>
          ) : null}
          {loading ? <p>Loading…</p> : null}
          {data.items.map((row) => (
            <details key={row.id} className="border-b py-3">
              <summary>
                {text(row.actorName)} · version {row.version} ·{" "}
                {new Date(String(row.createdAt)).toLocaleString()}
              </summary>
              <p>Record {text(row.recordId)}</p>
              <div className="grid md:grid-cols-2 gap-5">
                {["beforeState", "afterState"].map((key, i) => (
                  <div key={key}>
                    <strong>{i ? "After" : "Before"}</strong>
                    {row[key] && typeof row[key] === "object" ? (
                      Object.entries(row[key] as Record<string, unknown>).map(
                        ([k, v]) => (
                          <p className="text-sm break-words" key={k}>
                            {human(k)}: {text(v)}
                          </p>
                        ),
                      )
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
function decisions(resource: AdministrationResource, row: AdministrationRow) {
  return resource === "conduct" && row.status === "recorded"
    ? ["voided"]
    : resource === "evaluations" && row.status === "pending"
      ? ["approved", "rejected"]
      : resource === "leave" && row.status === "pending"
        ? ["approved", "rejected", "cancelled"]
        : resource === "leave" && row.status === "approved"
          ? ["cancelled"]
          : [];
}
export function AdministrationPanel({
  scope,
  title,
  initialStatus = "all",
  readOnly = false,
}: {
  scope: AdministrationScope;
  title: string;
  initialStatus?: string;
  readOnly?: boolean;
}) {
  const h = useSchoolAdministration(scope, initialStatus),
    resource = scope.startsWith("reports/")
      ? null
      : (scope as AdministrationResource);
  const [review, setReview] = useState<AdministrationRow | null>(null),
    [decision, setDecision] = useState(""),
    [reason, setReason] = useState("");
  const mutable =
    resource &&
    [
      "incidents",
      "leave-types",
      "entitlements",
      "evaluation-settings",
    ].includes(resource);
  const patch = (next: AdministrationDraft) =>
    h.setDraft((before) => ({ ...before, ...next }));
  function fieldControl(field: AdministrationField) {
    const value = h.draft[field.key];
    if (field.key === "guardianId" && h.draft.reviewerKind !== "parent")
      return null;
    const identityLocked =
      !!h.editing &&
      resource === "entitlements" &&
      ["staffId", "typeId", "startDate", "endDate"].includes(field.key);
    if (field.kind === "choice")
      return (
        <Choice
          key={h.editing + field.key + String(h.draft.studentId)}
          field={field}
          value={String(value ?? "")}
          draft={h.draft}
          disabled={identityLocked}
          onChange={(row) => {
            patch({
              [field.key]: row.id,
              ...(field.key === "enrollmentId"
                ? { studentId: String(row.studentId ?? ""), guardianId: null }
                : {}),
            });
          }}
        />
      );
    if (field.kind === "checkbox")
      return (
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => patch({ [field.key]: e.target.checked })}
          />
          {field.label}
        </label>
      );
    if (field.kind === "textarea")
      return (
        <label>
          {field.label}
          <textarea
            rows={3}
            required={!["description", "note"].includes(field.key)}
            className={inputClass}
            maxLength={field.maxLength}
            value={String(value ?? "")}
            onChange={(e) => patch({ [field.key]: e.target.value })}
          />
        </label>
      );
    if (field.kind === "select")
      return (
        <label>
          {field.label}
          <select
            className={inputClass}
            value={String(value)}
            onChange={(e) =>
              patch({ [field.key]: e.target.value, guardianId: null })
            }
          >
            {field.values?.map((v) => (
              <option key={v} value={v}>
                {human(v)}
              </option>
            ))}
          </select>
        </label>
      );
    return (
      <label>
        {field.label}
        <LmsInput
          required
          disabled={identityLocked}
          className={inputClass}
          type={field.kind}
          min={field.min}
          max={field.max}
          step={field.kind === "number" ? 1 : undefined}
          maxLength={field.maxLength}
          value={String(value ?? "")}
          onChange={(e) =>
            patch({
              [field.key]:
                field.kind === "number"
                  ? Number(e.target.value)
                  : e.target.value,
            })
          }
        />
      </label>
    );
  }
  async function submitDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!review) return;
    if (await h.decision(review, decision, reason)) {
      setReview(null);
      setReason("");
    }
  }
  const displayKeys = scope.startsWith("reports/")
    ? ["name", "count", scope === "reports/teachers" ? "percentage" : "points"]
    : resource === "incidents"
      ? ["name", "description", "points"]
      : resource === "leave-types"
        ? ["name", "description"]
        : resource === "entitlements"
          ? [
              "name",
              "startDate",
              "endDate",
              "days",
              "reservedDays",
              "availableDays",
            ]
          : resource === "conduct"
            ? [
                "studentName",
                "className",
                "sectionName",
                "incidentName",
                "occurredOn",
                "points",
                "note",
                "status",
                "decisionReason",
              ]
            : resource === "leave"
              ? [
                  "staffName",
                  "typeName",
                  "startDate",
                  "endDate",
                  "days",
                  "reason",
                  "status",
                  "decisionReason",
                ]
              : resource === "evaluation-settings"
                ? [
                    "allowStudent",
                    "allowParent",
                    "anonymous",
                    "verificationRequired",
                    "maxStars",
                  ]
                : [
                    "staffName",
                    "studentName",
                    "subjectName",
                    "reviewerKind",
                    "reviewedOn",
                    "rating",
                    "maxStars",
                    "comment",
                    "status",
                    "decisionReason",
                  ];
  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title={title}
        subtitle={
          resource === "evaluations"
            ? "Administrator-recorded source reviews"
            : scope.startsWith("reports/")
              ? "Reports from persisted records"
              : "School administration"
        }
      />
      {h.error ? (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {h.error}{" "}
          <Button
            variant="outline"
            disabled={h.loading || h.saving}
            onClick={() => void h.load()}
          >
            Retry
          </Button>
        </div>
      ) : null}
      {h.notice ? <p role="status">{h.notice}</p> : null}
      {resource && !readOnly ? (
        <AdminCard
          title={
            h.editing
              ? "Edit saved record"
              : resource === "evaluation-settings"
                ? "Evaluation policy"
                : "New record"
          }
        >
          {resource === "leave" || resource === "entitlements" ? (
            <p className="mb-4 text-sm">
              Leave uses inclusive calendar days. Pending requests reserve
              quota; cancelled or rejected requests release it.
            </p>
          ) : null}
          {resource === "evaluations" ? (
            <p className="mb-4 text-sm">
              Record a review received from the selected student or guardian.
              The audit identifies the administrator who entered it. This form
              does not sign in as the reviewer.
            </p>
          ) : null}
          {resource === "evaluation-settings" && !h.data.total && h.ready ? (
            <p>
              No evaluation policy has been saved. Saving explicitly creates it.
            </p>
          ) : null}
          {resource === "evaluation-settings" && h.data.total && !h.editing ? (
            <p className="mb-4">
              Choose Edit below to change the saved policy.
            </p>
          ) : null}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void h.save();
            }}
          >
            <fieldset
              disabled={
                h.saving ||
                !h.ready ||
                (resource === "evaluation-settings" &&
                  h.data.total > 0 &&
                  !h.editing)
              }
              className="grid md:grid-cols-2 gap-6"
            >
              {administrationFields[resource].map((field) => (
                <div key={field.key}>{fieldControl(field)}</div>
              ))}
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit">
                  {h.saving
                    ? "Saving…"
                    : h.editing
                      ? "Save changes"
                      : "Save record"}
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
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <input
            aria-label="Search records"
            className={inputClass}
            value={h.search}
            placeholder="Search records"
            disabled={h.saving}
            onChange={(e) => {
              h.setSearch(e.target.value);
              h.setPage(1);
            }}
          />
          {resource &&
          ["incidents", "leave-types", "entitlements"].includes(resource) ? (
            <label className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={h.archived}
                disabled={h.saving}
                onChange={(e) => {
                  h.setArchived(e.target.checked);
                  h.setPage(1);
                }}
              />
              Archived
            </label>
          ) : null}
          {resource &&
          ["conduct", "leave", "evaluations"].includes(resource) ? (
            <label>
              Status
              <select
                aria-label="Status"
                className={inputClass}
                value={h.status}
                disabled={h.saving}
                onChange={(e) => {
                  h.setStatus(e.target.value);
                  h.setPage(1);
                }}
              >
                {(resource === "conduct"
                  ? ["all", "recorded", "voided"]
                  : resource === "leave"
                    ? ["all", "pending", "approved", "rejected", "cancelled"]
                    : ["all", "pending", "approved", "rejected"]
                ).map((v) => (
                  <option key={v} value={v}>
                    {human(v)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {!resource ||
          ["conduct", "entitlements", "leave", "evaluations"].includes(
            resource,
          ) ? (
            <>
              <label>
                From
                <LmsInput
                  aria-label="From date"
                  type="date"
                  className={inputClass}
                  value={h.from}
                  disabled={h.saving}
                  onChange={(e) => {
                    h.setFrom(e.target.value);
                    h.setPage(1);
                  }}
                />
              </label>
              <label>
                To
                <LmsInput
                  aria-label="To date"
                  type="date"
                  className={inputClass}
                  value={h.to}
                  disabled={h.saving}
                  onChange={(e) => {
                    h.setTo(e.target.value);
                    h.setPage(1);
                  }}
                />
              </label>
            </>
          ) : null}
        </div>
        {h.loading ? <p role="status">Loading…</p> : null}
        <div role="region" aria-label="Scrollable records" tabIndex={0} className="overflow-x-auto">
          <table className="w-full text-sm my-5">
            <thead>
              <tr className="text-left border-b">
                {displayKeys.map((k) => (
                  <th key={k} className="p-3 whitespace-nowrap">
                    {k === "percentage" ? "Rating %" : human(k)}
                  </th>
                ))}
                {resource && !readOnly ? (
                  <th className="p-3">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {h.data.items.map((row) => (
                <tr key={row.id} className="border-b align-top">
                  {displayKeys.map((k) => (
                    <td key={k} className="p-3 whitespace-pre-wrap min-w-24">
                      {text(row[k])}
                    </td>
                  ))}
                  {resource && !readOnly ? (
                    <td className="p-3 space-y-2">
                      {mutable ? (
                        <>
                          <Button
                            variant="outline"
                            disabled={h.saving || !h.ready}
                            onClick={() => h.edit(row)}
                          >
                            Edit
                          </Button>
                          {resource !== "evaluation-settings" ? (
                            <Button
                              variant="outline"
                              disabled={h.saving || !h.ready}
                              onClick={() => void h.save(row)}
                            >
                              {row.archived ? "Restore" : "Archive"}
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                      {decisions(resource, row).length ? (
                        <Button
                          variant="outline"
                          disabled={h.saving || !h.ready || !!review}
                          onClick={() => {
                            setReview(row);
                            setDecision(decisions(resource, row)[0]);
                            setReason("");
                          }}
                        >
                          Review decision
                        </Button>
                      ) : null}
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
      {review && resource ? (
        <AdminCard title="Record decision">
          <p>
            Record {review.id} · version {review.version}
          </p>
          <form onSubmit={submitDecision}>
            <fieldset disabled={h.saving || !h.ready} className="space-y-4">
              <label>
                Decision
                <select
                  className={inputClass}
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                >
                  {decisions(resource, review).map((v) => (
                    <option key={v} value={v}>
                      {human(v)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reason
                <textarea
                  required
                  maxLength={2000}
                  className={inputClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">Save decision</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReview(null)}
                >
                  Cancel
                </Button>
              </div>
            </fieldset>
          </form>
        </AdminCard>
      ) : null}
      {resource ? <History resource={resource} /> : null}
    </div>
  );
}
