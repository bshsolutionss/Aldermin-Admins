"use client";

import React, { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { DataTable } from "@/components/common/DataTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiService, type AcademicYear, type AcademicYearInput } from "@/lib/api-service";

const empty: AcademicYearInput = { name: "", startDate: "", endDate: "" };

export default function AcademicYearPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [form, setForm] = useState<AcademicYearInput>({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  useEffect(() => {
    let active = true;
    apiService.academicYears.getAll().then(data => { if (active) setYears(data); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load academic years"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const reset = () => { setForm({ ...empty }); setEditing(null); };
  const reload = async () => {
    setLoading(true); setError("");
    try { setYears(await apiService.academicYears.getAll()); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load academic years"); }
    finally { setLoading(false); }
  };
  const mutate = async (action: () => Promise<unknown>, resetForm = false) => {
    if (busy.current || loading) return;
    busy.current = true; setSaving(true); setError("");
    try {
      await action();
      setYears(await apiService.academicYears.getAll());
      if (resetForm) reset();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save academic year"); }
    finally { busy.current = false; setSaving(false); }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.endDate <= form.startDate) { setError("End date must be after start date"); return; }
    void mutate(() => editing ? apiService.academicYears.update(editing, form) : apiService.academicYears.create(form), true);
  };
  const columns = [
    { header: "Academic Year", accessor: "name" as const },
    { header: "Start Date", accessor: "startDate" as const },
    { header: "End Date", accessor: "endDate" as const },
    { header: "Status", accessor: (year: AcademicYear) => year.isCurrent ? "Current" : "—" },
    { header: "Actions", accessor: (year: AcademicYear) => <div className="flex gap-2 flex-wrap">
      <Button variant="ghost" size="sm" disabled={saving || loading} onClick={() => { setEditing(year.id); setForm({ name: year.name, startDate: year.startDate, endDate: year.endDate }); setError(""); }}>Edit</Button>
      <Button variant="ghost" size="sm" disabled={saving || loading || year.isCurrent} onClick={() => void mutate(() => apiService.academicYears.setCurrent(year.id))}>Set Current</Button>
      <Button variant="ghost" size="sm" disabled={saving || loading || year.isCurrent} onClick={() => void mutate(() => apiService.academicYears.delete(year.id), editing === year.id)}>Delete</Button>
    </div> },
  ];
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Academic Year" 
        subtitle="Configure and manage academic year"
      />
      <AdminCard>
        <div className="p-6">
          {error && <p role="alert" className="mb-4 text-sm text-red-600">{error} <button type="button" disabled={saving} onClick={() => void reload()}>Retry</button></p>}
          <h2 className="mb-4 text-sm font-semibold text-gray-500">{editing ? "Edit Academic Year" : "Add Academic Year"}</h2>
          <form onSubmit={submit} className="space-y-4">
            <fieldset disabled={saving || loading} className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
              <div className="space-y-2"><Label htmlFor="year-name">Academic Year Name</Label><Input id="year-name" required maxLength={100} placeholder="e.g. 2026–2027" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="year-start">Start Date</Label><Input id="year-start" required type="date" value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="year-end">End Date</Label><Input id="year-end" required type="date" value={form.endDate} onChange={event => setForm({ ...form, endDate: event.target.value })} /></div>
            </fieldset>
            <div className="flex gap-2"><Button type="submit" disabled={saving || loading}>{saving ? "Saving..." : editing ? "Update Academic Year" : "Save Academic Year"}</Button>{editing && <Button type="button" variant="outline" disabled={saving} onClick={reset}>Cancel</Button>}</div>
          </form>
        </div>
      </AdminCard>
      <DataTable data={years} columns={columns} searchKey="name" searchPlaceholder="Search academic years..." title="Academic Years" isLoading={loading} />
    </div>
  );
}
