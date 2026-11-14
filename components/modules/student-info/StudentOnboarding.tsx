import { StudentEditorPanel } from "./StudentEditorPanel";
export function StudentOnboarding({ studentId }: { studentId?: string }) {
  return <StudentEditorPanel studentId={studentId} />;
}
