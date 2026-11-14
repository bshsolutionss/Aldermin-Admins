import { proxyHr } from "@/lib/hr-proxy";

async function handle(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyHr(request, "designations", (await context.params).id);
}

export const GET = handle;
export const PATCH = handle;
export const DELETE = handle;
