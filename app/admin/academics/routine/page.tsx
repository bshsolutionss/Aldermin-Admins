"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { RoutineForm } from "@/components/modules/academics/RoutineForm";
import { Button } from "@/components/ui/button";
import { FaPlus, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { DataTable } from "@/components/common/DataTable";
import { type ClassRoutine as Routine } from "@/lib/api-service";
import { useClassRoutines } from "@/lib/use-class-routines";
import { ListActionButtons } from "@/components/common/ListActionButtons";

export default function ClassRoutinePage() {
  const { routines, isLoading, saving, error, options, formData, change, handleSubmit,
    editingId, edit, remove, reset, reload, classes, sections, subjects, selectedAllocation } = useClassRoutines();

  const columns = [
    {
      header: "Deployment Vector",
      accessor: (item: Routine) => (
        <div>
          <div className="font-bold text-foreground text-sm leading-none mb-1">
            {item.class} - {item.section}
          </div>
          <div className="text-[9px] text-secondary font-bold uppercase tracking-widest">
            {item.day}
          </div>
        </div>
      ),
    },
    {
      header: "Temporal Window",
      accessor: (item: Routine) => (
        <div className="flex items-center gap-2 text-gray-500 font-mono text-xs">
          <FaClock size={10} className="text-secondary" />
          {item.startTime} - {item.endTime}
        </div>
      ),
    },
    {
      header: "Syllabus Component",
      accessor: (item: Routine) => (
        <div>
          <div className="font-semibold text-foreground text-sm">
            {item.subject}
          </div>
          <div className="text-[9px] text-gray-400 font-bold">
            {item.teacher}
          </div>
        </div>
      ),
    },
    {
      header: "Spatial Resource",
      accessor: (item: Routine) => (
        <div className="flex items-center gap-2 text-secondary font-bold text-xs">
          <FaMapMarkerAlt size={10} />
          Room {item.room}
        </div>
      ),
    },
    {
      header: "Action",
      accessor: (item: Routine) => (
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
      {error && <p role="alert" className="text-sm text-red-600">{error} <button type="button" disabled={saving || isLoading} onClick={() => void reload()}>Retry</button></p>}
      <PageHeader
        title="Routine Management"
        subtitle="Scheduling"
        action={
          <Button disabled={saving || isLoading} onClick={reset} className="bg-secondary hover:bg-secondary/90 text-white gap-2 py-6 px-6 rounded-xl font-bold text-[10px] shadow-lg shadow-secondary/10 transition-all">
            <FaPlus /> Add Routine
          </Button>
        }
      />
      <label className="block text-sm text-gray-500">Academic year <select aria-label="Academic year" value={options.academicYearId ?? ""} disabled={saving || isLoading} onChange={e => void reload(e.target.value)} className="ml-2 rounded-xl border border-gray-200 bg-white px-3 py-2"><option value="" disabled>Select year</option>{options.academicYears.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}</select></label>
      {!isLoading && !options.allocations.length && <p className="text-sm text-gray-500">Create a subject allocation with an active staff member for this academic year before scheduling a routine.</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="lg:col-span-4 h-full sticky top-8">
          <RoutineForm
            formData={formData}
            change={change}
            handleSubmit={handleSubmit}
            classes={classes} sections={sections} subjects={subjects} classrooms={options.classrooms} selectedAllocation={selectedAllocation}
            disabled={saving || isLoading} editing={!!editingId} onCancel={reset}
          />
        </div>

        {/* List Index */}
        <div className="lg:col-span-8 h-full">
          <DataTable
            data={routines}
            columns={columns}
            searchKey="class"
            searchPlaceholder="Search by class..."
            title="Institutional Operational Schedule"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
