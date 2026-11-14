"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaUserPlus,
  FaIdBadge,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaUserTie,
} from "react-icons/fa";
import { DataTable } from "@/components/common/DataTable";
import { apiService, type Staff } from "@/lib/api-service";
import { ListActionButtons } from "@/components/common/ListActionButtons";

export default function StaffListPage() {
  const router = useRouter();
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const busy = useRef(false);

  const reload = async () => setStaffMembers(await apiService.hr.getStaff());

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setStaffMembers(await apiService.hr.getStaff());
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unable to load staff");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const remove = async (staff: Staff) => {
    if (
      busy.current ||
      !window.confirm(`Delete staff member ${staff.name}?`)
    )
      return;
    busy.current = true;
    setIsDeleting(true);
    setError("");
    try {
      await apiService.hr.deleteStaff(staff.id);
      await reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to delete staff member",
      );
    } finally {
      busy.current = false;
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: "Staff Identity",
      accessor: (staff: Staff) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center font-semibold text-sm shadow-inner group-hover:bg-secondary group-hover:text-white transition-all shadow-sm">
            {staff.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm tracking-tight leading-none mb-1">
              {staff.name}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 leading-none">
              <FaIdBadge className="text-gray-500/40" size={10} />{" "}
              {staff.staffNo}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Role / Dept",
      accessor: (staff: Staff) => (
        <div>
          <span className="inline-flex px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[9px] font-semibold mb-1.5 shadow-sm">
            {staff.role}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold leading-none">
            <FaBuilding className="text-gray-500/40" size={10} />{" "}
            {staff.department ?? "Unassigned"}
          </div>
        </div>
      ),
    },
    {
      header: "Designation",
      accessor: (staff: Staff) => (
        <div className="flex items-center gap-2 text-[10px] font-semibold text-foreground">
          <FaUserTie className="text-gray-500/40" size={12} />
          {staff.designation ?? "Unassigned"}
        </div>
      ),
    },
    {
      header: "Contact Info",
      accessor: (staff: Staff) => (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 transition-colors hover:text-secondary cursor-pointer">
            <FaPhone className="text-gray-500/40" size={10} />{" "}
            {staff.phone ?? "N/A"}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 transition-colors hover:text-secondary cursor-pointer">
            <FaEnvelope className="text-gray-500/40" size={10} />{" "}
            {staff.email || "N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Action",
      accessor: (staff: Staff) => (
        <ListActionButtons
          onEdit={() => {
            router.push(`/admin/hr/add-staff?id=${encodeURIComponent(staff.id)}`);
          }}
          onDelete={() => {
            void remove(staff);
          }}
        />
      ),
      className: "text-center",
      headerClassName: "text-center",
    },
  ];

  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title="Institutional Directory"
        subtitle="Personnel Infrastructure"
        action={
          <Link href="/admin/hr/add-staff">
            <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2 py-6 px-6 rounded-xl font-bold text-[10px] shadow-lg shadow-secondary/10 transition-all">
              <FaUserPlus /> Authorize Personnel
            </Button>
          </Link>
        }
      />

      {error && (
        <div role="alert" className="text-sm text-red-600">
          {error}{" "}
          <Button
            variant="ghost"
            onClick={() => {
              setError("");
              void reload().catch((error) =>
                setError(
                  error instanceof Error ? error.message : "Unable to load staff",
                ),
              );
            }}
          >
            Retry
          </Button>
        </div>
      )}

      <DataTable
        data={staffMembers}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search directory..."
        title={isDeleting ? "Updating Staff Index..." : "Certified Staff Index"}
        isLoading={isLoading}
      />
    </div>
  );
}
