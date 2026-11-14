"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { foundationsApi } from "./admin-foundations-client";

export function useWeekends() {
  const [days, setDays] = useState<number[]>([]);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    if (busy.current) return;
    const token = ++sequence.current;
    setLoading(true); setReady(false); setError(""); setNotice("");
    try {
      const result = await foundationsApi.weekends();
      if (token === sequence.current) { setDays(result.weekends?.days ?? []); setVersion(result.weekends?.version ?? 0); setReady(true); }
    } catch (err) { if (token === sequence.current) setError(err instanceof Error ? err.message : "Unable to load weekends"); }
    finally { if (token === sequence.current) setLoading(false); }
  }, []);
  const invalidateRequests = useCallback(() => { ++sequence.current; }, []);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return reload(); });
    return () => { active = false; invalidateRequests(); };
  }, [reload, invalidateRequests]);
  async function save() {
    if (busy.current || !ready) return;
    if (days.length > 6) { setError("Keep at least one school day each week."); return; }
    busy.current = true; ++sequence.current; setSaving(true); setError(""); setNotice("");
    try {
      const result = await foundationsApi.saveWeekends(days, version);
      setDays(result.weekends.days); setVersion(result.weekends.version); setNotice(result.changed ? "Weekend settings saved." : "Weekend settings are already up to date.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save weekends"); }
    finally { busy.current = false; setSaving(false); }
  }
  return { days, setDays, version, loading, ready, saving, error, notice, save, reload };
}
