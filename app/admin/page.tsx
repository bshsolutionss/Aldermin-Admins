"use client";

import React from "react";
import { DashboardProvider } from "@/lib/use-dashboard";
import { DashboardStatus } from "@/components/modules/dashboard/DashboardStatus";
import { WelcomeCard } from "@/components/modules/dashboard/WelcomeCard";
import { StatCards } from "@/components/modules/dashboard/StatCards";
import { CalendarCard } from "@/components/modules/dashboard/CalendarCard";
import { StudentChart } from "@/components/modules/dashboard/StudentChart";
import {
  NoticeBoard,
  MessagesCard,
} from "@/components/modules/dashboard/LiveDashboardCards";
import { FinancialOverview } from "@/components/modules/dashboard/FinancialOverview";
import { EarningChart } from "@/components/modules/dashboard/EarningChart";
import { FeeStatus } from "@/components/modules/dashboard/FeeStatus";

export default function Dashboard() {
  return (
    <DashboardProvider>
      <div className="w-full space-y-6 pb-8">
        <DashboardStatus />

        {/* Row 1: Welcome, Quick Stats, Calendar */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          <div className="col-span-12 lg:col-span-6 xl:col-span-7">
            <WelcomeCard />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 xl:col-span-2">
            <StatCards />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 xl:col-span-3">
            <CalendarCard />
          </div>
        </div>

        {/* Row 2: Students Distribution, Notice Board, Financial Overview */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          <div className="col-span-12 lg:col-span-4 h-full">
            <StudentChart />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-3 h-full">
            <NoticeBoard />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-5 h-full">
            <FinancialOverview />
          </div>
        </div>

        {/* Row 3: Earnings Chart, Fee Status, Events */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          <div className="col-span-12 min-w-0 xl:col-span-6">
            <EarningChart />
          </div>
          <div className="col-span-12 min-w-0 md:col-span-6 xl:col-span-3">
            <FeeStatus />
          </div>
          <div className="col-span-12 min-w-0 md:col-span-6 xl:col-span-3">
            <MessagesCard />
          </div>
        </div>
      </div>
    </DashboardProvider>
  );
}
