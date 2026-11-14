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
  async function action(task: () => Promise<void>) {
    if (busy.current || !ready) return false;
    busy.current = true; setSaving(true); setError(""); setNotice("");
    try { await task(); return true; }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to save records"); return false; }
    finally { busy.current = false; setSaving(false); }
  }
  function saveProfile() {
    return action(async () => {
      if (student) { const result = await schoolRecordsApi.updateStudent(student.id, { ...input, active, version: student.version }); setStudent(result.student); setActive(result.student.active); }
      else {
        if (!enrollment.classSectionId || !enrollment.rollNo || !enrollment.startDate || !enrollment.endDate) throw new Error("Choose a placement, explicit roll number and enrollment dates in Academic.");
        const result = await schoolRecordsApi.createStudent({ ...input, enrollment, ...(guardian.name.trim() ? { guardian } : {}) });
        setStudent(result.student);
        if (result.guardian) { setGuardians([result.guardian]); setGuardianRecord(result.guardian); }
        if (result.enrollment) setEnrollments([result.enrollment]);
        setEnrollment({ ...blankEnrollment });
      }
      setNotice("Student profile saved.");
    });
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
