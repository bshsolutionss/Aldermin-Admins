import { proxyClassrooms } from "@/lib/classrooms-proxy";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyClassrooms(request, (await context.params).id);
}
export const PATCH = GET;
export const DELETE = GET;
