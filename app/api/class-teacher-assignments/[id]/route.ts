import { proxyClassTeacher } from "@/lib/class-teacher-proxy";

async function handle(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyClassTeacher(request, (await context.params).id);
}

export const GET = handle;
export const PATCH = handle;
export const DELETE = handle;
