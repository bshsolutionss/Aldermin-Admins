import { StudentDirectory } from '@/components/modules/student-info/StudentDirectory';
import { StudentEditorPanel } from '@/components/modules/student-info/StudentEditorPanel';
import { PageHeader } from '@/components/common/PageHeader';
export default async function Page({searchParams}:{searchParams:Promise<{id?:string}>}) {
 const {id}=await searchParams;
 return id?<div className="container mx-auto space-y-8"><PageHeader title="Review Student Promotion" subtitle="Add a dated enrollment; previous placements and audit history are preserved."/><StudentEditorPanel studentId={id}/></div>:<StudentDirectory promotion/>;
}
