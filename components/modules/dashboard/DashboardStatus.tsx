"use client";

import React from "react";
import { useDashboard } from "@/lib/use-dashboard";
import { Button } from "@/components/ui/button";
import {
  BiRefresh,
  BiBuildingHouse,
  BiCalendar,
  BiTime,
  BiDollarCircle,
  BiInfoCircle,
} from "react-icons/bi";
import { cn } from "@/lib/utils";

export function DashboardStatus() {
  const { data, error, loading, retry } = useDashboard();

  return (
    <div className="w-full bg-white/75 backdrop-blur-md border border-gray-200/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Left Information Section */}
        <div className="space-y-2 flex-1">
          {loading ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground animate-pulse">
              <BiRefresh className="size-4 animate-spin text-secondary" />
              <span>Loading persisted school data…</span>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200"
            >
              <BiInfoCircle className="size-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div
              role="status"
              className="flex flex-wrap items-center gap-2 text-xs"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-secondary/10 text-secondary font-bold border border-secondary/20">
                <BiBuildingHouse className="size-3.5" />
                {data?.schoolName ?? "School name not configured"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 font-medium">
                <BiCalendar className="size-3.5 text-gray-400" />
                {data?.today}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 font-medium">
                <BiTime className="size-3.5 text-gray-400" />
                {data?.timezone}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 font-medium">
                Finance FY {data?.year}
              </span>
            </div>
          )}

          {data && !data.finance.currency && (
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-1.5 w-fit">
              <BiDollarCircle className="size-4 text-amber-600 shrink-0" />
              <span>
                Configure the school currency in{" "}
                <a
                  href="/admin/settings/general-settings/general-settings-inner#finance-settings"
                  className="font-bold underline hover:text-amber-900"
                >
                  Finance Settings
                </a>{" "}
                before using financial totals.
              </span>
            </div>
          )}

          {data && (
            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5 pl-0.5">
              <BiInfoCircle className="size-3 text-gray-400 shrink-0" />
              Accrual income and expense reflect posted journals; fee balances
              include all dates.
            </p>
          )}
        </div>

        {/* Right Action Section */}
        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={retry}
            className="h-9 px-4 rounded-xl text-xs font-bold gap-2 bg-white hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30 transition-all shadow-xs"
          >
            <BiRefresh className={cn("size-4", loading && "animate-spin")} />
            Refresh dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
