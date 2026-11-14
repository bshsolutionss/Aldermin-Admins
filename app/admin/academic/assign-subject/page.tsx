"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiService, type SubjectAssignment, type SubjectAssignmentOptions } from "@/lib/api-service";
import {
  FaUserTie,
  FaBookOpen,
  FaLayerGroup,
  FaTrash,
  FaEdit,
  FaCheck,
  FaLink,
} from "react-icons/fa";

export default function AssignSubjectPage() {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [options, setOptions] = useState<SubjectAssignmentOptions>({ academicYearId: null, subjects: [], teachers: [], classSections: [] });
  const [form, setForm] = useState({ subjectId: "", classSectionId: "", staffId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const reload = async () => {
    setIsLoading(true); setError("");
    try {
      const [rows, choices] = await Promise.all([apiService.subjectAssignments.getAll(), apiService.subjectAssignments.getOptions()]);
      setAssignments(rows); setOptions(choices);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load allocations"); }
    finally { setIsLoading(false); }
  };
  useEffect(() => {
    let active = true;
    Promise.all([apiService.subjectAssignments.getAll(), apiService.subjectAssignments.getOptions()])
      .then(([rows, choices]) => { if (active) { setAssignments(rows); setOptions(choices); } })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load allocations"); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || isLoading || !form.subjectId || !form.classSectionId || !form.staffId) return;
    busy.current = true; setSaving(true); setError("");
    try {
      if (editingId) await apiService.subjectAssignments.update(editingId, form);
      else await apiService.subjectAssignments.create(form);
      setAssignments(await apiService.subjectAssignments.getAll());
      setEditingId(null); setForm({ subjectId: "", classSectionId: "", staffId: "" });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save allocation"); }
    finally { busy.current = false; setSaving(false); }
  };
  const remove = async (id: string) => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError("");
    try {
      await apiService.subjectAssignments.delete(id);
      setAssignments(await apiService.subjectAssignments.getAll());
      if (editingId === id) { setEditingId(null); setForm({ subjectId: "", classSectionId: "", staffId: "" }); }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete allocation"); }
    finally { busy.current = false; setSaving(false); }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg ring-4 ring-indigo-50">
            <FaLink className="text-white" size={20} />
          </div>
          Academic Mapping
        </h1>
      </div>

      {error && <div role="alert" className="text-red-600 text-sm">{error} <button type="button" onClick={() => void reload()}>Retry</button></div>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Assignment Form */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl bg-white p-8 shadow-xl border border-gray-100 ring-1 ring-black/5 flex flex-col h-full bg-gradient-to-br from-white to-gray-50/10">
            <h4 className="mb-8 text-xs font-semibold text-gray-400   leading-none flex items-center gap-2">
              {editingId ? "Edit Assignment" : "Create Assignment"}
              <div className="h-[1px] flex-1 bg-gray-100"></div>
            </h4>

            <form onSubmit={submit} className="space-y-6 flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400   mb-2 px-1">
                    Discipline <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaBookOpen
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                      size={12}
                    />
                    <select required disabled={saving || isLoading} value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} className="w-full rounded-2xl border-gray-100 p-4 pl-10 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-white shadow-sm appearance-none">
                      <option value="">Select Subject</option>
                      {isLoading && <option disabled>Loading subjects...</option>}
                      {options.subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400   mb-2 px-1">
                    Sectional Unit <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLayerGroup
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                      size={12}
                    />
                    <select required disabled={saving || isLoading} value={form.classSectionId} onChange={e => setForm({ ...form, classSectionId: e.target.value })} className="w-full rounded-2xl border-gray-100 p-4 pl-10 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-white shadow-sm appearance-none">
                      <option value="">Select Class / Section</option>
                      {options.classSections.map(section => <option key={section.id} value={section.id}>{section.className} / {section.sectionName} ({section.academicYearName})</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400   mb-2 px-1">
                    Lead Instructor <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUserTie
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                      size={12}
                    />
                    <select required disabled={saving || isLoading} value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} className="w-full rounded-2xl border-gray-100 p-4 pl-10 text-xs font-semibold text-indigo-600 outline-none bg-indigo-50/30 appearance-none">
                      <option value="">Select Faculty</option>
                      {options.teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.staffNo})</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={saving || isLoading || !form.subjectId || !form.classSectionId || !form.staffId}
                  className="w-full relative overflow-hidden rounded-2xl bg-indigo-600 px-8 py-5 text-white font-semibold text-xs   transition-all hover:bg-indigo-700 active:scale-[0.98] shadow-2xl shadow-indigo-100"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <FaCheck className="" />
                    Establish Mapping
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Assignment Registry */}
        <div className="lg:col-span-8">
          <div className="rounded-3xl bg-white p-8 shadow-xl border border-gray-100 ring-1 ring-black/5 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/20 rounded-full blur-3xl -mr-32 -mt-32"></div>

            <div className="flex items-center justify-between mb-8 relative">
              <h4 className="text-xs font-semibold text-gray-400   leading-none">
                Assigned Faculty Registry
              </h4>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-50 relative">
              <table className="min-w-full text-[11px]">
                <thead className="bg-gray-50/70 text-gray-500 font-semibold border-b border-gray-50">
                  <tr>
                    <th className="px-5 py-6 text-left w-12  tracking-tighter">
                      SN
                    </th>
                    <th className="px-5 py-6 text-left  tracking-tighter text-gray-400">
                      Assignment Profile
                    </th>
                    <th className="px-5 py-6 text-center  tracking-tighter text-gray-400">
                      Allocated Unit
                    </th>
                    <th className="px-5 py-6 text-center  tracking-tighter text-gray-400">
                      Interaction
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/70">
                  {assignments.map((a, index) => (
                    <tr
                      key={a.id}
                      className="hover:bg-indigo-50/20 transition-all group"
                    >
                      <td className="px-5 py-8 text-gray-300  ">
                        {index + 1}
                      </td>
                      <td className="px-5 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                            <FaUserTie size={16} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 leading-tight text-xs   tracking-tighter mb-1">
                              {a.teacher}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-semibold text-indigo-500  ">
                              <FaBookOpen size={10} /> {a.subject}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-8 text-center">
                        <span className="px-4 py-1.5 bg-gray-900 text-white text-[9px] font-semibold rounded-lg   ">
                          {a.legacy ? `${a.section} (legacy)` : `${a.className} / ${a.section}`}
                        </span>
                      </td>
                      <td className="px-5 py-8 text-center">
                        <div className="flex justify-center gap-1">
                          <button disabled={saving || a.legacy} onClick={() => { setEditingId(a.id); setForm({ subjectId: a.subjectId, classSectionId: a.classSectionId ?? "", staffId: a.staffId ?? "" }); }} className="p-3 rounded-xl bg-gray-50 text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <FaEdit size={14} />
                          </button>
                          <button disabled={saving} onClick={() => void remove(a.id)} className="p-3 rounded-xl bg-gray-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                            <FaTrash size={14} />
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

