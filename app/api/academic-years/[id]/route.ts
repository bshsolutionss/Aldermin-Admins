import { proxyAcademicYears } from "@/lib/academic-years-proxy";
async function handle(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyAcademicYears(request, (await context.params).id);
}
export const GET = handle;
export const PATCH = handle;
export const DELETE = handle;
