"use client";

import React from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { FaCircle } from "react-icons/fa";
import { useDashboard } from "@/lib/use-dashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const subscribeMounted = () => () => {};
const clientMounted = () => true;
const serverMounted = () => false;

export function EarningChart() {
  const { data, loading } = useDashboard();
  const monthly = data?.finance.monthly ?? [];
  const safe = monthly.every((r) =>
    [r.income, r.expense].every(
      (v) =>
        /^-?\d+$/.test(v) &&
        BigInt(v) <= BigInt(Number.MAX_SAFE_INTEGER) &&
        BigInt(v) >= -BigInt(Number.MAX_SAFE_INTEGER),
    ),
  );
  const chartData = safe
    ? monthly.map((r) => ({
        month: r.month,
        income: Number(r.income) / 100,
        expense: Number(r.expense) / 100,
      }))
    : [];
  const isMounted = React.useSyncExternalStore(
    subscribeMounted,
    clientMounted,
    serverMounted,
  );

  if (!isMounted || !data) {
    return (
      <AdminCard className="p-6 h-[400px] flex items-center justify-center">
        <span className="text-xs font-semibold text-muted-foreground animate-pulse">
          {loading
            ? "Loading…"
            : "Dashboard data unavailable. Use Refresh dashboard to retry."}
        </span>
      </AdminCard>
    );
  }

  return (
    <AdminCard className="p-6 h-[400px] flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div>
            <h4 className="font-semibold text-foreground text-sm">
              Earnings Overview
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Posted income / expense · {data?.year ?? "—"} ·{" "}
              {data?.finance.currency ?? "Currency not configured"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-gray-500">
              <FaCircle className="text-[#016956]" size={8} /> Income
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-gray-500">
              <FaCircle className="text-orange-400" size={8} /> Expense
            </div>
            <a
              href="/admin/accounts/accounts/profitandlost"
              aria-label="View profit and loss report"
              className="text-gray-400 hover:text-foreground transition-colors"
            >
              <BiDotsVerticalRounded size={20} />
            </a>
          </div>
        </div>

        {!safe && (
          <p
            role="status"
            className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-xl mb-2"
          >
            Chart values exceed the supported plotting range; exact totals
            remain available in reports.
          </p>
        )}
      </div>

      <div className="flex-1 w-full relative min-h-[260px]">
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#016956" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#016956" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FB923C" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FB923C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
                dx={-5}
              />
              <CartesianGrid
                vertical={false}
                stroke="#f3f4f6"
                strokeDasharray="3 3"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#016956"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#FB923C"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminCard>
  );
}
