"use client";

import React, { useState, useEffect, useRef } from "react";
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

  const [className, setClassName] = useState("");
  const [passingMarks, setPassingMarks] = useState("33");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAcademicYearId, setEditingAcademicYearId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const reload = async () => setClasses(await apiService.classes.getAll());

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
    const init = async () => {
      try {
        const [academicYears, sectionList, classList] = await Promise.all([
          apiService.academicYears.getAll(),
          apiService.sections.getAll(),
          apiService.classes.getAll(),
        ]);
        setCurrentAcademicYearId(academicYears.find((y) => y.isCurrent)?.id ?? null);
        setSections(sectionList);
        setClasses(classList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load classes");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const startEdit = async (item: SchoolClass) => {
    if (busy.current) return;
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
    if (busy.current) return;
    const name = className.trim();
    if (!name) { setError("Class name is required"); return; }
    const academicYearId = editingId ? editingAcademicYearId : currentAcademicYearId;
    if (!academicYearId) { setError("Set a current academic year before adding classes"); return; }
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
            onClick={() => { setError(""); void reload().catch((err) => setError(err instanceof Error ? err.message : "Unable to load classes")); }}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="lg:col-span-4 h-full sticky top-8">
          <ClassForm
            className={className}
            setClassName={setClassName}
            passingMarks={passingMarks}
            setPassingMarks={setPassingMarks}
            sections={sections}
            selectedSections={selectedSections}
            toggleSection={toggleSection}
            onSubmit={handleSubmit}
            disabled={isSaving}
            editing={editingId !== null}
            onCancel={cancel}
          />
        </div>

        {/* List Index */}
        <div className="lg:col-span-8 h-full">
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
