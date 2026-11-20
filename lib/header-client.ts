import { sessionFetch } from "./session-client";

export type HeaderItem = {
  id: string; title: string; detail: string; href: string;
  date?: string; status?: string;
};
export type HeaderFeed = { items: HeaderItem[]; count: number };
export async function getHeaderFeed(kind: "search" | "alerts" | "messages", q = "", signal?: AbortSignal): Promise<HeaderFeed> {
  const params = new URLSearchParams({ kind });
  if (kind === "search") params.set("q", q);
  const response = await sessionFetch("/api/admin-header?" + params, { method: "GET", cache: "no-store", signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to load header data");
  return data;
}
