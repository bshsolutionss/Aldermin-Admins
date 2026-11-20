"use client";

import React from "react";
import { type RoutineAllocation, type Classroom } from "@/lib/api-service";
import { routineDays, type RoutineFormData } from "@/lib/use-class-routines";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  FaCheck,
  FaCalendarDay,
  FaBookOpen,
  FaUserTie,
  FaDoorClosed,
} from "react-icons/fa";

interface RoutineFormProps {
  formData: RoutineFormData;
  change: (field: keyof RoutineFormData, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  classes: { id: string; name: string }[];
  sections: { id: string; name: string }[];
  subjects: RoutineAllocation[];
  classrooms: Classroom[];
  selectedAllocation?: RoutineAllocation;
  disabled?: boolean;
  editing?: boolean;
  onCancel?: () => void;
}

export function RoutineForm({
  formData,
  change,
  handleSubmit,
  classes, sections, subjects, classrooms, selectedAllocation, disabled, editing, onCancel,
}: RoutineFormProps) {
  const handleChange = change;

  return (
    <AdminCard className="p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-500   flex items-center gap-2">
          {editing ? "Edit Routine Entry" : "Add Routine Entry"}
          <div className="h-1 w-12 bg-sidebar/20 rounded-full"></div>
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        {/* Class & Section Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className=" text-[10px]  text-gray-500 font-bold">
              Class <span className="text-red-500">*</span>
            </Label>
            <Select
              disabled={disabled}
              value={formData.class}
              onValueChange={(val) => handleChange("class", val)}
            >
              <SelectTrigger aria-label="Class" className="bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className=" text-[10px]  text-gray-500 font-bold">
              Section <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.section}
              disabled={disabled || !formData.class}
              onValueChange={(val) => handleChange("section", val)}
            >
              <SelectTrigger aria-label="Section" className="bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Day */}
        <div className="space-y-2">
          <Label className=" text-[10px]  text-gray-500 font-bold">
            Day <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <FaCalendarDay
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
              size={14}
            />
            <Select
              value={formData.day}
              disabled={disabled}
              onValueChange={(val) => handleChange("day", val)}
            >
              <SelectTrigger aria-label="Day" className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium">
                <SelectValue placeholder="Select Day" />
              </SelectTrigger>
              <SelectContent>
                {routineDays.map((day, index) => <SelectItem key={day} value={String(index + 1)}>{day}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className=" text-[10px]  text-gray-500 font-bold">
              Start Time
            </Label>
            <Input aria-label="Start Time"
              type="time"
              required
              disabled={disabled}
              value={formData.startTime}
              onChange={(e) => handleChange("startTime", e.target.value)}
              className="bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className=" text-[10px]  text-gray-500 font-bold">
              End Time
            </Label>
            <Input aria-label="End Time"
              type="time"
              value={formData.endTime}
              required
              disabled={disabled}
              onChange={(e) => handleChange("endTime", e.target.value)}
              className="bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label className=" text-[10px]  text-gray-500 font-bold">
            Subject <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <FaBookOpen
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
              size={14}
            />
            <Select
              value={formData.subject}
              disabled={disabled || !formData.section}
              onValueChange={(val) => handleChange("subject", val)}
            >
              <SelectTrigger aria-label="Subject" className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.subjectName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Teacher */}
        <div className="space-y-2">
          <Label className=" text-[10px]  text-gray-500 font-bold">
            Teacher <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <FaUserTie
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
              size={14}
            />
            <Select
              value={formData.teacher}
              disabled
              onValueChange={(val) => handleChange("teacher", val)}
            >
              <SelectTrigger aria-label="Teacher" className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium">
                <SelectValue placeholder="Select Teacher" />
              </SelectTrigger>
              <SelectContent>
                {selectedAllocation && <SelectItem value={selectedAllocation.staffId}>{selectedAllocation.teacherName}</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Room */}
        <div className="space-y-2">
          <Label className=" text-[10px]  text-gray-500 font-bold">
            Room / Lab
          </Label>
          <div className="relative">
            <FaDoorClosed
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
              size={14}
            />
            <Select value={formData.room} onValueChange={val => handleChange("room", val)} disabled={disabled}>
              <SelectTrigger aria-label="Room / Lab" className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium"><SelectValue placeholder="Select Room" /></SelectTrigger>
              <SelectContent>{classrooms.map(room => <SelectItem key={room.id} value={room.id}>{room.roomNumber}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={disabled}
            className="w-full py-6 text-xs font-semibold  tracking-[0.2em] bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <FaCheck className="" />
              Save Routine
            </div>
          </Button>
          {editing && <Button type="button" variant="outline" disabled={disabled} onClick={onCancel} className="w-full mt-2">Cancel</Button>}
        </div>
      </form>
    </AdminCard>
  );
}
