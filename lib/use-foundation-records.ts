"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { foundationsApi, type FoundationInput, type FoundationPage, type FoundationRecord, type FoundationResource } from "./admin-foundations-client";

export function useFoundationRecords(resource: FoundationResource) {
  const [result, setResult] = useState<FoundationPage>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<FoundationRecord | null>(null);
  const [draft, setDraft] = useState<FoundationInput>({ name: "", startDate: "", endDate: "" });
  const sequence = useRef(0);
  const busy = useRef(false);
  const currentView = useRef({ page, search, archived });

  const load = useCallback(async (targetPage = page, targetSearch = search, targetArchived = archived) => {
    const token = ++sequence.current;
    setLoading(true); setReady(false); setError("");
    try {
      const data = await foundationsApi.list(resource, targetPage, targetSearch, targetArchived);
      if (token === sequence.current) { setResult(data); setReady(true); }
    } catch (err) { if (token === sequence.current) setError(err instanceof Error ? err.message : "Unable to load records"); }
    finally { if (token === sequence.current) setLoading(false); }
  }, [resource, page, search, archived]);
  const invalidateRequests = useCallback(() => { ++sequence.current; }, []);
  useEffect(() => {
    let active = true;
    currentView.current = { page, search, archived };
    void Promise.resolve().then(() => { if (active) return load(page, search, archived); });
    return () => { active = false; invalidateRequests(); };
  }, [load, invalidateRequests, page, search, archived]);
  function reset() { setEditing(null); setDraft({ name: "", startDate: "", endDate: "" }); }
  function edit(record: FoundationRecord) { if (busy.current) return; setEditing(record); setDraft({ name: record.name, startDate: record.startDate ?? "", endDate: record.endDate ?? "" }); setNotice(""); }
  async function persist(input: FoundationInput, id?: string) {
    if (busy.current || !ready) return false;
    busy.current = true; ++sequence.current; setSaving(true); setError(""); setNotice("");
    try {
      const saved = await foundationsApi.save(resource, input, id);
      reset(); setNotice(saved.changed ? "Record saved." : "Record is already up to date.");
      // Refresh the current view, including changes made while the save was pending.
      const view = currentView.current;
      await load(view.page, view.search, view.archived);
      return true;
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save record"); return false; }
    finally { busy.current = false; setSaving(false); }
  }
  function save() {
    const input: FoundationInput = { name: draft.name.trim(), ...(resource === "holidays" ? { startDate: draft.startDate, endDate: draft.endDate } : {}), ...(editing ? { version: editing.version, archived: editing.archived } : {}) };
    return persist(input, editing?.id);
  }
  function archive(record: FoundationRecord) {
    return persist({ name: record.name, version: record.version, archived: !record.archived, ...(resource === "holidays" ? { startDate: record.startDate, endDate: record.endDate } : {}) }, record.id);
  }
  return { ...result, search, archived, page, loading, ready, saving, error, notice, editing, draft, setDraft, edit, reset, save, archive,
    reload: () => load(), setSearch: (value: string) => { setPage(1); setSearch(value); }, setArchived: (value: boolean) => { setPage(1); setArchived(value); }, setPage };
}
