import { proxySchoolSubjects } from "@/lib/school-subjects-proxy";
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxySchoolSubjects(request, (await context.params).id, "school-subject-assignments");
}
export const GET = DELETE;
export const PATCH = DELETE;
