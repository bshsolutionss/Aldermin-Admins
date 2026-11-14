import { proxyAcademicYears } from "@/lib/academic-years-proxy";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyAcademicYears(request, (await context.params).id, true);
}
