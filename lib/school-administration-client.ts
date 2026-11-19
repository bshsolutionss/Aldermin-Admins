import { sessionFetch } from "./session-client";
import type { Page } from "./school-records-client";
export type AdministrationResource =
  | "incidents"
  | "conduct"
  | "leave-types"
  | "entitlements"
  | "leave"
  | "evaluation-settings"
  | "evaluations";
export type AdministrationScope =
  | AdministrationResource
  | "reports/students"
  | "reports/classes"
  | "reports/incidents"
  | "reports/teachers";
export type AdministrationRow = {
  id: string;
  version: number;
  [key: string]: unknown;
};
export type AdministrationDraft = Record<
  string,
  string | number | boolean | null
>;
export type AdministrationField = {
  key: string;
  label: string;
  kind:
    "text" | "date" | "number" | "textarea" | "checkbox" | "choice" | "select";
  choices?: string;
  values?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
};
const name: AdministrationField = {
  key: "name",
  label: "Name",
  kind: "text",
  maxLength: 160,
};
const description: AdministrationField = {
  key: "description",
  label: "Description",
  kind: "textarea",
  maxLength: 2000,
};
const enrollment: AdministrationField = {
  key: "enrollmentId",
  label: "Student enrollment",
  kind: "choice",
  choices: "options/enrollments",
};
export const administrationFields: Record<
  AdministrationResource,
  AdministrationField[]
> = {
  incidents: [
    name,
    {
      key: "points",
      label: "Conduct points",
      kind: "number",
      min: -10000,
      max: 10000,
    },
    description,
  ],
  "leave-types": [name, description],
  conduct: [
    {
      key: "incidentId",
      label: "Incident",
      kind: "choice",
      choices: "incidents",
    },
    enrollment,
    { key: "occurredOn", label: "Occurred date", kind: "date" },
    { key: "note", label: "Note", kind: "textarea", maxLength: 2000 },
  ],
  entitlements: [
    {
      key: "staffId",
      label: "Staff",
      kind: "choice",
      choices: "options/staff",
    },
    {
      key: "typeId",
      label: "Leave type",
      kind: "choice",
      choices: "leave-types",
    },
    { key: "startDate", label: "Period start", kind: "date" },
    { key: "endDate", label: "Period end", kind: "date" },
    {
      key: "days",
      label: "Quota in calendar days",
      kind: "number",
      min: 0,
      max: 366,
    },
  ],
  leave: [
    {
      key: "entitlementId",
      label: "Staff entitlement",
      kind: "choice",
      choices: "entitlements",
    },
    { key: "startDate", label: "First leave day", kind: "date" },
    { key: "endDate", label: "Last leave day", kind: "date" },
    { key: "reason", label: "Reason", kind: "textarea", maxLength: 2000 },
  ],
  "evaluation-settings": [
    {
      key: "allowStudent",
      label: "Allow student-source reviews",
      kind: "checkbox",
    },
    {
      key: "allowParent",
      label: "Allow parent-source reviews",
      kind: "checkbox",
    },
    {
      key: "anonymous",
      label: "Mark reviews anonymous for future faculty views",
      kind: "checkbox",
    },
    {
      key: "verificationRequired",
      label: "Require Admin review before inclusion in reports",
      kind: "checkbox",
    },
    {
      key: "maxStars",
      label: "Maximum rating",
      kind: "number",
      min: 1,
      max: 10,
    },
  ],
  evaluations: [
    {
      key: "assignmentId",
      label: "Teacher subject allocation",
      kind: "choice",
      choices: "options/allocations",
    },
    enrollment,
    {
      key: "reviewerKind",
      label: "Reviewer source",
      kind: "select",
      values: ["student", "parent"],
    },
    {
      key: "guardianId",
      label: "Student guardian (parent reviews)",
      kind: "choice",
      choices: "options/guardians",
    },
    { key: "reviewedOn", label: "Review date", kind: "date" },
    {
      key: "rating",
      label: "Rating on configured scale",
      kind: "number",
      min: 1,
      max: 10,
    },
    {
      key: "comment",
      label: "Review comment",
      kind: "textarea",
      maxLength: 2000,
    },
  ],
};
export function blankAdministration(
  resource: AdministrationResource,
): AdministrationDraft {
  const result: AdministrationDraft = {
    version: 0,
    archived: false,
    requestId: crypto.randomUUID(),
    studentId: "",
  };
  for (const field of administrationFields[resource])
    result[field.key] =
      field.kind === "checkbox"
        ? false
        : field.key === "reviewerKind"
          ? "student"
          : field.key === "guardianId"
            ? null
            : field.kind === "number"
              ? 0
              : "";
  return result;
}
export function administrationBody(
  resource: AdministrationResource,
  input: AdministrationDraft,
) {
  const keys = administrationFields[resource].map((f) => f.key);
  if (["incidents", "leave-types", "entitlements"].includes(resource))
    keys.push("archived", "version");
  if (resource === "evaluation-settings") keys.push("version");
  if (["conduct", "leave", "evaluations"].includes(resource))
    keys.push("requestId");
  return Object.fromEntries(keys.map((key) => [key, input[key]]));
}
async function call<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await sessionFetch("/api/school-administration/" + path, {
    method,
    cache: "no-store",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const result = await response.json().catch(() => {
    throw Error("Invalid server response. Please retry.");
  });
  if (!response.ok)
    throw Error(
      Array.isArray(result.message)
        ? result.message.join("; ")
        : result.message || "Unable to load or save administration records",
    );
  return result;
}
export type AdministrationFilters = {
  page?: number;
  search?: string;
  archived?: boolean;
  status?: string;
  from?: string;
  to?: string;
  targetId?: string;
};
function query(f: AdministrationFilters = {}) {
  return new URLSearchParams({
    page: String(f.page ?? 1),
    pageSize: "20",
    search: f.search ?? "",
    archived: String(f.archived ?? false),
    status: f.status ?? "all",
    ...(f.from ? { from: f.from } : {}),
    ...(f.to ? { to: f.to } : {}),
    ...(f.targetId ? { targetId: f.targetId } : {}),
  });
}
export const schoolAdministrationApi = {
  list: async (
    scope: AdministrationScope,
    filters: AdministrationFilters = {},
  ) => {
    if (scope === "evaluation-settings") {
      const { settings } = await call<{ settings: AdministrationRow | null }>(
        "evaluation-settings",
      );
      return {
        items: settings ? [settings] : [],
        total: settings ? 1 : 0,
        page: 1,
        pageSize: 20,
      };
    }
    return call<Page<AdministrationRow>>(scope + "?" + query(filters));
  },
  choices: (path: string, filters: AdministrationFilters = {}) =>
    call<Page<AdministrationRow>>(path + "?" + query(filters)),
  save: (
    resource: AdministrationResource,
    input: AdministrationDraft,
    id?: string,
  ) =>
    call<{ record: AdministrationRow; changed: boolean }>(
      resource +
        (id && resource !== "evaluation-settings"
          ? "/" + encodeURIComponent(id)
          : ""),
      id || resource === "evaluation-settings" ? "PUT" : "POST",
      administrationBody(resource, input),
    ),
  decision: (
    resource: AdministrationResource,
    id: string,
    status: string,
    reason: string,
    version: number,
  ) =>
    call<{ record: AdministrationRow; changed: boolean }>(
      resource + "/" + encodeURIComponent(id) + "/decision",
      "PUT",
      { status, reason, version },
    ),
  history: (resource: AdministrationResource, page = 1) =>
    call<Page<AdministrationRow>>(resource + "/history?" + query({ page })),
};
