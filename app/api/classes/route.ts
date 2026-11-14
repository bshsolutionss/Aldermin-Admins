import { proxyClasses } from "@/lib/classes-proxy";
export const GET = (request: Request) => proxyClasses(request);
export const POST = GET;
