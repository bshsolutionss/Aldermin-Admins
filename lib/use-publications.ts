"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  schoolContentApi,
  type ContentInput,
  type ContentRecord,
  type ContentResource,
  type ContentOptions,
  type MaterialKind,
} from "./school-content-client";
import type { Page } from "./school-records-client";
export function blankPublication(
  resource: ContentResource,
  kind: MaterialKind = "material",
): ContentInput {
  const base = { title: "", published: false, archived: false, version: 0 };
  if (resource === "materials")
    return {
      ...base,
      kind,
      description: "",
      assignmentId: null,
      fileId: null,
      videoUrl: null,
    };
  if (resource === "notices")
    return { ...base, body: "", audience: "all", startDate: "", endDate: "" };
  return { ...base, description: "", location: "", startsAt: "", endsAt: "" };
}
export function publicationInput(record: ContentRecord): ContentInput {
  const { title, published, archived, version } = record,
    base = { title, published, archived, version };
  if ("kind" in record)
    return {
      ...base,
      kind: record.kind,
      description: record.description,
      assignmentId: record.assignmentId,
      fileId: record.fileId,
      videoUrl: record.videoUrl,
    };
  if ("body" in record)
    return {
      ...base,
      body: record.body,
      audience: record.audience,
      startDate: record.startDate,
      endDate: record.endDate,
    };
  return {
    ...base,
    description: record.description,
    location: record.location,
    startsAt: record.startsAt,
    endsAt: record.endsAt,
  };
}
export function usePublications(
  resource: ContentResource,
  kind: MaterialKind = "material",
) {
  const [result, setResult] = useState<Page<ContentRecord>>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    }),
    [options, setOptions] = useState<ContentOptions>({
      assignments: [],
      today: null,
      timezone: null,
    });
  const [draft, setDraft] = useState<ContentInput>(() =>
      blankPublication(resource, kind),
    ),
    [editing, setEditing] = useState<ContentRecord | null>(null);
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false),
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
      const [data, metadata] = await Promise.all([
        schoolContentApi.list(resource, page, search, archived, kind),
        schoolContentApi.options(),
      ]);
      if (token === sequence.current) {
        setResult(data);
        setOptions(metadata);
        setReady(true);
      }
    } catch (err) {
      if (token === sequence.current)
        setError(
          err instanceof Error ? err.message : "Unable to load publications",
        );
    } finally {
      if (token === sequence.current) setLoading(false);
    }
  }, [resource, kind, page, search, archived]);
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
  function reset() {
    setDraft(blankPublication(resource, kind));
    setEditing(null);
  }
  function edit(record: ContentRecord) {
    if (busy.current) return;
    setDraft(publicationInput(record));
    setEditing(record);
    setNotice("");
  }
  async function persist(input: ContentInput, id?: string, clear = false) {
    if (busy.current || !ready) return false;
    busy.current = true;
    invalidate();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const saved = await schoolContentApi.save(resource, input, id);
      if (clear || (editing && editing.id === id)) reset();
      setNotice(
        saved.changed
          ? "Publication saved."
          : "Publication is already up to date.",
      );
      await load();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save publication",
      );
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return {
    ...result,
    options,
    draft,
    setDraft,
    editing,
    page,
    search,
    archived,
    loading,
    ready,
    saving,
    error,
    notice,
    load,
    edit,
    reset,
    setError,
    save: () =>
      persist({ ...draft, version: editing?.version ?? 0 }, editing?.id, true),
    archive: (record: ContentRecord) =>
      persist(
        { ...publicationInput(record), archived: !record.archived },
        record.id,
      ),
    setPage,
    setSearch: (value: string) => {
      setPage(1);
      setSearch(value);
    },
    setArchived: (value: boolean) => {
      setPage(1);
      setArchived(value);
    },
  };
}
