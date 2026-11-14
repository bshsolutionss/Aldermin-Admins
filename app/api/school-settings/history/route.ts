import { proxySchoolSettings } from "@/lib/school-settings-proxy";
export function GET(request: Request) { return proxySchoolSettings(request, true); }
