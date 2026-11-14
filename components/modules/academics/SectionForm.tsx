"use client";

import React from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaCheck, FaLayerGroup } from "react-icons/fa";

interface SectionFormProps {
  sectionName: string;
  setSectionName: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  editing?: boolean;
  onCancel?: () => void;
}

export function SectionForm({
  sectionName,
  setSectionName,
  onSubmit,
  disabled,
  editing,
  onCancel,
}: SectionFormProps) {
  return (
    <AdminCard className="p-8 h-full bg-gradient-to-br from-white/60 to-sidebar/5">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-500   flex items-center gap-2">
          {editing ? "Edit Section" : "Add Section"}
          <div className="h-1 w-12 bg-sidebar/20 rounded-full"></div>
        </h4>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 flex-1">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-name" className=" text-[10px]  text-gray-500 font-bold">
              Section Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaLayerGroup
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                size={14}
              />
              <Input
                id="section-name"
                maxLength={100}
                disabled={disabled}
                placeholder="e.g. Section Alpha"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium py-6"
                required
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            disabled={disabled}
            type="submit"
            className="w-full py-6 text-xs font-semibold  tracking-[0.2em] bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <FaCheck className="" />
              {disabled ? "Saving..." : editing ? "Update Section" : "Save Section"}
            </div>
          </Button>
          {editing && <Button type="button" variant="ghost" disabled={disabled} onClick={onCancel} className="w-full mt-2">Cancel</Button>}
        </div>
      </form>
    </AdminCard>
  );
}
