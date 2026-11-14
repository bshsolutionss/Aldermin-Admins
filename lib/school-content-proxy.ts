import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "./auth-server";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const scopes: Record<string, string> = {
  files: "school-files",
  materials: "school-materials",
  notices: "school-notices",
  events: "school-events",
};
export async function proxySchoolContent(request: Request, parts: string[]) {
  const [scope, id, suffix] = parts,
    method = request.method;
  if (!Object.hasOwn(scopes, scope))
    return NextResponse.json(
      { message: "Unknown content route" },
      { status: 404 },
    );
  const download =
    scope === "files" &&
    parts.length === 3 &&
    uuid.test(id ?? "") &&
    suffix === "download" &&
    method === "GET";
  const upload = scope === "files" && parts.length === 1 && method === "POST";
  const special =
    parts.length === 2 &&
    ((scope === "files" && id === "links" && ["GET", "PUT"].includes(method)) ||
      (scope === "files" && id === "history" && method === "GET") ||
      (scope === "materials" && id === "options" && method === "GET") ||
      (scope === "events" && id === "calendar" && method === "GET"));
  const allowed =
    download ||
    special ||
    (parts.length === 1 && ["GET", "POST"].includes(method)) ||
    (parts.length === 2 && uuid.test(id ?? "") && method === "PUT");
  if (!allowed)
    return NextResponse.json(
      { message: "Unknown content route or method" },
      { status: 404 },
    );
  if (method !== "GET" && !isSameOrigin(request))
    return NextResponse.json(
      { message: "Cross-origin request denied" },
      { status: 403 },
    );
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user)
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if (user.role !== "admin")
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 },
      );
    const init: RequestInit & { duplex?: "half" } = {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    if (upload) {
      const type = request.headers.get("content-type") ?? "";
      if (!/^multipart\/form-data;\s*boundary=/i.test(type))
        return NextResponse.json(
          { message: "Use a multipart file upload" },
          { status: 400 },
        );
      const length = request.headers.get("content-length");
      if (length && Number(length) > 5242880 + 65536)
        return NextResponse.json(
          { message: "Upload exceeds the 5 MiB file limit" },
          { status: 413 },
        );
      init.headers = { ...init.headers, "Content-Type": type };
      init.body = request.body;
      init.duplex = "half";
    } else if (method !== "GET") {
      try {
        init.body = JSON.stringify(await request.json());
      } catch {
        return NextResponse.json(
          { message: "Invalid JSON body" },
          { status: 400 },
        );
      }
      init.headers = { ...init.headers, "Content-Type": "application/json" };
    }
    const response = await authFetch(
      `/${scopes[scope]}${parts.length > 1 ? `/${parts.slice(1).join("/")}` : ""}${method === "GET" ? new URL(request.url).search : ""}`,
      init,
    );
    if (download && response.ok) {
      const mime = response.headers.get("content-type")?.split(";")[0] ?? "";
      if (
        !["application/pdf", "image/png", "image/jpeg", "text/plain"].includes(
          mime,
        )
      )
        throw new Error("Unexpected download type");
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": mime,
          "Content-Disposition":
            response.headers.get("content-disposition") ?? "attachment",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "sandbox; default-src 'none'",
        },
      });
    }
    return NextResponse.json(await response.json(), {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "School files and content are temporarily unavailable. Please retry.",
      },
      { status: 503 },
    );
  }
}
