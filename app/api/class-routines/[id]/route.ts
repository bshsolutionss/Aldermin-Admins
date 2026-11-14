import { proxyClassRoutines } from "@/lib/class-routines-proxy";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { return proxyClassRoutines(request, (await context.params).id); }
export const PATCH = GET;
export const DELETE = GET;
