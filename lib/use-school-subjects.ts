"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiService, type SchoolSubject, type SchoolSubjectInput } from "./api-service";

const emptyForm: SchoolSubjectInput = { name: "", code: "", type: "Theory" };

export function useSchoolSubjects() {
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [form, setForm] = useState<SchoolSubjectInput>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try { setSubjects(await apiService.schoolSubjects.getAll()); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load subjects"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    apiService.schoolSubjects.getAll()
      .then(data => { if (active) setSubjects(data); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load subjects"); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const reset = () => { setForm({ ...emptyForm }); setEditingId(null); setError(""); };
  const edit = (subject: SchoolSubject) => {
    if (busy.current) return;
    setEditingId(subject.id);
    setForm({ name: subject.name, code: subject.code ?? "", type: subject.type });
    setError("");
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || isLoading) return;
    busy.current = true;
    setIsSubmitting(true);
    setError("");
    try {
      const saved = editingId
        ? await apiService.schoolSubjects.update(editingId, form)
        : await apiService.schoolSubjects.create(form);
      setSubjects(current => [...current.filter(item => item.id !== saved.id), saved]
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)));
      reset();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save subject"); }
    finally { busy.current = false; setIsSubmitting(false); }
  };
  const remove = async (id: string) => {
    if (busy.current || isLoading) return;
    busy.current = true;
    setIsSubmitting(true);
    setError("");
    try {
      await apiService.schoolSubjects.delete(id);
      setSubjects(current => current.filter(item => item.id !== id));
      if (editingId === id) reset();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete subject"); }
    finally { busy.current = false; setIsSubmitting(false); }
  };
  return { subjects, form, setForm, editingId, isLoading, isSubmitting, error, reload, reset, edit, submit, remove };
}
