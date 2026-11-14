import { proxyAdminRoles } from "@/lib/admin-roles-proxy";
export function GET(request: Request) { return proxyAdminRoles(request, "roles"); }
export function POST(request: Request) { return proxyAdminRoles(request, "roles"); }
