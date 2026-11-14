"use client";

import React from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaCheck, FaBook, FaFlask, FaFileAlt } from "react-icons/fa";
import type { SchoolSubjectInput } from "@/lib/api-service";

interface SubjectFormProps {
  form: SchoolSubjectInput;
  setForm: (form: SchoolSubjectInput) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  editing?: boolean;
  onCancel?: () => void;
}

export function SubjectForm({ form, setForm, onSubmit, disabled, editing, onCancel }: SubjectFormProps) {
  const types = [
    { id: "Theory", icon: <FaFileAlt size={12} />, label: "Theory" },
    { id: "Practical", icon: <FaFlask size={12} />, label: "Practical" },
  ];

  return (
    <AdminCard className="p-8 h-full bg-gradient-to-br from-white/60 to-sidebar/5">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-500   flex items-center gap-2">
          {editing ? "Edit Subject" : "Add Subject"}
          <div className="h-1 w-12 bg-sidebar/20 rounded-full"></div>
        </h4>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 flex-1">
        <fieldset disabled={disabled} className="min-w-0 space-y-4">
          <div className="space-y-2">
            <Label className=" text-[10px]  text-gray-500 font-bold">
              Subject Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaBook
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                size={14}
              />
              <Input
                placeholder="e.g. Mathematics"
                value={form.name}
                maxLength={200}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium py-6"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className=" text-[10px]  text-gray-500 font-bold">
              Subject Code
            </Label>
            <Input
              placeholder="e.g. MATH101"
              value={form.code ?? ""}
              maxLength={50}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium py-6"
            />
          </div>

          <div className="space-y-3">
            <Label className=" text-[10px]  text-gray-500 font-bold">
              Learning Type
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {types.map((type) => (
                <div
                  key={type.id}
                  onClick={() =>
                    !disabled && setForm({
                      ...form,
                      type: type.id as "Theory" | "Practical",
                    })
                  }
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-2 group ${
                    form.type === type.id
                      ? "bg-secondary border-secondary text-white shadow-lg"
                      : "bg-white border-gray-200 text-gray-500 hover:border-secondary/50 hover:bg-white"
                  }`}
                >
                  {type.icon}
                  <span className="text-[10px] font-semibold  ">
                    {type.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </fieldset>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={disabled}
            className="w-full py-6 text-xs font-semibold  tracking-[0.2em] bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <FaCheck className="" />
              {editing ? "Update Subject" : "Save Subject"}
            </div>
          </Button>
          {editing && <button type="button" disabled={disabled} onClick={onCancel}>Cancel edit</button>}
        </div>
      </form>
    </AdminCard>
  );
}
