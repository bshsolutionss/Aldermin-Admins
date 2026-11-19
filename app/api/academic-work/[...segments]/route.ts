import { proxyAcademicWork } from "@/lib/academic-work-proxy";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ segments: string[] }> };
export async function GET(request: Request, context: Context) {
  return proxyAcademicWork(request, (await context.params).segments);
}
export async function POST(request: Request, context: Context) {
  return proxyAcademicWork(request, (await context.params).segments);
}
export async function PUT(request: Request, context: Context) {
  return proxyAcademicWork(request, (await context.params).segments);
}
