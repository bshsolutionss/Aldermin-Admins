import { proxyHr } from "@/lib/hr-proxy";

export const GET = (request: Request) => proxyHr(request, "staff", undefined, "roles");
