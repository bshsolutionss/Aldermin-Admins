import { NextRequest, NextResponse } from "next/server";
import { authFetch, clearAuthCookies, isSameOrigin } from "@/lib/auth-server";
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  let revoked = true;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (refreshToken) {
    try {
      const backend = await authFetch("/auth/logout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }),
      });
      revoked = backend.ok;
    } catch { revoked = false; }
  }
  const response = NextResponse.json({
    message: revoked ? "Logged out successfully" : "Signed out locally. The server could not confirm session revocation.",
  }, { status: revoked ? 200 : 503 });
  clearAuthCookies(response);
  return response;
}
