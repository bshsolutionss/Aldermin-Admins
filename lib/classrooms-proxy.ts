import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "@/lib/auth-server";

export async function proxyClassrooms(request: Request, id?: string) {
  if (request.method !== "GET" && !isSameOrigin(request)) return NextResponse.json({ message: "Cross-origin request denied" }, { status: 403 });
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ message: "Invalid classroom ID" }, { status: 400 });
    let body: string | undefined;
    if (["POST", "PATCH"].includes(request.method)) {
      try { body = JSON.stringify(await request.json()); }
      catch { return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 }); }
    }
    const response = await authFetch(`/classrooms${id ? `/${id}` : ""}`, {
      method: request.method,
      headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body,
    });
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Classrooms service is temporarily unavailable. Please retry." }, { status: 503 });
  }
}
