import { proxyFinance } from "@/lib/finance-proxy";
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: Request, context: Context) {
  return proxyFinance(request, (await context.params).path);
}
export async function POST(request: Request, context: Context) {
  return proxyFinance(request, (await context.params).path);
}
export async function PUT(request: Request, context: Context) {
  return proxyFinance(request, (await context.params).path);
}
