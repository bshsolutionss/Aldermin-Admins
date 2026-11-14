"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  schoolOperationsApi,
  type ChoiceResource,
  type OperationRow,
} from "@/lib/school-operations-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function OperationChoice({
  resource,
  value,
  onChange,
  disabled = false,
}: {
  resource: ChoiceResource;
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [rows, setRows] = useState<OperationRow[]>([]),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const sequence = useRef(0);
  const invalidate = useCallback(() => {
    ++sequence.current;
  }, []);
  const load = useCallback(async () => {
    const token = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const data = await schoolOperationsApi.list(
        resource,
        page,
        search,
        false,
        resource === "loans"
          ? "open"
          : resource === "movements"
            ? "issue"
            : "all",
      );
      if (token === sequence.current) {
        setRows(data.items);
        setTotal(data.total);
      }
    } catch (err) {
      if (token === sequence.current) {
        setRows([]);
        setError(err instanceof Error ? err.message : "Unable to load choices");
      }
    } finally {
      if (token === sequence.current) setLoading(false);
    }
  }, [resource, page, search]);
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
        aria-label={`Search ${resource}`}
        value={search}
        disabled={disabled}
        onChange={(event) => {
          setPage(1);
          setSearch(event.target.value);
        }}
        placeholder="Search available choices…"
      />
      <select
        aria-label={`Choose ${resource}`}
        className="w-full h-12 border border-gray-200 rounded-xl bg-white px-3 text-sm"
        disabled={disabled || loading || !!error}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Choose a record</option>
        {value && !rows.some((row) => row.id === value) && (
          <option value={value}>Current selection ({value})</option>
        )}
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {row.name ||
              row.title ||
              row.itemName ||
              row.bookTitle ||
              row.code ||
              row.id}
            {row.code ? " · " + row.code : ""}
            {row.movementOn
              ? " · " + row.movementOn + " · " + row.quantity
              : ""}
            {row.available !== undefined
              ? " · " + row.available + " available"
              : ""}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
          <Button type="button" variant="ghost" onClick={() => void load()}>
            Retry
          </Button>
        </p>
      )}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || loading || page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <span className="text-xs">
          Page {page} · {total}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || loading || page * 20 >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
