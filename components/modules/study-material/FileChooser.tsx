"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { schoolContentApi, type StoredFile } from "@/lib/school-content-client";
import type { Page } from "@/lib/school-records-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function FileChooser({
  value,
  onChange,
  purpose = "all",
  disabled = false,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  purpose?: string;
  disabled?: boolean;
}) {
  const [result, setResult] = useState<Page<StoredFile>>({
      items: [],
      page: 1,
      total: 0,
      pageSize: 20,
    }),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const token = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const data = await schoolContentApi.files(page, search, false, purpose);
      if (token === sequence.current) setResult(data);
    } catch (err) {
      if (token === sequence.current)
        setError(err instanceof Error ? err.message : "Unable to load files");
    } finally {
      if (token === sequence.current) setLoading(false);
    }
  }, [page, search, purpose]);
  const invalidate = useCallback(() => {
    ++sequence.current;
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return load();
    });
    return () => {
      active = false;
      invalidate();
    };
  }, [load, invalidate]);
  return (
    <div className="space-y-2">
      <Input
        aria-label="Search stored files"
        value={search}
        disabled={disabled}
        onChange={(event) => {
          setPage(1);
          setSearch(event.target.value);
        }}
        placeholder="Search stored filenames…"
      />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}{" "}
          <Button type="button" variant="ghost" onClick={() => void load()}>
            Retry
          </Button>
        </p>
      )}
      <select
        aria-label="Stored file"
        value={value ?? ""}
        disabled={disabled || loading}
        onChange={(event) => onChange(event.target.value || null)}
        className="w-full h-12 rounded-xl border border-gray-200 px-3 bg-white"
      >
        <option value="">Select a stored file</option>
        {value && !result.items.some((file) => file.id === value) && (
          <option value={value}>Existing selected file</option>
        )}
        {result.items.map((file) => (
          <option key={file.id} value={file.id}>
            {file.originalName} · {file.purpose}
          </option>
        ))}
      </select>
      <div className="flex justify-between gap-2 text-xs">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || loading || page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous Files
        </Button>
        <span>{result.total} files</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={
            disabled || loading || page * result.pageSize >= result.total
          }
          onClick={() => setPage(page + 1)}
        >
          Next Files
        </Button>
      </div>
    </div>
  );
}
