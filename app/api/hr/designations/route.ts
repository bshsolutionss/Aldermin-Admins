import { proxyHr } from "@/lib/hr-proxy";

export const GET = (request: Request) => proxyHr(request, "designations");
export const POST = GET;
