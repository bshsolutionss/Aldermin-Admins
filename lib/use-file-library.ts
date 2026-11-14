"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { schoolContentApi, type StoredFile } from "./school-content-client";
import type { Page } from "./school-records-client";
export function useFileLibrary() {
  const [result, setResult] = useState<Page<StoredFile>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false);
  const [purpose, setPurpose] = useState<"portrait" | "document">("document"),
    [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true),
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
      const data = await schoolContentApi.files(page, search, archived);
      if (token === sequence.current) {
        setResult(data);
        setReady(true);
      }
    } catch (err) {
      if (token === sequence.current)
        setError(err instanceof Error ? err.message : "Unable to load files");
    } finally {
      if (token === sequence.current) setLoading(false);
    }
  }, [page, search, archived]);
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
  async function act(task: () => Promise<void>) {
    if (busy.current || !ready) return false;
    busy.current = true;
    invalidate();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await task();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save file");
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  function upload() {
    return act(async () => {
      if (!file || !file.size || file.size > 5242880)
        throw new Error("Choose a nonempty file up to 5 MiB.");
      const saved = await schoolContentApi.upload(file, purpose);
      setFile(null);
      setNotice(`Uploaded ${saved.originalName}.`);
      await load();
    });
  }
  function archive(target: StoredFile) {
    return act(async () => {
      await schoolContentApi.archiveFile(target);
      setNotice(
        target.archived
          ? "File restored."
          : "File archived; its bytes and attachment history are retained.",
      );
      await load();
    });
  }
  async function download(target: StoredFile) {
    try {
      setError("");
      await schoolContentApi.download(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }
  return {
    ...result,
    page,
    search,
    archived,
    purpose,
    setPurpose,
    file,
    setFile,
    loading,
    ready,
    saving,
    error,
    notice,
    upload,
    archive,
    download,
    load,
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
