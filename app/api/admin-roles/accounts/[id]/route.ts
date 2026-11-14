import { proxyAdminRoles } from "@/lib/admin-roles-proxy";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyAdminRoles(request, "accounts", (await context.params).id);
}
