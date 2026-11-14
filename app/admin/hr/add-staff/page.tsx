"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { FileAttachmentPanel } from "@/components/modules/study-material/FileAttachmentPanel";
import {
  apiService,
  type Department,
  type Designation,
  type StaffInput,
} from "@/lib/api-service";
import {
  FaUserCircle,
  FaUniversity,
  FaCloudUploadAlt,
  FaSave,
  FaMoneyBillWave,
} from "react-icons/fa";

const emptyForm = {
  staffNo: "",
  role: "",
  departmentId: "",
  designationId: "",
  firstName: "",
  lastName: "",
  fatherName: "",
  motherName: "",
  email: "",
  gender: "",
  dob: "",
  joiningDate: "",
  phone: "",
  maritalStatus: "",
  emergencyMobile: "",
  drivingLicense: "",
  isExpert: true,
  address: "",
  permanentAddress: "",
  experience: "",
  epfNo: "",
  basicSalary: "",
  contractType: "",
  location: "",
  bankAccountName: "",
  bankAccountNo: "",
  bankName: "",
  branchName: "",
  facebookUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  instagramUrl: "",
  nic: "",
  status: "active" as "active" | "inactive",
};

type StaffForm = typeof emptyForm;

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: IconType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-8 group">
      <div className="p-3 bg-secondary rounded-2xl shadow-lg ring-4 ring-secondary/5 group-hover:scale-110 transition-transform">
        <Icon className="text-white" size={20} />
      </div>
      <div>
        <h4 className="text-lg font-semibold text-gray-800 tracking-tight ">
          {title}
        </h4>
        <p className="text-[10px] text-gray-400 font-bold  ">{subtitle}</p>
      </div>
      <div className="flex-1 border-b border-dashed border-gray-100 ml-4"></div>
    </div>
  );
}

