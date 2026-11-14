"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  schoolOperationsApi,
  blankRegistry,
  registryInput,
  type OperationRow,
  type RegistryResource,
  type OperationResource,
  type RegistryInput,
} from "./school-operations-client";
import type { Page } from "./school-records-client";
export function useSchoolOperations(
  resource: OperationResource | "stock",
  initialStatus = "all",
) {
  const [result, setResult] = useState<Page<OperationRow>>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false),
    [status, setStatus] = useState(initialStatus),
    [loading, setLoading] = useState(true),
    [ready, setReady] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const busy = useRef(false),
    sequence = useRef(0);
  const load = useCallback(async () => {
    const token = ++sequence.current;
    setLoading(true);
    setReady(false);
    setError("");
    try {
      const data = await schoolOperationsApi.list(
        resource,
        page,
        search,
        archived,
        status,
      );
      if (token === sequence.current) {
        setResult(data);
        setReady(true);
      }
    } catch (err) {
      if (token === sequence.current)
        setError(
          err instanceof Error ? err.message : "Unable to load operations",
        );
    } finally {
      if (token === sequence.current) setLoading(false);
    }
  }, [resource, page, search, archived, status]);
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
  async function act(
    action: () => Promise<{ changed: boolean }>,
    success: () => void = () => {},
  ) {
    if (busy.current || !ready) return false;
    busy.current = true;
    invalidate();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const saved = await action();
      success();
      setNotice(saved.changed ? "Saved." : "Already up to date.");
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save operation");
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return {
    ...result,
    page,
    search,
    archived,
    status,
    loading,
    ready,
    saving,
    error,
    notice,
    load,
    act,
    setError,
    setPage,
    setSearch: (value: string) => {
      setPage(1);
      setSearch(value);
    },
    setArchived: (value: boolean) => {
      setPage(1);
      setArchived(value);
    },
    setStatus: (value: string) => {
      setPage(1);
      setStatus(value);
    },
  };
}
export function useRegistry(resource: RegistryResource) {
  const state = useSchoolOperations(resource);
  const [draft, setDraft] = useState<RegistryInput>(blankRegistry),
    [editing, setEditing] = useState<OperationRow | null>(null);
  function reset() {
    setDraft(blankRegistry());
    setEditing(null);
  }
  return {
    ...state,
    draft,
    setDraft,
    editing,
    reset,
    edit: (row: OperationRow) => {
      if (!state.saving) {
        setDraft(registryInput(row));
        setEditing(row);
      }
    },
    save: () =>
      state.act(
        () =>
          schoolOperationsApi.save(
            resource,
            { ...draft, version: editing?.version ?? 0 },
            editing?.id,
          ),
        reset,
      ),
    archive: (row: OperationRow) =>
      state.act(
        () =>
          schoolOperationsApi.save(
            resource,
            { ...registryInput(row), archived: !row.archived },
            row.id,
          ),
        () => {
          if (row.id === editing?.id) reset();
        },
      ),
  };
}
