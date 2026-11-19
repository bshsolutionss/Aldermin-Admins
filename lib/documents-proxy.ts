import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "./auth-server";

const json = (data: unknown, status: number) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function proxyDocuments(request: Request, parts: string[]) {
  const [resource, id, action] = parts, method = request.method;
  const allowed = (parts.length === 1 && method === "GET" && ["templates", "issues", "history"].includes(resource)) ||
    (parts.length === 1 && method === "POST" && ["templates", "issues", "print-jobs"].includes(resource)) ||
    (parts.length === 2 && resource === "options" && ["student", "staff"].includes(id) && method === "GET") ||
    (parts.length === 2 && ["issues", "assets"].includes(resource) && uuid.test(id) && method === "GET") ||
    (parts.length === 2 && resource === "templates" && uuid.test(id) && method === "PUT") ||
    (parts.length === 3 && uuid.test(id) && ((resource === "templates" && action === "history" && method === "GET") || (resource === "issues" && action === "revoke" && method === "POST")));
  if (!allowed) return json({ message: "Unknown document operation" }, 404);
  if (method !== "GET" && !isSameOrigin(request)) return json({ message: "Cross-origin request denied" }, 403);
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user) return json({ message: "Unauthenticated" }, 401);
    if (user.role !== "admin") return json({ message: "Admin access required" }, 403);
    const init: RequestInit = { method, headers: { Authorization: `Bearer ${accessToken}` } };
    if (method !== "GET") {
      try { init.body = JSON.stringify(await request.json()); }
      catch { return json({ message: "Invalid JSON body" }, 400); }
      init.headers = { ...init.headers, "Content-Type": "application/json" };
    }
    const response = await authFetch("/documents/" + parts.join("/") + (method === "GET" ? new URL(request.url).search : ""), init);
    return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch { return json({ message: "Document service is temporarily unavailable. Please retry." }, 503); }
}
