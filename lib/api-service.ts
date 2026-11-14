/**
 * Centralized API Service for Aldermin School Management System.
 * Connects to real NestJS backend APIs for Authentication, Users & Roles, Courses,
 * School Subjects, Academic Years, Sections, Classes, and HR (departments,
 * designations, staff).
 * Modules without backend APIs (Students, Fees, Library, etc.) remain mock-backed
 * until their backend endpoints are implemented.
 */

import { sessionFetch, withSessionLock } from "./session-client";

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: "admin" | "instructor" | "student" | string;
  createdAt?: string;
  status?: string;
  lastLogin?: string;
}

export interface CourseItem {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | string;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPermission extends Pick<UserAccount, "id" | "name" | "email" | "role"> {
  loginEnabled: boolean;
  updatedAt: string | null;
}
export interface LoginPermissionPage {
  items: LoginPermission[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminPermissionRole { id: string; name: string; permissions: string[]; version: number; }
export interface AdminRoleCatalog { roles: AdminPermissionRole[]; catalog: string[]; resources: Record<string, string>; }
export interface AdminRoleAccount { id: string; name: string; email: string; loginEnabled: boolean; roleId: string | null; roleName: string | null; }
export interface AdminRoleAccounts { items: AdminRoleAccount[]; total: number; page: number; pageSize: number; }

export interface SchoolSettingsInput {
  schoolName: string; schoolCode: string | null; contactEmail: string | null;
  contactPhone: string | null; address: string | null; timezone: string; version: number;
}
export interface SchoolSettings extends SchoolSettingsInput { updatedAt: string; }
export interface SchoolSettingsHistoryItem {
  id: string; actorId: string; actorName: string; version: number; createdAt: string;
  beforeState: SchoolSettings | null; afterState: SchoolSettings;
}
export interface SchoolSettingsHistory { items: SchoolSettingsHistoryItem[]; total: number; page: number; pageSize: number; }

export interface SchoolSubjectInput {
  name: string;
  code: string | null;
  type: "Theory" | "Practical";
}

export interface SchoolSubject extends SchoolSubjectInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomInput { roomNumber: string; capacity: number; }
export interface Classroom extends ClassroomInput { id: string; createdAt: string; updatedAt: string; }
export interface ClassRoutineInput { assignmentId: string; classroomId: string; dayOfWeek: number; startTime: string; endTime: string; }
export interface ClassRoutine extends ClassRoutineInput {
  id: string; classId: string; classSectionId: string; academicYearId: string; academicYearName: string;
  class: string; section: string; day: string; subjectId: string; subject: string; staffId: string; teacher: string; room: string;
  createdAt: string; updatedAt: string;
}
export interface RoutineAllocation {
  id: string; classId: string; className: string; classSectionId: string; sectionName: string;
  academicYearId: string; academicYearName: string; subjectId: string; subjectName: string; staffId: string; teacherName: string;
}
export interface RoutineOptions { academicYearId: string | null; academicYears: AcademicYear[]; allocations: RoutineAllocation[]; classrooms: Classroom[]; }

export interface SubjectAssignmentInput { subjectId: string; classSectionId: string; staffId: string; }
export interface SubjectAssignmentOptions {
  academicYearId: string | null;
  subjects: { id: string; name: string }[];
  classSections: { id: string; className: string; sectionName: string; academicYearId: string; academicYearName: string }[];
  teachers: { id: string; name: string; staffNo: string }[];
}
export interface AcademicYearInput { name: string; startDate: string; endDate: string; }
export interface Section { id: string; name: string; createdAt: string; updatedAt: string; }
export interface AcademicYear extends AcademicYearInput { id: string; isCurrent: boolean; createdAt: string; updatedAt: string; }
export interface SubjectAssignment {
  id: string; subjectId: string; classSectionId: string | null; staffId: string | null;
  teacherId: string | null; legacy: boolean; subject: string; section: string;
  teacher: string; className: string | null; academicYearId: string | null;
  academicYearName: string | null; createdAt: string; updatedAt: string;
}

export interface ClassInput {
  academicYearId: string;
  name: string;
  passingMarks?: number | null;
  sectionIds?: string[];
}
export interface SchoolClass extends ClassInput {
  id: string;
  academicYear: AcademicYear;
  passingMarks: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentInput {
  name: string;
  description?: string | null;
}
export interface Department extends DepartmentInput {
  id: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Designation {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffInput {
  staffNo: string;
  role: string;
  firstName: string;
  lastName: string;
  departmentId?: string | null;
  designationId?: string | null;
  userId?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  email?: string | null;
  gender?: "male" | "female" | "other" | null;
  dob?: string | null;
  joiningDate?: string | null;
  phone?: string | null;
  maritalStatus?: "single" | "married" | "divorced" | "widowed" | null;
  emergencyMobile?: string | null;
  drivingLicense?: string | null;
  isExpert?: boolean;
  address?: string | null;
  permanentAddress?: string | null;
  experience?: string | null;
  epfNo?: string | null;
  basicSalary?: number | null;
  contractType?: "permanent" | "probation" | null;
  location?: string | null;
  bankAccountName?: string | null;
  bankAccountNo?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  photoUrl?: string | null;
  resumeUrl?: string | null;
  joiningDocUrl?: string | null;
  otherDocUrl?: string | null;
  nic?: string | null;
  status?: "active" | "inactive";
}
export interface Staff extends StaffInput {
  id: string;
  name: string;
  department: string | null;
  designation: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface StaffOption {
  id: string;
  staffNo: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string | null;
  designation: string | null;
  status: string;
}

export interface ClassTeacherAssignmentInput {
  classSectionId: string;
  staffId: string;
}
export interface ClassTeacherAssignment extends ClassTeacherAssignmentInput {
  id: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  academicYearId: string;
  academicYearName: string;
  staffNo: string;
  teacherRole: string;
  teacherName: string;
  createdAt: string;
  updatedAt: string;
}
export interface ClassTeacherSectionOption {
  id: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  academicYearId: string;
  academicYearName: string;
}
export interface ClassTeacherOptions {
  academicYearId: string | null;
  classSections: ClassTeacherSectionOption[];
  teachers: {
    id: string;
    staffNo: string;
    name: string;
    role: string;
    department: string | null;
    designation: string | null;
  }[];
}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function clientRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await sessionFetch(endpoint, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const message = Array.isArray(error?.message)
      ? error.message.join(", ")
      : error?.message || "Request failed";

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiService = {
  classRoutines: {
    getAll: (academicYearId?: string, classSectionId?: string) => {
      const query = new URLSearchParams();
      if (academicYearId) query.set("academicYearId", academicYearId);
      if (classSectionId) query.set("classSectionId", classSectionId);
      return clientRequest<ClassRoutine[]>(`/api/class-routines${query.size ? `?${query}` : ""}`);
    },
    getById: (id: string) => clientRequest<ClassRoutine>(`/api/class-routines/${encodeURIComponent(id)}`),
    getOptions: (academicYearId?: string) => clientRequest<RoutineOptions>(`/api/class-routines/options${academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : ""}`),
    create: (data: ClassRoutineInput) => clientRequest<ClassRoutine>("/api/class-routines", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ClassRoutineInput>) => clientRequest<ClassRoutine>(`/api/class-routines/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => clientRequest<{ success: boolean }>(`/api/class-routines/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  classrooms: {
    getAll: () => clientRequest<Classroom[]>("/api/classrooms"),
    getById: (id: string) => clientRequest<Classroom>(`/api/classrooms/${encodeURIComponent(id)}`),
    create: (data: ClassroomInput) => clientRequest<Classroom>("/api/classrooms", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ClassroomInput>) => clientRequest<Classroom>(`/api/classrooms/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => clientRequest<{ success: boolean }>(`/api/classrooms/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  sections: {
    getAll: () => clientRequest<Section[]>("/api/sections"),
    getById: (id: string) => clientRequest<Section>(`/api/sections/${encodeURIComponent(id)}`),
    create: (data: { name: string }) => clientRequest<Section>("/api/sections", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { name: string }) => clientRequest<Section>(`/api/sections/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => clientRequest<{ success: boolean }>(`/api/sections/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  classes: {
    getAll: () => clientRequest<SchoolClass[]>("/api/classes"),
    getById: (id: string) => clientRequest<SchoolClass>(`/api/classes/${encodeURIComponent(id)}`),
    getSectionIds: (id: string) => clientRequest<string[]>(`/api/classes/${encodeURIComponent(id)}/sections`),
    create: (data: ClassInput) => clientRequest<SchoolClass>("/api/classes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: ClassInput) => clientRequest<SchoolClass>(`/api/classes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => clientRequest<{ success: boolean }>(`/api/classes/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  classTeacherAssignments: {
    getAll: () => clientRequest<ClassTeacherAssignment[]>("/api/class-teacher-assignments"),
    getOptions: (academicYearId?: string) =>
      clientRequest<ClassTeacherOptions>(
        `/api/class-teacher-assignments/options${academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : ""}`,
      ),
    create: (data: ClassTeacherAssignmentInput) =>
      clientRequest<ClassTeacherAssignment>("/api/class-teacher-assignments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<ClassTeacherAssignmentInput>) =>
      clientRequest<ClassTeacherAssignment>(
        `/api/class-teacher-assignments/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(data) },
      ),
    delete: (id: string) =>
      clientRequest<{ success: boolean }>(
        `/api/class-teacher-assignments/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
  },
  academicYears: {
    getAll: () => clientRequest<AcademicYear[]>("/api/academic-years"),
    getById: (id: string) => clientRequest<AcademicYear>(`/api/academic-years/${encodeURIComponent(id)}`),
    create: (data: AcademicYearInput) => clientRequest<AcademicYear>("/api/academic-years", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<AcademicYearInput>) => clientRequest<AcademicYear>(`/api/academic-years/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
    setCurrent: (id: string) => clientRequest<AcademicYear>(`/api/academic-years/${encodeURIComponent(id)}/current`, { method: "PATCH" }),
    delete: (id: string) => clientRequest<{ success: boolean }>(`/api/academic-years/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  subjectAssignments: {
    getAll: (academicYearId?: string) => clientRequest<SubjectAssignment[]>(`/api/school-subject-assignments${academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : ""}`),
    getOptions: (academicYearId?: string) => clientRequest<SubjectAssignmentOptions>(`/api/school-subject-assignments/options${academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : ""}`),
    create: (data: SubjectAssignmentInput) => clientRequest<SubjectAssignment>("/api/school-subject-assignments", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<SubjectAssignmentInput>) => clientRequest<SubjectAssignment>(`/api/school-subject-assignments/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => clientRequest<{ success: boolean }>(`/api/school-subject-assignments/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  schoolSubjects: {
    getAll: () => clientRequest<SchoolSubject[]>("/api/school-subjects"),
    getById: (id: string) => clientRequest<SchoolSubject>(`/api/school-subjects/${encodeURIComponent(id)}`),
    create: (data: SchoolSubjectInput) => clientRequest<SchoolSubject>("/api/school-subjects", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<SchoolSubjectInput>) => clientRequest<SchoolSubject>(`/api/school-subjects/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => clientRequest<{ success: boolean }>(`/api/school-subjects/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  // ==========================================
  // REAL BACKEND INTEGRATED MODULES
  // ==========================================

  // --- Authentication ---
  auth: {
    login: async (credentials: {
      email: string;
      password: string;
      portal?: "admin" | "portal";
      requiredRole?: string;
    }) => {
      return withSessionLock(async () => {
        const result = await clientRequest<{
        message: string;
        user: UserAccount;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        });
        // Verify cookies were accepted; do not refresh while holding the login lock.
        const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
        const user = await response.json().catch(() => null) as UserAccount | null;
        const roles = credentials.portal === "admin" ? ["admin"] : ["student", "instructor"];
        if (!response.ok || !user?.id || !user.name || !user.email || !roles.includes(user.role) ||
          user.id !== result.user?.id || user.email !== result.user.email || user.role !== result.user.role) {
          throw new Error("Unable to establish a verified session. Please sign in again.");
        }
        return { ...result, user };
      });
    },

    register: (data: { name: string; email: string; password: string }) =>
      clientRequest<{ message: string; user: UserAccount }>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),

    logout: async () => {
      return withSessionLock(() => clientRequest<{ message: string }>("/api/auth/logout", {
        method: "POST",
      }));
    },

    getMe: async () => {
      return clientRequest<UserAccount>("/api/auth/me", {
        method: "GET",
      });
    },

    forgotPassword: async (email: string) => {
      return clientRequest<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: async (data: { token: string; newPassword: string }) => {
      return clientRequest<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  // --- Users & Roles Management ---
  schoolSettings: {
    get: () => clientRequest<{ settings: SchoolSettings | null }>("/api/school-settings"),
    save: (input: SchoolSettingsInput) => clientRequest<{ settings: SchoolSettings; changed: boolean }>("/api/school-settings", { method: "PUT", body: JSON.stringify(input) }),
    history: (page = 1) => clientRequest<SchoolSettingsHistory>(`/api/school-settings/history?${new URLSearchParams({ page: String(page), pageSize: "10" })}`),
  },
  adminRoles: {
    list: () => clientRequest<AdminRoleCatalog>("/api/admin-roles"),
    accounts: (search = "", page = 1) => clientRequest<AdminRoleAccounts>(`/api/admin-roles/accounts?${new URLSearchParams({ search, page: String(page), pageSize: "25" })}`),
    create: (name: string, permissions: string[]) => clientRequest<AdminPermissionRole>("/api/admin-roles", { method: "POST", body: JSON.stringify({ name, permissions }) }),
    update: (role: AdminPermissionRole) => clientRequest<AdminPermissionRole>(`/api/admin-roles/${encodeURIComponent(role.id)}`, { method: "PATCH", body: JSON.stringify({ name: role.name, permissions: role.permissions, version: role.version }) }),
    assign: (account: AdminRoleAccount, roleId: string | null) => clientRequest<{ userId: string; roleId: string | null; changed: boolean }>(`/api/admin-roles/accounts/${encodeURIComponent(account.id)}`, { method: "PATCH", body: JSON.stringify({ roleId, previousRoleId: account.roleId }) }),
  },
  users: {
    getLoginPermissions: (search = "", page = 1) =>
      clientRequest<LoginPermissionPage>(`/api/users/login-permissions?${new URLSearchParams({ search, page: String(page), pageSize: "25" })}`),
    updateLoginPermission: (id: string, loginEnabled: boolean) =>
      clientRequest<{ id: string; loginEnabled: boolean; changed: boolean }>(`/api/users/${encodeURIComponent(id)}/login-permission`, {
        method: "PATCH", body: JSON.stringify({ loginEnabled }),
      }),
    getAll: async (): Promise<UserAccount[]> => {
      return clientRequest<UserAccount[]>("/api/users", {
        method: "GET",
      });
    },

    create: async (data: {
      name: string;
      email: string;
      password: string;
      role?: string;
    }): Promise<{ message: string; user: UserAccount }> => {
      return clientRequest<{ message: string; user: UserAccount }>("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    updateRole: async (
      id: string,
      role: "admin" | "instructor" | "student" | string
    ): Promise<{ message: string; user: UserAccount }> => {
      return clientRequest<{ message: string; user: UserAccount }>(
        `/api/users/${id}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ role }),
        }
      );
    },
  },

  // --- Courses Module ---
  courses: {
    getAll: async (): Promise<CourseItem[]> => {
      return clientRequest<CourseItem[]>("/api/courses", {
        method: "GET",
      });
    },

    getMine: async (): Promise<CourseItem[]> => {
      return clientRequest<CourseItem[]>("/api/courses?mine=true", {
        method: "GET",
      });
    },

    getById: async (id: string): Promise<CourseItem> => {
      return clientRequest<CourseItem>(`/api/courses/${id}`, {
        method: "GET",
      });
    },

    create: async (data: {
      title: string;
      description?: string;
    }): Promise<CourseItem> => {
      return clientRequest<CourseItem>("/api/courses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: string,
      data: { title?: string; description?: string }
    ): Promise<CourseItem> => {
      return clientRequest<CourseItem>(`/api/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    publish: async (id: string): Promise<CourseItem> => {
      return clientRequest<CourseItem>(`/api/courses/${id}/publish`, {
        method: "PATCH",
      });
    },

    unpublish: async (id: string): Promise<CourseItem> => {
      return clientRequest<CourseItem>(`/api/courses/${id}/unpublish`, {
        method: "PATCH",
      });
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      return clientRequest<{ success: boolean }>(`/api/courses/${id}`, {
        method: "DELETE",
      });
    },
  },

  // ==========================================
  // MODULES PENDING BACKEND IMPLEMENTATION
  // (Preserved mock data with non-destructive fallback)
  // ==========================================

  // --- Student Information Module ---
  students: {
    getAll: async () => {
      await delay(600);
      return [
        {
          id: 1,
          admissionNo: "SIS-23-001",
          name: "Mohammad Ali",
          fatherName: "Faizan Ali",
          dob: "2010-05-15",
          className: "Class 10-A",
          gender: "Male",
          category: "General",
        },
        {
          id: 2,
          admissionNo: "SIS-23-042",
          name: "Fatima Zehra",
          fatherName: "Syed Abbas",
          dob: "2011-02-28",
          className: "Class 10-A",
          gender: "Female",
          category: "Scholarship",
        },
      ];
    },
    create: async (data: Record<string, unknown>) => {
      await delay(1000);
      return { success: true, data: { id: Math.random(), ...data } };
    },
    delete: async (id: number | string) => {
      await delay(500);
      return { success: true };
    },
  },

  categories: {
    getAll: async () => {
      await delay(400);
      return [
        { id: 1, name: "General", grade: "All", section: "All" },
        { id: 2, name: "Scholarship", grade: "All", section: "All" },
      ];
    },
    create: async (name: string) => {
      await delay(700);
      return { id: Math.random(), name, grade: "All", section: "All" };
    },
  },

  // --- Fees Module ---
  fees: {
    getCollection: async () => {
      await delay(800);
      return [
        {
          id: 1,
          invoiceId: "INV-1001",
          studentName: "Mohammad Ali",
          amount: "5,000",
          date: "2023-10-01",
          status: "Paid",
        },
        {
          id: 2,
          invoiceId: "INV-1002",
          studentName: "Fatima Zehra",
          amount: "4,500",
          date: "2023-10-02",
          status: "Unpaid",
        },
      ];
    },
    getTypes: async () => {
      await delay(400);
      return [
        { id: 1, name: "Tuition Fee", code: "TFE", amount: "4,000" },
        { id: 2, name: "Library Fee", code: "LIB", amount: "500" },
      ];
    },
    getFeeGroups: async () => {
      await delay(300);
      return [
        {
          id: 1,
          group: "General Fees",
          description: "Standard fees applicable to all students.",
        },
        {
          id: 2,
          group: "Academic Fees",
          description: "Fees related to course materials and labs.",
        },
      ];
    },
    getFeeCarryForward: async () => {
      await delay(600);
      return [
        {
          id: 1,
          name: "Marcus Aurelius",
          admissionNo: "ADM001",
          prevBalance: "1200",
          carryAmount: "1200",
          status: "Unprocessed",
        },
        {
          id: 2,
          name: "Seneca Minor",
          admissionNo: "ADM042",
          prevBalance: "450",
          carryAmount: "450",
          status: "Forwarded",
        },
      ];
    },
  },

  // --- HR (Human Resource) Module ---
  hr: {
    getStaff: () => clientRequest<Staff[]>("/api/hr/staff"),
    getStaffById: (id: string) =>
      clientRequest<Staff>(`/api/hr/staff/${encodeURIComponent(id)}`),
    getStaffOptions: (role?: string) =>
      clientRequest<StaffOption[]>(
        `/api/hr/staff/options${role ? `?role=${encodeURIComponent(role)}` : ""}`,
      ),
    getDepartments: () => clientRequest<Department[]>("/api/hr/departments"),
    createDepartment: (data: DepartmentInput) =>
      clientRequest<Department>("/api/hr/departments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateDepartment: (id: string, data: Partial<DepartmentInput>) =>
      clientRequest<Department>(`/api/hr/departments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteDepartment: (id: string) =>
      clientRequest<{ success: boolean }>(
        `/api/hr/departments/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
    getDesignations: () => clientRequest<Designation[]>("/api/hr/designations"),
    createDesignation: (data: { name: string }) =>
      clientRequest<Designation>("/api/hr/designations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateDesignation: (id: string, data: { name: string }) =>
      clientRequest<Designation>(`/api/hr/designations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteDesignation: (id: string) =>
      clientRequest<{ success: boolean }>(
        `/api/hr/designations/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
    getRoles: () => clientRequest<string[]>("/api/hr/staff/roles"),
    createStaff: (data: StaffInput) =>
      clientRequest<Staff>("/api/hr/staff", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStaff: (id: string, data: Partial<StaffInput>) =>
      clientRequest<Staff>(`/api/hr/staff/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteStaff: (id: string) =>
      clientRequest<{ success: boolean }>(`/api/hr/staff/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    getAttendance: async (date: string) => {
      await delay(500);
      return [
        { id: 1, name: "Zia Khan", status: "Present" },
        { id: 2, name: "Sara Ahmed", status: "Absent" },
      ];
    },
    getPayroll: async () => {
      await delay(600);
      return [
        {
          id: 1,
          staffName: "Marcus Aurelius",
          role: "Lead Teacher",
          department: "Academic",
          month: "December",
          year: "2023",
          grossSalary: "4500",
          netSalary: "4200",
          status: "Paid",
        },
        {
          id: 2,
          staffName: "Seneca Minor",
          role: "Accountant",
          department: "Finance",
          month: "December",
          year: "2023",
          grossSalary: "3800",
          netSalary: "3500",
          status: "Generated",
        },
        {
          id: 3,
          staffName: "Epictetus Slave",
          role: "Librarian",
          department: "Library",
          month: "December",
          year: "2023",
          grossSalary: "3200",
          netSalary: "3000",
          status: "Processing",
        },
      ];
    },
  },

  // --- Academics Module ---
  academics: {
    getClasses: async () => {
      await delay(400);
      return ["Class 9", "Class 10", "Class 11", "Class 12"];
    },
    getSections: async () => {
      await delay(300);
      return ["A", "B", "C", "D"];
    },
    getSubjects: (): Promise<SchoolSubject[]> => apiService.schoolSubjects.getAll(),
    getClassRooms: (): Promise<Classroom[]> => apiService.classrooms.getAll(),
    getSubjectAssignments: (): Promise<SubjectAssignment[]> => apiService.subjectAssignments.getAll(),
    getRoutines: (): Promise<ClassRoutine[]> => apiService.classRoutines.getAll(),
  },

  // --- Library Module ---
  library: {
    getBooks: async () => {
      await delay(700);
      return [
        {
          id: 1,
          title: "Modern Physics",
          author: "H.C. Verma",
          isbn: "123-456",
          category: "Science",
          quantity: 10,
        },
        {
          id: 2,
          title: "Pure Mathematics",
          author: "P.K. Jain",
          isbn: "789-012",
          category: "Math",
          quantity: 5,
        },
      ];
    },
  },

  // --- Accounts & Inventory Module ---
  accounts: {
    getChartOfAccounts: async () => {
      await delay(600);
      return [
        {
          id: 1,
          code: "1000",
          name: "Assets",
          type: "Asset",
          balance: "500,000",
        },
        {
          id: 2,
          code: "2000",
          name: "Liabilities",
          type: "Liability",
          balance: "150,000",
        },
        {
          id: 3,
          code: "3000",
          name: "Equity",
          type: "Equity",
          balance: "350,000",
        },
        {
          id: 4,
          code: "4000",
          name: "Income",
          type: "Income",
          balance: "75,000",
        },
        {
          id: 5,
          code: "5000",
          name: "Expenses",
          type: "Expense",
          balance: "45,000",
        },
      ];
    },
    getInventory: async () => {
      await delay(800);
      return [
        {
          id: 1,
          item: "Whiteboard Markers",
          category: "Stationery",
          qty: 45,
          unit: "Pcs",
        },
        {
          id: 2,
          item: "A4 Printing Paper",
          category: "Stationery",
          qty: 12,
          unit: "Reams",
        },
      ];
    },
  },

  // --- Examination Module ---
  examination: {
    getMarksRegister: async (examId?: string, classId?: string) => {
      await delay(900);
      return [
        {
          id: 1,
          admissionNo: "ADM-2023-001",
          rollNo: "10",
          name: "Avery Sterling",
          marks: 85,
          remarks: "Excellent",
          isPresent: true,
        },
        {
          id: 2,
          admissionNo: "ADM-2023-042",
          rollNo: "15",
          name: "Elara Vance",
          marks: 42,
          remarks: "Medical issue",
          isPresent: true,
        },
      ];
    },
    getSchedules: async () => {
      await delay(700);
      return [
        {
          id: 1,
          title: "Final Term 2023",
          startDate: "2023-12-10",
          status: "Upcoming",
        },
        {
          id: 2,
          title: "Mid Term 2023",
          startDate: "2023-06-15",
          status: "Completed",
        },
      ];
    },
  },
};
