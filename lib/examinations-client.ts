import { sessionFetch } from "./session-client";
import type { Page } from "./school-records-client";
export type ExamResource = "types" | "grades" | "assessments" | "schedules";
export type ExamMode = ExamResource | "attendance" | "marks" | "report";
export type ExamInput = {
  name: string;
  description: string;
  archived: boolean;
  version: number;
  typeId: string;
  minPercent: number;
  maxPercent: number;
  requestId: string;
  assignmentId: string;
  title: string;
  maxMarks: number;
  passMarks: number;
  assessmentId: string;
  classroomId: string;
  examDate: string;
  startTime: string;
  endTime: string;
};
export type ExamRow = ExamInput & {
  id: string;
  typeName?: string;
  className?: string;
  sectionName?: string;
  subjectName?: string;
  teacherName?: string;
  roomNumber?: string;
  assessmentTitle?: string;
};
export type ExamRoster = {
  enrollmentId: string;
  admissionNo: string;
  name: string;
  rollNo: string;
  attendanceStatus: "present" | "absent" | "excused" | null;
  attendanceVersion: number;
  note: string | null;
  status: "graded" | "absent" | "excused" | null;
  score: number | null;
  markVersion: number;
  feedback: string | null;
  maxMarks: number | null;
  passMarks: number | null;
  grade: string | null;
  percentage: number | null;
  passed: boolean | null;
};
export type ExamEvent = {
  id: string;
  resource: string;
  recordId: string;
  version: number;
  actorName: string;
  createdAt: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown>;
};
export const blankExam = (): ExamInput => ({
  name: "",
  description: "",
  archived: false,
  version: 0,
  typeId: "",
  minPercent: 0,
  maxPercent: 100,
  requestId: crypto.randomUUID(),
  assignmentId: "",
  title: "",
  maxMarks: 100,
  passMarks: 40,
  assessmentId: "",
  classroomId: "",
  examDate: "",
  startTime: "",
  endTime: "",
});
const keys: Record<ExamResource, (keyof ExamInput)[]> = {
  types: ["name", "description", "archived", "version"],
  grades: ["typeId", "name", "minPercent", "maxPercent", "archived", "version"],
  assessments: [
    "requestId",
    "typeId",
    "assignmentId",
    "title",
    "maxMarks",
    "passMarks",
    "archived",
    "version",
  ],
  schedules: [
    "assessmentId",
    "classroomId",
    "examDate",
    "startTime",
    "endTime",
    "version",
  ],
};
export function examBody(r: ExamResource, input: ExamInput) {
  return Object.fromEntries(keys[r].map((k) => [k, input[k]]));
}
async function call<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await sessionFetch("/api/examinations/" + path, {
    method,
    cache: "no-store",
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(
      Array.isArray(value.message)
        ? value.message.join("; ")
        : value.message || "Examination request failed",
    );
  return value;
}
const query = (page: number, search: string, archived = false) =>
  new URLSearchParams({
    page: String(page),
    pageSize: "20",
    search,
    archived: String(archived),
  }).toString();
export const examinationsApi = {
  schedule: (assessmentId:string) => call<Page<ExamRow>>('schedules?'+query(1,'')+'&assessmentId='+encodeURIComponent(assessmentId)),
  list: (r: ExamResource, page = 1, search = "", archived = false) =>
    call<Page<ExamRow>>(r + "?" + query(page, search, archived)),
  options: (
    kind: "types" | "assessments" | "allocations" | "rooms",
    page = 1,
    search = "",
  ) =>
    call<Page<{ id: string; label: string }>>(
      "options/" + kind + "?" + query(page, search),
    ),
  save: (r: ExamResource, input: ExamInput, id?: string) =>
    call<{ record: ExamRow; changed: boolean }>(
      r + (id ? "/" + encodeURIComponent(id) : ""),
      id ? "PUT" : "POST",
      examBody(r, input),
    ),
  roster: (id: string, page = 1, search = "") =>
    call<
      Page<ExamRoster> & {
        assessment: ExamRow;
        schedule: { id: string; date: string };
      }
    >(
      "assessments/" +
        encodeURIComponent(id) +
        "/roster?" +
        query(page, search),
    ),
  record: (
    id: string,
    kind: "attendance" | "marks",
    input: {
      enrollmentId: string;
      status: string;
      version: number;
      note?: string;
      score?: number | null;
      feedback?: string;
    },
  ) =>
    call(
      "assessments/" + encodeURIComponent(id) + "/" + kind,
      "PUT",
      kind === "attendance"
        ? {
            enrollmentId: input.enrollmentId,
            status: input.status,
            note: input.note ?? "",
            version: input.version,
          }
        : {
            enrollmentId: input.enrollmentId,
            status: input.status,
            score: input.score ?? null,
            feedback: input.feedback ?? "",
            version: input.version,
          },
    ),
  history: (page = 1) => call<Page<ExamEvent>>("history?" + query(page, "")),
};
