"use client";

import { useClassRoutines } from "@/lib/use-class-routines";
import { AdminCard } from "@/components/common/AdminCard";
import { PageHeader } from "@/components/common/PageHeader";

export function ClassRoutineReport() {
  const { routines, options, isLoading, error, reload } = useClassRoutines();
  return <div className="space-y-6">
    <PageHeader title="Class Routine" subtitle="View class schedules" />
    <AdminCard><div className="space-y-4 p-6">
      <label className="block">Academic year <select className="ml-2 rounded-xl border p-2" value={options.academicYearId ?? ""} disabled={isLoading || !options.academicYears.length} onChange={event => void reload(event.target.value)}>
        {!options.academicYearId && <option value="">No academic year</option>}
        {options.academicYears.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}
      </select></label>
      {isLoading && <p>Loading class routine…</p>}
      {error && <p role="alert">{error}</p>}
      {!isLoading && !error && <><div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr><th>Class</th><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th></tr></thead>
        <tbody>{routines.map(row => <tr key={row.id} className="border-t"><td>{row.class} {row.section}</td><td>{row.day}</td><td>{row.startTime.slice(0, 5)}–{row.endTime.slice(0, 5)}</td><td>{row.subject}</td><td>{row.teacher}</td><td>{row.room}</td></tr>)}</tbody>
      </table></div>{routines.length === 0 && <p>No class routines found for this academic year.</p>}</>}
    </div></AdminCard>
  </div>;
}
