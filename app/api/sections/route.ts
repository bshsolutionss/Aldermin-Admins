import { proxySections } from "@/lib/sections-proxy";
export const GET = (request: Request) => proxySections(request);
export const POST = GET;