export default function AddStaffPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const busy = useRef(false);

  const [formData, setFormData] = useState<StaffForm>(emptyForm);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const id = new URLSearchParams(window.location.search).get("id");
      try {
        const [rolesRes, deptsRes, desigsRes] = await Promise.all([
          apiService.hr.getRoles(),
          apiService.hr.getDepartments(),
          apiService.hr.getDesignations(),
        ]);
        if (cancelled) return;
        setRoles(rolesRes);
        setDepartments(deptsRes);
        setDesignations(desigsRes);
        if (!id) return;
        setEditingId(id);
        setIsLoadingStaff(true);
        const staff = await apiService.hr.getStaffById(id);
        if (cancelled) return;
        const text = (value: string | null | undefined) => value ?? "";
        setFormData({
          staffNo: staff.staffNo,
          role: staff.role,
          departmentId: staff.departmentId ?? "",
          designationId: staff.designationId ?? "",
          firstName: staff.firstName,
          lastName: staff.lastName,
          fatherName: text(staff.fatherName),
          motherName: text(staff.motherName),
          email: text(staff.email),
          gender: text(staff.gender),
          dob: text(staff.dob),
          joiningDate: text(staff.joiningDate),
          phone: text(staff.phone),
          maritalStatus: text(staff.maritalStatus),
          emergencyMobile: text(staff.emergencyMobile),
          drivingLicense: text(staff.drivingLicense),
          isExpert: staff.isExpert ?? true,
          address: text(staff.address),
          permanentAddress: text(staff.permanentAddress),
          experience: text(staff.experience),
          epfNo: text(staff.epfNo),
          basicSalary:
            staff.basicSalary === null || staff.basicSalary === undefined
              ? ""
              : String(staff.basicSalary),
          contractType: text(staff.contractType),
          location: text(staff.location),
          bankAccountName: text(staff.bankAccountName),
          bankAccountNo: text(staff.bankAccountNo),
          bankName: text(staff.bankName),
          branchName: text(staff.branchName),
          facebookUrl: text(staff.facebookUrl),
          twitterUrl: text(staff.twitterUrl),
          linkedinUrl: text(staff.linkedinUrl),
          instagramUrl: text(staff.instagramUrl),
          nic: text(staff.nic),
          status: staff.status === "inactive" ? "inactive" : "active",
        });
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load staff form data",
          );
      } finally {
        if (!cancelled) setIsLoadingStaff(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const bind = (name: keyof StaffForm) => ({
    name,
    value: String(formData[name] ?? ""),
    onChange: handleInputChange,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    setError("");
    setSuccess("");
    const staffNo = formData.staffNo.trim();
    const role = formData.role.trim();
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    if (!staffNo || !role || !firstName || !lastName) {
      setError("Staff ID, role, first name and last name are required.");
      return;
    }
    const salaryText = formData.basicSalary.trim();
    const basicSalary = salaryText ? Number(salaryText) : null;
    if (basicSalary !== null && !Number.isFinite(basicSalary)) {
      setError("Basic salary must be a valid number.");
      return;
    }
    const nullable = (value: string) => value.trim() || null;
    const payload: StaffInput = {
      staffNo,
      role,
      firstName,
      lastName,
      departmentId: formData.departmentId || null,
      designationId: formData.designationId || null,
      fatherName: nullable(formData.fatherName),
      motherName: nullable(formData.motherName),
      email: nullable(formData.email),
      gender: formData.gender
        ? (formData.gender as StaffInput["gender"])
        : null,
      dob: nullable(formData.dob),
      joiningDate: nullable(formData.joiningDate),
      phone: nullable(formData.phone),
      maritalStatus: formData.maritalStatus
        ? (formData.maritalStatus as StaffInput["maritalStatus"])
        : null,
      emergencyMobile: nullable(formData.emergencyMobile),
      drivingLicense: nullable(formData.drivingLicense),
      isExpert: formData.isExpert,
      address: nullable(formData.address),
      permanentAddress: nullable(formData.permanentAddress),
      experience: nullable(formData.experience),
      epfNo: nullable(formData.epfNo),
      basicSalary,
      contractType: formData.contractType
        ? (formData.contractType as StaffInput["contractType"])
        : null,
      location: nullable(formData.location),
      bankAccountName: nullable(formData.bankAccountName),
      bankAccountNo: nullable(formData.bankAccountNo),
      bankName: nullable(formData.bankName),
      branchName: nullable(formData.branchName),
      facebookUrl: nullable(formData.facebookUrl),
      twitterUrl: nullable(formData.twitterUrl),
      linkedinUrl: nullable(formData.linkedinUrl),
      instagramUrl: nullable(formData.instagramUrl),
      nic: nullable(formData.nic),
      status: formData.status,
    };
    busy.current = true;
    setIsSubmitting(true);
    try {
      if (editingId) await apiService.hr.updateStaff(editingId, payload);
      else await apiService.hr.createStaff(payload);
      setSuccess(
        editingId
          ? "Staff profile updated successfully."
          : "Staff profile finalized and archived.",
      );
      setTimeout(() => router.push("/admin/hr/staff-list"), 600);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save staff profile",
      );
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto space-y-12 pb-20">
      <PageHeader
        title={editingId ? "Personnel Update" : "Personnel Onboarding"}
        subtitle="Staff Recruitment Lifecycle"
        backUrl="/admin/hr/staff-list"
      />

      {error && (
        <div role="alert" className="flex items-center gap-3 text-sm text-red-600">
          {error}
          <Button variant="ghost" onClick={() => setError("")}>
            Dismiss
          </Button>
        </div>
      )}
      {success && (
        <div role="status" className="text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-12">
        {/* Basic Info Section */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-50 ring-1 ring-black/5">
          <SectionTitle
            icon={FaUserCircle}
            title="Primary Identity"
            subtitle="Core employment data & credentials"
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Staff ID # <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...bind("staffNo")}
                maxLength={50}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="REQ-001"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                {...bind("role")}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                {...bind("departmentId")}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="">Select Dept</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Designation <span className="text-red-500">*</span>
              </label>
              <select
                {...bind("designationId")}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="">Select Role</option>
                {designations.map((desig) => (
                  <option key={desig.id} value={desig.id}>
                    {desig.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                First Name
              </label>
              <input
                type="text"
                {...bind("firstName")}
                maxLength={100}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...bind("lastName")}
                maxLength={100}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Gender
              </label>
              <select
                {...bind("gender")}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...bind("dob")}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...bind("email")}
                maxLength={255}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="email@institution.edu"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Mobile # <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...bind("phone")}
                maxLength={30}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="+880..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Joining Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...bind("joiningDate")}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Professional & Payroll Section */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-50 ring-1 ring-black/5">
          <SectionTitle
            icon={FaMoneyBillWave}
            title="Payroll & Professional"
            subtitle="Salary structure and contract specifics"
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                EPF Number
              </label>
              <input
                type="text"
                {...bind("epfNo")}
                maxLength={50}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Basic Salary
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  {...bind("basicSalary")}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-gray-50 border-gray-100 pl-10 p-4 text-sm font-semibold text-indigo-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Contract Type
              </label>
              <select
                {...bind("contractType")}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="">Select</option>
                <option value="permanent">Permanent</option>
                <option value="probation">Probation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400  mb-2">
                Experience
              </label>
              <input
                type="text"
                {...bind("experience")}
                maxLength={100}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="5 Years"
              />
            </div>
          </div>
        </div>

        {/* Bank & Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-50 ring-1 ring-black/5">
            <SectionTitle
              icon={FaUniversity}
              title="Bank Registry"
              subtitle="Direct deposit details"
            />
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400  mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  {...bind("bankAccountName")}
                  maxLength={150}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400  mb-2">
                    Account #
                  </label>
                  <input
                    type="text"
                    {...bind("bankAccountNo")}
                    maxLength={50}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none "
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400  mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...bind("bankName")}
                    maxLength={150}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-gray-50 border-gray-100 p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-50 ring-1 ring-black/5">
            <SectionTitle
              icon={FaCloudUploadAlt}
              title="Documentation"
              subtitle="Upload essential verification files"
            />
            {editingId ? <FileAttachmentPanel staffId={editingId} disabled={isSubmitting || isLoadingStaff} /> : <p className="text-sm text-gray-500">Save the staff profile, then open it from Staff List to add portrait and verification documents.</p>}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center pt-8">
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingStaff}
            className="group relative flex items-center justify-center gap-4 rounded-full bg-secondary h-20 px-16 py-5 text-white font-semibold text-xl transition-all hover:bg-secondary/90 active:scale-[0.98] shadow-2xl shadow-secondary/20 overflow-hidden disabled:opacity-70"
          >
            {isSubmitting || isLoadingStaff ? (
              <div className="w-6 h-6 border-b-2 border-white rounded-full animate-spin"></div>
            ) : (
              <FaSave
                size={24}
                className="group-hover:rotate-12 transition-transform"
              />
            )}
            {isLoadingStaff
              ? "Loading Record..."
              : isSubmitting
                ? editingId
                  ? "Updating Details..."
                  : "Archiving Details..."
                : editingId
                  ? "Update Personnel Record"
                  : "Finalize Personnel Record"}
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </Button>
        </div>
      </form>
    </div>
  );
}
