"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Button } from "@/components/ui/button";
import { schoolRecordsApi, type AttendanceKind, type AttendancePage, type SchoolOptions } from "@/lib/school-records-client";

export function AttendanceReport({ kind }: { kind: AttendanceKind }) {
  const [date, setDate] = useState(""), [page, setPage] = useState(1);
  const [placement, setPlacement] = useState(""), [options, setOptions] = useState<SchoolOptions | null>(null), [optionsError, setOptionsError] = useState("");
  const [data, setData] = useState<AttendancePage | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    if (kind === "students") void schoolRecordsApi.options().then(result => { if (active) setOptions(result); }, (reason: unknown) => { if (active) setOptionsError(reason instanceof Error ? reason.message : "Unable to load classes"); });
    return () => { active = false; };
  }, [kind]);
  useEffect(() => {
    let active = true;
    if (date && (kind === "staff" || placement)) void schoolRecordsApi.attendance(kind, date, placement, page).then(result => {
      if (active) { setData(result); setError(""); setLoading(false); }
    }, (reason: unknown) => { if (active) { setData(null); setError(reason instanceof Error ? reason.message : "Unable to load attendance"); setLoading(false); } });
    return () => { active = false; };
  }, [kind, date, placement, page]);
  return <div className="space-y-6"><PageHeader title={kind === "staff" ? "Staff Attendance Report" : "Student Attendance Report"} subtitle="Recorded daily attendance" /><AdminCard><div className="space-y-4 p-6">
    <label>Date <input className="ml-2 rounded-xl border p-2" type="date" value={date} onChange={event => { setDate(event.target.value); setPage(1); setData(null); setError(""); setLoading(Boolean(event.target.value) && (kind === "staff" || Boolean(placement))); }} /></label>
    {kind === "students" && <label> Class and section <select className="ml-2 rounded-xl border p-2" value={placement} onChange={event => { setPlacement(event.target.value); setPage(1); setData(null); setError(""); setLoading(Boolean(date && event.target.value)); }}><option value="">Choose a class</option>{options?.placements.map(item => <option key={item.id} value={item.id}>{item.yearName} / {item.className} / {item.sectionName}</option>)}</select></label>}
    {optionsError && <p role="alert">{optionsError}</p>}
    {(!date || (kind === "students" && !placement)) && <p>Choose a date{kind === "students" ? " and class" : ""} to view attendance.</p>}{loading && <p>Loading attendance…</p>}{error && <p role="alert">{error}</p>}
    {!loading && data && <><div role="region" aria-label="Scrollable records" tabIndex={0} className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Name</th><th>Reference</th><th>Status</th><th>Note</th></tr></thead><tbody>{data.items.map(row => <tr className="border-t" key={row.targetId}><td>{row.name}</td><td>{row.reference}</td><td>{row.status ?? "Unmarked"}</td><td>{row.note}</td></tr>)}</tbody></table></div>{data.total === 0 && <p>No matching records.</p>}
    <div className="flex items-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => { setLoading(true); setPage(page - 1); }}>Previous</Button><span>Page {page} · {data.total} records</span><Button variant="outline" disabled={page * data.pageSize >= data.total} onClick={() => { setLoading(true); setPage(page + 1); }}>Next</Button></div></>}
  </div></AdminCard></div>;
}
