"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionForm } from "@/components/modules/academics/SectionForm";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { apiService, type Section as SectionData } from "@/lib/api-service";
import { ListActionButtons } from "@/components/common/ListActionButtons";

export default function SectionPage() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [sectionName, setSectionName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const reload = async () => setSections(await apiService.sections.getAll());
  const cancel = () => { setEditingId(null); setSectionName(""); };

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setSections(await apiService.sections.getAll());
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unable to load sections");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    const name = sectionName.trim();
    if (!name) { setError("Section name is required"); return; }
    busy.current = true; setIsSaving(true); setError("");
    try {
      if (editingId) await apiService.sections.update(editingId, { name });
      else await apiService.sections.create({ name });
      cancel(); await reload();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save section"); }
    finally { busy.current = false; setIsSaving(false); }
  };

  const remove = async (id: string) => {
    if (busy.current || !window.confirm("Delete this section?")) return;
    busy.current = true; setIsSaving(true); setError("");
    try {
      await apiService.sections.delete(id);
      if (editingId === id) cancel();
      await reload();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to delete section"); }
    finally { busy.current = false; setIsSaving(false); }
  };

  const columns = [
    {
      header: "Section Identifier",
      accessor: "name" as keyof SectionData,
      className: "font-semibold text-secondary",
    },
    {
      header: "Action",
      accessor: (item: SectionData) => (
        <ListActionButtons
          onEdit={() => { if (!busy.current) { setEditingId(item.id); setSectionName(item.name); setError(""); } }}
          onDelete={() => { void remove(item.id); }}
        />
      ),
      className: "text-end",
      headerClassName: "text-end",
    },
  ];

  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title="Institutional Sections"
        subtitle="Academic Management"
        action={
          <Button disabled={isSaving} onClick={() => { cancel(); document.getElementById("section-name")?.focus(); }} className="bg-secondary hover:bg-secondary/90 text-white gap-2 py-6 px-6 rounded-xl font-bold text-[10px] shadow-lg shadow-secondary/10">
            <FaPlus /> Authorize Section
          </Button>
        }
      />

      {error && <div role="alert" className="text-sm text-red-600">{error} <Button variant="ghost" onClick={() => { setError(""); void reload().catch(error => setError(error instanceof Error ? error.message : "Unable to load sections")); }}>Retry</Button></div>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="lg:col-span-4 h-full sticky top-8">
          <SectionForm
            sectionName={sectionName}
            setSectionName={setSectionName}
            onSubmit={handleSubmit}
            disabled={isSaving}
            editing={editingId !== null}
            onCancel={cancel}
          />
        </div>

        {/* List Index */}
        <div className="lg:col-span-8 h-full">
          <DataTable
            data={sections}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search sections..."
            title="Active Sections"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
