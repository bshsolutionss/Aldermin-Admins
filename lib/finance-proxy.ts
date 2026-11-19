import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "./auth-server";
const resources = [
  "groups",
  "types",
  "accounts",
  "invoices",
  "payments",
  "journals",
  "payroll",
  "wallet-requests",
  "wallet-movements",
  "history",
];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function proxyFinance(request: Request, parts: string[]) {
  const [resource, id, action] = parts,
    method = request.method;
  const allowed =
    (method === "GET" &&
      ((parts.length === 1 && [...resources, "settings"].includes(resource)) ||
        (parts.length === 2 &&
          ((resource === "options" &&
            [
              "students",
              "staff",
              "groups",
              "types",
              "accounts",
              "invoices",
            ].includes(id)) ||
            (resource === "reports" &&
              [
                "trial-balance",
                "profit-loss",
                "dues",
                "wallet",
                "payments",
                "payroll",
              ].includes(id)))))) ||
    (method === "POST" &&
      parts.length === 1 &&
      resources
        .filter((r) => !["history", "wallet-movements"].includes(r))
        .includes(resource)) ||
    (method === "PUT" &&
      ((parts.length === 1 && resource === "settings") ||
        (parts.length === 2 &&
          ["groups", "types", "accounts"].includes(resource) &&
          uuid.test(id)) ||
        (parts.length === 3 &&
          uuid.test(id) &&
          ((resource === "payroll" && action === "pay") ||
            (resource === "wallet-requests" && action === "decision")))));
  if (!allowed)
    return NextResponse.json(
      { message: "Unknown finance route" },
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
      "/finance/" +
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
      { message: "Finance is temporarily unavailable. Please retry." },
      { status: 503 },
    );
  }
}
