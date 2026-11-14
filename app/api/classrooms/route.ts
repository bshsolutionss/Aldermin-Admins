import { proxyClassrooms } from "@/lib/classrooms-proxy";
export const GET = (request: Request) => proxyClassrooms(request);
export const POST = GET;
