"use client";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { documentsApi, type DocumentChoice, type DocumentHistory, type DocumentIssue, type DocumentKind, type DocumentSummary, type DocumentTemplate, type IssueInput } from "@/lib/documents-client";
import { documentPrintHtml, renderPrintWindow } from "@/lib/document-print";
import { DocumentPager } from "./DocumentDesigner";
import type { Page } from "@/lib/school-records-client";
const field = "w-full rounded-2xl border border-gray-200 bg-white p-4 text-xs font-bold outline-none shadow-sm";
const empty = <T,>(): Page<T> => ({ items: [], page: 1, pageSize: 20, total: 0 });
const message = (e: unknown) => e instanceof Error ? e.message : "Document operation failed";

export function DocumentWorkspace({ kind, bulk = false }: { kind: DocumentKind; bulk?: boolean }) {
  const cert = kind === "certificate";
  const [templates, setTemplates] = useState(empty<DocumentTemplate>), [templatePage, setTemplatePage] = useState(1), [templateSearch, setTemplateSearch] = useState("");
  const [template, setTemplate] = useState<DocumentTemplate | null>(null), [templateError, setTemplateError] = useState("");
  const [subjects, setSubjects] = useState(empty<DocumentChoice>), [subjectPage, setSubjectPage] = useState(1), [subjectSearch, setSubjectSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, { requestId: string; name: string }>>({});
  const [issuedOn, setIssuedOn] = useState(() => new Date().toISOString().slice(0, 10)), [expiresOn, setExpiresOn] = useState("");
  const [includeInactive,setIncludeInactive] = useState(false);
  const [issues, setIssues] = useState(empty<DocumentSummary>), [issuePage, setIssuePage] = useState(1), [issueSearch, setIssueSearch] = useState("");
  const [printIds, setPrintIds] = useState<string[]>([]), [history, setHistory] = useState(empty<DocumentHistory>), [historyPage, setHistoryPage] = useState(1);
  const [detail, setDetail] = useState<DocumentIssue | null>(null), [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true), [issueLoading, setIssueLoading] = useState(true), [error, setError] = useState(""), [issueError, setIssueError] = useState(""), [historyError, setHistoryError] = useState("");
  const [busy, setBusy] = useState(false), [pending, setPending] = useState(false), [notice, setNotice] = useState(""), [revision, setRevision] = useState(0);
  const lock = useRef(false), batch = useRef<IssueInput[] | null>(null), printRequest = useRef<{ key: string; id: string } | null>(null), revokeRequest = useRef<{ key: string; id: string } | null>(null), detailSequence = useRef(0);
  useEffect(() => {
    let active = true;
    if (!bulk) void documentsApi.templates(kind, templatePage, templateSearch).then(result => { if (active) { setTemplates(result); setTemplateError(""); } }, e => { if (active) { setTemplates(empty()); setTemplateError(message(e)); } });
    return () => { active = false; };
  }, [kind, templatePage, templateSearch, bulk, revision]);
  const audience = template?.audience ?? "student";
  useEffect(() => {
    let active = true;
    if (!bulk) void Promise.resolve().then(async () => {
      if (!active) return; setLoading(true);
      try { const result = await documentsApi.subjects(audience, subjectPage, subjectSearch,includeInactive); if (active) { setSubjects(result); setError(""); } }
      catch (e) { if (active) { setSubjects(empty()); setError(message(e)); } } finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, [audience, subjectPage, subjectSearch, bulk, revision,includeInactive]);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return; setIssueLoading(true);
      try { const result = await documentsApi.issues(kind, issuePage, issueSearch); if (active) { setIssues(result); setIssueError(""); } }
      catch (e) { if (active) { setIssues(empty()); setIssueError(message(e)); } } finally { if (active) setIssueLoading(false); }
    });
    return () => { active = false; };
  }, [kind, issuePage, issueSearch, revision]);
  useEffect(() => {
    let active = true;
    void documentsApi.history(kind, historyPage).then(result => { if (active) { setHistory(result); setHistoryError(""); } }, e => { if (active) { setHistory(empty()); setHistoryError(message(e)); } });
    return () => { active = false; };
  }, [kind, historyPage, revision]);
  function chooseTemplate(row: DocumentTemplate | null) {
    setTemplate(row); setSelected({}); setSubjectPage(1); setSubjectSearch(""); setNotice("");
  }
  async function issue(event: React.FormEvent) {
    event.preventDefault(); if (lock.current || !template || !Object.keys(selected).length) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    if (!batch.current) batch.current = Object.entries(selected).map(([subjectId, value]) => ({ subjectId, requestId: value.requestId, templateId: template.id, templateVersion: template.version, issuedOn, expiresOn: expiresOn || null,allowInactive:includeInactive }));
    setPending(true);
    try { const result = await documentsApi.issue(batch.current); setSelected({}); batch.current = null; setPending(false); setRevision(r => r + 1); setNotice(`${result.items.length} document(s) issued and recorded. Select them below for printing.`); }
    catch (e) { setError(message(e)); } finally { lock.current = false; setBusy(false); }
  }
  async function view(id: string) {
    const seq = ++detailSequence.current; setDetail(null); setReason(""); setIssueError("");
    try { const result = await documentsApi.get(id); if (seq === detailSequence.current) setDetail(result.record); }
    catch (e) { if (seq === detailSequence.current) setIssueError(message(e)); }
  }
  async function revoke(event: React.FormEvent) {
    event.preventDefault(); if (lock.current || !detail) return;
    lock.current = true; setBusy(true); setIssueError("");
    const key = detail.id + ":" + reason;
    if (revokeRequest.current?.key !== key) revokeRequest.current = { key, id: crypto.randomUUID() };
    try { await documentsApi.revoke(detail.id, revokeRequest.current.id, reason); setDetail(null); setReason(""); setRevision(r => r + 1); setNotice("Revocation recorded. Issued data is preserved."); }
    catch (e) { setIssueError(message(e)); } finally { lock.current = false; setBusy(false); }
  }
  async function print(method: "print" | "html-export") {
    if (lock.current || !printIds.length) return;
    const popup = method === "print" ? window.open("about:blank", "_blank") : null;
    if (method === "print" && !popup) { setIssueError("Allow the print window, then retry. No print request was recorded."); return; }
    lock.current = true; setBusy(true); setIssueError(""); setNotice("");
    const key = method + ":" + [...printIds].sort().join(",");
    if (printRequest.current?.key !== key) printRequest.current = { key, id: crypto.randomUUID() };
    try {
      const result = await documentsApi.print(printRequest.current.id, printIds, method);
      const html = documentPrintHtml(result.items, window.location.origin);
      if (popup) await renderPrintWindow(popup, html);
      else { const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `documents-${result.job.id}.html`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      setNotice(method === "print" ? "Print dialog requested and recorded. Confirm the result with your printer." : "HTML export requested and recorded. Open the file to print or save as PDF.");
      printRequest.current = null; setPrintIds([]); setRevision(r => r + 1);
    } catch (e) { popup?.close(); setIssueError(message(e)); } finally { lock.current = false; setBusy(false); }
  }
  const freeze = busy || pending;
  return <div className="container mx-auto space-y-8">
    <PageHeader title={bulk ? (cert ? "Bulk Certificate Processor" : "Institutional Bulk ID Printer") : cert ? "Accolade Issuance Matrix" : "ID Issuance Matrix"} subtitle={bulk ? "Configure Parameters & Execute Document Production" : "Batch Document Generation & Processing"} />
    {notice && <p role="status">{notice}</p>}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {!bulk && <><div className="lg:col-span-4 h-full"><AdminCard className="p-10 flex flex-col h-full bg-gradient-to-br from-white to-secondary/5"><h2 className="mb-8 text-xs font-semibold text-gray-500">Issuance Configuration</h2>
        {templateError && <p role="alert">{templateError}</p>}
        <form className="space-y-4" onSubmit={issue}><fieldset disabled={freeze || !!templateError} className="space-y-4">
          <label className="block text-xs">Search templates<input className={field} value={templateSearch} onChange={e => { setTemplateSearch(e.target.value); setTemplatePage(1); }} /></label>
          <label className="block text-xs">Document Template<select required className={field} value={template?.id ?? ""} onChange={e => chooseTemplate(templates.items.find(row => row.id === e.target.value) ?? null)}><option value="">Choose a template</option>{template && !templates.items.some(row => row.id === template.id) && <option value={template.id}>{template.name} · v{template.version}</option>}{templates.items.map(row => <option value={row.id} disabled={row.archived} key={row.id}>{row.name} · {row.audience} · v{row.version}{row.archived ? " (archived)" : ""}</option>)}</select></label>
          <DocumentPager page={templatePage} total={templates.total} change={setTemplatePage} disabled={freeze} />
          <label className="block text-xs">Issued on (UTC date)<input required type="date" className={field} value={issuedOn} onChange={e => setIssuedOn(e.target.value)} /></label>
          <label className="block text-xs">Expires on (optional, UTC date)<input type="date" min={issuedOn} className={field} value={expiresOn} onChange={e => setExpiresOn(e.target.value)} /></label>
          <label className="flex gap-2 text-xs"><input type="checkbox" checked={includeInactive} onChange={e=>{setIncludeInactive(e.target.checked);setSelected({});setSubjectPage(1);}} />Include inactive recipients (explicit historical issuance)</label>
        </fieldset><p>{Object.keys(selected).length} selected · Maximum 50 per issuance</p><Button type="submit" className="w-full h-16 bg-secondary text-white rounded-2xl" disabled={busy || !template || (!pending && (loading || !!error || !!templateError)) || !Object.keys(selected).length}>{busy ? "Processing…" : pending ? "Retry Same Issuance Request" : "Issue Selected Documents"}</Button></form>
        {pending && <div className="text-xs space-y-2"><p>The request identity is retained. Check issued history before discarding an uncertain request.</p><Button variant="outline" disabled={busy} onClick={() => { batch.current = null; setPending(false); setSelected({}); }}>Discard Pending Request</Button></div>}
      </AdminCard></div><div className="lg:col-span-8"><AdminCard className="p-6"><h2 className="text-xs font-semibold text-gray-500">{audience === "staff" ? "Staff" : "Student"} Candidates</h2><label className="block text-xs my-4">Search candidates<input className={field} disabled={freeze} value={subjectSearch} onChange={e => { setSubjectSearch(e.target.value); setSubjectPage(1); }} /></label>{error && <p role="alert">{error}</p>}{loading && <p>Loading candidates…</p>}<Table><TableHeader><TableRow><TableHead>Select</TableHead><TableHead>Reference</TableHead><TableHead>Name</TableHead></TableRow></TableHeader><TableBody>{subjects.items.map(row => <TableRow key={row.id}><TableCell><input type="checkbox" aria-label={"Select " + row.name} checked={!!selected[row.id]} disabled={freeze || loading || !template || (!selected[row.id] && Object.keys(selected).length >= 50)} onChange={() => setSelected(current => { const next = { ...current }; if (next[row.id]) delete next[row.id]; else next[row.id] = { requestId: crypto.randomUUID(), name: row.name }; return next; })} /></TableCell><TableCell>{row.reference}</TableCell><TableCell>{row.name}</TableCell></TableRow>)}</TableBody></Table>{!loading && !subjects.items.length && <p>No candidates found.</p>}<DocumentPager page={subjectPage} total={subjects.total} change={setSubjectPage} disabled={freeze || loading} /></AdminCard></div></>}
      <div className={bulk ? "lg:col-span-4" : "lg:col-span-12"}><AdminCard className="p-6 bg-gradient-to-br from-white to-secondary/5"><h2 className="text-xs font-semibold text-gray-500 mb-4">{bulk ? "Batch Configuration" : "Print Configuration"}</h2><p className="text-sm mb-4">Select up to 20 valid issued documents. Revoked, expired and future-dated documents cannot be printed.</p><div className="flex flex-wrap gap-3"><Button disabled={busy || !printIds.length} onClick={() => void print("print")}>Print Selected ({printIds.length})</Button><Button variant="outline" disabled={busy || !printIds.length} onClick={() => void print("html-export")}>Export Selected as HTML</Button><Button variant="outline" disabled={busy} onClick={() => setRevision(r => r + 1)}>Refresh</Button></div></AdminCard></div>
      <div className={bulk ? "lg:col-span-8" : "lg:col-span-12"}><AdminCard className="p-6"><h2 className="text-xs font-semibold text-gray-500">Issued Document Registry</h2><label className="block text-xs my-4">Search issued documents<input className={field} value={issueSearch} disabled={busy} onChange={e => { setIssueSearch(e.target.value); setIssuePage(1); }} /></label>{issueError && <p role="alert">{issueError}</p>}{issueLoading && <p>Loading issued documents…</p>}<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Select</TableHead><TableHead>Document</TableHead><TableHead>Name</TableHead><TableHead>Validity</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{issues.items.map(row => <TableRow key={row.id}><TableCell><input type="checkbox" aria-label={"Print " + row.document_no} checked={printIds.includes(row.id)} disabled={busy || issueLoading || row.status !== "valid" || (!printIds.includes(row.id) && printIds.length >= 20)} onChange={() => setPrintIds(ids => ids.includes(row.id) ? ids.filter(id => id !== row.id) : [...ids, row.id])} /></TableCell><TableCell><div className="break-all">{row.document_no}</div><small>{row.template_name}</small></TableCell><TableCell>{row.subject_name}</TableCell><TableCell>{row.status} · {row.issued_on}{row.expires_on ? " – " + row.expires_on : ""}</TableCell><TableCell><Button variant="outline" disabled={busy} onClick={() => void view(row.id)}>View</Button></TableCell></TableRow>)}</TableBody></Table></div>{!issueLoading && !issues.items.length && <p>No issued documents found.</p>}<DocumentPager page={issuePage} total={issues.total} change={setIssuePage} disabled={busy || issueLoading} /></AdminCard></div>
    </div>
    {detail && <AdminCard className="p-6 space-y-4"><h2>{detail.document_no} · {detail.status}</h2><iframe title="Issued document preview" sandbox="" className="w-full h-96 border rounded-xl" srcDoc={documentPrintHtml([detail], window.location.origin)} /><a className="underline" href={"/verify-document/" + detail.verification_token} target="_blank" rel="noreferrer">Verify current status</a>{detail.status !== "revoked" && <form onSubmit={revoke} className="space-y-3"><label>Revocation reason<textarea className={field} required maxLength={1000} disabled={busy} value={reason} onChange={e => setReason(e.target.value)} /></label><Button type="submit" variant="outline" disabled={busy || !reason.trim()}>Revoke Document</Button></form>}<Button variant="outline" disabled={busy} onClick={() => { ++detailSequence.current; setDetail(null); }}>Close Preview</Button></AdminCard>}
    <AdminCard className="p-6"><h2 className="text-xs font-semibold text-gray-500 mb-4">Issuance, Template and Print History</h2>{historyError && <p role="alert">{historyError}</p>}<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Action</TableHead><TableHead>Record</TableHead><TableHead>Details</TableHead><TableHead>Actor</TableHead></TableRow></TableHeader><TableBody>{history.items.map(row => <TableRow key={row.id + row.record_id}><TableCell>{row.created_at}</TableCell><TableCell>{row.action}</TableCell><TableCell className="break-all">{row.record_id}</TableCell><TableCell>{row.detail}</TableCell><TableCell>{row.actor_name}</TableCell></TableRow>)}</TableBody></Table></div><DocumentPager page={historyPage} total={history.total} change={setHistoryPage} disabled={busy} /></AdminCard>
  </div>;
}
