"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { PageHeader } from "@/components/common/PageHeader";
import { DesignationForm } from "@/components/modules/hr/DesignationForm";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { apiService, type Designation } from "@/lib/api-service";
import { ListActionButtons } from "@/components/common/ListActionButtons";

export default function DesignationPage() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [designationTitle, setDesignationTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const reload = async () =>
    setDesignations(await apiService.hr.getDesignations());
  const cancel = () => {
    setEditingId(null);
    setDesignationTitle("");
  };

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        setDesignations(await apiService.hr.getDesignations());
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to load designations",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchDesignations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    const name = designationTitle.trim();
    if (!name) {
      setError("Designation title is required");
      return;
    }
    busy.current = true;
    setIsSaving(true);
    setError("");
    try {
      if (editingId)
        await apiService.hr.updateDesignation(editingId, { name });
      else await apiService.hr.createDesignation({ name });
      cancel();
      await reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save designation",
      );
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (busy.current || !window.confirm("Delete this designation?")) return;
    busy.current = true;
    setIsSaving(true);
    setError("");
    try {
      await apiService.hr.deleteDesignation(id);
      if (editingId === id) cancel();
      await reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to delete designation",
      );
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  };

  const columns = [
    {
      header: "Designation Title",
      accessor: "name" as keyof Designation,
      className: "font-semibold text-foreground",
    },
    {
      header: "Action",
      accessor: (item: Designation) => (
        <ListActionButtons
          onEdit={() => {
            if (!busy.current) {
              setEditingId(item.id);
              setDesignationTitle(item.name);
              setError("");
            }
          }}
          onDelete={() => {
            void remove(item.id);
          }}
        />
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title="Institutional Roles"
        subtitle="Staff Hierarchy Management"
        action={
          <Button
            disabled={isSaving}
            onClick={() => {
              cancel();
              document.getElementById("designation-title")?.focus();
            }}
            className="bg-secondary hover:bg-secondary/90 text-white gap-2 py-6 px-6 rounded-xl font-bold text-[10px] shadow-lg shadow-secondary/10 transition-all"
          >
            <FaPlus /> Authorize Role
          </Button>
        }
      />

      {error && (
        <div role="alert" className="text-sm text-red-600">
          {error}{" "}
          <Button
            variant="ghost"
            onClick={() => {
              setError("");
              void reload().catch((error) =>
                setError(
                  error instanceof Error
                    ? error.message
                    : "Unable to load designations",
                ),
              );
            }}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="xl:col-span-4 self-start">
          <DesignationForm
            designationTitle={designationTitle}
            setDesignationTitle={setDesignationTitle}
            onSubmit={handleSubmit}
            disabled={isSaving}
            editing={editingId !== null}
            onCancel={cancel}
          />
        </div>

        {/* List Index */}
        <div className="xl:col-span-8 h-full">
          <DataTable
            data={designations}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search roles..."
            title="Staff Hierarchy"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
