"use client";

import { useEffect, useRef, useState } from "react";
import { financeApi, type FinanceRow } from "./finance-client";

export function useFinanceSettings() {
  const [record, setRecord] = useState<FinanceRow | null>(null);
  const [currency, setCurrency] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    const token = ++sequence.current;
    void financeApi.settings().then(
      ({ record }) => {
        if (!active || token !== sequence.current) return;
        setRecord(record);
        setCurrency(String(record?.currency ?? ""));
        setReady(true);
        setLoading(false);
        setError("");
      },
      (err) => {
        if (!active || token !== sequence.current) return;
        setReady(false);
        setLoading(false);
        setError(err instanceof Error ? err.message : "Unable to load school currency");
      },
    );
    return () => { active = false; };
  }, [revision]);

  function reload() {
    if (busy.current) return;
    ++sequence.current;
    setReady(false);
    setLoading(true);
    setError("");
    setNotice("");
    setRevision(value => value + 1);
  }

  async function save(): Promise<boolean> {
    if (busy.current || !ready) return false;
    if (!/^[A-Z]{3}$/.test(currency)) {
      setError("Choose a school currency before saving.");
      return false;
    }
    busy.current = true;
    ++sequence.current;
    setSaving(true);
    setError("");
    setNotice("");
    let written = false;
    try {
      const saved = await financeApi.saveSettings({ currency, version: record?.version ?? 0 });
      written = true;
      // Keep the current version even if the independent confirmation read fails.
      setRecord(saved.record);
      const confirmed = await financeApi.settings();
      if (confirmed.record?.currency !== currency) {
        throw new Error("The loaded school currency does not match the selection. Reload before retrying.");
      }
      setRecord(confirmed.record);
      setCurrency(String(confirmed.record.currency));
      setNotice("School currency saved and reloaded.");
      if (typeof window !== "undefined") window.dispatchEvent(new Event("finance-settings-saved"));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save school currency";
      setError(written ? "Currency was saved, but confirmation failed. " + message : message);
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return { record, currency, setCurrency, ready, loading, saving, error, notice, reload, save };
}
