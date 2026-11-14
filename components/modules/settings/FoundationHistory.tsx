"use client";
import { useRef, useState } from "react";
import { foundationsApi, type FoundationHistory as History } from "@/lib/admin-foundations-client";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";

function describe(value: unknown) {
  if (!value || typeof value !== "object") return "Unconfigured";
  const record = value as { name?: string; startDate?: string; endDate?: string; archived?: boolean; days?: number[] };
  if (record.days) {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return record.days.length ? record.days.map(day => names[day]).join(", ") : "No weekend days";
  }
  return `${record.name ?? ""}${record.startDate ? ` · ${record.startDate} to ${record.endDate}` : ""} · ${record.archived ? "Archived" : "Active"}`;
}

export function FoundationHistory() {
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  async function load(page = 1) {
    if (busy.current) return;
    busy.current = true; setLoading(true); setError("");
    try { setHistory(await foundationsApi.history(page)); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load history"); }
    finally { busy.current = false; setLoading(false); }
  }
  return <AdminCard className="p-6 space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-semibold">Calendar and student catalog history</h2><Button variant="outline" disabled={loading} onClick={() => void load()}>Refresh history</Button></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {history && <>
      {history.items.length === 0 && <p>No changes recorded.</p>}
      {history.items.map(event => <details key={event.id} className="border-b border-gray-200 py-2"><summary className="cursor-pointer">{event.resource} · Version {event.version} · {event.actorName} · {new Date(event.createdAt).toLocaleString()}</summary><div className="grid md:grid-cols-2 gap-4 mt-3"><div><p className="font-semibold">Before</p><p>{describe(event.beforeState)}</p></div><div><p className="font-semibold">After</p><p>{describe(event.afterState)}</p></div></div></details>)}
      <div className="flex items-center gap-3"><Button variant="outline" disabled={loading || history.page <= 1} onClick={() => void load(history.page - 1)}>Previous</Button><span>Page {history.page} · {history.total} changes</span><Button variant="outline" disabled={loading || history.page * history.pageSize >= history.total} onClick={() => void load(history.page + 1)}>Next</Button></div>
    </>}
  </AdminCard>;
}
