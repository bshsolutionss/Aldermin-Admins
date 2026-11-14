"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiService, type Classroom } from "./api-service";

export function useClassrooms() {
  const [rooms, setRooms] = useState<Classroom[]>([]);
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  useEffect(() => {
    let active = true;
    apiService.classrooms.getAll()
      .then(rows => { if (active) setRooms(rows); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load classrooms"); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  const reload = useCallback(async () => {
    if (busy.current) return;
    setIsLoading(true); setError("");
    try { setRooms(await apiService.classrooms.getAll()); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load classrooms"); }
    finally { setIsLoading(false); }
  }, []);
  const reset = () => {
    if (busy.current) return;
    setEditingId(null); setRoomNumber(""); setCapacity(""); setError("");
  };
  const edit = (room: Classroom) => {
    if (busy.current) return;
    setEditingId(room.id); setRoomNumber(room.roomNumber); setCapacity(String(room.capacity)); setError("");
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || isLoading) return;
    const count = Number(capacity);
    if (!roomNumber.trim() || roomNumber.trim().length > 100 || !/^\d+$/.test(capacity.trim()) || !Number.isInteger(count) || count < 1 || count > 2147483647) {
      setError("Enter a room number (up to 100 characters) and a positive whole-number capacity"); return;
    }
    busy.current = true; setSaving(true); setError("");
    try {
      const payload = { roomNumber: roomNumber.trim(), capacity: count };
      const saved = editingId ? await apiService.classrooms.update(editingId, payload) : await apiService.classrooms.create(payload);
      setRooms(current => [...current.filter(row => row.id !== saved.id), saved].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber) || a.id.localeCompare(b.id)));
      setEditingId(null); setRoomNumber(""); setCapacity("");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save classroom"); }
    finally { busy.current = false; setSaving(false); }
  };
  const remove = async (id: string) => {
    if (busy.current || isLoading) return;
    busy.current = true; setSaving(true); setError("");
    try {
      await apiService.classrooms.delete(id);
      setRooms(current => current.filter(row => row.id !== id));
      if (editingId === id) { setEditingId(null); setRoomNumber(""); setCapacity(""); }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete classroom"); }
    finally { busy.current = false; setSaving(false); }
  };
  return { rooms, roomNumber, setRoomNumber, capacity, setCapacity, editingId, isLoading, saving, error, reload, reset, edit, handleSubmit, remove };
}
