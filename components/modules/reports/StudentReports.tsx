"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { schoolRecordsApi, type StudentRecord, type GuardianRecord, type Page } from "@/lib/school-records-client";

type Mode = "students" | "guardians" | "export";
const empty: Page<StudentRecord> = { items: [], total: 0, page: 1, pageSize: 20 };

// Spreadsheet applications can execute formulas even in quoted CSV cells.
export function csvCell(value: string | null | undefined) {
  const safe = String(value ?? "").replace(/^[\t\r\n ]*([=+@-])/, "'$1");
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function studentCsv(rows: StudentRecord[]) {
  const lines = [["Admission number", "First name", "Last name", "Class", "Section", "Roll number"], ...rows.map(r => [r.admissionNo, r.firstName, r.lastName, r.className, r.sectionName, r.rollNo])];
  return "\uFEFF" + lines.map(line => line.map(csvCell).join(",")).join("\r\n");
}

export function StudentReports({ mode }: { mode: Mode }) {
  const [page, setPage] = useState(1), [search, setSearch] = useState("");
  const [data, setData] = useState(empty), [error, setError] = useState(""), [loading, setLoading] = useState(true);
  const [guardian, setGuardian] = useState<{ student: string; rows: GuardianRecord[] } | null>(null);
  const [guardianError, setGuardianError] = useState("");
  const [selection, setSelection] = useState("");
  useEffect(() => {
    let active = true;
    void schoolRecordsApi.students(page, search).then(result => {
      if (active) { setData(result); setError(""); setLoading(false); }
    }, (reason: unknown) => {
      if (active) { setData(empty); setError(reason instanceof Error ? reason.message : "Unable to load students"); setLoading(false); }
    });
    return () => { active = false; };
  }, [page, search]);
  useEffect(() => {
    let active = true;
    if (selection) void schoolRecordsApi.student(selection).then(result => {
      if (active) { setGuardian({ student: result.student.firstName + " " + result.student.lastName, rows: result.guardians }); setGuardianError(""); }
    }, (reason: unknown) => { if (active) { setGuardian(null); setSelection(""); setGuardianError(reason instanceof Error ? reason.message : "Unable to load guardians"); } });
    return () => { active = false; };
  }, [selection]);
  function exportPage() {
    const url = URL.createObjectURL(new Blob([studentCsv(data.items)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `students-page-${page}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  const title = mode === "guardians" ? "Guardian Report" : mode === "export" ? "Student Export" : "Student Report";
  return <div className="space-y-6"><PageHeader title={title} subtitle="Active student records" /><AdminCard><div className="space-y-4 p-6">
    <label>Search students <input className="ml-2 rounded-xl border p-2" value={search} onChange={event => { setLoading(true); setPage(1); setSearch(event.target.value); setSelection(""); setGuardian(null); }} /></label>
    {loading && <p>Loading students…</p>}{error && <p role="alert">{error}</p>}
    {!loading && !error && <><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Admission no.</th><th>Name</th><th>Class</th><th>Section</th><th>Roll no.</th>{mode === "guardians" && <th>Guardians</th>}</tr></thead><tbody>
      {data.items.map(row => <tr className="border-t" key={row.id}><td>{row.admissionNo}</td><td>{row.firstName} {row.lastName}</td><td>{row.className ?? "—"}</td><td>{row.sectionName ?? "—"}</td><td>{row.rollNo ?? "—"}</td>{mode === "guardians" && <td><Button variant="outline" disabled={selection === row.id} onClick={() => { setGuardian(null); setGuardianError(""); setSelection(row.id); }}>View</Button></td>}</tr>)}
    </tbody></table></div>{data.total === 0 && <p>No active students found.</p>}
    <div className="flex items-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => { setLoading(true); setPage(page - 1); }}>Previous</Button><span>Page {page} · {data.total} records</span><Button variant="outline" disabled={page * data.pageSize >= data.total} onClick={() => { setLoading(true); setPage(page + 1); }}>Next</Button>{mode === "export" && <Button disabled={!data.items.length} onClick={exportPage}>Export this page as CSV</Button>}</div></>}
    {guardianError && <p role="alert">{guardianError}</p>}{guardian && <section><h2>Guardians for {guardian.student}</h2>{guardian.rows.length ? <ul>{guardian.rows.map(row => <li key={row.id}>{row.name} · {row.relationship} · {row.phone || "No phone"}</li>)}</ul> : <p>No guardians recorded.</p>}</section>}
  </div></AdminCard></div>;
}
