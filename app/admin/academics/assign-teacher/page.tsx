"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AssignTeacherForm } from "@/components/modules/academics/AssignTeacherForm";
import { Button } from "@/components/ui/button";
import { FaPlus } from "react-icons/fa";
import { DataTable } from "@/components/common/DataTable";
import {
  apiService,
  type ClassTeacherAssignment,
  type ClassTeacherOptions,
} from "@/lib/api-service";
import { ListActionButtons } from "@/components/common/ListActionButtons";

interface ClassOption {
  id: string;
  name: string;
}
interface SectionOption {
  id: string;
  name: string;
}
interface TeacherOption {
  id: string;
  name: string;
  staffNo?: string;
}

export default function AssignClassTeacherPage() {
  const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [options, setOptions] = useState<ClassTeacherOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const reload = async () =>
    setAssignments(await apiService.classTeacherAssignments.getAll());

  const resetForm = () => {
    setEditingId(null);
    setSelectedClass("");
    setSelectedSection("");
    setSelectedTeacher("");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rows, choices] = await Promise.all([
          apiService.classTeacherAssignments.getAll(),
          apiService.classTeacherAssignments.getOptions(),
        ]);
        setAssignments(rows);
        setOptions(choices);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load class teacher assignments",
        );
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, []);

  const classSections = options?.classSections ?? [];
  const classes: ClassOption[] = [];
  const seenClasses = new Set<string>();
  for (const section of classSections) {
    if (seenClasses.has(section.classId)) continue;
    seenClasses.add(section.classId);
    classes.push({ id: section.classId, name: section.className });
  }
  const sections: SectionOption[] = classSections
    .filter((section) => section.classId === selectedClass)
    .map((section) => ({ id: section.id, name: section.sectionName }));
  const teachers: TeacherOption[] = (options?.teachers ?? []).map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    staffNo: teacher.staffNo,
  }));

  const selectClass = (value: string) => {
    setSelectedClass(value);
    setSelectedSection("");
  };

  const startEdit = (item: ClassTeacherAssignment) => {
    if (busy.current) return;
    setError("");
    setEditingId(item.id);
    setSelectedClass(item.classId);
    setSelectedSection(item.classSectionId);
    setSelectedTeacher(item.staffId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    if (!selectedSection || !selectedTeacher) {
      setError("Select a class section and teacher");
      return;
    }
    busy.current = true;
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        classSectionId: selectedSection,
        staffId: selectedTeacher,
      };
      if (editingId) {
        await apiService.classTeacherAssignments.update(editingId, payload);
      } else {
        await apiService.classTeacherAssignments.create(payload);
      }
      resetForm();
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save class teacher assignment",
      );
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (busy.current || !window.confirm("Delete this class teacher assignment?")) {
      return;
    }
    busy.current = true;
    setIsSaving(true);
    setError("");
    try {
      await apiService.classTeacherAssignments.delete(id);
      if (editingId === id) resetForm();
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete class teacher assignment",
      );
    } finally {
      busy.current = false;
      setIsSaving(false);
    }
  };

  const columns = [
    {
      header: "Institutional Class",
      accessor: "className" as keyof ClassTeacherAssignment,
      className: "font-semibold text-foreground",
    },
    {
      header: "Logical Section",
      accessor: "sectionName" as keyof ClassTeacherAssignment,
      className: "font-bold text-secondary",
    },
    {
      header: "Faculty In-Charge",
      accessor: "teacherName" as keyof ClassTeacherAssignment,
      className: "italic text-gray-500",
    },
    {
      header: "Action",
      accessor: (item: ClassTeacherAssignment) => (
        <ListActionButtons
          onEdit={() => startEdit(item)}
          onDelete={() => void remove(item.id)}
        />
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  return (
    <div className="container mx-auto space-y-8 pb-10">
      {error && (
        <div role="alert" className="text-sm text-red-600">
          {error}{" "}
          <Button
            variant="ghost"
            onClick={() => {
              setError("");
              void Promise.all([
                apiService.classTeacherAssignments.getAll(),
                apiService.classTeacherAssignments.getOptions(),
              ])
                .then(([rows, choices]) => {
                  setAssignments(rows);
                  setOptions(choices);
                })
                .catch((err) =>
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Unable to load class teacher assignments",
                  ),
                );
            }}
          >
            Retry
          </Button>
        </div>
      )}
      <PageHeader
        title="Class Teacher Allocation"
        subtitle="Academics Management"
        action={
          <Button
            disabled={isSaving}
            onClick={() => {
              resetForm();
              document.getElementById("class-teacher-class")?.focus();
            }}
            className="bg-secondary hover:bg-secondary/90 text-white gap-2 py-6 px-6 rounded-xl font-bold text-[10px] shadow-lg shadow-secondary/10 transition-all"
          >
            <FaPlus /> Assign Teacher
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* FORM */}
        <div className="xl:col-span-4 self-start">
          <AssignTeacherForm
            selectedClass={selectedClass}
            setSelectedClass={selectClass}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            selectedTeacher={selectedTeacher}
            setSelectedTeacher={setSelectedTeacher}
            handleSubmit={handleSubmit}
            classes={classes}
            sections={sections}
            teachers={teachers}
            disabled={isSaving || isLoading}
            editing={editingId !== null}
            onCancel={resetForm}
          />
        </div>

        {/* TABLE */}
        <div className="xl:col-span-8 h-full">
          <DataTable
            data={assignments}
            columns={columns}
            searchKey="teacherName"
            searchPlaceholder="Filter by teacher..."
            title="Institutional Faculty Matrix"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
