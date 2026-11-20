"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { FaPlus } from "react-icons/fa";
import { PageHeader } from "@/components/common/PageHeader";
import { ClassForm } from "@/components/modules/academics/ClassForm";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { apiService, type SchoolClass, type Section as SectionData } from "@/lib/api-service";
import { ListActionButtons } from "@/components/common/ListActionButtons";

export default function ClassPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<string | null>(null);
  const [configurationReady, setConfigurationReady] = useState(false);

  const [className, setClassName] = useState("");
  const [passingMarks, setPassingMarks] = useState("33");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAcademicYearId, setEditingAcademicYearId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const loadSequence = useRef(0);
  const invalidateLoads = useCallback(() => { ++loadSequence.current; }, []);

  const reload = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setIsLoading(true);
    setConfigurationReady(false);
    setError("");
    try {
      const [academicYears, sectionList, classList] = await Promise.all([
        apiService.academicYears.getAll(),
        apiService.sections.getAll(),
        apiService.classes.getAll(),
      ]);
      if (sequence !== loadSequence.current) return;
      setCurrentAcademicYearId(academicYears.find((year) => year.isCurrent === true)?.id ?? null);
      setSections(sectionList);
      setClasses(classList);
      setConfigurationReady(true);
    } catch (err) {
      if (sequence === loadSequence.current)
        setError(err instanceof Error ? err.message : "Unable to load classes");
    } finally {
      if (sequence === loadSequence.current) setIsLoading(false);
    }
  }, []);

  const cancel = () => {
    setEditingId(null);
    setEditingAcademicYearId(null);
    setClassName("");
    setPassingMarks("33");
    setSelectedSections([]);
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId],
    );
  };

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return reload(); });
    return () => { active = false; invalidateLoads(); };
  }, [reload, invalidateLoads]);

  const startEdit = async (item: SchoolClass) => {
    if (busy.current || isLoading || !configurationReady) return;
    setError("");
    setEditingId(item.id);
    setEditingAcademicYearId(item.academicYearId ?? item.academicYear?.id ?? null);
    setClassName(item.name);
    setPassingMarks(String(item.passingMarks ?? 33));
    try {
      setSelectedSections(await apiService.classes.getSectionIds(item.id));
    } catch {
      setSelectedSections([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current || isLoading || !configurationReady) return;
    const name = className.trim();
    if (!name) { setError("Class name is required"); return; }
    const academicYearId = editingId ? editingAcademicYearId : currentAcademicYearId;
    if (!academicYearId) {
      setError(editingId ? "This class has no academic year. Reload its record before editing." : "Set a current academic year in Academic Year settings, then reload the class setup.");
      return;
    }
    busy.current = true; setIsSaving(true); setError("");
    try {
      const payload = {
        academicYearId,
        name,
        passingMarks: parseInt(passingMarks, 10),
        sectionIds: selectedSections,
      };
      if (editingId) await apiService.classes.update(editingId, payload);
      else await apiService.classes.create(payload);
      cancel();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save class");
    } finally {
      busy.current = false; setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (busy.current || !window.confirm("Delete this class?")) return;
    busy.current = true; setIsSaving(true); setError("");
    try {
      await apiService.classes.delete(id);
      if (editingId === id) cancel();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete class");
    } finally {
      busy.current = false; setIsSaving(false);
    }
  };

  const columns = [
    {
      header: "Class Name",
      accessor: "name" as keyof SchoolClass,
      className: "font-semibold text-gray-700",
    },
    {
      header: "Passing Marks",
      accessor: (item: SchoolClass) => item.passingMarks ?? "-",
    },
    {
      header: "Average Performance",
      accessor: () => (
        <span className="text-gray-500 italic">No data</span>
      ),
    },
    {
      header: "Action",
      accessor: (item: SchoolClass) => (
        <ListActionButtons
          onEdit={() => { if (!busy.current) void startEdit(item); }}
          onDelete={() => { void remove(item.id); }}
        />
      ),
      className: "text-center",
      headerClassName: "text-center",
    },
  ];

  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title="Institutional Grades"
        subtitle="Academic Management"
        action={
          <Button
            disabled={isSaving}
            onClick={() => { cancel(); document.getElementById("class-name")?.focus(); }}
            className="bg-secondary hover:bg-secondary/90 text-white gap-2 py-6 px-6 rounded-xl font-bold text-[10px] shadow-lg shadow-secondary/10 transition-all"
          >
            <FaPlus /> Authorize Class
          </Button>
        }
      />

      {error && (
        <div role="alert" className="text-sm text-red-600">
          {error}{" "}
          <Button
            variant="ghost"
            disabled={isLoading || isSaving}
            onClick={() => void reload()}
          >
            Retry
          </Button>
        </div>
      )}

      {configurationReady && !currentAcademicYearId && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="font-medium text-amber-950">A current academic year is required to add classes.</p>
          <p className="text-sm text-amber-900">Sections are configured separately. Create an academic year and choose Set Current, then reload the class setup. Your class form will be kept.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/settings/general-settings/academic-year" className="text-sm font-semibold text-secondary underline">Open Academic Year settings</Link>
            <Button type="button" variant="outline" disabled={isSaving || isLoading} onClick={() => void reload()}>Reload class setup</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="xl:col-span-4 self-start">
          <ClassForm
            className={className}
            setClassName={setClassName}
            passingMarks={passingMarks}
            setPassingMarks={setPassingMarks}
            sections={sections}
            selectedSections={selectedSections}
            toggleSection={toggleSection}
            onSubmit={handleSubmit}
            disabled={isSaving || isLoading || !configurationReady}
            canSubmit={editingId !== null ? !!editingAcademicYearId : !!currentAcademicYearId}
            editing={editingId !== null}
            onCancel={cancel}
          />
        </div>

        {/* List Index */}
        <div className="xl:col-span-8 h-full">
          <DataTable
            data={classes}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search classes..."
            title="Registered Grades"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
