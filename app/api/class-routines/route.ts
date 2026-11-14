import { proxyClassRoutines } from "@/lib/class-routines-proxy";
export const GET = (request: Request) => proxyClassRoutines(request);
export const POST = GET;
