import { proxySchoolRecords } from "@/lib/school-records-proxy";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ segments: string[] }> };
async function route(request: Request, context: Context) { return proxySchoolRecords(request, "student-records", (await context.params).segments); }
export { route as GET, route as POST, route as PUT };
