import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "@/lib/auth-server";

export async function proxyUserAccess(request: Request, action: "login-permissions" | "login-permission" | "role", id?: string) {
  if (request.method !== "GET" && !isSameOrigin(request))
    return NextResponse.json({ message: "Cross-origin request denied" }, { status: 403 });
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    if (action !== "login-permissions" && (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    let body: string | undefined;
    if (request.method === "PATCH") {
      try { body = JSON.stringify(await request.json()); }
      catch { return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 }); }
    }
    const suffix = action === "login-permissions" ? new URL(request.url).search : "";
    const path = action === "login-permissions" ? "/users/login-permissions" : `/users/${id}/${action}`;
    const response = await authFetch(path + suffix, {
      method: request.method,
      headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body,
    });
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "User access service is temporarily unavailable. Please retry." }, { status: 503 });
  }
}
