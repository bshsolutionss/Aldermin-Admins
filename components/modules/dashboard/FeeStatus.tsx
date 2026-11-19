"use client";

import React from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { useDashboard } from "@/lib/use-dashboard";
import { formatMinor } from "@/lib/finance-client";
import { Badge } from "@/components/ui/badge";

export function FeeStatus() {
  const { data } = useDashboard();
  const money = (value: string | undefined) =>
    value !== undefined
      ? (data?.finance.currency ? `${data.finance.currency} ` : "") +
        formatMinor(value)
      : "—";

  return (
    <AdminCard role="region" aria-label="Fee Status" className="h-full min-h-[360px] min-w-0 p-5 flex flex-col">
      <div className="min-w-0 mb-5">
        <div className="flex justify-between items-start gap-3 mb-5">
          <div className="min-w-0">
            <h6 className="font-semibold text-foreground text-sm">Fee Status</h6>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Collection & dues summary
            </p>
          </div>
          <a
            href="/admin/reports/feesreports/fees-due-report"
            aria-label="View fee dues"
            className="shrink-0 text-gray-400 hover:text-foreground transition-colors"
          >
            <BiDotsVerticalRounded size={20} />
          </a>
        </div>

        <div className="space-y-3.5">
          <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-2 min-w-0 p-3.5 rounded-2xl border border-green-200/80 bg-green-50/50 backdrop-blur-sm shadow-xs">
            <Badge
              variant="outline"
              className="bg-green-100 text-green-700 border-green-200 font-bold tracking-wider text-[10px]"
            >
              Collected
            </Badge>
            <strong className="max-w-full overflow-x-auto whitespace-nowrap tabular-nums text-green-800 text-base font-bold tracking-tight">
              {money(data?.finance.fees.collected)}
            </strong>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-2 min-w-0 p-3.5 rounded-2xl border border-yellow-200/80 bg-yellow-50/50 backdrop-blur-sm shadow-xs">
            <Badge
              variant="outline"
              className="bg-yellow-100 text-yellow-700 border-yellow-200 font-bold tracking-wider text-[10px]"
            >
              Pending
            </Badge>
            <strong className="max-w-full overflow-x-auto whitespace-nowrap tabular-nums text-yellow-800 text-base font-bold tracking-tight">
              {money(data?.finance.fees.pending)}
            </strong>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-2 min-w-0 p-3.5 rounded-2xl border border-red-200/80 bg-red-50/50 backdrop-blur-sm shadow-xs">
            <Badge
              variant="outline"
              className="bg-red-100 text-red-700 border-red-200 font-bold tracking-wider text-[10px]"
            >
              Overdue
            </Badge>
            <strong className="max-w-full overflow-x-auto whitespace-nowrap tabular-nums text-red-800 text-base font-bold tracking-tight">
              {money(data?.finance.fees.overdue)}
            </strong>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2 text-[11px] text-muted-foreground">
        <span className="whitespace-nowrap">As of {data?.today ?? "today"}</span>
        <a
          href="/admin/reports/feesreports/fees-due-report"
          className="shrink-0 whitespace-nowrap text-secondary font-semibold hover:underline"
        >
          View dues &rarr;
        </a>
      </div>
    </AdminCard>
  );
}
