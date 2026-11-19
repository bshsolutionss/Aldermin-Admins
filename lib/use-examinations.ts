"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  examinationsApi,
  blankExam,
  type ExamInput,
  type ExamResource,
  type ExamRow,
} from "./examinations-client";
import type { Page } from "./school-records-client";
export function useExaminations(resource: ExamResource) {
  const [data, setData] = useState<Page<ExamRow>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false);
  const [draft, setDraft] = useState<ExamInput>(blankExam),
    [editing, setEditing] = useState<string>();
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true),
    [ready, setReady] = useState(false),
    [saving, setSaving] = useState(false);
  const seq = useRef(0),
    busy = useRef(false);
  const load = useCallback(async () => {
    const token = ++seq.current;
    setLoading(true);
    setReady(false);
    setError("");
    try {
      const rows = await examinationsApi.list(resource, page, search, archived);
      if (token === seq.current) {
        setData(rows);
        setReady(true);
      }
    } catch (e) {
      if (token === seq.current)
        setError(
          e instanceof Error ? e.message : "Unable to load examinations",
        );
    } finally {
      if (token === seq.current) setLoading(false);
    }
  }, [resource, page, search, archived]);
  const invalidate = useCallback(() => {
    ++seq.current;
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
  function edit(row: ExamRow) {
    if (busy.current) return;
    setDraft({
      ...blankExam(),
      ...row,
      startTime: row.startTime?.slice(0, 5) ?? "",
      endTime: row.endTime?.slice(0, 5) ?? "",
    });
    setEditing(row.id);
  }
  function cancel() {
    if (busy.current) return;
    setDraft(blankExam());
    setEditing(undefined);
  }
  async function save(row?: ExamRow) {
    if (busy.current || !ready) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    ++seq.current;
    try {
      await examinationsApi.save(
        resource,
        row ? { ...blankExam(), ...row, archived: !row.archived } : draft,
        row?.id ?? editing,
      );
      if (!row || row.id === editing) {
        setDraft(blankExam());
        setEditing(undefined);
      }
      setNotice("Saved.");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save examination");
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
    error,
    notice,
    loading,
    ready,
    saving,
    load,
    edit,
    cancel,
    save,
  };
}
