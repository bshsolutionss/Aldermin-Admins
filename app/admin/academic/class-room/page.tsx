"use client";

import React from "react";
import { useClassrooms } from "@/lib/use-classrooms";
import {
  FaDoorOpen,
  FaUsers,
  FaTrash,
  FaEdit,
  FaCheck,
  FaBuilding,
} from "react-icons/fa";

export default function AcademicClassRoomPage() {
  const { rooms, roomNumber, setRoomNumber, capacity, setCapacity, handleSubmit,
    editingId, error, isLoading, saving, edit, remove, reset, reload } = useClassrooms();

  return (
    <div className="container mx-auto space-y-6">
      {error && <p role="alert" className="text-sm text-red-600">{error} <button type="button" disabled={saving || isLoading} onClick={() => void reload()}>Retry</button></p>}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tighter flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-xl shadow-sm ring-4 ring-secondary/10">
            <FaBuilding className="text-white" size={20} />
          </div>
          Classrooms
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Creation Form */}
        <div className="xl:col-span-4">
          <div className="rounded-xl bg-white p-5 sm:p-6 border border-gray-200 flex flex-col h-full ">
            <h4 className="mb-6 text-xs font-semibold text-gray-500   leading-none flex items-center justify-between">
              {editingId ? "Edit classroom" : "Add classroom"}
              <div className="h-1 w-12 bg-secondary/10 rounded-full"></div>
            </h4>

            <form onSubmit={handleSubmit} className="space-y-6 flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                  Room number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaDoorOpen
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={14}
                  />
                  <input aria-label="Room number"
                    disabled={saving || isLoading}
                    maxLength={100}
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full rounded-lg border-gray-100 p-4 pl-12 text-sm font-bold focus:ring-4 focus:ring-secondary/10 focus:border-secondary/20 outline-none transition-all placeholder:font-medium bg-white shadow-sm  "
                    placeholder="e.g. HALL-A"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500   mb-2 px-1">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaUsers
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={14}
                  />
                  <input aria-label="Capacity"
                    type="number"
                    disabled={saving || isLoading}
                    min={1}
                    max={2147483647}
                    step={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full rounded-lg border-gray-100 p-4 pl-12 text-sm font-semibold focus:ring-4 focus:ring-secondary/10 focus:border-secondary/20 outline-none transition-all placeholder:font-medium bg-white shadow-sm "
                    placeholder="40"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving || isLoading}
                  className="group w-full relative overflow-hidden rounded-lg bg-secondary px-4 py-3 text-white font-semibold text-xs   transition-all hover:bg-secondary/90 active:scale-[0.98] shadow-sm shadow-gray-200"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <FaCheck className="group-hover:rotate-12 transition-transform" />
                    Archive Space
                  </div>
                </button>
                {editingId && <button type="button" disabled={saving} onClick={reset} className="w-full mt-2 text-sm text-gray-500">Cancel</button>}
              </div>
            </form>
          </div>
        </div>

        {/* List Index */}
        <div className="xl:col-span-8">
          <div className="rounded-xl bg-white p-5 sm:p-6 border border-gray-200 relative overflow-hidden h-full">

            <div className="flex items-center justify-between mb-8 relative">
              <h4 className="text-xs font-semibold text-gray-500   leading-none">
                Architectural Matrix
              </h4>
            </div>

            <div role="region" aria-label="Scrollable records" tabIndex={0} className="overflow-x-auto rounded-lg border border-gray-50 relative">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50/70 text-gray-500 font-bold border-b border-gray-50">
                  <tr>
                    <th className="px-6 py-6 text-left w-16 text-xs  font-semibold">
                      SN
                    </th>
                    <th className="px-6 py-6 text-left text-xs  font-semibold ">
                      Space Identity
                    </th>
                    <th className="px-6 py-6 text-center text-xs  font-semibold ">
                      Load Capacity
                    </th>
                    <th className="px-6 py-6 text-center text-xs  font-semibold ">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rooms.map((r, index) => (
                    <tr
                      key={r.id}
                      className="hover:bg-secondary/20 transition-all group"
                    >
                      <td className="px-6 py-8 text-gray-500  text-xs ">
                        {index + 1}
                      </td>
                      <td className="px-6 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all shadow-sm border border-gray-100">
                            <FaDoorOpen size={20} />
                          </div>
                          <span className="font-semibold text-gray-900 tracking-tight text-lg    leading-none">
                            {r.roomNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-lg text-xs font-semibold  shadow-sm border border-secondary/10">
                          <FaUsers size={12} />
                          {r.capacity} Seats
                        </div>
                      </td>
                      <td className="px-6 py-8 text-center">
                        <div className="flex justify-center gap-1">
                          <button disabled={saving} onClick={() => edit(r)} className="p-3 rounded-xl bg-gray-50 text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <FaEdit size={14} />
                          </button>
                          <button disabled={saving} onClick={() => void remove(r.id)} className="p-3 rounded-xl bg-gray-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
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

