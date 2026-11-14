"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { UserForm } from "@/components/modules/user/UserForm";
import { UserList, UserItem } from "@/components/modules/user/UserList";
import { apiService, UserAccount } from "@/lib/api-service";

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data: UserAccount[] = await apiService.users.getAll();
      const mapped: UserItem[] = data.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || "student",
        status: "Active",
        lastLogin: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString()
          : "Recently",
      }));
      setUsers(mapped);
    } catch (err) {
      console.error("Failed to load users from backend:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load users"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await apiService.users.updateRole(id, newRole);
      await loadUsers();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update user role on server"
      );
    }
  };

  return (
    <div className="container mx-auto space-y-8">
      <PageHeader
        title="System User Control"
        subtitle="System Administration"
      />

      {errorMessage && (
        <div className="bg-red-50 text-red-600 text-xs p-4 rounded-xl border border-red-200">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* User Creation */}
        <div className="lg:col-span-4 h-full">
          <UserForm onUserCreated={loadUsers} />
        </div>

        {/* User List */}
        <div className="lg:col-span-8 h-full">
          <UserList
            users={users}
            isLoading={isLoading}
            onRoleChange={handleRoleChange}
          />
        </div>
      </div>
    </div>
  );
}
