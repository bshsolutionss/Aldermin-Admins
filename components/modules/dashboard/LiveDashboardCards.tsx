"use client";

import React from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { useDashboard } from "@/lib/use-dashboard";
import { BiBell, BiCalendar, BiTime, BiMapPin } from "react-icons/bi";

export function NoticeBoard() {
  const { data } = useDashboard();
  return (
    <AdminCard className="p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <BiBell size={18} />
            </div>
            <div>
              <h5 className="font-semibold text-foreground text-sm">Notice Board</h5>
              <p className="text-[11px] text-gray-500">Official circulars & announcements</p>
            </div>
          </div>
          <a
            href="/admin/accounts/communicate/noticeboard"
            className="text-secondary text-xs font-bold hover:underline"
          >
            View all
          </a>
        </div>

        <div className="overflow-auto custom-scrollbar flex flex-col gap-3 max-h-[220px] pr-1">
          {!data ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <BiBell className="text-3xl text-gray-300 mb-2 animate-pulse" />
              <p className="text-xs font-medium">Notices unavailable until dashboard loads.</p>
            </div>
          ) : data.notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <BiBell className="text-2xl text-gray-300 mb-1.5" />
              <p className="text-xs font-medium text-gray-500">No current published notices.</p>
            </div>
          ) : (
            data.notices.map((row) => (
              <div
                key={row.id}
                className="p-3.5 rounded-xl flex gap-3 bg-yellow-50/50 border border-yellow-100 hover:shadow-xs transition-shadow"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-yellow-100/70 text-yellow-700">
                  <BiBell size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h6 className="font-bold text-xs text-foreground mb-1 truncate">{row.title}</h6>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {row.body}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">
                    {row.start_date} – {row.end_date} · {row.audience}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <a
          className="text-secondary text-xs font-bold hover:underline flex items-center gap-1"
          href="/admin/accounts/communicate/noticeboard"
        >
          Manage notices &rarr;
        </a>
      </div>
    </AdminCard>
  );
}

export function MessagesCard() {
  const { data } = useDashboard();
  return (
    <AdminCard className="p-6 h-[400px] flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <BiCalendar size={18} />
            </div>
            <div>
              <h6 className="font-semibold text-sm text-foreground">Upcoming Events</h6>
              <p className="text-[11px] text-gray-500">Scheduled calendar milestones</p>
            </div>
          </div>
          <a
            href="/admin/accounts/communicate/event"
            className="text-secondary text-xs font-bold hover:underline"
          >
            View all
          </a>
        </div>

        <div className="overflow-y-auto custom-scrollbar space-y-3 max-h-[260px] pr-1">
          {!data ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <BiCalendar className="text-3xl text-gray-300 mb-2 animate-pulse" />
              <p className="text-xs font-medium">Events unavailable until dashboard loads.</p>
            </div>
          ) : data.events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <BiCalendar className="text-3xl text-gray-300 mb-2" />
              <p className="text-xs font-medium text-gray-500">No upcoming published events.</p>
            </div>
          ) : (
            data.events.map((row) => (
              <div
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-white hover:shadow-xs transition-all"
                key={row.id}
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <BiCalendar size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h6 className="font-bold text-xs text-foreground truncate">{row.title}</h6>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <BiTime size={12} className="text-gray-400 shrink-0" />
                    {new Date(row.starts_at).toLocaleString(undefined, {
                      timeZone: data.timezone,
                    })}
                  </p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <BiMapPin size={12} className="text-gray-400 shrink-0" />
                    {row.location || "Location not recorded"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
        <a
          href="/admin/accounts/communicate/event"
          className="text-secondary text-xs font-bold hover:underline flex items-center gap-1"
        >
          Calendar events &rarr;
        </a>
      </div>
    </AdminCard>
  );
}
