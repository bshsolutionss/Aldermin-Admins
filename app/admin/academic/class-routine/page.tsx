"use client";

import { Input as LmsInput } from "@/components/ui/input";

import React from "react";
import { useClassRoutines, routineDays } from "@/lib/use-class-routines";
import {
  FaCalendarAlt,
  FaClock,
  FaBook,
  FaUserTie,
  FaDoorOpen,
  FaTrash,
  FaEdit,
  FaCheck,
  FaLayerGroup,
} from "react-icons/fa";

export default function ClassRoutinePage() {
  const { routines, options, formData, change, handleSubmit, editingId, error, isLoading, saving,
    edit, remove, reset, reload, classes, sections, subjects, selectedAllocation } = useClassRoutines();

  return (
    <div className="container mx-auto space-y-6">
      {error && <p role="alert" className="text-sm text-red-600">{error} <button type="button" disabled={saving || isLoading} onClick={() => void reload()}>Retry</button></p>}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-xl shadow-sm ring-4 ring-secondary/10">
            <FaCalendarAlt className="text-white" size={20} />
          </div>
          Chronological Routine
        </h1>
      </div>

      <label className="block text-sm text-gray-500">Academic year <select aria-label="Academic year" value={options.academicYearId ?? ""} disabled={saving || isLoading} onChange={e => void reload(e.target.value)} className="ml-2 rounded-xl border border-gray-200 bg-white px-3 py-2"><option value="" disabled>Select year</option>{options.academicYears.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}</select></label>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Creation Form */}
        <div className="xl:col-span-4 self-start">
          <div className="rounded-xl bg-white p-5 sm:p-6 border border-gray-200 flex flex-col h-full bg-gradient-to-br from-white to-indigo-50/5">
            <h4 className="mb-8 text-xs font-semibold text-gray-500   leading-none flex items-center gap-2">
              {editingId ? "Edit Chronology" : "Add To Chronology"}
              <div className="h-[1px] flex-1 bg-gray-100"></div>
            </h4>

            <form onSubmit={handleSubmit} className="space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                    Grade
                  </label>
                  <select aria-label="Grade" required disabled={saving || isLoading} value={formData.class} onChange={e => change("class", e.target.value)} className="w-full rounded-lg border-gray-100 p-4 text-xs font-bold focus:ring-4 focus:ring-secondary/10 outline-none transition-all bg-white shadow-sm appearance-none">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                    Unit
                  </label>
                  <select aria-label="Unit" required disabled={saving || isLoading || !formData.class} value={formData.section} onChange={e => change("section", e.target.value)} className="w-full rounded-lg border-gray-100 p-4 text-xs font-bold focus:ring-4 focus:ring-secondary/10 outline-none transition-all bg-white shadow-sm appearance-none">
                    <option value="">Select Section</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                  Academic Day
                </label>
                <select aria-label="Academic Day" required disabled={saving || isLoading} value={formData.day} onChange={e => change("day", e.target.value)} className="w-full rounded-lg border-gray-100 p-4 text-xs font-semibold text-secondary outline-none bg-secondary/30 appearance-none ">
                  <option value="">Select Day</option>
                  {routineDays.map((day,index) => <option key={day} value={String(index+1)}>{day}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                    Commencement
                  </label>
                  <div className="relative">
                    <FaClock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={12}
                    />
                    <LmsInput aria-label="Commencement"
                      type="time"
                      required disabled={saving || isLoading} value={formData.startTime} onChange={e => change("startTime", e.target.value)}
                      placeholder="08:00 AM"
                      className="w-full rounded-lg border-gray-100 p-4 pl-10 text-xs  font-bold focus:ring-4 focus:ring-secondary/10 outline-none transition-all bg-white shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                    Conclusion
                  </label>
                  <div className="relative">
                    <FaClock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={12}
                    />
                    <LmsInput aria-label="Conclusion"
                      type="time"
                      required disabled={saving || isLoading} value={formData.endTime} onChange={e => change("endTime", e.target.value)}
                      placeholder="08:40 AM"
                      className="w-full rounded-lg border-gray-100 p-4 pl-10 text-xs  font-bold focus:ring-4 focus:ring-secondary/10 outline-none transition-all bg-white shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                  Discipline
                </label>
                <div className="relative">
                  <FaBook
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={12}
                  />
                  <select aria-label="Discipline" required disabled={saving || isLoading || !formData.section} value={formData.subject} onChange={e => change("subject", e.target.value)} className="w-full rounded-lg border-gray-100 p-4 pl-10 text-xs font-bold focus:ring-4 focus:ring-secondary/10 outline-none transition-all bg-white shadow-sm appearance-none">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                  Instructor
                </label>
                <div className="relative">
                  <FaUserTie
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={12}
                  />
                  <select aria-label="Instructor" disabled value={formData.teacher} className="w-full rounded-lg border-gray-100 p-4 pl-10 text-xs font-bold focus:ring-4 focus:ring-secondary/10 outline-none transition-all bg-white shadow-sm appearance-none group">
                    <option value="">Assigned Teacher</option>
                    {selectedAllocation && <option value={selectedAllocation.staffId}>{selectedAllocation.teacherName}</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                  Classroom
                </label>
                <div className="relative">
                  <FaDoorOpen
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={12}
                  />
                  <select aria-label="Classroom"
                    required disabled={saving || isLoading} value={formData.room} onChange={e => change("room", e.target.value)}
                    className="w-full rounded-lg border-gray-100 p-4 pl-10 text-xs font-bold focus:ring-4 focus:ring-secondary/10 outline-none transition-all bg-white shadow-sm  "
                  ><option value="">Select Room</option>{options.classrooms.map(room => <option key={room.id} value={room.id}>{room.roomNumber}</option>)}</select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving || isLoading}
                  className="w-full relative overflow-hidden rounded-lg bg-secondary px-4 py-3 text-white font-semibold text-xs   transition-all hover:bg-secondary/90 active:scale-[0.98] shadow-sm shadow-gray-200"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <FaCheck className="" />
                    Save To Routine
                  </div>
                </button>
                {editingId && <button type="button" disabled={saving} onClick={reset} className="w-full mt-2 text-sm text-gray-500">Cancel</button>}
              </div>
            </form>
          </div>
        </div>

        {/* Routine Registry */}
        <div className="xl:col-span-8">
          <div className="rounded-xl bg-white p-5 sm:p-6 border border-gray-200 relative overflow-hidden h-full">

            <div className="flex items-center justify-between mb-8 relative">
              <h4 className="text-xs font-semibold text-gray-500   leading-none">
                Institutional Timetable
              </h4>
            </div>

            <div role="region" aria-label="Scrollable records" tabIndex={0} className="overflow-x-auto rounded-lg border border-gray-50 relative">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50/70 text-gray-500 font-semibold border-b border-gray-50">
                  <tr>
                    <th className="px-5 py-6 text-left w-12  tracking-tighter">
                      SN
                    </th>
                    <th className="px-5 py-6 text-left  tracking-tighter text-gray-500">
                      Class and section
                    </th>
                    <th className="px-5 py-6 text-center  tracking-tighter text-gray-500">
                      Day and time
                    </th>
                    <th className="px-5 py-6 text-left  tracking-tighter text-gray-500">
                      Instructor & Subject
                    </th>
                    <th className="px-5 py-6 text-center  tracking-tighter text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/70">
                  {routines.map((r, index) => (
                    <tr
                      key={r.id}
                      className="hover:bg-secondary/20 transition-all group"
                    >
                      <td className="px-5 py-8 text-gray-500  ">
                        {index + 1}
                      </td>
                      <td className="px-5 py-8">
                        <div className="font-semibold text-gray-900 leading-tight text-xs   tracking-tighter mb-1">
                          {r.class}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary  ">
                          <FaLayerGroup size={8} /> {r.section}
                        </div>
                      </td>
                      <td className="px-5 py-8 text-center">
                        <div className="font-semibold text-gray-800   mb-1">
                          {r.day}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-xs  text-gray-500 border border-gray-100">
                          <FaClock size={8} className="text-secondary" />{" "}
                          {r.startTime} - {r.endTime}
                        </div>
                      </td>
                      <td className="px-5 py-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/10">
                            <FaUserTie size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-secondary tracking-tight  ">
                              {r.subject}
                            </div>
                            <div className="text-xs font-bold text-gray-500   mt-1">
                              By {r.teacher}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-8 text-center text-xs font-semibold  text-gray-500 ">
                        <div className="flex justify-center gap-1">
                          <button disabled={saving || isLoading} onClick={() => edit(r)} className="p-3 rounded-xl bg-gray-50 text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <FaEdit size={12} />
                          </button>
                          <button disabled={saving || isLoading} onClick={() => void remove(r.id)} className="p-3 rounded-xl bg-gray-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

