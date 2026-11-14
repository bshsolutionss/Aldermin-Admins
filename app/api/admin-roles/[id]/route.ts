import { proxyAdminRoles } from "@/lib/admin-roles-proxy";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyAdminRoles(request, "roles", (await context.params).id);
}
