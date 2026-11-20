import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser } from "@/lib/auth-server";
import type { DashboardSummary } from "@/lib/dashboard-client";
import type { HeaderFeed } from "@/lib/header-client";

type EmailLog = {
  installed: boolean;
  total: number;
  items: { id: string; subject: string; recipient: string; status: string; created_at: string }[];
};

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401, headers });
    if (user.role !== "admin") return NextResponse.json({ message: "Admin access required" }, { status: 403, headers });
    const params = new URL(request.url).searchParams;
    const kind = params.get("kind");
    if (!["alerts", "messages", "search"].includes(kind ?? "")) {
      return NextResponse.json({ message: "Unknown header action" }, { status: 400, headers });
    }
    // Use existing deployed endpoints for both activity icons. The dedicated
    // header endpoint is newer than the hosted backend's current release.
    const emailParams = new URLSearchParams({ page: "1", pageSize: "8", search: '"channel": "email"' });
    const path = kind === "messages"
      ? "/admin-operations/messages?" + emailParams
      : kind === "alerts" ? "/admin-dashboard"
      : "/admin-dashboard/header" + new URL(request.url).search;
    const result = await authFetch(path, {
      method: "GET", headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await result.json();
    if (!result.ok) {
      return NextResponse.json({ message: result.status === 404
        ? "This service is unavailable on the server. Please try again later."
        : data.message || "Unable to load header data. Please retry." }, { status: result.status, headers });
    }
    if (kind === "messages") {
      const log = data as EmailLog;
      if (!log.installed) return NextResponse.json({ message: "Email delivery service is not configured yet." }, { status: 503, headers });
      const feed: HeaderFeed = {
        count: log.total,
        items: log.items.map(item => ({
          id: item.id, title: item.subject || "(No subject)", detail: item.recipient,
          status: item.status, date: item.created_at,
          href: "/admin/accounts/communicate/emailsmsandlog",
        })),
      };
      return NextResponse.json(feed, { headers });
    }
    if (kind === "alerts") {
      const summary = data as DashboardSummary;
      const items = [
        ...summary.notices.map(item => ({ id: item.id, title: item.title, detail: item.body.slice(0, 180), date: item.start_date, status: "Notice", href: "/admin/accounts/communicate/noticeboard" })),
        ...summary.events.map(item => ({ id: item.id, title: item.title, detail: item.location, date: item.starts_at, status: "Event", href: "/admin/accounts/communicate/event" })),
      ].sort((a, b) => b.date.localeCompare(a.date));
      return NextResponse.json({ items, count: items.length } satisfies HeaderFeed, { headers });
    }
    return NextResponse.json(data, { headers });
  } catch {
    return NextResponse.json({ message: "Header service unavailable. Please retry." }, { status: 503, headers });
  }
}
