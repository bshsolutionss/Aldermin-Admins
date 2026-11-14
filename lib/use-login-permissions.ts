"use client";
import { useEffect, useRef, useState } from "react";
import { apiService, type LoginPermission, type LoginPermissionPage } from "./api-service";

export function useLoginPermissions() {
  const [data, setData] = useState<LoginPermissionPage>({ items: [], total: 0, page: 1, pageSize: 25 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const sequence = useRef(0);
  const busy = useRef(false);
  const activeFilter = useRef("");
  async function load(page = 1, filter = activeFilter.current) {
    const token = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const result = await apiService.users.getLoginPermissions(filter, page);
      if (token === sequence.current) { activeFilter.current = filter; setData(result); }
    } catch (err) {
      if (token === sequence.current) {
        setData({ items: [], total: 0, page, pageSize: 25 });
        setError(err instanceof Error ? err.message : "Unable to load login permissions");
      }
    } finally { if (token === sequence.current) setLoading(false); }
  }
  useEffect(() => {
    let cancelled = false;
    const token = ++sequence.current;
    void apiService.users.getLoginPermissions("", 1).then(result => {
      if (!cancelled && token === sequence.current) setData(result);
    }).catch(err => {
      if (!cancelled && token === sequence.current)
        setError(err instanceof Error ? err.message : "Unable to load login permissions");
    }).finally(() => {
      if (!cancelled && token === sequence.current) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);
  async function toggle(user: LoginPermission) {
    if (busy.current) return;
    busy.current = true;
    setSaving(user.id); setError(""); setNotice("");
    try {
      const result = await apiService.users.updateLoginPermission(user.id, !user.loginEnabled);
      setData(current => ({ ...current, items: current.items.map(row => row.id === result.id ? { ...row, loginEnabled: result.loginEnabled } : row) }));
      setNotice(`${user.name}: login access ${result.loginEnabled ? "enabled" : "disabled"}.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to change login access"); }
    finally { busy.current = false; setSaving(null); }
  }
  return { data, search, setSearch, loading, saving, error, notice, load, toggle };
}
