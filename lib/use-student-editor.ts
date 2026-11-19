"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { schoolRecordsApi, type StudentInput, type StudentRecord, type SchoolOptions, type GuardianInput, type GuardianRecord, type EnrollmentInput, type EnrollmentRecord } from "./school-records-client";
const blankProfile: StudentInput = { admissionNo: "", firstName: "", lastName: "", birthDate: "", gender: "", email: null, phone: null, address: null, medicalNotes: null, categoryId: null, groupId: null };
const blankGuardian: GuardianInput = { name: "", relationship: "", email: null, phone: null, address: null, isPrimary: true };
const blankEnrollment: EnrollmentInput = { classSectionId: "", rollNo: "", startDate: "", endDate: "" };
export function useStudentEditor(studentId?: string) {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [input, setInput] = useState<StudentInput>({ ...blankProfile });
  const [active, setActive] = useState(true);
  const [options, setOptions] = useState<SchoolOptions>({ placements: [], categories: [], groups: [], today: null });
  const [guardian, setGuardian] = useState<GuardianInput>({ ...blankGuardian });
  const [guardianRecord, setGuardianRecord] = useState<GuardianRecord | null>(null);
  const [guardians, setGuardians] = useState<GuardianRecord[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentInput>({ ...blankEnrollment });
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = useRef(false), sequence = useRef(0);
  const load = useCallback(async () => {
    if (busy.current) return;
    const token = ++sequence.current;
    setLoading(true); setReady(false); setError("");
    try {
      const [metadata, detail] = await Promise.all([schoolRecordsApi.options(), studentId ? schoolRecordsApi.student(studentId) : Promise.resolve(null)]);
      if (token !== sequence.current) return;
      setOptions(metadata);
      if (detail) {
        setStudent(detail.student);
        setActive(detail.student.active);
        const { admissionNo, firstName, lastName, birthDate, gender, email, phone, address, medicalNotes, categoryId, groupId } = detail.student;
        setInput({ admissionNo, firstName, lastName, birthDate, gender, email, phone, address, medicalNotes, categoryId, groupId });
        setGuardians(detail.guardians); setEnrollments(detail.enrollments);
      }
      setReady(true);
    } catch (err) { if (token === sequence.current) setError(err instanceof Error ? err.message : "Unable to load student records"); }
    finally { if (token === sequence.current) setLoading(false); }
  }, [studentId]);
  const invalidate = useCallback(() => { ++sequence.current; }, []);
  useEffect(() => { let active = true; void Promise.resolve().then(() => { if (active) return load(); }); return () => { active = false; invalidate(); }; }, [load, invalidate]);
  async function action(task: () => Promise<void>, onTabRedirect?: (tab: string) => void) {
    if (busy.current || !ready) return false;
    busy.current = true; setSaving(true); setError(""); setNotice("");
    try { await task(); return true; }
    catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save records";
      setError(message);
      if (onTabRedirect) {
        const lower = message.toLowerCase();
        if (lower.includes("personal") || lower.includes("first name") || lower.includes("last name") || lower.includes("birth date") || lower.includes("gender")) {
          onTabRedirect("personal");
        } else if (lower.includes("placement") || lower.includes("academic") || lower.includes("admission") || lower.includes("roll") || lower.includes("enrollment")) {
          onTabRedirect("academic");
        } else if (lower.includes("guardian")) {
          onTabRedirect("guardian");
        }
      }
      return false;
    }
    finally { busy.current = false; setSaving(false); }
  }
  function saveProfile(onTabRedirect?: (tab: string) => void) {
    return action(async () => {
      if (student) {
        if (!input.firstName?.trim()) {
          onTabRedirect?.("personal");
          throw new Error("Legal First Name is required (Personal Details tab).");
        }
        if (!input.lastName?.trim()) {
          onTabRedirect?.("personal");
          throw new Error("Legal Last Name is required (Personal Details tab).");
        }
        if (!input.birthDate) {
          onTabRedirect?.("personal");
          throw new Error("Birth Date is required (Personal Details tab).");
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) {
          onTabRedirect?.("personal");
          throw new Error("Birth Date must be in YYYY-MM-DD format (Personal Details tab).");
        }
        if (input.birthDate > new Date().toISOString().slice(0, 10)) {
          onTabRedirect?.("personal");
          throw new Error("Birth Date cannot be in the future (Personal Details tab).");
        }
        if (!input.gender || !["male", "female", "other"].includes(input.gender)) {
          onTabRedirect?.("personal");
          throw new Error("Please select gender: male, female, or other (Personal Details tab).");
        }
        const result = await schoolRecordsApi.updateStudent(student.id, { ...input, active, version: student.version });
        setStudent(result.student);
        setActive(result.student.active);
      } else {
        if (!enrollment.classSectionId || !enrollment.rollNo?.trim() || !enrollment.startDate || !enrollment.endDate) {
          onTabRedirect?.("academic");
          throw new Error("Choose a placement, explicit roll number and enrollment dates in Academic.");
        }
        if (!input.admissionNo?.trim()) {
          onTabRedirect?.("academic");
          throw new Error("Admission Number is required in Institutional Placement.");
        }
        if (enrollment.endDate < enrollment.startDate) {
          onTabRedirect?.("academic");
          throw new Error("Enrollment End Date cannot be earlier than Start Date.");
        }
        if (!input.firstName?.trim()) {
          onTabRedirect?.("personal");
          throw new Error("Legal First Name is required (Personal Details tab).");
        }
        if (!input.lastName?.trim()) {
          onTabRedirect?.("personal");
          throw new Error("Legal Last Name is required (Personal Details tab).");
        }
        if (!input.birthDate) {
          onTabRedirect?.("personal");
          throw new Error("Birth Date is required (Personal Details tab).");
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) {
          onTabRedirect?.("personal");
          throw new Error("Birth Date must be in YYYY-MM-DD format (Personal Details tab).");
        }
        if (input.birthDate > new Date().toISOString().slice(0, 10)) {
          onTabRedirect?.("personal");
          throw new Error("Birth Date cannot be in the future (Personal Details tab).");
        }
        if (enrollment.startDate < input.birthDate) {
          onTabRedirect?.("academic");
          throw new Error("Enrollment start date cannot precede student birth date.");
        }
        if (!input.gender || !["male", "female", "other"].includes(input.gender)) {
          onTabRedirect?.("personal");
          throw new Error("Please select gender: male, female, or other (Personal Details tab).");
        }
        if (guardian.name?.trim() && !guardian.relationship?.trim()) {
          onTabRedirect?.("guardian");
          throw new Error("Guardian Relationship is required when Guardian Name is provided.");
        }
        const result = await schoolRecordsApi.createStudent({ ...input, enrollment, ...(guardian.name.trim() ? { guardian } : {}) });
        setStudent(result.student);
        if (result.guardian) { setGuardians([result.guardian]); setGuardianRecord(result.guardian); }
        if (result.enrollment) setEnrollments([result.enrollment]);
        setEnrollment({ ...blankEnrollment });
      }
      setNotice("Student profile saved.");
    }, onTabRedirect);
  }
  function selectGuardian(record: GuardianRecord | null) {
    setGuardianRecord(record);
    setGuardian(record ? { name: record.name, relationship: record.relationship, phone: record.phone, email: record.email, address: record.address, isPrimary: record.isPrimary } : { ...blankGuardian, isPrimary: !guardians.some(item => item.isPrimary) });
  }
  function saveGuardian() {
    return action(async () => {
      if (!student) throw new Error("Save the student first, or include the first guardian during admission.");
      const saved = await schoolRecordsApi.guardian(student.id, { ...guardian, ...(guardianRecord ? { version: guardianRecord.version } : {}) }, guardianRecord?.id);
      setGuardians(previous => [...previous.filter(item => item.id !== saved.id), saved]); setGuardianRecord(saved); setNotice("Guardian saved.");
    });
  }
  function enroll() {
    return action(async () => {
      if (!student) throw new Error("Save the student before adding another enrollment.");
      const saved = await schoolRecordsApi.enroll(student.id, enrollment);
      setEnrollments(previous => [saved, ...previous]); setEnrollment({ ...blankEnrollment }); setNotice("Enrollment saved. Previous placements remain in history.");
    });
  }
  function endEnrollment(record: EnrollmentRecord, endDate: string) {
    return action(async () => {
      if (!student) return;
      const saved = await schoolRecordsApi.endEnrollment(student.id, record.id, endDate, record.version);
      setEnrollments(previous => previous.map(item => item.id === record.id ? { ...item, ...saved.enrollment } : item)); setNotice("Enrollment end date saved.");
    });
  }
  function selectPlacement(id: string) {
    const placement = options.placements.find(item => item.id === id);
    setEnrollment(previous => ({ ...previous, classSectionId: id, startDate: placement?.startDate ?? "", endDate: placement?.endDate ?? "" }));
  }
  return { student, input, setInput, active, setActive, options, guardian, setGuardian, guardianRecord, guardians, selectGuardian, enrollment, setEnrollment, enrollments, loading, ready, saving, error, notice, load, saveProfile, saveGuardian, enroll, endEnrollment, selectPlacement };
}
