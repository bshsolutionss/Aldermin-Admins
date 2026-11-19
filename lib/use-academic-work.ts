"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  academicWorkApi,
  blankWork,
  type WorkResource,
  type WorkInput,
  type WorkRow,
} from "./academic-work-client";
import type { Page } from "./school-records-client";
export function useAcademicWork(resource: WorkResource) {
  const [data, setData] = useState<Page<WorkRow>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false);
  const [draft, setDraft] = useState<WorkInput>(blankWork),
    [editing, setEditing] = useState<string>();
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true),
    [ready, setReady] = useState(false),
    [saving, setSaving] = useState(false);
  const sequence = useRef(0),
    busy = useRef(false);
  const load = useCallback(async () => {
    const token = ++sequence.current;
    setLoading(true);
    setReady(false);
    setError("");
    try {
      const rows = await academicWorkApi.list(resource, page, search, archived);
      if (token === sequence.current) {
        setData(rows);
        setReady(true);
      }
    } catch (e) {
      if (token === sequence.current)
        setError(
          e instanceof Error ? e.message : "Unable to load academic work",
        );
    } finally {
      if (token === sequence.current) setLoading(false);
    }
  }, [resource, page, search, archived]);
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
  function edit(row: WorkRow) {
    if (busy.current) return;
    setDraft({ ...blankWork(), ...row });
    setEditing(row.id);
    setNotice("");
  }
  function cancel() {
    if (busy.current) return;
    setDraft(blankWork());
    setEditing(undefined);
  }
  async function save(row?: WorkRow) {
    if (busy.current || !ready) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    ++sequence.current;
    try {
      await academicWorkApi.save(
        resource,
        row ? { ...blankWork(), ...row, archived: !row.archived } : draft,
        row?.id ?? editing,
      );
      if (!row || row.id === editing) {
        setDraft(blankWork());
        setEditing(undefined);
      }
      setNotice(row ? (row.archived ? "Restored." : "Archived.") : "Saved.");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save academic work");
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return {
    data,
    page,
    setPage,
    search,
    setSearch,
    archived,
    setArchived,
    draft,
    setDraft,
    editing,
    edit,
    cancel,
    error,
    notice,
    loading,
    ready,
    saving,
    load,
    save,
  };
}
