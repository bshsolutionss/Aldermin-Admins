"use client";

import { useEffect, useState } from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { examinationsApi, type ExamRow } from "@/lib/examinations-client";
import type { Page } from "@/lib/school-records-client";

export function ExamRoutineReport() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<ExamRow> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void examinationsApi.list("schedules", page).then(
      (result) => { if (active) { setData(result); setError(""); setLoading(false); } },
      (reason: unknown) => { if (active) { setData(null); setError(reason instanceof Error ? reason.message : "Unable to load exam routine"); setLoading(false); } },
    );
    return () => { active = false; };
  }, [page]);
  function changePage(next: number) { setLoading(true); setPage(next); }
  return <div className="space-y-6">
    <PageHeader title="Exam Routine" subtitle="View scheduled examinations" />
    <AdminCard><div className="space-y-4 p-6">
      {loading && <p>Loading exam routine…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && data && <>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr><th>Examination</th><th>Class</th><th>Subject</th><th>Date</th><th>Time</th><th>Room</th></tr></thead>
          <tbody>{data.items.map(row => <tr key={row.id} className="border-t"><td>{row.assessmentTitle}</td><td>{row.className} {row.sectionName}</td><td>{row.subjectName}</td><td>{row.examDate}</td><td>{row.startTime?.slice(0, 5)}–{row.endTime?.slice(0, 5)}</td><td>{row.roomNumber}</td></tr>)}</tbody>
        </table></div>
        {data.total === 0 && <p>No scheduled examinations found.</p>}
        <div className="flex items-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => changePage(page - 1)}>Previous</Button><span>Page {page} · {data.total} records</span><Button variant="outline" disabled={page * data.pageSize >= data.total} onClick={() => changePage(page + 1)}>Next</Button></div>
      </>}
    </div></AdminCard>
  </div>;
}
