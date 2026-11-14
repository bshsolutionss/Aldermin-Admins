"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { schoolRecordsApi, type Page, type StudentRecord } from "@/lib/school-records-client";
export function StudentDirectory() {
  const [data, setData] = useState<Page<StudentRecord>>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [page, setPage] = useState(1), [search, setSearch] = useState(""), [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const sequence = useRef(0);
  const load = useCallback(async () => { const token = ++sequence.current; setLoading(true); setError(""); try { const result = await schoolRecordsApi.students(page, search, active); if (token === sequence.current) setData(result); } catch (err) { if (token === sequence.current) setError(err instanceof Error ? err.message : "Unable to load students"); } finally { if (token === sequence.current) setLoading(false); } }, [page, search, active]);
  const invalidate = useCallback(() => { ++sequence.current; }, []);
  useEffect(() => { let present = true; void Promise.resolve().then(() => { if (present) return load(); }); return () => { present = false; invalidate(); }; }, [load, invalidate]);
  return <div className="container mx-auto space-y-8 pb-10"><PageHeader title="Student Directory" subtitle="Student Information System (SIS)" action={<Link href="/admin/student-info/add" className="bg-secondary text-white rounded-xl px-6 py-3 text-xs font-semibold">Add Student</Link>} />
    <div className="flex flex-wrap gap-4 items-center"><Input aria-label="Search students" value={search} onChange={event => { setPage(1); setSearch(event.target.value); }} placeholder="Search name or admission number…" className="max-w-sm" /><label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!active} onChange={event => { setPage(1); setActive(!event.target.checked); }} />Show inactive students</label><Button variant="outline" onClick={() => void load()}>Reload</Button></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <AdminCard className="p-8 overflow-x-auto"><h2 className="text-xs font-semibold text-gray-500 mb-6">Student List</h2><Table><TableHeader><TableRow><TableHead>Identity</TableHead><TableHead>Student Profile</TableHead><TableHead>Guardianship</TableHead><TableHead>Latest Placement</TableHead><TableHead>Interaction</TableHead></TableRow></TableHeader><TableBody>
      {loading ? <TableRow><TableCell colSpan={5}>Loading students…</TableCell></TableRow> : error ? <TableRow><TableCell colSpan={5}>Student records could not load. Reload to retry.</TableCell></TableRow> : data.items.length === 0 ? <TableRow><TableCell colSpan={5}>No matching students.</TableCell></TableRow> : data.items.map(student => <TableRow key={student.id}><TableCell><span className="rounded-lg bg-secondary/10 text-secondary px-3 py-1 text-xs font-semibold">{student.admissionNo}</span></TableCell><TableCell><p className="font-semibold">{student.firstName} {student.lastName}</p><p className="text-xs text-gray-500">{student.gender} · {student.birthDate}</p></TableCell><TableCell>{student.guardianName ?? "No primary contact"}</TableCell><TableCell>{student.className ? `${student.yearName} · ${student.className} · ${student.sectionName}` : "Not enrolled"}</TableCell><TableCell><Link href={`/admin/student-info/add?id=${student.id}`} className="text-secondary underline text-sm">View / Edit</Link></TableCell></TableRow>)}
    </TableBody></Table><div className="flex justify-between gap-3 mt-6"><Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm">Page {page} · {data.total} records</span><Button variant="outline" disabled={loading || page * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>Next</Button></div></AdminCard>
  </div>;
}
