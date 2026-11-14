import { proxySchoolSubjects } from "@/lib/school-subjects-proxy";
export const GET = (request: Request) => proxySchoolSubjects(request, "options", "school-subject-assignments");
