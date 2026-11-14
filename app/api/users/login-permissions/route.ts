import { proxyUserAccess } from "@/lib/user-access-proxy";
export async function GET(request: Request) {
  return proxyUserAccess(request, "login-permissions");
}
