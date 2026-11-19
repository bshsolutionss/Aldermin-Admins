import { sessionFetch } from "./session-client";
export type CampusResource =
  | "question-groups"
  | "questions"
  | "exams"
  | "exam-questions"
  | "participants"
  | "attempts"
  | "answers"
  | "office-catalogs"
  | "inquiries"
  | "visits"
  | "correspondence"
  | "complaints"
  | "room-types"
  | "buildings"
  | "rooms"
  | "allocations"
  | "history";
export type CampusChoice =
  | "question-groups"
  | "questions"
  | "subjects"
  | "exams"
  | "office-catalogs"
  | "room-types"
  | "buildings"
  | "rooms"
  | "students"
  | "users"
  | "staff"
  | "classes"
  | "enrollments"
  | "allocations";
export type CampusRow = { id: string; version: number; [key: string]: unknown };
export type CampusInput = Record<
  string,
  string | number | boolean | string[] | null
>;
export type CampusPage = {
  items: CampusRow[];
  total: number;
  page: number;
  pageSize: number;
};
export class CampusError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await sessionFetch("/api/online-campus/" + path, {
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
    throw new CampusError(
      Array.isArray(data.message)
        ? data.message.join(", ")
        : (data.message ?? "Unable to load school operations"),
      response.status,
    );
  return data as T;
}
const keys: Record<string, string[]> = {
  "question-groups": ["name", "archived", "version"],
  questions: [
    "groupId",
    "subjectId",
    "prompt",
    "choices",
    "correctIndex",
    "marks",
    "archived",
    "version",
  ],
  exams: [
    "requestId",
    "assignmentId",
    "title",
    "opensAt",
    "closesAt",
    "durationMinutes",
    "passPercent",
    "version",
  ],
  "exam-questions": ["examId", "questionId", "position", "archived", "version"],
  participants: ["examId", "enrollmentId", "userId", "archived", "version"],
  "office-catalogs": ["name", "kind", "archived", "version"],
  inquiries: [
    "requestId",
    "name",
    "phone",
    "email",
    "sourceId",
    "classId",
    "inquiryDate",
    "note",
    "status",
    "version",
  ],
  visits: [
    "requestId",
    "name",
    "phone",
    "purposeId",
    "staffId",
    "guestCount",
    "enteredAt",
    "note",
    "version",
  ],
  correspondence: [
    "requestId",
    "kind",
    "name",
    "contact",
    "reference",
    "subject",
    "message",
    "recordDate",
    "durationSeconds",
    "version",
  ],
  complaints: [
    "requestId",
    "name",
    "phone",
    "categoryId",
    "staffId",
    "receivedDate",
    "summary",
    "status",
    "resolution",
    "version",
  ],
  "room-types": ["name", "archived", "version"],
  buildings: ["name", "gender", "address", "archived", "version"],
  rooms: ["name", "buildingId", "typeId", "capacity", "archived", "version"],
  allocations: [
    "requestId",
    "studentId",
    "roomId",
    "bedNo",
    "startDate",
    "endDate",
    "note",
  ],
  status: ["version", "status"],
  checkout: ["version", "leftAt"],
  end: ["version", "endDate"],
  finalize: ["version"],
};
export const campusApi = {
  list: (resource: CampusResource, query: Record<string, string>) =>
    request<CampusPage>(resource + "?" + new URLSearchParams(query)),
  options: (kind: CampusChoice, page: number, search: string) =>
    request<{ items: { id: string; label: string }[]; total: number }>(
      "options/" +
        kind +
        "?" +
        new URLSearchParams({ page: String(page), search }),
    ),
  save: (resource: CampusResource, data: CampusInput, id?: string) => {
    if (!keys[resource]) throw new Error("Unsupported school operation");
    return request<{ record: CampusRow }>(
      resource + (id ? "/" + id : ""),
      id ? "PUT" : "POST",
      Object.fromEntries(
        keys[resource]
          .filter((k) => Object.hasOwn(data, k))
          .map((k) => [k, data[k]]),
      ),
    );
  },
  action: (
    resource: CampusResource,
    id: string,
    action: "status" | "checkout" | "end" | "finalize",
    data: CampusInput,
  ) =>
    request<{ record: CampusRow }>(
      resource + "/" + id + "/" + action,
      "PUT",
      Object.fromEntries(
        keys[action]
          .filter((k) => Object.hasOwn(data, k))
          .map((k) => [k, data[k]]),
      ),
    ),
  admit: (id: string, data: CampusInput) =>
    request<{ record: CampusRow }>("inquiries/" + id + "/admit", "PUT", {
      requestId: data.requestId,
      version: data.version,
      student: Object.fromEntries(
        [
          "admissionNo",
          "firstName",
          "lastName",
          "birthDate",
          "gender",
          "email",
          "phone",
        ]
          .filter((k) => data[k] !== "" && data[k] !== undefined)
          .map((k) => [k, data[k]]),
      ),
    }),
};
