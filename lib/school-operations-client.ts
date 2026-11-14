import { sessionFetch } from "./session-client";
import type { Page } from "./school-records-client";
export type RegistryResource =
  | "library-categories"
  | "library-subjects"
  | "books"
  | "members"
  | "inventory-categories"
  | "stores"
  | "suppliers"
  | "items";
export type OperationResource = RegistryResource | "loans" | "movements";
export type ChoiceResource =
  OperationResource | "owners/students" | "owners/staff";
export type RegistryInput = {
  name: string;
  code: string;
  title: string;
  isbn: string;
  author: string;
  publisher: string;
  contact: string;
  unit: string;
  copies: number;
  categoryId: string | null;
  subjectId: string | null;
  studentId: string | null;
  staffId: string | null;
  archived: boolean;
  version: number;
};
export type LoanInput = {
  requestId: string;
  bookId: string;
  memberId: string;
  issuedOn: string;
  dueOn: string;
  note: string;
};
export type MovementInput = {
  requestId: string;
  itemId: string;
  storeId: string;
  kind: "receive" | "issue" | "return" | "sale";
  quantity: number;
  movementOn: string;
  supplierId: string | null;
  studentId: string | null;
  staffId: string | null;
  sourceId: string | null;
  reference: string;
  note: string;
};
export type OperationRow = Partial<
  RegistryInput & LoanInput & MovementInput
> & {
  id: string;
  version: number;
  available?: number;
  returnedOn?: string | null;
  bookTitle?: string;
  memberCode?: string;
  itemName?: string;
  storeName?: string;
};
export function blankRegistry(): RegistryInput {
  return {
    name: "",
    code: "",
    title: "",
    isbn: "",
    author: "",
    publisher: "",
    contact: "",
    unit: "",
    copies: 0,
    categoryId: null,
    subjectId: null,
    studentId: null,
    staffId: null,
    archived: false,
    version: 0,
  };
}
export function registryInput(row: OperationRow): RegistryInput {
  const blank = blankRegistry();
  return Object.fromEntries(
    Object.entries(blank).map(([key, value]) => [
      key,
      row[key as keyof RegistryInput] ?? value,
    ]),
  ) as RegistryInput;
}
async function json<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await sessionFetch("/api/school-operations/" + path, {
    method,
    cache: "no-store",
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }),
  });
  const result = await response.json().catch(() => {
    throw Error("Invalid server response");
  });
  if (!response.ok)
    throw Error(
      Array.isArray(result.message)
        ? result.message.join("; ")
        : result.message || "Unable to load or save operations",
    );
  return result as T;
}
export const schoolOperationsApi = {
  list: (
    resource: ChoiceResource | "stock",
    page = 1,
    search = "",
    archived = false,
    status = "all",
  ) =>
    json<Page<OperationRow>>(
      `${resource}?${new URLSearchParams({ page: String(page), pageSize: "20", search, archived: String(archived), status })}`,
    ),
  save: (resource: RegistryResource, input: RegistryInput, id?: string) =>
    json<{ record: OperationRow; changed: boolean }>(
      resource + (id ? "/" + id : ""),
      id ? "PUT" : "POST",
      input,
    ),
  issue: (input: LoanInput) =>
    json<{ record: OperationRow; changed: boolean }>(
      "loans/issue",
      "POST",
      input,
    ),
  returnLoan: (id: string, returnedOn: string, version: number) =>
    json<{ record: OperationRow; changed: boolean }>(
      `loans/${id}/return`,
      "PUT",
      { returnedOn, version },
    ),
  move: (input: MovementInput) =>
    json<{ record: OperationRow; changed: boolean }>(
      "movements/record",
      "POST",
      input,
    ),
  history: (resource: OperationResource, page = 1) =>
    json<
      Page<{
        id: string;
        recordId: string;
        version: number;
        actorName: string;
        createdAt: string;
      }>
    >(`${resource}/history?page=${page}&pageSize=10`),
};
