"use client";

import React from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { BiTrendingDown, BiTrendingUp } from "react-icons/bi";
import { useDashboard } from "@/lib/use-dashboard";
import { formatMinor } from "@/lib/finance-client";

export function FinancialOverview() {
  const { data, year, setYear, loading } = useDashboard();
  const isCurrencySet = Boolean(data?.finance.currency);
  const money = (value: string | undefined) =>
    !data
      ? "—"
      : isCurrencySet && value !== undefined
        ? `${data.finance.currency} ${formatMinor(value)}`
        : formatMinor(value || "0");

  return (
    <AdminCard className="h-full flex flex-col overflow-hidden">
      <div className="p-4 md:p-6 flex flex-col h-full">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
          <div>
            <h5 className="font-semibold text-foreground text-sm tracking-tight">
              Financial Overview
            </h5>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Accrual income & expense summary
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/80 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              FY Year
            </span>
            <input
              type="number"
              aria-label="Dashboard year"
              min="1900"
              max="9999"
              className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/20"
              disabled={loading}
              value={data?.year ?? year ?? ""}
              onChange={(e) => {
                const y = Number(e.target.value);
                if (Number.isInteger(y) && y >= 1900 && y <= 9999) setYear(y);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 flex-1 min-h-[160px]">
          {/* Income */}
          <div
            style={{ borderRadius: "24px" }}
            className="bg-secondary/10 p-5 relative text-foreground flex flex-col border border-secondary/20 overflow-hidden group hover:shadow-xs transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 bg-secondary rounded-2xl flex items-center justify-center shadow-sm shadow-secondary/40 text-white">
                <BiTrendingUp className="text-xl" />
              </div>
              <span className="text-[10px] font-bold text-secondary bg-white/80 border border-secondary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Posted journals
              </span>
            </div>

            <div className="mt-auto">
              <h4 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 tracking-tight truncate">
                {money(data?.finance.income)}
              </h4>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Total Income
                </p>
                {!isCurrencySet && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Currency not configured
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Expense */}
          <div
            style={{ borderRadius: "24px" }}
            className="bg-orange-50/60 p-5 relative text-foreground flex flex-col border border-orange-200/80 overflow-hidden group hover:shadow-xs transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 bg-orange-400 rounded-2xl flex items-center justify-center shadow-sm shadow-orange-400/40 text-white">
                <BiTrendingDown className="text-xl" />
              </div>
              <span className="text-[10px] font-bold text-orange-700 bg-white/80 border border-orange-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Posted journals
              </span>
            </div>

            <div className="mt-auto">
              <h4 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 tracking-tight truncate">
                {money(data?.finance.expense)}
              </h4>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Total Expenses
                </p>
                {!isCurrencySet && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Currency not configured
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminCard>
  );
}
