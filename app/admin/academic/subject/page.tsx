"use client";

import React from "react";
import {
  FaBookOpen,
  FaTrash,
  FaEdit,
  FaCheck,
  FaFlask,
  FaMicroscope,
} from "react-icons/fa";
import { useSchoolSubjects } from "@/lib/use-school-subjects";

export default function SubjectPage() {
  const { subjects: subjectList, form, setForm, editingId, isLoading, isSubmitting, error, reload, reset, edit, submit, remove } = useSchoolSubjects();
  const subjectName = form.name;
  const subjectCode = form.code ?? "";
  const subjectType = form.type;

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-xl shadow-sm ring-4 ring-secondary/10">
            <FaBookOpen className="text-white" size={20} />
          </div>
          Subjects
        </h1>
      </div>

      {error && <div role="alert" className="text-red-600 text-sm">{error} <button type="button" disabled={isSubmitting} onClick={() => void reload()}>Retry</button></div>}
      {isLoading && <p role="status">Loading subjects...</p>}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Creation Form */}
        <div className="xl:col-span-4 self-start">
          <div className="rounded-xl bg-white p-5 sm:p-6 border border-gray-200 flex flex-col h-full ">
            <h4 className="mb-8 text-xs font-semibold text-gray-500   leading-none flex items-center gap-2">
              {editingId ? "Edit Subject" : "Add Subject"}
              <div className="h-[1px] flex-1 bg-gray-100"></div>
            </h4>

            <form onSubmit={submit} className="space-y-6 flex-1">
              <fieldset disabled={isSubmitting || isLoading} className="min-w-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-500   mb-2 px-1 text-nowrap">
                      Subject name
                    </label>
                    <input aria-label="Subject name"
                      type="text"
                      maxLength={200}
                      value={subjectName}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border-gray-100 p-4 text-xs font-bold focus:ring-4 focus:ring-secondary/10 outline-none transition-all bg-white shadow-sm"
                      placeholder="e.g. Topology"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                      Subject code
                    </label>
                    <input aria-label="Subject code"
                      type="text"
                      maxLength={50}
                      value={subjectCode}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      className="w-full rounded-lg border-gray-100 p-4 text-xs  font-bold focus:ring-4 focus:ring-secondary/10 outline-none transition-all bg-white shadow-sm"
                      placeholder="TOP-101"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500   mb-4 px-1">
                    Subject type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button type="button" aria-pressed={subjectType === "Theory"} disabled={isSubmitting || isLoading}
                      onClick={() => !isSubmitting && setForm({ ...form, type: "Theory" })}
                      className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                        subjectType === "Theory"
                          ? "bg-secondary border-secondary text-white shadow-sm"
                          : "bg-gray-50 border-gray-100 text-gray-500 hover:border-secondary/10"
                      }`}
                    >
                      <FaBookOpen
                        size={14}
                        className={
                          subjectType === "Theory"
                            ? "text-white"
                            : "text-gray-500"
                        }
                      />
                      <span className="text-xs font-semibold  ">
                        Theory
                      </span>
                    </button>
                    <button type="button" aria-pressed={subjectType === "Practical"} disabled={isSubmitting || isLoading}
                      onClick={() => !isSubmitting && setForm({ ...form, type: "Practical" })}
                      className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                        subjectType === "Practical"
                          ? "bg-secondary border-secondary text-white shadow-sm"
                          : "bg-gray-50 border-gray-100 text-gray-500 hover:border-secondary/10"
                      }`}
                    >
                      <FaFlask
                        size={14}
                        className={
                          subjectType === "Practical"
                            ? "text-white"
                            : "text-gray-500"
                        }
                      />
                      <span className="text-xs font-semibold  ">
                        Practical
                      </span>
                    </button>
                  </div>
                </div>
              </fieldset>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full relative overflow-hidden rounded-lg bg-secondary  text-white px-4 py-3 text-xs font-semibold   transition-all hover:bg-secondary/90 active:scale-[0.98] active:border-b-0 active:translate-y-1 shadow-sm shadow-gray-200"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <FaCheck className="" />
                    {editingId ? "Update subject" : "Save subject"}
                  </div>
                </button>
              </div>
              {editingId && <button type="button" disabled={isSubmitting} onClick={reset}>Cancel edit</button>}
            </form>
          </div>
        </div>

        {/* List Index */}
        <div className="xl:col-span-8">
          <div className="rounded-xl bg-white p-5 sm:p-6 border border-gray-200 relative overflow-hidden h-full">

            <div className="flex items-center justify-between mb-8 relative">
              <h4 className="text-xs font-semibold text-gray-500   leading-none">
                Subject list
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
                      Subject
                    </th>
                    <th className="px-5 py-6 text-center  tracking-tighter text-gray-500">
                      Classification
                    </th>
                    <th className="px-5 py-6 text-center  tracking-tighter text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/70">
                  {!isLoading && subjectList.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No subjects found.</td></tr>}
                  {subjectList.map((s, index) => (
                    <tr
                      key={s.id}
                      className="hover:bg-secondary/20 transition-all group"
                    >
                      <td className="px-5 py-8 text-gray-500  ">
                        {index + 1}
                      </td>
                      <td className="px-5 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-secondary group-hover:text-white transition-all shadow-sm">
                            {s.type === "Theory" ? (
                              <FaBookOpen size={16} />
                            ) : (
                              <FaMicroscope size={16} />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 leading-tight text-xs   tracking-tighter mb-1">
                              {s.name}
                            </div>
                            <div className="text-xs  font-semibold text-secondary/60  ">
                              {s.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-8 text-center text-gray-500">
                        <span
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold   shadow-sm ring-1 ring-inset ${
                            s.type === "Theory"
                              ? "bg-secondary/10 text-secondary ring-secondary/10"
                              : "bg-emerald-50 text-emerald-700 ring-emerald-100"
                          }`}
                        >
                          {s.type}
                        </span>
                      </td>
                      <td className="px-5 py-8 text-center">
                        <div className="flex justify-center gap-1">
                          <button aria-label={`Edit ${s.name}`} disabled={isSubmitting} onClick={() => edit(s)} className="p-3 rounded-xl bg-gray-50 text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <FaEdit size={14} />
                          </button>
                          <button
                            aria-label={`Delete ${s.name}`}
                            disabled={isSubmitting}
                            onClick={() => void remove(s.id)}
                            className="p-3 rounded-xl bg-gray-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer"
                          >
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

