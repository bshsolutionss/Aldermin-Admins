"use client";

import React from "react";
import { FaPlus } from "react-icons/fa";
import { PageHeader } from "@/components/common/PageHeader";
import { SubjectForm } from "@/components/modules/academics/SubjectForm";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { type SchoolSubject as Subject } from "@/lib/api-service";
import { useSchoolSubjects } from "@/lib/use-school-subjects";
import { ListActionButtons } from "@/components/common/ListActionButtons";

export default function SubjectPage() {
  const { subjects, form, setForm, editingId, isLoading, isSubmitting, error, reload, reset, edit, submit, remove } = useSchoolSubjects();

  const columns = [
    {
      header: "Subject Name",
      accessor: "name" as keyof Subject,
      className: "font-semibold text-foreground",
    },
    {
      header: "Inventory Code",
      accessor: "code" as keyof Subject,
      className: "font-bold text-secondary font-mono",
    },
    {
      header: "Vector Type",
      accessor: "type" as keyof Subject,
      className: "italic text-gray-500",
    },
    {
      header: "Action",
      accessor: (item: Subject) => (
        <ListActionButtons
          onEdit={() => edit(item)}
          onDelete={() => void remove(item.id)}
        />
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title="Knowledge Inventory"
        subtitle="Syllabus Management"
        action={
          <Button disabled={isSubmitting} onClick={reset} className="bg-secondary hover:bg-secondary/90 text-white gap-2 py-6 px-6 rounded-xl font-bold text-[10px] shadow-lg shadow-secondary/10 transition-all">
            <FaPlus /> Authorize Subject
          </Button>
        }
      />

      {error && <div role="alert" className="text-red-600 text-sm">{error} <button type="button" disabled={isSubmitting} onClick={() => void reload()}>Retry</button></div>}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="xl:col-span-4 self-start">
          <SubjectForm
            form={form}
            setForm={setForm}
            onSubmit={submit}
            disabled={isSubmitting || isLoading}
            editing={!!editingId}
            onCancel={reset}
          />
        </div>

        {/* List Index */}
        <div className="xl:col-span-8 h-full">
          <DataTable
            data={subjects}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search subjects..."
            title="Registered Curriculum"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
