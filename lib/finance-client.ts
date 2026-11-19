import { sessionFetch } from "./session-client";
export type FinanceRow = {
  id: string;
  version?: number;
  [key: string]: unknown;
};
export type FinancePage = {
  items: FinanceRow[];
  total: number;
  page: number;
  pageSize: number;
  currency: string | null;
  basis?: string;
};
export type FinanceResource =
  | "groups"
  | "types"
  | "accounts"
  | "invoices"
  | "payments"
  | "journals"
  | "payroll"
  | "wallet-requests"
  | "wallet-movements"
  | "history";
export type FinanceChoice =
  "students" | "staff" | "groups" | "types" | "accounts" | "invoices";
export type FinanceReport =
  "trial-balance" | "profit-loss" | "dues" | "wallet" | "payments" | "payroll";
export type FinanceInput = Record<string, string | number | boolean>;
export class FinanceError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function financeRequest<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await sessionFetch("/api/finance/" + path, {
    method,
    cache: "no-store",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const data = await response
    .json()
    .catch(() => ({ message: "Invalid server response" }));
  if (!response.ok)
    throw new FinanceError(
      Array.isArray(data.message)
        ? data.message.join(", ")
        : (data.message ?? "Unable to load finance"),
      response.status,
    );
  return data as T;
}
const writeKeys: Record<string, string[]> = {
  groups: ["name", "archived", "version"],
  types: ["name", "archived", "version", "groupId", "amount"],
  accounts: ["name", "archived", "version", "code", "kind", "isBank"],
  invoices: [
    "requestId",
    "bookingDate",
    "memo",
    "studentId",
    "feeTypeId",
    "receivableId",
    "revenueId",
    "title",
    "dueDate",
    "waiver",
    "fine",
  ],
  payments: [
    "requestId",
    "bookingDate",
    "memo",
    "invoiceId",
    "method",
    "accountId",
    "amount",
    "reference",
  ],
  journals: [
    "requestId",
    "bookingDate",
    "memo",
    "kind",
    "debitId",
    "creditId",
    "amount",
  ],
  payroll: [
    "requestId",
    "bookingDate",
    "memo",
    "staffId",
    "period",
    "gross",
    "deduction",
    "expenseId",
    "payableId",
  ],
  "wallet-requests": [
    "requestId",
    "bookingDate",
    "memo",
    "studentId",
    "kind",
    "liabilityId",
    "bankId",
    "amount",
    "reference",
  ],
  pay: ["requestId", "bookingDate", "memo", "version", "bankId"],
  decision: ["version", "status", "note"],
  settings: ["version", "currency"],
};
function payload(kind: string, data: FinanceInput) {
  const keys = writeKeys[kind];
  if (!keys) throw new Error("Unsupported financial operation");
  return Object.fromEntries(
    keys.filter((k) => Object.hasOwn(data, k)).map((k) => [k, data[k]]),
  );
}
export const financeApi = {
  list: (resource: FinanceResource, query: Record<string, string>) =>
    financeRequest<FinancePage>(resource + "?" + new URLSearchParams(query)),
  report: (report: FinanceReport, query: Record<string, string>) =>
    financeRequest<FinancePage>(
      "reports/" + report + "?" + new URLSearchParams(query),
    ),
  options: (kind: FinanceChoice, page: number, search: string) =>
    financeRequest<{ items: { id: string; label: string }[]; total: number }>(
      "options/" +
        kind +
        "?" +
        new URLSearchParams({ page: String(page), search }),
    ),
  settings: () =>
    financeRequest<{ record: FinanceRow | null; decimalPlaces: number }>(
      "settings",
    ),
  saveSettings: (data: FinanceInput) =>
    financeRequest<{ record: FinanceRow }>(
      "settings",
      "PUT",
      payload("settings", data),
    ),
  save: (resource: FinanceResource, data: FinanceInput, id?: string) => {
    if (id && !["groups", "types", "accounts"].includes(resource))
      throw new Error("Posted financial records cannot be edited");
    return financeRequest<{ record: FinanceRow }>(
      resource + (id ? "/" + id : ""),
      id ? "PUT" : "POST",
      payload(resource, data),
    );
  },
  action: (
    resource: "payroll" | "wallet-requests",
    id: string,
    action: "pay" | "decision",
    data: FinanceInput,
  ) =>
    financeRequest<{ record: FinanceRow }>(
      resource + "/" + id + "/" + action,
      "PUT",
      payload(action, data),
    ),
};
export function formatMinor(value: unknown): string {
  const text = String(value ?? "0");
  if (!/^-?\d+$/.test(text)) return "—";
  const n = BigInt(text),
    abs = n < BigInt(0) ? -n : n;
  return (
    (n < BigInt(0) ? "-" : "") +
    String(abs / BigInt(100)) +
    "." +
    String(abs % BigInt(100)).padStart(2, "0")
  );
}
