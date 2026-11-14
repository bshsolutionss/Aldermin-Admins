import { NextRequest, NextResponse } from "next/server";
import { authFetch, clearAuthCookies, isSameOrigin } from "@/lib/auth-server";
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (typeof body?.token !== "string" || !body.token.trim() || typeof body.newPassword !== "string" || !body.newPassword) {
    return NextResponse.json({ message: "Token and new password are required" }, { status: 400 });
  }
  try {
    const backend = await authFetch("/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: body.token.trim(), newPassword: body.newPassword }),
    });
    const data = await backend.json();
    const response = NextResponse.json({
      message: Array.isArray(data.message) ? data.message.join(", ") : data.message,
    }, { status: backend.status, headers: { "Cache-Control": "no-store" } });
    if (backend.ok) clearAuthCookies(response);
    return response;
  } catch {
    return NextResponse.json({ message: "Unable to reset password. Please try again." }, { status: 503 });
  }
}
