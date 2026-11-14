import { FaUserPlus } from "react-icons/fa";
import { StudentOnboarding } from "@/components/modules/student-info/StudentOnboarding";
import { PageHeader } from "@/components/common/PageHeader";
export default async function AddStudentPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return <div className="container mx-auto space-y-8 pb-32"><PageHeader title={id ? "Edit Student" : "Onboard New Student"} subtitle="Student Information System (SIS)" icon={<FaUserPlus size={24} />} /><StudentOnboarding studentId={id} /></div>;
}
