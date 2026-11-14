import { proxyClasses } from "@/lib/classes-proxy";
async function handle(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyClasses(request, (await context.params).id, "sections");
}
export const GET = handle;
