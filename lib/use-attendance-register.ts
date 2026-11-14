"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { schoolRecordsApi, type AttendanceKind, type AttendancePage, type AttendanceEntry, type AttendanceInput, type SchoolOptions } from "./school-records-client";
const blank: AttendancePage = { items: [], total: 0, page: 1, pageSize: 50, date: "", calendar: { today: null, weekend: null, holiday: null } };
export function useAttendanceRegister(kind: AttendanceKind) {
  const [options, setOptions] = useState<SchoolOptions>({ placements: [], categories: [], groups: [], today: null });
  const [date, setDate] = useState("");
  const [placement, setPlacement] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AttendancePage>({ ...blank });
  const [dirty, setDirty] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = useRef(false), sequence = useRef(0);
  useEffect(() => {
    let active = true;
    void schoolRecordsApi.options().then(metadata => { if (active) { setOptions(metadata); setDate(previous => previous || metadata.today || ""); } }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Unable to load school options"); });
    return () => { active = false; };
  }, []);
  const reload = useCallback(async () => {
    if (!date || (kind === "students" && !placement)) { setReady(false); setResult({ ...blank }); return; }
    const token = ++sequence.current;
    setLoading(true); setReady(false); setError("");
    try { const data = await schoolRecordsApi.attendance(kind, date, kind === "students" ? placement : "", page); if (token === sequence.current) { setResult(data); setDirty([]); setReady(true); } }
    catch (err) { if (token === sequence.current) setError(err instanceof Error ? err.message : "Unable to load attendance"); }
    finally { if (token === sequence.current) setLoading(false); }
  }, [kind, date, placement, page]);
  const invalidate = useCallback(() => { ++sequence.current; }, []);
  useEffect(() => { let active = true; void Promise.resolve().then(() => { if (active) return reload(); }); return () => { active = false; invalidate(); }; }, [reload, invalidate]);
  function change(targetId: string, patch: Partial<Pick<AttendanceEntry, "status" | "note" | "clockIn" | "clockOut">>) {
    if (busy.current || !ready) return;
    setResult(previous => ({ ...previous, items: previous.items.map(item => item.targetId === targetId ? { ...item, ...patch } : item) }));
    setDirty(previous => previous.includes(targetId) ? previous : [...previous, targetId]);
  }
  async function save() {
    if (busy.current || !ready || !dirty.length) return;
    const changed = result.items.filter(item => dirty.includes(item.targetId));
    if (changed.some(item => !item.status)) { setError("Choose a status for every edited attendance row."); return; }
    const entries: AttendanceInput[] = changed.map(item => ({ targetId: item.targetId, status: item.status!, note: item.note, version: item.version, ...(kind === "staff" ? { clockIn: item.clockIn || null, clockOut: item.clockOut || null } : {}) }));
    busy.current = true; invalidate(); setSaving(true); setError(""); setNotice("");
    try { const saved = await schoolRecordsApi.saveAttendance(kind, date, entries); setNotice(`Attendance saved: ${saved.changed} records changed.`); await reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to save attendance"); }
    finally { busy.current = false; setSaving(false); }
  }
  return { ...result, options, date, placement, page, dirty, loading, ready, saving, error, notice, change, save, reload,
    setDate: (value: string) => { if (busy.current || dirty.length) return; setPage(1); setDate(value); },
    setPlacement: (value: string) => { if (busy.current || dirty.length) return; setPage(1); setPlacement(value); },
    setPage: (value: number) => { if (!busy.current && !dirty.length) setPage(value); } };
}
