import { sessionFetch } from "./session-client";
export type DashboardSummary = {
  asOf: string;
  year: number;
  today: string;
  timezone: string;
  schoolName: string | null;
  students: { total: number; male: number; female: number; other: number };
  staff: { total: number; teachers: number };
  finance: {
    currency: string | null;
    decimalPlaces: number;
    income: string;
    expense: string;
    monthly: { month: string; income: string; expense: string }[];
    fees: { collected: string; pending: string; overdue: string };
    basis: string;
  };
  notices: {
    id: string;
    title: string;
    body: string;
    audience: string;
    start_date: string;
    end_date: string;
  }[];
  events: {
    id: string;
    title: string;
    location: string;
    starts_at: string;
    ends_at: string;
  }[];
};
export const dashboardApi = {
  summary: async (year?: number): Promise<DashboardSummary> => {
    const result = await sessionFetch(
      "/api/admin-dashboard" +
        (year === undefined ? "" : "?year=" + encodeURIComponent(year)),
      { method: "GET", cache: "no-store" },
    );
    const data = await result.json();
    if (!result.ok) throw new Error(data.message || "Dashboard unavailable");
    return data;
  },
};
