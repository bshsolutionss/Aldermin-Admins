import { proxyAcademicYears } from "@/lib/academic-years-proxy";
export const GET = (request: Request) => proxyAcademicYears(request);
export const POST = GET;
