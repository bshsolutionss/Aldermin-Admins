import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "./auth-server";
const registry = [
  "library-categories",
  "library-subjects",
  "books",
  "members",
  "inventory-categories",
  "stores",
  "suppliers",
  "items",
];
const resources = [...registry, "loans", "movements"];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function proxySchoolOperations(request: Request, parts: string[]) {
  const [scope, id, action] = parts,
    method = request.method;
  const allowed =
    (method === "GET" &&
      ((parts.length === 1 && [...resources, "stock"].includes(scope)) ||
        (parts.length === 2 && resources.includes(scope) && id === "history") ||
        (parts.length === 2 &&
          scope === "owners" &&
          ["students", "staff"].includes(id)))) ||
    (method === "POST" &&
      ((parts.length === 1 && registry.includes(scope)) ||
        (parts.length === 2 &&
          ((scope === "loans" && id === "issue") ||
            (scope === "movements" && id === "record"))))) ||
    (method === "PUT" &&
      ((parts.length === 2 && registry.includes(scope) && uuid.test(id)) ||
        (parts.length === 3 &&
          scope === "loans" &&
          uuid.test(id) &&
          action === "return")));
  if (!allowed)
    return NextResponse.json(
      { message: "Unknown operations route or method" },
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
      "/school-operations/" +
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
          "Library and inventory are temporarily unavailable. Please retry.",
      },
      { status: 503 },
    );
  }
}
