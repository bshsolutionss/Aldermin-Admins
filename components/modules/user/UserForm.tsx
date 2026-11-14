"use client";

import React, { useState } from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaPlus, FaEnvelope, FaLock } from "react-icons/fa";
import { apiService } from "@/lib/api-service";

interface UserFormProps {
  onUserCreated?: () => void;
}

export function UserForm({ onUserCreated }: UserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Map UI role to backend UserRole (admin, instructor, student)
      let backendRole = "student";
      if (role === "admin") backendRole = "admin";
      else if (role === "teacher" || role === "instructor") backendRole = "instructor";
      else backendRole = "student";

      await apiService.users.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: backendRole,
      });

      setSuccess("Account successfully created!");
      setName("");
      setEmail("");
      setPassword("");
      setRole("student");
      if (onUserCreated) onUserCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create user account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminCard className="p-8 h-full bg-white">
      <h4 className="mb-6 text-xs font-semibold text-gray-400 leading-none flex items-center justify-between">
        Register User
      </h4>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-xl text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 text-green-700 text-xs p-3 rounded-xl text-center">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className="block text-[10px] font-semibold text-gray-400 px-1">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-2xl border-gray-200 bg-white p-4 text-xs font-bold focus:ring-2 focus:ring-secondary/20 outline-none transition-all h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="block text-[10px] font-semibold text-gray-400 px-1">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FaEnvelope
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10"
                size={12}
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-2xl border-gray-200 bg-white p-4 pl-10 text-xs font-bold focus:ring-2 focus:ring-secondary/20 outline-none transition-all h-12"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="block text-[10px] font-semibold text-gray-400 px-1">
                System Role
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full rounded-2xl border-gray-200 bg-white p-4 text-xs font-bold focus:ring-2 focus:ring-secondary/20 outline-none transition-all h-12">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher / Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="block text-[10px] font-semibold text-gray-400 px-1">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <FaLock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10"
                  size={12}
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-2xl border-gray-200 bg-white p-4 pl-10 text-xs font-bold focus:ring-2 focus:ring-secondary/20 outline-none transition-all h-12"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden rounded-2xl bg-secondary hover:bg-secondary/90 disabled:opacity-60 text-white px-8 py-6 text-[10px] font-semibold tracking-[0.2em] transition-all cursor-pointer"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              <FaPlus />
              {loading ? "Creating Account..." : "Create Account"}
            </div>
          </Button>
        </div>
      </form>
    </AdminCard>
  );
}
