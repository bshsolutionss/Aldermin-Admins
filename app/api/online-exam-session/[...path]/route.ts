import { proxyCampus } from "@/lib/campus-proxy";
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: Request, context: Context) {
  return proxyCampus(request, (await context.params).path, true);
}
export async function POST(request: Request, context: Context) {
  return proxyCampus(request, (await context.params).path, true);
}
export async function PUT(request: Request, context: Context) {
  return proxyCampus(request, (await context.params).path, true);
}
