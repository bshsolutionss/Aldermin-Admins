"use client";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FaCertificate, FaIdCard, FaCheck, FaImage, FaSignature } from "react-icons/fa";
import { blankTemplate, documentFields, documentsApi, templateInput, type DocumentField, type DocumentIssue, type DocumentKind, type DocumentTemplate, type TemplateEvent } from "@/lib/documents-client";
import { schoolContentApi } from "@/lib/school-content-client";
import { documentPrintHtml } from "@/lib/document-print";
import type { Page } from "@/lib/school-records-client";
const field = "w-full rounded-2xl border border-gray-200 bg-white p-4 text-xs font-bold outline-none shadow-sm";
const message = (e: unknown) => e instanceof Error ? e.message : "Document request failed";
export function DocumentPager({ page, total, change, disabled = false }: { page: number; total: number; change: (p: number) => void; disabled?: boolean }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 py-4"><Button variant="outline" disabled={disabled || page === 1} onClick={() => change(page - 1)}>Previous</Button><span>Page {page} · {total} records</span><Button variant="outline" disabled={disabled || page * 20 >= total} onClick={() => change(page + 1)}>Next</Button></div>;
}
export function DocumentDesigner({ kind }: { kind: DocumentKind }) {
  const cert = kind === "certificate";
  const [draft, setDraft] = useState(() => blankTemplate(kind)), [editing, setEditing] = useState<string>();
  const [data, setData] = useState<Page<DocumentTemplate>>({ items: [], page: 1, pageSize: 20, total: 0 });
  const [page, setPage] = useState(1), [search, setSearch] = useState(""), [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [available, setAvailable] = useState(false), [artwork, setArtwork] = useState<{background:string|null;signature:string|null}>({background:null,signature:null});
  const [historyId, setHistoryId] = useState(""), [historyPage, setHistoryPage] = useState(1), [history, setHistory] = useState<Page<TemplateEvent> | null>(null), [historyError, setHistoryError] = useState("");
  const busy = useRef(false);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return; setLoading(true);
      try { const result = await documentsApi.templates(kind, page, search); if (active) { setData(result); setAvailable(true); setError(""); } }
      catch (e) { if (active) { setData({ items: [], page: 1, pageSize: 20, total: 0 }); setAvailable(false); setError(message(e)); } }
      finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, [kind, page, search, revision]);
  useEffect(() => {
    let active = true;
    if (historyId) void documentsApi.templateHistory(historyId, historyPage).then(result => { if (active) { setHistory(result); setHistoryError(""); } }, e => { if (active) { setHistory(null); setHistoryError(message(e)); } });
    return () => { active = false; };
  }, [historyId, historyPage, revision]);
  useEffect(() => {
    let active = true;
    void Promise.all([draft.backgroundFileId ? documentsApi.image(draft.backgroundFileId) : Promise.resolve({data:null}),draft.signatureFileId ? documentsApi.image(draft.signatureFileId) : Promise.resolve({data:null})]).then(([background,signature]) => { if(active) setArtwork({background:background.data,signature:signature.data}); },e=>{if(active) {setArtwork({background:null,signature:null});setError(message(e));}});
    return () => {active=false;};
  },[draft.backgroundFileId,draft.signatureFileId]);
  async function upload(file: File | undefined, slot: "backgroundFileId" | "signatureFileId") {
    if (!file || busy.current || !available) return;
    if (file.size > 524288 || !["image/png", "image/jpeg"].includes(file.type)) { setError("Use a PNG or JPEG image up to 512 KiB"); return; }
    busy.current = true; setSaving(true); setError("");
    try { const stored = await schoolContentApi.upload(file, "portrait"); setDraft(d => ({ ...d, [slot]: stored.id })); setNotice("Artwork saved to the existing file library; save the template to use it."); }
    catch (e) { setError(message(e)); } finally { busy.current = false; setSaving(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy.current || loading || !available) return;
    busy.current = true; setSaving(true); setError(""); setNotice("");
    try { const { record } = await documentsApi.saveTemplate(draft, editing); setDraft(templateInput(record)); setEditing(record.id); setRevision(r => r + 1); setNotice("Template saved with version " + record.version); }
    catch (e) { setError(message(e)); } finally { busy.current = false; setSaving(false); }
  }
  const preview: DocumentIssue = { id: "preview", kind, audience: draft.audience, document_no: "PREVIEW", verification_token: "", issued_on: "Preview date", expires_on: null, status: "valid", subject_name: "Preview name", template_name: draft.name, snapshot: { template: { name: draft.name, heading: draft.heading, body: draft.body, version: draft.version, layout: draft.layout }, subject: { fullName: "Preview name", reference: "Preview reference", values: {} }, assets: { ...artwork, portrait: null } } };
  function toggle(f: DocumentField) { setDraft(d => ({ ...d, layout: { ...d.layout, fields: d.layout.fields.includes(f) ? d.layout.fields.filter(v => v !== f) : [...d.layout.fields, f] } })); }
  return <div className="container mx-auto space-y-8">
    <PageHeader title={cert ? "Certificate Templates" : "ID Card Templates"} subtitle={cert ? "Design and manage school certificates" : "Design and manage school ID cards"} />
    {error && <p role="alert">{error} <Button variant="outline" disabled={saving} onClick={() => setRevision(r => r + 1)}>Retry loading</Button></p>}{notice && <p role="status">{notice}</p>}
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      <div className="xl:col-span-5 h-full"><AdminCard className="p-10 flex flex-col h-full bg-gradient-to-br from-white to-secondary/5">
        <h2 className="mb-8 text-xs font-semibold text-gray-500">{cert ? "Honourary Protocol Design" : "Design Token Architecture"}</h2>
        <form className="space-y-6 flex-1" onSubmit={save}><fieldset disabled={saving || loading || !available} className="space-y-4">
          <label className="block text-xs">{cert ? "Accolade" : "Blueprint"} Designation<input required maxLength={160} className={field} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></label>
          <label className="block text-xs">Heading<input required maxLength={200} className={field} value={draft.heading} onChange={e => setDraft(d => ({ ...d, heading: e.target.value }))} /></label>
          <label className="block text-xs">Applicable Tier<select className={field} value={draft.audience} disabled={!!editing} onChange={e => setDraft(d => ({ ...d, audience: e.target.value as "student" | "staff" }))}><option value="student">Student</option><option value="staff">Staff</option></select></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="text-xs">Font family<select className={field} value={draft.layout.font} onChange={e => setDraft(d => ({ ...d, layout: { ...d.layout, font: e.target.value as typeof d.layout.font } }))}><option value="serif">Serif</option><option value="sans-serif">Sans serif</option><option value="monospace">Monospace</option></select></label><label className="text-xs">Font size (pt)<input required type="number" min={8} max={48} className={field} value={draft.layout.fontSize} onChange={e => setDraft(d => ({ ...d, layout: { ...d.layout, fontSize: Number(e.target.value) } }))} /></label></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{(["widthMm", "heightMm"] as const).map(key => <label className="text-xs" key={key}>{key === "widthMm" ? "Width (mm)" : "Height (mm)"}<input required type="number" min={40} max={320} className={field} value={draft.layout[key]} onChange={e => setDraft(d => ({ ...d, layout: { ...d.layout, [key]: Number(e.target.value) } }))} /></label>)}</div>
          <label className="block text-xs">Narrative Body<textarea maxLength={4000} className={field + " min-h-[120px]"} value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} /></label>
          <p className="text-xs text-gray-500">Use placeholders such as {"{{fullName}}"} and {"{{reference}}"}. Missing registry values print as “Not recorded”.</p>
          <div className="grid grid-cols-3 gap-2">{(["left", "center", "right"] as const).map(align => <Button key={align} type="button" variant="outline" aria-pressed={draft.layout.align === align} className={draft.layout.align === align ? "bg-secondary/10 border-secondary/20" : ""} onClick={() => setDraft(d => ({ ...d, layout: { ...d.layout, align } }))}>{align}</Button>)}</div>
          <div className="grid grid-cols-2 gap-2">{Object.entries(documentFields).map(([key, label]) => <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border text-xs" key={key}>{label}<input type="checkbox" checked={draft.layout.fields.includes(key as DocumentField)} onChange={() => toggle(key as DocumentField)} /></label>)}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">{(["backgroundFileId", "signatureFileId"] as const).map(slot => <div key={slot} className="p-4 rounded-2xl border border-dashed border-gray-200 text-xs"><label className="flex flex-col gap-2">{slot === "backgroundFileId" ? <FaImage /> : <FaSignature />}{slot === "backgroundFileId" ? (cert ? "Background artwork" : "Background artwork") : (cert ? "Signature" : "Signature")}<input aria-label={slot === "backgroundFileId" ? "Background artwork" : "Signature artwork"} type="file" accept="image/png,image/jpeg" onChange={e => void upload(e.target.files?.[0], slot)} /></label>{draft[slot] && <><p className="break-all">Library asset: {draft[slot]}</p><Button type="button" variant="outline" onClick={() => setDraft(d => ({ ...d, [slot]: null }))}>Remove</Button></>}</div>)}</div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.archived} onChange={e => setDraft(d => ({ ...d, archived: e.target.checked }))} />Archived (preserves issued documents)</label>
          <Button type="submit" className="w-full h-16 bg-secondary hover:bg-secondary/90 text-white rounded-2xl text-xs"><FaCheck className="mr-2" />{saving ? "Saving…" : editing ? "Save Template Version" : cert ? "Canonize Accolade Design" : "Establish Blueprint"}</Button>
          <Button type="button" variant="outline" onClick={() => { setDraft(blankTemplate(kind)); setEditing(undefined); setNotice(""); }}>New template</Button>
        </fieldset></form>
      </AdminCard></div>
      <div className="xl:col-span-7 space-y-6"><label className="block text-xs">Search template registry<input className={field} value={search} disabled={saving} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label>
        <AdminCard className="flex flex-col"><div className="p-8 border-b"><h2 className="text-xs font-semibold text-gray-500">Institutional Template Registry</h2></div>{loading ? <p className="p-8">Loading templates…</p> : <Table><TableHeader><TableRow><TableHead>Identity</TableHead><TableHead>Tier / Version</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{data.items.map(row => <TableRow key={row.id}><TableCell>{cert ? <FaCertificate /> : <FaIdCard />}{row.name}{row.archived ? " (archived)" : ""}</TableCell><TableCell>{row.audience} · v{row.version}</TableCell><TableCell><Button variant="outline" disabled={saving} onClick={() => { setDraft(templateInput(row)); setEditing(row.id); setNotice(""); }}>Edit {row.name}</Button><Button variant="ghost" disabled={saving} onClick={() => { setHistoryId(row.id); setHistoryPage(1); setHistory(null); }}>History</Button></TableCell></TableRow>)}</TableBody></Table>}{!loading && !data.items.length && <p className="p-8">No templates found.</p>}<DocumentPager page={page} total={data.total} change={setPage} disabled={saving || loading} /></AdminCard>
        <AdminCard className="p-6"><h2 className="text-xs font-semibold text-gray-500 mb-4">Layout Preview · Artwork is shown in issued print copies</h2><iframe title="Document layout preview" sandbox="" className="w-full h-96 border rounded-xl" srcDoc={documentPrintHtml([preview], "https://preview.invalid", true)} /></AdminCard>
        {historyId && <AdminCard className="p-6"><h2>Template History</h2>{historyError && <p role="alert">{historyError}</p>}{!history && !historyError && <p>Loading history…</p>}{history?.items.map(event => <details key={event.id}><summary>Version {event.version} · {event.actor_name} · {event.created_at}</summary><pre className="overflow-auto text-xs">{JSON.stringify({ before: event.before_state, after: event.after_state }, null, 2)}</pre></details>)}<DocumentPager page={historyPage} total={history?.total ?? 0} change={setHistoryPage} /></AdminCard>}
      </div>
    </div>
  </div>;
}
