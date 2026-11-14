import { proxyUserAccess } from "@/lib/user-access-proxy";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyUserAccess(request, "login-permission", (await context.params).id);
}
