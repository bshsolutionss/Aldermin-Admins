import { proxyAdminRoles } from "@/lib/admin-roles-proxy";
export function GET(request: Request) { return proxyAdminRoles(request, "accounts"); }
