"use client";

import React from "react";
import { AdminCard } from "@/components/common/AdminCard";
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
  FaChalkboardTeacher,
  FaUsers,
  FaLayerGroup,
} from "react-icons/fa";

interface Option {
  id: string;
  name: string;
}
interface TeacherOption extends Option {
  staffNo?: string;
}

interface AssignTeacherFormProps {
  selectedClass: string;
  setSelectedClass: (val: string) => void;
  selectedSection: string;
  setSelectedSection: (val: string) => void;
  selectedTeacher: string;
  setSelectedTeacher: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  classes: Option[];
  sections: Option[];
  teachers: TeacherOption[];
  disabled?: boolean;
  editing?: boolean;
  onCancel?: () => void;
}

export function AssignTeacherForm({
  selectedClass,
  setSelectedClass,
  selectedSection,
  setSelectedSection,
  selectedTeacher,
  setSelectedTeacher,
  handleSubmit,
  classes,
  sections,
  teachers,
  disabled,
  editing,
  onCancel,
}: AssignTeacherFormProps) {
  return (
    <AdminCard className="p-4 md:p-8 h-full bg-gradient-to-br from-white/60 to-sidebar/5">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-500 flex items-center gap-2">
          {editing ? "Edit Assignment" : "Add Assignment"}
          <div className="h-1 w-12 bg-sidebar/20 rounded-full"></div>
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        <div className="space-y-4">
          {/* Class Selection */}
          <div className="space-y-2">
            <Label className="text-[10px] text-gray-500 font-bold">
              Class <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaUsers
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                size={14}
              />
              <Select
                disabled={disabled}
                value={selectedClass}
                onValueChange={setSelectedClass}
              >
                <SelectTrigger
                  id="class-teacher-class"
                  className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all py-6 font-medium"
                >
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section Selection */}
          <div className="space-y-2">
            <Label className="text-[10px] text-gray-500 font-bold">
              Section <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaLayerGroup
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                size={14}
              />
              <Select
                disabled={disabled || !selectedClass}
                value={selectedSection}
                onValueChange={setSelectedSection}
              >
                <SelectTrigger className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all py-6 font-medium">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
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
                <SelectTrigger className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all py-6 font-medium">
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.staffNo
                        ? `${teacher.name} (${teacher.staffNo})`
                        : teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <Button
            type="submit"
            disabled={disabled || !selectedSection || !selectedTeacher}
            className="w-full py-6 text-xs font-semibold tracking-[0.2em] bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <FaCheck className="" />
              {editing ? "Update Assignment" : "Assign Teacher"}
            </div>
          </Button>
          {editing && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={disabled}
              className="w-full py-6 text-xs font-semibold"
            >
              Cancel Edit
            </Button>
          )}
        </div>
      </form>
    </AdminCard>
  );
}
