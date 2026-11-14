import { proxySchoolContent } from "@/lib/school-content-proxy";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ segments: string[] }> };
async function route(request: Request, context: Context) { return proxySchoolContent(request, (await context.params).segments); }
export { route as GET, route as POST, route as PUT };
