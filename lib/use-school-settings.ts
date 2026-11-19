"use client";
import { useEffect, useRef, useState } from "react";
import { apiService, type SchoolSettings, type SchoolSettingsHistory, type SchoolSettingsInput } from "./api-service";

const empty: SchoolSettingsInput = { schoolName: "", schoolCode: null, contactEmail: null, contactPhone: null, address: null, timezone: "", version: 0 };
function input(settings: SchoolSettings | null): SchoolSettingsInput {
  if (!settings) return { ...empty };
  const { schoolName, schoolCode, contactEmail, contactPhone, address, timezone, version } = settings;
  return { schoolName, schoolCode, contactEmail, contactPhone, address, timezone, version };
}
export function useSchoolSettings() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [draft, setDraft] = useState<SchoolSettingsInput>({ ...empty });
  const [history, setHistory] = useState<SchoolSettingsHistory>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const sequence = useRef(0);
  const historySequence = useRef(0);
  const busy = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const token = ++sequence.current;
    const historyToken = ++historySequence.current;
    void Promise.all([apiService.schoolSettings.get(), apiService.schoolSettings.history()]).then(([result, events]) => {
      if (!cancelled && token === sequence.current) {
        setSettings(result.settings); setDraft(input(result.settings)); setReady(true);
        if (historyToken === historySequence.current) setHistory(events);
      }
    }).catch(err => {
      if (!cancelled && token === sequence.current) setError(err instanceof Error ? err.message : "Unable to load settings");
    }).finally(() => { if (!cancelled && token === sequence.current) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  async function reload() {
    if (busy.current) return;
    const token = ++sequence.current;
    const historyToken = ++historySequence.current;
    setLoading(true); setReady(false); setError(""); setNotice("");
    try {
      const [result, events] = await Promise.all([apiService.schoolSettings.get(), apiService.schoolSettings.history()]);
      if (token === sequence.current) {
        setSettings(result.settings); setDraft(input(result.settings)); setReady(true);
        if (historyToken === historySequence.current) setHistory(events);
      }
    } catch (err) { if (token === sequence.current) setError(err instanceof Error ? err.message : "Unable to load settings"); }
    finally { if (token === sequence.current) setLoading(false); }
  }
  async function loadHistory(page: number) {
    if (busy.current) return;
    const token = ++historySequence.current;
    setError("");
    try { const events = await apiService.schoolSettings.history(page); if (token === historySequence.current) setHistory(events); }
    catch (err) { if (token === historySequence.current) setError(err instanceof Error ? err.message : "Unable to load history"); }
  }
  async function save() {
    if (busy.current || !ready) return false;
    busy.current = true; ++sequence.current;
    const token = ++historySequence.current;
    setSaving(true); setError(""); setNotice("");
    try {
      const result = await apiService.schoolSettings.save(draft);
      setSettings(result.settings); setDraft(input(result.settings));
      setNotice(result.changed ? "General Settings saved." : "General Settings are already up to date.");
      try { const events = await apiService.schoolSettings.history(); if (token === historySequence.current) setHistory(events); }
      catch { setError("Settings are saved. Audit history could not load; reload to retry."); }
      return true;
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save settings"); return false; }
    finally { busy.current = false; setSaving(false); }
  }
  return { settings, draft, setDraft, history, loading, ready, saving, error, notice, reload, loadHistory, save };
}
