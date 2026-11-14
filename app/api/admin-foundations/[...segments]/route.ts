import { proxyFoundations } from "@/lib/admin-foundations-proxy";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ segments: string[] }> };
async function route(request: Request, context: Context) {
  return proxyFoundations(request, (await context.params).segments);
}
export { route as GET, route as POST, route as PUT };
