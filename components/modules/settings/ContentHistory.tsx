"use client";
import { useRef, useState } from "react";
import { schoolContentApi } from "@/lib/school-content-client";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Button } from "@/components/ui/button";
function describe(value: unknown) {
  if (!value || typeof value !== "object") return "No previous record";
  const row = value as {
    title?: string;
    originalName?: string;
    slot?: string;
    archived?: boolean;
    published?: boolean;
    fileId?: string | null;
  };
  return [
    row.title || row.originalName || row.slot || "Record",
    row.archived === undefined ? null : row.archived ? "Archived" : "Active",
    row.published === undefined ? null : row.published ? "Published" : "Draft",
    row.fileId === null ? "Attachment cleared" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
export function ContentHistory() {
  const [result, setResult] = useState<Awaited<
      ReturnType<typeof schoolContentApi.history>
    > | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const busy = useRef(false);
  async function load(page = 1) {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      setResult(await schoolContentApi.history(page));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load history");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  return (
    <AdminCard className="p-6 space-y-4">
      <div className="flex justify-between gap-4">
        <h2 className="font-semibold">File and Publication History</h2>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => void load()}
        >
          Refresh History
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {result && (
        <>
          {!result.items.length && <p>No changes recorded.</p>}
          {result.items.map((event) => (
            <details key={event.id} className="border-b border-gray-200 py-2">
              <summary>
                {event.resource} · Version {event.version} · {event.actorName} ·{" "}
                {new Date(event.createdAt).toLocaleString()}
              </summary>
              <p className="text-sm mt-2">
                Before: {describe(event.beforeState)}
              </p>
              <p className="text-sm">After: {describe(event.afterState)}</p>
            </details>
          ))}
          <div className="flex gap-3 items-center">
            <Button
              variant="outline"
              disabled={loading || result.page <= 1}
              onClick={() => void load(result.page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {result.page} · {result.total} changes
            </span>
            <Button
              variant="outline"
              disabled={
                loading || result.page * result.pageSize >= result.total
              }
              onClick={() => void load(result.page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </AdminCard>
  );
}
