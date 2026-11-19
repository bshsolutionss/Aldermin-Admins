"use client";

import React from "react";
import { useDashboard } from "@/lib/use-dashboard";
import { AdminCard } from "@/components/common/AdminCard";
import { BiDotsVerticalRounded, BiMale, BiFemale } from "react-icons/bi";

export function StudentChart() {
  const { data } = useDashboard();
  const percent = (n: number | undefined) =>
    data ? (data.students.total ? Math.round(((n ?? 0) * 100) / data.students.total) : 0) : null;
  const male = percent(data?.students.male);
  const female = percent(data?.students.female);

  return (
    <AdminCard className="p-4 md:p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h5 className="font-semibold text-foreground text-sm">Students Distribution</h5>
            <p className="text-[11px] text-gray-500 mt-0.5">Total registered students: {data?.students.total ?? "—"}</p>
          </div>
          <a
            href="/admin/reports/studentreports/student-report"
            aria-label="View student report"
            className="text-gray-400 hover:text-foreground transition-colors"
          >
            <BiDotsVerticalRounded size={22} />
          </a>
        </div>

        <div className="flex justify-around items-center gap-4 select-none my-2">
          {/* Boys Knob */}
          <div className="text-center group">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center transition-transform group-hover:scale-105 duration-500">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="9"
                  fill="none"
                  className="text-gray-100"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="#006D5F"
                  strokeWidth="9"
                  fill="none"
                  strokeDasharray="301.6"
                  strokeDashoffset={301.6 * (1 - (male ?? 0) / 100)}
                  strokeLinecap="round"
                  className="drop-shadow-sm transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-xl sm:text-2xl font-bold text-foreground">
                {male === null ? "—" : male + "%"}
              </span>
            </div>
            <p className="text-xs font-bold text-secondary mt-2 flex items-center justify-center gap-1">
              <BiMale size={16} /> Boys
            </p>
          </div>

          {/* Girls Knob */}
          <div className="text-center group">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center transition-transform group-hover:scale-105 duration-500">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="9"
                  fill="none"
                  className="text-gray-100"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="#E9C46A"
                  strokeWidth="9"
                  fill="none"
                  strokeDasharray="301.6"
                  strokeDashoffset={301.6 * (1 - (female ?? 0) / 100)}
                  strokeLinecap="round"
                  className="drop-shadow-sm transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-xl sm:text-2xl font-bold text-foreground">
                {female === null ? "—" : female + "%"}
              </span>
            </div>
            <p className="text-xs font-bold text-yellow-600 mt-2 flex items-center justify-center gap-1">
              <BiFemale size={16} /> Girls
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-center">
          <div className="text-secondary font-bold flex items-center justify-center gap-1.5 text-xs">
            <BiMale size={16} /> {data?.students.male ?? "—"} (Male)
          </div>
          <div className="text-yellow-600 font-bold flex items-center justify-center gap-1.5 text-xs">
            <BiFemale size={16} /> {data?.students.female ?? "—"} (Female)
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Other / unrecorded: <strong className="text-foreground">{data?.students.other ?? "—"}</strong></span>
        <span className="text-gray-400">Active student registry</span>
      </div>
    </AdminCard>
  );
}
