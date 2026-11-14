import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "./auth-server";

export async function proxyAdminRoles(request: Request, action: "roles" | "accounts", id?: string) {
  if (request.method !== "GET" && !isSameOrigin(request))
    return NextResponse.json({ message: "Cross-origin request denied" }, { status: 403 });
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    if (id !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    let body: string | undefined;
    if (request.method !== "GET") {
      try { body = JSON.stringify(await request.json()); }
      catch { return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 }); }
    }
    const path = `/admin-roles${action === "accounts" ? "/accounts" : ""}${id ? `/${id}` : ""}`;
    const query = request.method === "GET" ? new URL(request.url).search : "";
    const response = await authFetch(path + query, {
      method: request.method,
      headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body,
    });
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Role management is temporarily unavailable. Please retry." }, { status: 503 });
  }
}
