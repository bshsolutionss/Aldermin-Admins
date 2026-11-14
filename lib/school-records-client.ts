import { sessionFetch } from "./session-client";
export type StudentInput = { admissionNo: string; firstName: string; lastName: string; birthDate: string; gender: string; email: string | null; phone: string | null; address: string | null; medicalNotes: string | null; categoryId: string | null; groupId: string | null };
export type StudentRecord = StudentInput & { id: string; version: number; active: boolean; guardianName?: string | null; className?: string | null; sectionName?: string | null; yearName?: string | null; rollNo?: string | null };
export type GuardianInput = { name: string; relationship: string; email: string | null; phone: string | null; address: string | null; isPrimary: boolean };
export type GuardianRecord = GuardianInput & { id: string; studentId: string; version: number };
export type EnrollmentInput = { classSectionId: string; rollNo: string; startDate: string; endDate: string };
export type EnrollmentRecord = EnrollmentInput & { id: string; studentId: string; academicYearId: string; version: number; className?: string; sectionName?: string; yearName?: string };
export type StudentDetail = { student: StudentRecord; guardians: GuardianRecord[]; enrollments: EnrollmentRecord[] };
export type SchoolOptions = { placements: { id: string; className: string; sectionName: string; yearName: string; academicYearId: string; startDate: string; endDate: string }[]; categories: { id: string; name: string }[]; groups: { id: string; name: string }[]; today: string | null };
export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
export type AttendanceKind = "students" | "staff";
export type AttendanceStatus = "present" | "absent" | "late" | "half-day" | "leave";
export type AttendanceEntry = { targetId: string; name: string; reference: string; rollNo?: string; role?: string; id: string | null; status: AttendanceStatus | null; note: string; version: number; clockIn?: string | null; clockOut?: string | null };
export type AttendancePage = Page<AttendanceEntry> & { date: string; calendar: { today: string | null; weekend: boolean | null; holiday: string | null } };
export type AttendanceInput = { targetId: string; status: AttendanceStatus; note: string; version: number; clockIn?: string | null; clockOut?: string | null };
async function call<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await sessionFetch(`/api/${path}`, { method, cache: "no-store", ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an invalid response. Please retry."); }
  if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join("; ") : result.message || "Unable to load or save school records");
  return result as T;
}
export const schoolRecordsApi = {
  options: () => call<SchoolOptions>("student-records/options"),
  students: (page = 1, search = "", active = true) => call<Page<StudentRecord>>(`student-records/students?${new URLSearchParams({ page: String(page), pageSize: "20", search, active: String(active) })}`),
  student: (id: string) => call<StudentDetail>(`student-records/students/${id}`),
  createStudent: (input: StudentInput & { guardian?: GuardianInput; enrollment?: EnrollmentInput }) => call<{ student: StudentRecord; guardian: GuardianRecord | null; enrollment: EnrollmentRecord | null }>("student-records/students", "POST", input),
  updateStudent: (id: string, input: StudentInput & { active: boolean; version: number }) => call<{ student: StudentRecord }>(`student-records/students/${id}`, "PUT", input),
  guardian: (studentId: string, input: GuardianInput & { version?: number }, id?: string) => call<GuardianRecord>(`student-records/students/${studentId}/guardians${id ? `/${id}` : ""}`, id ? "PUT" : "POST", input),
  enroll: (studentId: string, input: EnrollmentInput) => call<EnrollmentRecord>(`student-records/students/${studentId}/enrollments`, "POST", input),
  endEnrollment: (studentId: string, id: string, endDate: string, version: number) => call<{ enrollment: EnrollmentRecord; changed: boolean }>(`student-records/students/${studentId}/enrollments/${id}`, "PUT", { endDate, version }),
  history: (page = 1) => call<Page<{ id: string; resource: string; recordId: string; actorName: string; version: number; createdAt: string; beforeState: unknown; afterState: unknown }>>(`student-records/history?page=${page}&pageSize=20`),
  attendance: (kind: AttendanceKind, date: string, classSectionId = "", page = 1) => call<AttendancePage>(`school-attendance/${kind}?${new URLSearchParams({ date, page: String(page), pageSize: "50", ...(classSectionId ? { classSectionId } : {}) })}`),
  saveAttendance: (kind: AttendanceKind, date: string, entries: AttendanceInput[]) => call<{ items: AttendanceEntry[]; changed: number }>(`school-attendance/${kind}`, "PUT", { date, entries }),
};
