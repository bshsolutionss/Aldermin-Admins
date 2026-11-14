import { proxyClassTeacher } from "@/lib/class-teacher-proxy";

export const GET = (request: Request) => proxyClassTeacher(request);
export const POST = GET;
