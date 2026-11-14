import { proxySchoolRecords } from "@/lib/school-records-proxy";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ kind: string }> };
async function route(request: Request, context: Context) { return proxySchoolRecords(request, "school-attendance", [(await context.params).kind]); }
export { route as GET, route as PUT };
