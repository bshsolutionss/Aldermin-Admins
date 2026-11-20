"use client";

import { Input as LmsInput } from "@/components/ui/input";

import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { useSchoolSettings } from "@/lib/use-school-settings";
import { useFinanceSettings } from "@/lib/use-finance-settings";
import { SchoolCurrencyField } from "@/components/modules/settings/SchoolCurrencyField";
import { useRef } from "react";

const labels = { schoolName: "School name", schoolCode: "School code", contactEmail: "Contact email", contactPhone: "Contact phone", address: "Address", timezone: "Timezone" } as const;

export default function GeneralSettingsInnerPage() {
  const state = useSchoolSettings();
  const finance = useFinanceSettings();
  const submitting = useRef(false);
  const saving = state.saving || finance.saving;
  async function save() {
    if (submitting.current) return;
    submitting.current = true;
    try {
      // The APIs have independent versions. Report each result explicitly if only one save succeeds.
      if (await state.save() && finance.ready) await finance.save();
    } finally { submitting.current = false; }
  }
  const button = "rounded-lg border px-4 py-2 disabled:opacity-50";
  return (
    <div className="space-y-6">
      <PageHeader 
        title="General Settings" 
        subtitle="Configure and manage general settings"
      />
      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{state.error}</p>}
      {state.notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-700">{state.notice}</p>}
      {finance.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">School Currency: {finance.error}</p>}
      {finance.notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-700">{finance.notice}</p>}
      <button className={button} disabled={state.loading || finance.loading || saving} onClick={() => { void state.reload(); finance.reload(); }}>Reload saved settings</button>
      {state.loading && <p role="status">Loading General Settings…</p>}
      <AdminCard>
        {state.ready && <form className="space-y-5 p-6" onSubmit={event => { event.preventDefault(); void save(); }}>
          {!state.settings && <p className="text-sm text-gray-600">School details have not been configured. Save the details below to set them up.</p>}
          <fieldset disabled={saving} className="grid gap-5 md:grid-cols-2">
            {Object.entries(labels).map(([key, label]) => {
              const field = key as keyof typeof labels;
              return <label className="block space-y-2" key={field}><span>{label}{field === "schoolName" || field === "timezone" ? " *" : ""}</span>
                {field === "address" ? <textarea className="block w-full rounded-lg border p-2" maxLength={500} value={state.draft.address ?? ""} onChange={event => state.setDraft(current => ({ ...current, address: event.target.value || null }))} /> :
                  <LmsInput className="block w-full rounded-lg border p-2" type={field === "contactEmail" ? "email" : "text"} required={field === "schoolName" || field === "timezone"} maxLength={{ schoolName: 120, schoolCode: 30, contactEmail: 254, contactPhone: 32, timezone: 64 }[field]} placeholder={field === "timezone" ? "Asia/Karachi" : undefined} value={state.draft[field] ?? ""} onChange={event => state.setDraft(current => ({ ...current, [field]: event.target.value || (field === "schoolName" || field === "timezone" ? "" : null) }))} />}
                {field === "timezone" && <span className="block text-sm text-gray-500">Enter a named timezone, such as Asia/Karachi or UTC.</span>}
              </label>;
            })}
          </fieldset>
          <section id="finance-settings" className="space-y-4 border-t pt-5">
            <h2 className="font-semibold">Finance Settings</h2>
            {finance.loading && <p role="status">Loading school currency…</p>}
            <div className="grid gap-5 md:grid-cols-2">
              <SchoolCurrencyField value={finance.currency} onChange={finance.setCurrency} disabled={saving || !finance.ready} />
            </div>
          </section>
          <button className={button} disabled={saving || (finance.ready && !finance.currency)} type="submit">{saving ? "Saving…" : "Save settings"}</button>
        </form>}
      </AdminCard>
      {state.ready && <AdminCard><div className="space-y-4 p-6"><h2 className="font-semibold">Change history</h2>
        {!state.history.items.length && <p>No saved changes yet.</p>}
        {state.history.items.map(item => <details className="rounded-lg border p-3" key={item.id}><summary>Version {item.version} · {item.actorName} · {new Date(item.createdAt).toLocaleString()}</summary><dl className="mt-3 space-y-2">
          {Object.entries(labels).filter(([key]) => item.beforeState?.[key as keyof typeof labels] !== item.afterState[key as keyof typeof labels]).map(([key, label]) => <div key={key}><dt className="font-medium">{label}</dt><dd className="break-words text-sm">{item.beforeState?.[key as keyof typeof labels] || "Not set"} → {item.afterState[key as keyof typeof labels] || "Not set"}</dd></div>)}
        </dl></details>)}
        <div className="flex items-center gap-3"><button className={button} disabled={saving || state.history.page <= 1} onClick={() => void state.loadHistory(state.history.page - 1)}>Previous</button><span>Page {state.history.page} · {state.history.total} changes</span><button className={button} disabled={saving || state.history.page * state.history.pageSize >= state.history.total} onClick={() => void state.loadHistory(state.history.page + 1)}>Next</button></div>
      </div></AdminCard>}
    </div>
  );
}
