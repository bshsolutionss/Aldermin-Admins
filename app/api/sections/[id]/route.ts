import { proxySections } from "@/lib/sections-proxy";
async function handle(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxySections(request, (await context.params).id);
}
export const GET = handle;
export const PATCH = handle;
export const DELETE = handle;
