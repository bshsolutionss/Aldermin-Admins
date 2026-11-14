"use client";

import React from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FaCheck,
  FaGraduationCap,
  FaLayerGroup,
  FaCheckCircle,
} from "react-icons/fa";

interface ClassSectionOption {
  id: string;
  name: string;
}

interface ClassFormProps {
  className: string;
  setClassName: (val: string) => void;
  passingMarks: string;
  setPassingMarks: (val: string) => void;
  sections: ClassSectionOption[];
  selectedSections: string[];
  toggleSection: (sectionId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  editing?: boolean;
  onCancel?: () => void;
}

export function ClassForm({
  className,
  setClassName,
  passingMarks,
  setPassingMarks,
  sections,
  selectedSections,
  toggleSection,
  onSubmit,
  disabled,
  editing,
  onCancel,
}: ClassFormProps) {
  return (
    <AdminCard className="p-8 h-full bg-gradient-to-br from-white/60 to-sidebar/5">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-500   flex items-center gap-2">
          {editing ? "Edit Academic Grade" : "Add Academic Grade"}
          <div className="h-1 w-12 bg-sidebar/20 rounded-full"></div>
        </h4>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 flex-1">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class-name" className=" text-[10px]  text-gray-500 font-bold">
              Grade Designation <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaGraduationCap
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                size={14}
              />
              <Input
                id="class-name"
                placeholder="e.g. Class 10"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={disabled}
                className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium py-6"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className=" text-[10px]  text-gray-500 font-bold">
              Passing Threshold
            </Label>
            <Select value={passingMarks} onValueChange={setPassingMarks} disabled={disabled}>
              <SelectTrigger className="bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all py-6">
                <SelectValue placeholder="Select Threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="33">33 Marks</SelectItem>
                <SelectItem value="40">40 Marks</SelectItem>
                <SelectItem value="50">50 Marks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Label className="block text-[10px] font-semibold text-gray-500   mb-4">
              Constituent Units
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {sections.length === 0 && (
                <p className="text-[11px] text-gray-400 italic">
                  No sections available yet.
                </p>
              )}
              {sections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => { if (!disabled) toggleSection(section.id); }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                    selectedSections.includes(section.id)
                      ? "bg-secondary border-secondary text-white shadow-lg"
                      : "bg-white border-gray-200 text-gray-500 hover:border-secondary/50 hover:bg-white"
                  } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <FaLayerGroup
                      size={12}
                      className={
                        selectedSections.includes(section.id)
                          ? "text-white"
                          : "text-gray-500 group-hover:text-secondary"
                      }
                    />
                    <span className="text-[11px] font-semibold  ">
                      Section {section.name}
                    </span>
                  </div>
                  {selectedSections.includes(section.id) && (
                    <FaCheckCircle size={14} />
                  )}
                </div>
              ))}
            </div>
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
              {disabled ? "Saving..." : editing ? "Update Grade" : "Initialize Grade"}
            </div>
          </Button>
          {editing && (
            <Button type="button" variant="ghost" disabled={disabled} onClick={onCancel} className="w-full mt-2">
              Cancel
            </Button>
          )}
        </div>
      </form>
    </AdminCard>
  );
}
