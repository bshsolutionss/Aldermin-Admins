"use client";

import React from "react";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaCheck, FaBuilding, FaUsers } from "react-icons/fa";

interface ClassRoomFormProps {
  roomNumber: string;
  setRoomNumber: (val: string) => void;
  capacity: string;
  setCapacity: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  editing?: boolean;
  onCancel?: () => void;
}

export function ClassRoomForm({
  roomNumber,
  setRoomNumber,
  capacity,
  setCapacity,
  handleSubmit,
  disabled,
  editing,
  onCancel,
}: ClassRoomFormProps) {
  return (
    <AdminCard className="p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-500   flex items-center gap-2">
          {editing ? "Edit Classroom" : "Add Classroom"}
          <div className="h-1 w-12 bg-sidebar/20 rounded-full"></div>
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className=" text-[10px]  text-gray-500 font-bold">
              Room Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaBuilding
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                size={14}
              />
              <Input aria-label="Room Number"
                disabled={disabled}
                maxLength={100}
                placeholder="e.g. 101"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium py-6"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className=" text-[10px]  text-gray-500 font-bold">
              Capacity <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaUsers
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                size={14}
              />
              <Input aria-label="Capacity"
                disabled={disabled}
                type="number"
                min={1}
                max={2147483647}
                step={1}
                placeholder="e.g. 40"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="pl-10 bg-white backdrop-blur-sm border-gray-200 focus:bg-white transition-all font-medium py-6"
                required
              />
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
              Save Room
            </div>
          </Button>
          {editing && <Button type="button" variant="outline" disabled={disabled} onClick={onCancel} className="w-full mt-2">Cancel</Button>}
        </div>
      </form>
    </AdminCard>
  );
}
