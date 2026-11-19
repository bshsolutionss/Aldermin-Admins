import { sessionFetch } from "./session-client";
import type { Page } from "./school-records-client";
export type WorkResource = "homework" | "lessons" | "topics" | "plans";
export type WorkInput = {
  assignmentId: string;
  title: string;
  description: string;
  archived: boolean;
  version: number;
  assignedOn: string;
  dueOn: string;
  maxPoints: number;
  lessonId: string;
  topicId: string;
  plannedOn: string;
  status: "planned" | "completed" | "cancelled";
  completedOn: string | null;
};
export type WorkRow = WorkInput & {
  id: string;
  className?: string;
  sectionName?: string;
  yearName?: string;
  subjectName?: string;
  teacherName?: string;
  targetCount?: number;
  evaluatedCount?: number;
  topicCount?: number;
  planCount?: number;
  completedCount?: number;
};
export type Allocation = {
  id: string;
  className: string;
  sectionName: string;
  yearName: string;
  subjectName: string;
  teacherName: string;
};
export type EvaluationInput = {
  enrollmentId: string;
  status: "submitted" | "missing" | "excused";
  points: number;
  feedback: string;
  evaluatedOn: string;
  version: number;
};
export type RosterRow = {
  enrollmentId: string;
  studentId: string;
  name: string;
  admissionNo: string;
  rollNo: string;
  id: string | null;
  version: number;
  status: EvaluationInput["status"] | null;
  points: number | null;
  feedback: string | null;
  evaluatedOn: string | null;
};
export type WorkEvent = {
  id: string;
  recordId: string;
  resource: string;
  version: number;
  actorName: string;
  createdAt: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown>;
};
export const blankWork = (): WorkInput => ({
  assignmentId: "",
  title: "",
  description: "",
  archived: false,
  version: 0,
  assignedOn: "",
  dueOn: "",
  maxPoints: 100,
  lessonId: "",
  topicId: "",
  plannedOn: "",
  status: "planned",
  completedOn: null,
});
export function workBody(resource: WorkResource, input: WorkInput) {
  const common = [
    "assignmentId",
    "title",
    "description",
    "archived",
    "version",
  ];
  const keys = [
    ...common,
    ...(resource === "homework"
      ? ["assignedOn", "dueOn", "maxPoints"]
      : resource === "topics"
        ? ["lessonId"]
        : resource === "plans"
          ? ["topicId", "plannedOn", "status", "completedOn"]
          : []),
  ];
  return Object.fromEntries(keys.map((k) => [k, input[k as keyof WorkInput]]));
}
async function call<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await sessionFetch("/api/academic-work/" + path, {
    method,
    cache: "no-store",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const data = await response.json().catch(() => {
    throw Error("Invalid server response. Please retry.");
  });
  if (!response.ok)
    throw Error(
      Array.isArray(data.message)
        ? data.message.join("; ")
        : data.message || "Unable to load or save academic work",
    );
  return data;
}
function query(page = 1, search = "", archived = false, assignmentId = "") {
  return new URLSearchParams({
    page: String(page),
    pageSize: "20",
    search,
    archived: String(archived),
    ...(assignmentId ? { assignmentId } : {}),
  });
}
export const academicWorkApi = {
  list: (
    resource: WorkResource,
    page = 1,
    search = "",
    archived = false,
    assignmentId = "",
  ) =>
    call<Page<WorkRow>>(
      resource + "?" + query(page, search, archived, assignmentId),
    ),
  options: (page = 1, search = "") =>
    call<Page<Allocation> & { today: string | null }>(
      "options?" + query(page, search),
    ),
  save: (resource: WorkResource, input: WorkInput, id?: string) =>
    call<{ record: WorkRow; changed: boolean }>(
      resource + (id ? "/" + encodeURIComponent(id) : ""),
      id ? "PUT" : "POST",
      workBody(resource, input),
    ),
  roster: (id: string, page = 1, search = "") =>
    call<Page<RosterRow> & { homework: WorkRow }>(
      "homework/" + encodeURIComponent(id) + "/roster?" + query(page, search),
    ),
  evaluate: (id: string, input: EvaluationInput) =>
    call<{ changed: boolean }>(
      "homework/" + encodeURIComponent(id) + "/evaluate",
      "PUT",
      input,
    ),
  history: (resource: WorkResource, page = 1) =>
    call<Page<WorkEvent>>(resource + "/history?" + query(page)),
};
