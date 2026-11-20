"use client";

import React from "react";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Label } from "@/components/ui/label";
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
  FaBook,
  FaChalkboardTeacher,
  FaLayerGroup,
} from "react-icons/fa";

interface AssignSubjectFormProps {
  selectedSubject: string;
  setSelectedSubject: (val: string) => void;
  selectedSection: string;
  setSelectedSection: (val: string) => void;
  selectedTeacher: string;
  setSelectedTeacher: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  subjects: { id: string; name: string }[];
  sections: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  disabled?: boolean;
  editing?: boolean;
  onCancel?: () => void;
}

export function AssignSubjectForm({
  selectedSubject,
  setSelectedSubject,
  selectedSection,
  setSelectedSection,
  selectedTeacher,
  setSelectedTeacher,
  handleSubmit,
  subjects,
  sections,
  teachers,
  disabled,
  editing,
  onCancel,
}: AssignSubjectFormProps) {
  return (
    <AdminCard className="p-4 md:p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-500 flex items-center gap-2">
          {editing ? "Edit Assignment" : "Assign Subject"}
          <div className="h-1 w-12 bg-sidebar/20 rounded-full"></div>
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        <div className="space-y-4">
          {/* Subject Selection */}
          <div className="space-y-2">
            <Label className="text-[10px] text-gray-500 font-bold">
              Subject <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaBook
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                size={14}
              />
              <Select
                disabled={disabled}
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger aria-label="Subject" className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all py-6 font-medium">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section Selection */}
          <div className="space-y-2">
            <Label className="text-[10px] text-gray-500 font-bold">
              Class / Section <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaLayerGroup
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                size={14}
              />
              <Select
                disabled={disabled}
                value={selectedSection}
                onValueChange={setSelectedSection}
              >
                <SelectTrigger aria-label="Class / Section" className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all py-6 font-medium">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id}>
                      {sec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label className="text-[10px] text-gray-500 font-bold">
              Teacher <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaChalkboardTeacher
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                size={14}
              />
              <Select
                disabled={disabled}
                value={selectedTeacher}
                onValueChange={setSelectedTeacher}
              >
                <SelectTrigger aria-label="Teacher" className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all py-6 font-medium">
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={disabled || !selectedSubject || !selectedSection || !selectedTeacher}
            className="w-full py-6 text-xs font-semibold tracking-[0.2em] bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <FaCheck className="" />
              {editing ? "Save Changes" : "Assign Subject"}
            </div>
          </Button>
          {editing && <Button type="button" variant="outline" disabled={disabled} onClick={onCancel} className="mt-2 w-full">Cancel</Button>}
        </div>
      </form>
    </AdminCard>
  );
}
