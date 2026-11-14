"use client";
import { useState, useEffect, useRef } from "react";
import { apiService, type ClassRoutine, type RoutineOptions } from "./api-service";

export interface RoutineFormData { class: string; section: string; subject: string; teacher: string; room: string; day: string; startTime: string; endTime: string; }
export const routineDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const emptyForm: RoutineFormData = { class: "", section: "", subject: "", teacher: "", room: "", day: "", startTime: "", endTime: "" };
const emptyOptions: RoutineOptions = { academicYearId: null, academicYears: [], allocations: [], classrooms: [] };
async function fetchData(yearId?: string) {
  const choices = await apiService.classRoutines.getOptions(yearId);
  const rows = await apiService.classRoutines.getAll(choices.academicYearId ?? undefined);
  return { choices, rows };
}
export function useClassRoutines() {
  const [routines, setRoutines] = useState<ClassRoutine[]>([]);
  const [options, setOptions] = useState<RoutineOptions>(emptyOptions);
  const [formData, setFormData] = useState<RoutineFormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false), requestId = useRef(0);
  useEffect(() => {
    let active = true;
    const seq = ++requestId.current;
    fetchData().then(({ choices, rows }) => { if (active && seq === requestId.current) { setOptions(choices); setRoutines(rows); } })
      .catch((err: unknown) => { if (active && seq === requestId.current) setError(err instanceof Error ? err.message : "Unable to load routines"); })
      .finally(() => { if (active && seq === requestId.current) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  const reload = async (yearId = options.academicYearId ?? undefined) => {
    if (busy.current) return;
    const seq = ++requestId.current;
    setIsLoading(true); setError("");
    try {
      const { choices, rows } = await fetchData(yearId);
      if (seq === requestId.current) {
        if (choices.academicYearId !== options.academicYearId) { setFormData({ ...emptyForm }); setEditingId(null); }
        setOptions(choices); setRoutines(rows);
      }
    } catch (err) { if (seq === requestId.current) setError(err instanceof Error ? err.message : "Unable to load routines"); }
    finally { if (seq === requestId.current) setIsLoading(false); }
  };
  const reset = () => { if (!busy.current) { setFormData({ ...emptyForm }); setEditingId(null); setError(""); } };
  const change = (field: keyof RoutineFormData, value: string) => {
    setFormData(current => {
      if (field === "class") return { ...current, class: value, section: "", subject: "", teacher: "" };
      if (field === "section") return { ...current, section: value, subject: "", teacher: "" };
      if (field === "subject") return { ...current, subject: value, teacher: options.allocations.find(a => a.id === value)?.staffId ?? "" };
      return { ...current, [field]: value };
    });
  };
  const edit = (row: ClassRoutine) => {
    if (busy.current || isLoading) return;
    setEditingId(row.id); setError("");
    setFormData({ class: row.classId, section: row.classSectionId, subject: row.assignmentId, teacher: row.staffId,
      day: String(row.dayOfWeek), startTime: row.startTime, endTime: row.endTime, room: row.classroomId });
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || isLoading) return;
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;
    const allocation = options.allocations.find(a => a.id === formData.subject && a.classSectionId === formData.section && a.classId === formData.class);
    if (!allocation || !options.classrooms.some(r => r.id === formData.room) || !/^[1-7]$/.test(formData.day) || !validTime.test(formData.startTime) || !validTime.test(formData.endTime) || formData.endTime <= formData.startTime) {
      setError("Select a subject allocation, room, day, and an end time later than the start time"); return;
    }
    busy.current = true; setSaving(true); setError("");
    try {
      const payload = { assignmentId: allocation.id, classroomId: formData.room, dayOfWeek: Number(formData.day), startTime: formData.startTime, endTime: formData.endTime };
      const saved = editingId ? await apiService.classRoutines.update(editingId, payload) : await apiService.classRoutines.create(payload);
      setRoutines(rows => [...rows.filter(r => r.id !== saved.id), saved].sort((a,b) => a.class.localeCompare(b.class) || a.section.localeCompare(b.section) || a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)));
      setEditingId(null); setFormData({ ...emptyForm });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save routine"); }
    finally { busy.current = false; setSaving(false); }
  };
  const remove = async (id: string) => {
    if (busy.current || isLoading) return;
    busy.current = true; setSaving(true); setError("");
    try {
      await apiService.classRoutines.delete(id); setRoutines(rows => rows.filter(r => r.id !== id));
      if (editingId === id) { setEditingId(null); setFormData({ ...emptyForm }); }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete routine"); }
    finally { busy.current = false; setSaving(false); }
  };
  const classes = [...new Map(options.allocations.map(a => [a.classId, { id: a.classId, name: a.className }])).values()];
  const sections = [...new Map(options.allocations.filter(a => a.classId === formData.class).map(a => [a.classSectionId, { id: a.classSectionId, name: a.sectionName }])).values()];
  const subjects = options.allocations.filter(a => a.classSectionId === formData.section);
  const selectedAllocation = subjects.find(a => a.id === formData.subject);
  return { routines, options, formData, change, editingId, isLoading, saving, error, reload, reset, edit, handleSubmit, remove, classes, sections, subjects, selectedAllocation };
}
