"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  schoolAdministrationApi,
  blankAdministration,
  type AdministrationScope,
  type AdministrationResource,
  type AdministrationRow,
  type AdministrationDraft,
} from "./school-administration-client";
import type { Page } from "./school-records-client";
export function useSchoolAdministration(
  scope: AdministrationScope,
  initialStatus = "all",
) {
  const resource = scope.startsWith("reports/")
    ? null
    : (scope as AdministrationResource);
  const [data, setData] = useState<Page<AdministrationRow>>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false),
    [status, setStatus] = useState(initialStatus),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const [draft, setDraft] = useState<AdministrationDraft>(() =>
      blankAdministration(resource ?? "incidents"),
    ),
    [editing, setEditing] = useState<string>(),
    [loading, setLoading] = useState(true),
    [ready, setReady] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const busy = useRef(false),
    sequence = useRef(0);
  const load = useCallback(async () => {
    const token = ++sequence.current;
    setReady(false);
    setLoading(true);
    setError("");
    try {
      const result = await schoolAdministrationApi.list(scope, {
        page,
        search,
        archived,
        status,
        from,
        to,
      });
      if (token === sequence.current) {
        setData(result);
        setReady(true);
      }
    } catch (e) {
      if (token === sequence.current)
        setError(
          e instanceof Error
            ? e.message
            : "Unable to load administration records",
        );
    } finally {
      if (token === sequence.current) setLoading(false);
    }
  }, [scope, page, search, archived, status, from, to]);
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
  function edit(row: AdministrationRow) {
    if (!resource || busy.current) return;
    const blank = blankAdministration(resource);
    for (const key of Object.keys(blank))
      if (row[key] !== undefined)
        blank[key] = row[key] as string | number | boolean | null;
    setDraft(blank);
    setEditing(row.id);
    setNotice("");
  }
  function cancel() {
    if (!resource || busy.current) return;
    setDraft(blankAdministration(resource));
    setEditing(undefined);
  }
  async function act(
    action: () => Promise<{ changed: boolean }>,
    success: () => void,
  ) {
    if (busy.current || !ready) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    invalidate();
    try {
      const result = await action();
      success();
      setNotice(result.changed ? "Saved." : "Already recorded.");
      await load();
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save administration record",
      );
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  function save(row?: AdministrationRow) {
    if (!resource) return Promise.resolve(false);
    const input = row
      ? ({
          ...blankAdministration(resource),
          ...row,
          archived: !row.archived,
        } as AdministrationDraft)
      : draft;
    return act(
      () => schoolAdministrationApi.save(resource, input, row?.id ?? editing),
      () => {
        if (!row || row.id === editing) {
          setDraft(blankAdministration(resource));
          setEditing(undefined);
        }
      },
    );
  }
  function decision(row: AdministrationRow, next: string, reason: string) {
    if (!resource) return Promise.resolve(false);
    return act(
      () =>
        schoolAdministrationApi.decision(
          resource,
          row.id,
          next,
          reason,
          row.version,
        ),
      () => {},
    );
  }
  return {
    data,
    page,
    setPage,
    search,
    setSearch,
    archived,
    setArchived,
    status,
    setStatus,
    from,
    setFrom,
    to,
    setTo,
    draft,
    setDraft,
    editing,
    edit,
    cancel,
    loading,
    ready,
    saving,
    error,
    notice,
    load,
    save,
    decision,
  };
}
