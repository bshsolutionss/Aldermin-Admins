import { NextRequest, NextResponse } from "next/server";
import { authFetch, clearAuthCookies, isSameOrigin, setAuthCookies } from "@/lib/auth-server";
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    const response = NextResponse.json({ message: "Session expired. Please sign in again." }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }
  try {
    const backend = await authFetch("/auth/refresh", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }),
    });
    if (backend.status === 401) {
      const response = NextResponse.json({ message: "Session expired. Please sign in again." }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }
    if (!backend.ok) throw new Error();
    const tokens = await backend.json();
    if (typeof tokens.accessToken !== "string" || !tokens.accessToken || typeof tokens.refreshToken !== "string" || !tokens.refreshToken) throw new Error();
    const response = NextResponse.json({ message: "Session renewed" });
    setAuthCookies(response, tokens);
    return response;
  } catch {
    // An outage is not proof of expiry; preserve the current cookies.
    return NextResponse.json({ message: "Unable to renew session. Please try again." }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
