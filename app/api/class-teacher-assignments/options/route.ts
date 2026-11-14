import { proxyClassTeacher } from "@/lib/class-teacher-proxy";

export const GET = (request: Request) => proxyClassTeacher(request, undefined, "options");
