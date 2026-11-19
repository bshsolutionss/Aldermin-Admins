import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "./auth-server";
const resources = [
  "incidents",
  "conduct",
  "leave-types",
  "entitlements",
  "leave",
  "evaluation-settings",
  "evaluations",
];
const catalogs = ["incidents", "leave-types", "entitlements"];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function proxySchoolAdministration(
  request: Request,
  parts: string[],
) {
  const [resource, id, action] = parts,
    method = request.method;
  const allowed =
    (method === "GET" &&
      ((parts.length === 1 && resources.includes(resource)) ||
        (parts.length === 2 &&
          ((resources.includes(resource) && id === "history") ||
            (resource === "options" &&
              ["staff", "enrollments", "guardians", "allocations"].includes(
                id,
              )) ||
            (resource === "reports" &&
              ["students", "classes", "incidents", "teachers"].includes(
                id,
              )))))) ||
    (method === "POST" &&
      parts.length === 1 &&
      resources.includes(resource) &&
      resource !== "evaluation-settings") ||
    (method === "PUT" &&
      ((parts.length === 1 && resource === "evaluation-settings") ||
        (parts.length === 2 && catalogs.includes(resource) && uuid.test(id)) ||
        (parts.length === 3 &&
          ["conduct", "leave", "evaluations"].includes(resource) &&
          uuid.test(id) &&
          action === "decision")));
  if (!allowed)
    return NextResponse.json(
      { message: "Unknown administration route" },
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
    const init: RequestInit = {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    if (method !== "GET") {
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
      "/school-administration/" +
        parts.join("/") +
        (method === "GET" ? new URL(request.url).search : ""),
      init,
    );
    return NextResponse.json(await response.json(), {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "School administration is temporarily unavailable. Please retry.",
      },
      { status: 503 },
    );
  }
}
