import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "./auth-server";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function proxySchoolRecords(request: Request, scope: "student-records" | "school-attendance", parts: string[]) {
  const method = request.method;
  let allowed = false;
  if (scope === "school-attendance") allowed = parts.length === 1 && ["students", "staff"].includes(parts[0]) && ["GET", "PUT"].includes(method);
  else if (parts.length === 1) allowed = ["options", "history"].includes(parts[0]) ? method === "GET" : parts[0] === "students" && ["GET", "POST"].includes(method);
  else if (parts[0] === "students" && uuid.test(parts[1] ?? "")) {
    if (parts.length === 2) allowed = ["GET", "PUT"].includes(method);
    if (["guardians", "enrollments"].includes(parts[2])) allowed = (parts.length === 3 && method === "POST") || (parts.length === 4 && uuid.test(parts[3]) && method === "PUT");
  }
  if (!allowed) return NextResponse.json({ message: "Unknown school record route or method" }, { status: 404 });
  if (method !== "GET" && !isSameOrigin(request)) return NextResponse.json({ message: "Cross-origin request denied" }, { status: 403 });
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    let body: string | undefined;
    if (method !== "GET") { try { body = JSON.stringify(await request.json()); } catch { return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 }); } }
    const response = await authFetch(`/${scope}/${parts.join("/")}${method === "GET" ? new URL(request.url).search : ""}`, { method, body, headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { "Content-Type": "application/json" } : {}) } });
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "School records are temporarily unavailable. Please retry." }, { status: 503 }); }
}
