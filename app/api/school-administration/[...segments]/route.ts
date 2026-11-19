import { proxySchoolAdministration } from "@/lib/school-administration-proxy";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ segments: string[] }> };
export async function GET(request: Request, context: Context) {
  return proxySchoolAdministration(request, (await context.params).segments);
}
export async function POST(request: Request, context: Context) {
  return proxySchoolAdministration(request, (await context.params).segments);
}
export async function PUT(request: Request, context: Context) {
  return proxySchoolAdministration(request, (await context.params).segments);
}
