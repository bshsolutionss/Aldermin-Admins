"use client";
import { AdminCard } from "@/components/common/AdminCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFoundationRecords } from "@/lib/use-foundation-records";
import type { FoundationResource } from "@/lib/admin-foundations-client";
import { FoundationHistory } from "./FoundationHistory";

export function FoundationRecordsPanel({ resource, title, subtitle }: { resource: FoundationResource; title: string; subtitle?: string }) {
  const state = useFoundationRecords(resource);
  const holiday = resource === "holidays";
  const noun = holiday ? "Holiday" : resource === "groups" ? "Group" : "Category";
  return <div className="container mx-auto space-y-8">
    <PageHeader title={title} subtitle={subtitle} />
    {state.error && <div role="alert" className="rounded-xl border border-red-200 p-4 text-destructive">{state.error} <Button variant="outline" disabled={state.saving} onClick={() => void state.reload()}>Reload records</Button></div>}
    {state.notice && <p role="status" className="text-green-700">{state.notice}</p>}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 h-full"><AdminCard className="p-8 h-full flex flex-col">
        <h2 className="mb-6 text-xs font-semibold text-gray-500">{state.editing ? `Edit ${noun}` : holiday ? "Create Holiday" : resource === "groups" ? "Create New Assembly" : "Define Taxonomy"}</h2>
        <form onSubmit={event => { event.preventDefault(); void state.save(); }} className="space-y-6 flex-1">
          <fieldset disabled={state.saving || !state.ready} className="space-y-6">
            <div><Label htmlFor={`${resource}-name`}>{noun} Name *</Label><Input id={`${resource}-name`} value={state.draft.name} required maxLength={120} onChange={event => state.setDraft({ ...state.draft, name: event.target.value })} className="w-full bg-white border-gray-200 py-6 font-bold" /></div>
            {holiday && <><div><Label htmlFor="holiday-start">Start Date *</Label><Input id="holiday-start" type="date" min="1900-01-01" max="9999-12-31" value={state.draft.startDate} required onChange={event => state.setDraft({ ...state.draft, startDate: event.target.value })} /></div><div><Label htmlFor="holiday-end">End Date *</Label><Input id="holiday-end" type="date" min={state.draft.startDate || "1900-01-01"} max="9999-12-31" value={state.draft.endDate} required onChange={event => state.setDraft({ ...state.draft, endDate: event.target.value })} /></div></>}
            <Button type="submit" className="w-full py-6 text-xs font-semibold shadow-lg">{state.saving ? "Saving…" : state.editing ? "Save Changes" : holiday ? "Save Holiday" : resource === "groups" ? "Finalize Assembly" : "Initialize Record"}</Button>
          </fieldset>
          {state.editing && <Button type="button" variant="outline" disabled={state.saving} onClick={state.reset}>Cancel edit</Button>}
        </form>
      </AdminCard></div>
      <div className="lg:col-span-8 h-full space-y-6">
        <div className="flex flex-wrap items-center gap-4"><Input aria-label={`Search ${resource}`} placeholder={`Search ${resource}…`} className="max-w-sm" value={state.search} disabled={state.saving} onChange={event => state.setSearch(event.target.value)} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.archived} disabled={state.saving} onChange={event => state.setArchived(event.target.checked)} />Show archived</label></div>
        <AdminCard className="flex flex-col p-8 overflow-hidden relative"><h2 className="pb-4 mb-4 border-b border-gray-200 text-xs font-semibold text-gray-500">{holiday ? "Holiday Records" : resource === "groups" ? "Assembly Registry" : "Classification Records"}</h2>
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{noun} Name</TableHead>{holiday && <><TableHead>Start Date</TableHead><TableHead>End Date</TableHead></>}<TableHead>Status</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader><TableBody>
            {state.loading ? <TableRow><TableCell colSpan={holiday ? 5 : 3}>Loading records…</TableCell></TableRow> : !state.ready ? <TableRow><TableCell colSpan={holiday ? 5 : 3}>Records could not load. Use Reload records to retry.</TableCell></TableRow> : state.items.length === 0 ? <TableRow><TableCell colSpan={holiday ? 5 : 3}>No matching records found.</TableCell></TableRow> : state.items.map(record => <TableRow key={record.id}><TableCell className="font-bold text-gray-700">{record.name}</TableCell>{holiday && <><TableCell>{record.startDate}</TableCell><TableCell>{record.endDate}</TableCell></>}<TableCell>{record.archived ? "Archived" : "Active"}</TableCell><TableCell><div className="flex justify-center gap-2"><Button size="sm" variant="ghost" disabled={state.saving || !state.ready} onClick={() => state.edit(record)}>Edit</Button><Button size="sm" variant="ghost" disabled={state.saving || !state.ready} onClick={() => void state.archive(record)}>{record.archived ? "Restore" : "Archive"}</Button></div></TableCell></TableRow>)}
          </TableBody></Table></div>
          <div className="flex items-center justify-between gap-3 pt-6"><Button variant="outline" disabled={state.loading || state.saving || state.page <= 1} onClick={() => state.setPage(state.page - 1)}>Previous</Button><span className="text-sm">Page {state.page} · {state.total} records</span><Button variant="outline" disabled={state.loading || state.saving || state.page * state.pageSize >= state.total} onClick={() => state.setPage(state.page + 1)}>Next</Button></div>
        </AdminCard>
      </div>
    </div>
    <FoundationHistory />
  </div>;
}
