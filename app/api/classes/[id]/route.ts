import { proxyClasses } from "@/lib/classes-proxy";
async function handle(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyClasses(request, (await context.params).id);
}
export const GET = handle;
export const PATCH = handle;
export const DELETE = handle;
