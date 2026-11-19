"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { schoolRecordsApi } from "@/lib/school-records-client";

type History = Awaited<ReturnType<typeof schoolRecordsApi.history>>;
export function StudentHistoryReport() {
  const [page, setPage] = useState(1), [data, setData] = useState<History | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void schoolRecordsApi.history(page).then(result => { if (active) { setData(result); setError(""); setLoading(false); } }, (reason: unknown) => { if (active) { setData(null); setError(reason instanceof Error ? reason.message : "Unable to load history"); setLoading(false); } });
    return () => { active = false; };
  }, [page]);
  return <div className="space-y-6"><PageHeader title="Student History" subtitle="Student registry change history" /><AdminCard><div className="space-y-4 p-6">
    {loading && <p>Loading history…</p>}{error && <p role="alert">{error}</p>}
    {!loading && data && <><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Time</th><th>Record type</th><th>Record ID</th><th>Version</th><th>Changed by</th></tr></thead><tbody>{data.items.map(row => <tr className="border-t" key={row.id}><td>{row.createdAt}</td><td>{row.resource}</td><td>{row.recordId}</td><td>{row.version}</td><td>{row.actorName}</td></tr>)}</tbody></table></div>{data.total === 0 && <p>No registry history recorded.</p>}
    <div className="flex items-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => { setLoading(true); setPage(page - 1); }}>Previous</Button><span>Page {page} · {data.total} records</span><Button variant="outline" disabled={page * data.pageSize >= data.total} onClick={() => { setLoading(true); setPage(page + 1); }}>Next</Button></div></>}
  </div></AdminCard></div>;
}
