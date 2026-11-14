"use client";
import { useState } from "react";
import Link from "next/link";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudentEditor } from "@/lib/use-student-editor";
import { FileAttachmentPanel } from "@/components/modules/study-material/FileAttachmentPanel";

const segments = ["academic", "personal", "contact", "medical", "family", "guardian", "extended"];
export function StudentEditorPanel({ studentId }: { studentId?: string }) {
  const state = useStudentEditor(studentId);
  const [segment, setSegment] = useState("academic");
  const [endDates, setEndDates] = useState<Record<string, string>>({});
  function text(field: "admissionNo" | "firstName" | "lastName" | "birthDate" | "email" | "phone" | "address" | "medicalNotes", label: string, type = "text", maxLength?: number) {
    return <div className="space-y-2"><Label htmlFor={`student-${field}`} className="text-[10px] font-semibold text-gray-500 ml-2">{label}</Label><Input id={`student-${field}`} type={type} value={state.input[field] ?? ""} maxLength={maxLength} onChange={event => state.setInput({ ...state.input, [field]: event.target.value })} className="w-full bg-white border-gray-200 py-6 text-xs font-bold" /></div>;
  }
  const selectClass = "w-full rounded-xl border border-gray-200 bg-white h-12 px-3 text-xs font-bold";
  return <div className="pb-8 space-y-6">
    {state.error && <div role="alert" className="rounded-xl border border-red-200 p-4 text-destructive">{state.error} <Button type="button" variant="outline" disabled={state.saving} onClick={() => void state.load()}>Reload</Button></div>}
    {state.notice && <p role="status" className="text-green-700">{state.notice}</p>}
    <AdminCard className="p-1.5 flex flex-wrap gap-1">{segments.map(item => <button key={item} type="button" onClick={() => setSegment(item)} className={`px-5 py-2.5 rounded-xl text-[10px] font-semibold capitalize ${segment === item ? "bg-secondary text-white shadow-md" : "text-gray-500 hover:bg-secondary/10"}`}>{item}</button>)}</AdminCard>
    <form onSubmit={event => { event.preventDefault(); void state.saveProfile(); }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <fieldset disabled={!state.ready || state.saving} className="lg:col-span-8 space-y-8 min-w-0"><AdminCard className="p-8 space-y-6">
        <h2 className="text-xs font-semibold text-gray-500 capitalize">{segment === "academic" ? "Institutional Placement" : segment === "personal" ? "Persona Details" : segment}</h2>
        {segment === "extended" && state.student && <label className="flex gap-2 text-sm"><input type="checkbox" checked={state.active} onChange={event => state.setActive(event.target.checked)} />Student active (saved with profile)</label>}
        {segment === "academic" && <>
          <div className="grid md:grid-cols-2 gap-6"><div className="space-y-2"><Label htmlFor="student-placement">Academic Year / Class / Section</Label><select id="student-placement" className={selectClass} value={state.enrollment.classSectionId} onChange={event => state.selectPlacement(event.target.value)}><option value="">Select an existing placement</option>{state.options.placements.map(item => <option key={item.id} value={item.id}>{item.yearName} · {item.className} · {item.sectionName}</option>)}</select></div>{text("admissionNo", "Admission No. *", "text", 50)}
            <div className="space-y-2"><Label htmlFor="student-roll">Roll No. *</Label><Input id="student-roll" value={state.enrollment.rollNo} maxLength={30} onChange={event => state.setEnrollment({ ...state.enrollment, rollNo: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="student-start">Enrollment Start *</Label><Input id="student-start" type="date" value={state.enrollment.startDate} onChange={event => state.setEnrollment({ ...state.enrollment, startDate: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="student-end">Enrollment End *</Label><Input id="student-end" type="date" value={state.enrollment.endDate} onChange={event => state.setEnrollment({ ...state.enrollment, endDate: event.target.value })} /></div>
          </div>
          {state.student && <Button type="button" onClick={() => void state.enroll()}>Add Enrollment / Promotion</Button>}
          {state.enrollments.map(record => <div key={record.id} className="rounded-xl border border-gray-200 p-4 space-y-3"><p className="font-semibold text-sm">{record.yearName ?? "Enrollment"} · {record.className ?? ""} {record.sectionName ?? ""} · Roll {record.rollNo}</p><p className="text-sm">{record.startDate} to {record.endDate}</p><div className="flex gap-3"><Input aria-label={`End date for roll ${record.rollNo}`} type="date" min={record.startDate} max={record.endDate} value={endDates[record.id] ?? record.endDate} onChange={event => setEndDates({ ...endDates, [record.id]: event.target.value })} /><Button type="button" variant="outline" onClick={() => void state.endEnrollment(record, endDates[record.id] ?? record.endDate)}>Shorten Period</Button></div></div>)}
        </>}
        {segment === "personal" && <div className="grid md:grid-cols-2 gap-6">{text("firstName", "Legal First Name *", "text", 100)}{text("lastName", "Legal Last Name *", "text", 100)}{text("birthDate", "Birth Date *", "date")}<div className="space-y-2"><Label htmlFor="student-gender">Gender *</Label><select id="student-gender" className={selectClass} value={state.input.gender} onChange={event => state.setInput({ ...state.input, gender: event.target.value })}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div></div>}
        {segment === "contact" && <div className="grid md:grid-cols-2 gap-6">{text("email", "Student Email", "email", 254)}{text("phone", "Phone", "tel", 32)}{text("address", "Address", "text", 500)}</div>}
        {segment === "medical" && text("medicalNotes", "Medical Notes", "text", 1000)}
        {(segment === "family" || segment === "guardian") && <>
          <Label htmlFor="guardian-select">Guardian Record</Label><select id="guardian-select" className={selectClass} value={state.guardianRecord?.id ?? ""} onChange={event => state.selectGuardian(state.guardians.find(item => item.id === event.target.value) ?? null)}><option value="">Add guardian</option>{state.guardians.map(item => <option key={item.id} value={item.id}>{item.name} · {item.relationship}{item.isPrimary ? " · Primary" : ""}</option>)}</select>
          <div className="grid md:grid-cols-2 gap-6">{([['name','Name',120],['relationship','Relationship',50],['email','Email',254],['phone','Phone',32],['address','Address',500]] as const).map(([key,label,maxLength]) => <div key={key} className="space-y-2"><Label htmlFor={`guardian-${key}`}>{label}</Label><Input id={`guardian-${key}`} type={key === "email" ? "email" : "text"} value={state.guardian[key] ?? ""} maxLength={maxLength} onChange={event => state.setGuardian({ ...state.guardian, [key]: event.target.value })} /></div>)}</div>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={state.guardian.isPrimary} onChange={event => state.setGuardian({ ...state.guardian, isPrimary: event.target.checked })} />Primary contact</label>
          {state.student ? <Button type="button" onClick={() => void state.saveGuardian()}>Save Guardian</Button> : <p className="text-sm text-gray-500">The first guardian is saved with the student admission.</p>}
          <p className="text-xs text-gray-500">To change the primary contact, save the current guardian with Primary contact unchecked, then select the new primary guardian.</p>
        </>}
        {segment === "extended" && <div className="grid md:grid-cols-2 gap-6">{([['categoryId','Category',state.options.categories],['groupId','Group',state.options.groups]] as const).map(([key,label,items]) => <div key={key} className="space-y-2"><Label htmlFor={`student-${key}`}>{label}</Label><select id={`student-${key}`} className={selectClass} value={state.input[key] ?? ""} onChange={event => state.setInput({ ...state.input, [key]: event.target.value || null })}><option value="">None</option>{state.input[key] && !items.some(item => item.id === state.input[key]) && <option value={state.input[key]!}>Existing archived {label.toLowerCase()}</option>}{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>)}</div>}
      </AdminCard></fieldset>
      <div className="lg:col-span-4 space-y-8"><AdminCard className="bg-secondary text-white p-8 border-0 space-y-6"><h2 className="text-[10px] font-semibold tracking-[0.4em] opacity-70">Registration Status</h2><p className="text-2xl font-semibold">{state.loading ? "Loading…" : state.student ? "Profile Saved" : "Profile Not Finalized"}</p>{state.student && <p className="text-sm">{state.student.admissionNo}</p>}<p className="text-xs capitalize">{segment}</p><Button type="submit" disabled={!state.ready || state.saving} className="w-full bg-white text-secondary hover:bg-white/90 py-6 rounded-2xl">{state.saving ? "Saving…" : state.student ? "Save Profile" : "Commit Archive"}</Button><Link href="/admin/student-info/list" className="block text-sm underline">Student Directory</Link></AdminCard><AdminCard className="p-8 space-y-6"><h2 className="text-xs font-semibold text-gray-500">Portrait and Documents</h2>{state.student?<FileAttachmentPanel studentId={state.student.id} disabled={state.saving}/>:<p className="text-sm text-gray-500">Save the student profile before adding attachments.</p>}</AdminCard></div>
    </form>
  </div>;
}
