"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { PageHeader } from "@/components/common/PageHeader";
import { DepartmentForm } from "@/components/modules/hr/DepartmentForm";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { apiService, type Department } from "@/lib/api-service";
import { ListActionButtons } from "@/components/common/ListActionButtons";

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentTitle, setDepartmentTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const reload = async () => setDepartments(await apiService.hr.getDepartments());
  const cancel = () => {
    setEditingId(null);
    setDepartmentTitle("");
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartments(await apiService.hr.getDepartments());
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to load departments",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    const name = departmentTitle.trim();
    if (!name) {
      setError("Department title is required");
      return;
    }
    busy.current = true;
    setIsSaving(true);
    setError("");
    try {
      if (editingId) await apiService.hr.updateDepartment(editingId, { name });
      else await apiService.hr.createDepartment({ name });
      cancel();
      await reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save department",
      );
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (busy.current || !window.confirm("Delete this department?")) return;
    busy.current = true;
    setIsSaving(true);
    setError("");
    try {
      await apiService.hr.deleteDepartment(id);
      if (editingId === id) cancel();
      await reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to delete department",
      );
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  };

  const columns = [
    {
      header: "Department Title",
      accessor: "name" as keyof Department,
      className: "font-semibold text-foreground",
    },
    {
      header: "Action",
      accessor: (item: Department) => (
        <ListActionButtons
          onEdit={() => {
            if (!busy.current) {
              setEditingId(item.id);
              setDepartmentTitle(item.name);
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
        title="Institutional Units"
        subtitle="Departmental Management"
        action={
          <Button
            disabled={isSaving}
            onClick={() => {
              cancel();
              document.getElementById("department-title")?.focus();
            }}
            className="bg-secondary hover:bg-secondary/90 text-white gap-2 py-6 px-6 rounded-xl font-bold text-[10px] shadow-lg shadow-secondary/10 transition-all"
          >
            <FaPlus /> Authorize Unit
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
                    : "Unable to load departments",
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
        <div className="xl:col-span-4 h-full sticky top-8">
          <DepartmentForm
            departmentTitle={departmentTitle}
            setDepartmentTitle={setDepartmentTitle}
            onSubmit={handleSubmit}
            disabled={isSaving}
            editing={editingId !== null}
            onCancel={cancel}
          />
        </div>

        {/* List Index */}
        <div className="xl:col-span-8 h-full">
          <DataTable
            data={departments}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search departments..."
            title="Active Units"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
