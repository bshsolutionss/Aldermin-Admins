import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "./auth-server";

const resources = new Set(["holidays", "weekends", "categories", "groups", "history"]);
export async function proxyFoundations(request: Request, segments: string[]) {
  const [resource, id] = segments;
  if (!resources.has(resource) || segments.length > 2 || (id && (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || resource === "weekends" || resource === "history")))
    return NextResponse.json({ message: "Unknown calendar or student catalog route" }, { status: 404 });
  const method = request.method;
  const allowed = resource === "history" ? method === "GET" : resource === "weekends" ? ["GET", "PUT"].includes(method) : id ? method === "PUT" : ["GET", "POST"].includes(method);
  if (!allowed) return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
  if (method !== "GET" && !isSameOrigin(request)) return NextResponse.json({ message: "Cross-origin request denied" }, { status: 403 });
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    let body: string | undefined;
    if (method !== "GET") {
      try { body = JSON.stringify(await request.json()); }
      catch { return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 }); }
    }
    const response = await authFetch(`/admin-foundations/${resource}${id ? `/${id}` : ""}${method === "GET" ? new URL(request.url).search : ""}`, {
      method, body, headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    });
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "Calendar and student catalogs are temporarily unavailable. Please retry." }, { status: 503 }); }
}
