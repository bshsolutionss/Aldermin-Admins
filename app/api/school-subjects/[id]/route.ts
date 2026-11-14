import { proxySchoolSubjects } from "@/lib/school-subjects-proxy";

type Context = { params: Promise<{ id: string }> };
async function handle(request: Request, context: Context) {
  return proxySchoolSubjects(request, (await context.params).id);
}
export const GET = handle;
export const PATCH = handle;
export const DELETE = handle;
