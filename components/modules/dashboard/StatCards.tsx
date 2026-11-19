"use client";

import React from "react";
import { useDashboard } from "@/lib/use-dashboard";
import { AdminCard } from "@/components/common/AdminCard";
import {
  BiDotsVerticalRounded,
  BiSolidGraduation,
  BiUserCheck,
  BiGroup,
} from "react-icons/bi";
import { cn } from "@/lib/utils";

export function StatCards() {
  const { data } = useDashboard();
  const stats = [
    {
      label: "Active Students",
      value: data?.students.total.toLocaleString() ?? "—",
      color: "yellow",
      href: "/admin/student-info/list",
      icon: BiSolidGraduation,
    },
    {
      label: "Active Teacher Role",
      value: data?.staff.teachers.toLocaleString() ?? "—",
      color: "purple",
      href: "/admin/hr/staff-list",
      icon: BiUserCheck,
    },
    {
      label: "Active Staff",
      value: data?.staff.total.toLocaleString() ?? "—",
      color: "orange",
      href: "/admin/hr/staff-list",
      icon: BiGroup,
    },
  ];

  return (
    <AdminCard className="h-full overflow-hidden">
      <div className="p-4 sm:p-5 h-full flex flex-col justify-between gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                "rounded-2xl p-3.5 sm:p-4 shadow-xs border backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300",
                stat.color === "yellow" && "bg-yellow-50/60 border-yellow-200/80",
                stat.color === "purple" && "bg-purple-50/60 border-purple-200/80",
                stat.color === "orange" && "bg-orange-50/60 border-orange-200/80",
              )}
            >
              <div className="flex justify-between items-center mb-1.5 relative z-10 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      stat.color === "yellow" && "text-yellow-600",
                      stat.color === "purple" && "text-purple-600",
                      stat.color === "orange" && "text-orange-600",
                    )}
                  />
                  <h6
                    className={cn(
                      "font-bold uppercase tracking-wider text-[10px] truncate",
                      stat.color === "yellow" && "text-yellow-700",
                      stat.color === "purple" && "text-purple-700",
                      stat.color === "orange" && "text-orange-700",
                    )}
                    title={stat.label}
                  >
                    {stat.label}
                  </h6>
                </div>
                <a
                  href={stat.href}
                  aria-label={"View " + stat.label}
                  className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
                >
                  <BiDotsVerticalRounded size={18} />
                </a>
              </div>
              <h3
                className={cn(
                  "text-2xl sm:text-3xl font-bold relative z-10 tracking-tight",
                  stat.color === "yellow" && "text-yellow-900",
                  stat.color === "purple" && "text-purple-900",
                  stat.color === "orange" && "text-orange-900",
                )}
              >
                {stat.value}
              </h3>
            </div>
          );
        })}
      </div>
    </AdminCard>
  );
}
