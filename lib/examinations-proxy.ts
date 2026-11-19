import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "./auth-server";
const resources = ["types", "grades", "assessments", "schedules"];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function proxyExaminations(request: Request, parts: string[]) {
  const [resource, id, action] = parts,
    method = request.method;
  const allowed =
    (method === "GET" &&
      ((parts.length === 1 && [...resources, "history"].includes(resource)) ||
        (parts.length === 2 &&
          resource === "options" &&
          ["types", "assessments", "allocations", "rooms"].includes(id)) ||
        (parts.length === 3 &&
          resource === "assessments" &&
          uuid.test(id) &&
          action === "roster"))) ||
    (method === "POST" && parts.length === 1 && resources.includes(resource)) ||
    (method === "PUT" &&
      uuid.test(id) &&
      ((parts.length === 2 && resources.includes(resource)) ||
        (parts.length === 3 &&
          resource === "assessments" &&
          ["attendance", "marks"].includes(action))));
  if (!allowed)
    return NextResponse.json(
      { message: "Unknown examination route" },
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
    const result = await authFetch(
      "/examinations/" +
        parts.join("/") +
        (method === "GET" ? new URL(request.url).search : ""),
      init,
    );
    return NextResponse.json(await result.json(), {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Examinations are temporarily unavailable. Please retry." },
      { status: 503 },
    );
  }
}
