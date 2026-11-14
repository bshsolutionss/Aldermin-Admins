"use client";

import React, { useState } from "react";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaSearch, FaEnvelope, FaEdit, FaCheck, FaTimes } from "react-icons/fa";

export interface UserItem {
  id: string | number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
}

interface UserListProps {
  users: UserItem[];
  isLoading?: boolean;
  onRoleChange?: (id: string, role: string) => Promise<void>;
}

export function UserList({ users, isLoading, onRoleChange }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("student");
  const [updating, setUpdating] = useState(false);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  const handleStartEdit = (user: UserItem) => {
    setEditingId(user.id);
    setSelectedRole(user.role.toLowerCase());
  };

  const handleSaveRole = async (id: string | number) => {
    if (!onRoleChange) return;
    setUpdating(true);
    try {
      await onRoleChange(String(id), selectedRole);
      setEditingId(null);
    } catch (e) {
      console.error("Role update failed:", e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AdminCard className="h-full bg-white relative overflow-hidden">
      <div className="p-8 pb-0 flex items-center justify-between mb-8 relative">
        <h4 className="text-xs font-semibold text-gray-400 leading-none">
          Authorized Personnel ({users.length})
        </h4>
        <div className="relative">
          <FaSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10"
            size={14}
          />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Users..."
            className="pl-10 pr-4 py-3 h-12 rounded-2xl bg-white border-gray-200 text-xs font-bold focus:ring-2 focus:ring-secondary/20 outline-none w-64 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="p-8 pt-0 overflow-x-auto relative">
        {isLoading ? (
          <div className="text-center py-12 text-sm text-gray-400">
            Loading personnel from backend...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">
            No users match the search criteria.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/70 text-gray-500 font-bold border-b border-gray-50">
              <tr>
                <th className="px-6 py-6 text-left w-16 text-[10px] font-semibold">
                  SN
                </th>
                <th className="px-6 py-6 text-left text-[10px] font-semibold">
                  User Profile
                </th>
                <th className="px-6 py-6 text-center text-[10px] font-semibold">
                  Role
                </th>
                <th className="px-6 py-6 text-center text-[10px] font-semibold">
                  Status
                </th>
                <th className="px-6 py-6 text-center text-[10px] font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((u, index) => {
                const isEditing = editingId === u.id;
                return (
                  <tr
                    key={u.id}
                    className="group hover:bg-secondary/5 transition-all"
                  >
                    <td className="px-6 py-8 text-gray-300 text-xs">
                      {index + 1}
                    </td>
                    <td className="px-6 py-8">
                      <div className="font-semibold text-gray-900 tracking-tight text-base leading-none mb-1">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold flex items-center gap-2">
                        <FaEnvelope size={10} /> {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-8 text-center">
                      {isEditing ? (
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none font-semibold text-secondary"
                        >
                          <option value="admin">Admin</option>
                          <option value="instructor">Instructor</option>
                          <option value="student">Student</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 bg-secondary/10 text-secondary text-[9px] font-semibold rounded-xl tracking-[0.2em] shadow-sm uppercase">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-8 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-semibold shadow-sm ring-1 ring-inset ${
                          u.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                            : "bg-red-50 text-red-700 ring-red-100"
                        }`}
                      >
                        {u.status}
                      </span>
                      <div className="text-[9px] text-gray-300 mt-1">
                        Last: {u.lastLogin}
                      </div>
                    </td>
                    <td className="px-6 py-8 text-center">
                      <div className="flex justify-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={updating}
                              onClick={() => handleSaveRole(u.id)}
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Save Role"
                            >
                              <FaCheck size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={updating}
                              onClick={() => setEditingId(null)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                              title="Cancel"
                            >
                              <FaTimes size={14} />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(u)}
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Role"
                          >
                            <FaEdit size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminCard>
  );
}
