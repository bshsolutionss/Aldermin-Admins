import { proxyClassRoutines } from "@/lib/class-routines-proxy";
export const GET = (request: Request) => proxyClassRoutines(request, "options");
