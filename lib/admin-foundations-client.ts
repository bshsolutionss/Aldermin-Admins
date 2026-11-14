import { sessionFetch } from "./session-client";

export type FoundationResource = "holidays" | "categories" | "groups";
export type FoundationRecord = { id: string; name: string; archived: boolean; version: number; updatedAt: string; startDate?: string; endDate?: string };
export type FoundationInput = { name: string; startDate?: string; endDate?: string; version?: number; archived?: boolean };
export type FoundationPage = { items: FoundationRecord[]; total: number; page: number; pageSize: number };
export type WeekendSettings = { days: number[]; version: number; updatedAt: string };
export type FoundationHistory = { items: { id: string; resource: string; recordId: string; version: number; actorName: string; createdAt: string; beforeState: unknown; afterState: unknown }[]; total: number; page: number; pageSize: number };

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await sessionFetch(`/api/admin-foundations/${path}`, { method, cache: "no-store", ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an invalid response. Please retry."); }
  if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join("; ") : result.message || "Unable to save or load records");
  return result as T;
}
export const foundationsApi = {
  list: (resource: FoundationResource, page = 1, search = "", archived = false) => request<FoundationPage>(`${resource}?${new URLSearchParams({ page: String(page), pageSize: "20", search, archived: String(archived) })}`),
  save: (resource: FoundationResource, input: FoundationInput, id?: string) => request<{ record: FoundationRecord; changed: boolean }>(`${resource}${id ? `/${id}` : ""}`, id ? "PUT" : "POST", input),
  weekends: () => request<{ weekends: WeekendSettings | null }>("weekends"),
  saveWeekends: (days: number[], version: number) => request<{ weekends: WeekendSettings; changed: boolean }>("weekends", "PUT", { days, version }),
  history: (page = 1) => request<FoundationHistory>(`history?page=${page}&pageSize=10`),
};
