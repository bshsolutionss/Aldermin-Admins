import { proxySchoolSubjects } from "@/lib/school-subjects-proxy";

export const GET = (request: Request) => proxySchoolSubjects(request);
export const POST = (request: Request) => proxySchoolSubjects(request);
