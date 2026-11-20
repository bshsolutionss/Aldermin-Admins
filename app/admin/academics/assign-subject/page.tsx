"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AssignSubjectForm } from "@/components/modules/academics/AssignSubjectForm";
import { Button } from "@/components/ui/button";
import { FaPlus } from "react-icons/fa";
import { DataTable } from "@/components/common/DataTable";
import { apiService, type SubjectAssignment as AssignedSubject } from "@/lib/api-service";
import { ListActionButtons } from "@/components/common/ListActionButtons";

export default function AssignSubjectPage() {
  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubject[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const busy = useRef(false);
  const [options, setOptions] = useState({
    subjects: [] as { id: string; name: string }[],
    sections: [] as { id: string; name: string }[],
    teachers: [] as { id: string; name: string }[],
  });

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignments, choices] = await Promise.all([
          apiService.academics.getSubjectAssignments(),
          apiService.subjectAssignments.getOptions(),
        ]);
        setAssignedSubjects(assignments);
        setOptions({
          subjects: choices.subjects,
          sections: choices.classSections.map(section => ({ id: section.id, name: `${section.className} / ${section.sectionName} (${section.academicYearName})` })),
          teachers: choices.teachers.map(teacher => ({ id: teacher.id, name: `${teacher.name} (${teacher.staffNo})` })),
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unable to load subject options");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current || !selectedSubject || !selectedSection || !selectedTeacher) return;
    busy.current = true; setSaving(true); setError("");
    try {
      const payload = { subjectId: selectedSubject, classSectionId: selectedSection, staffId: selectedTeacher };
      if (editingId) await apiService.subjectAssignments.update(editingId, payload);
      else await apiService.subjectAssignments.create(payload);
      setAssignedSubjects(await apiService.subjectAssignments.getAll());
      setSelectedSubject(""); setSelectedSection(""); setSelectedTeacher("");
      setEditingId(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save assignment"); }
    finally { busy.current = false; setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError("");
    try {
      await apiService.subjectAssignments.delete(id);
      setAssignedSubjects(await apiService.subjectAssignments.getAll());
      if (editingId === id) { setEditingId(null); setSelectedSubject(""); setSelectedSection(""); setSelectedTeacher(""); }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete assignment"); }
    finally { busy.current = false; setSaving(false); }
  };

  const columns = [
    {
      header: "Syllabus Component",
      accessor: "subject" as keyof AssignedSubject,
      className: "font-semibold text-foreground",
    },
    {
      header: "Logical Section",
      accessor: (item: AssignedSubject) => item.legacy ? `${item.section} (legacy)` : `${item.className} / ${item.section}`,
      className: "font-bold text-secondary",
    },
    {
      header: "Lead Instructor",
      accessor: "teacher" as keyof AssignedSubject,
      className: "italic text-gray-500",
    },
    {
      header: "Action",
      accessor: (item: AssignedSubject) => (
        <ListActionButtons
          onEdit={item.legacy ? undefined : () => {
            if (busy.current) return;
            setEditingId(item.id); setSelectedSubject(item.subjectId);
            setSelectedSection(item.classSectionId ?? ""); setSelectedTeacher(item.staffId ?? "");
          }}
          onDelete={() => void handleDelete(item.id)}
        />
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  return (
    <div className="container mx-auto space-y-8 pb-10">
      {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
      <PageHeader
        title="Subject Allocation"
        subtitle="Academics Management"
        action={
          <Button disabled={saving} onClick={() => { setEditingId(null); setSelectedSubject(""); setSelectedSection(""); setSelectedTeacher(""); }} className="bg-secondary hover:bg-secondary/90 text-white gap-2 py-6 px-6 rounded-xl font-bold text-[10px] shadow-lg shadow-secondary/10 transition-all">
            <FaPlus /> Assign Subject
          </Button>
        }
      />
      {!isLoading && !options.teachers.length && <p className="text-sm text-gray-500">Add an active staff member in Human Resource before assigning subjects.</p>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* FORM */}
        <div className="xl:col-span-4 self-start">
          <AssignSubjectForm
            editing={!!editingId}
            onCancel={() => { setEditingId(null); setSelectedSubject(""); setSelectedSection(""); setSelectedTeacher(""); }}
            disabled={saving || isLoading}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            selectedTeacher={selectedTeacher}
            setSelectedTeacher={setSelectedTeacher}
            handleSubmit={handleSubmit}
            subjects={options.subjects}
            sections={options.sections}
            teachers={options.teachers}
          />
        </div>

        {/* TABLE */}
        <div className="xl:col-span-8 h-full">
          <DataTable
            data={assignedSubjects}
            columns={columns}
            searchKey="subject"
            searchPlaceholder="Filter by subject..."
            title="Syllabus Deployment Matrix"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
