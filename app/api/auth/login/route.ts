import { NextRequest, NextResponse } from "next/server";
import { authFetch, setAuthCookies, clearAuthCookies, isSameOrigin } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const { email, password, portal } = body ?? {};
  if (portal !== "admin" && portal !== "portal") {
    return NextResponse.json({ message: "Choose the Admin Login or Portal Login." }, { status: 400 });
  }
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
  }
  try {
    const backend = await authFetch("/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await backend.json();
    if (!backend.ok) return NextResponse.json({
      message: Array.isArray(data.message) ? data.message.join(", ") : data.message ?? "Invalid email or password",
    }, { status: backend.status, headers: { "Cache-Control": "no-store" } });
    if (typeof data.accessToken !== "string" || !data.accessToken || typeof data.refreshToken !== "string" ||
      !data.refreshToken || !data.user?.id || !data.user.name || !data.user.email) throw new Error();

    const role = data.user.role?.toLowerCase();
    const permitted = portal === "admin" ? role === "admin" : role === "student" || role === "instructor";
    if (!permitted) {
      await authFetch("/auth/logout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: data.refreshToken }),
      }).catch(() => undefined);
      const message = portal === "admin"
        ? "Access denied. Only administrator accounts are permitted on the Admin Login page."
        : role === "admin" ? "Admin accounts must sign in through the Admin Login page."
        : "Access denied. Only student and instructor accounts are permitted on this portal.";
      const response = NextResponse.json({ message }, { status: 403 });
      clearAuthCookies(response);
      return response;
    }
    const response = NextResponse.json({ message: "Login successful", user: data.user });
    setAuthCookies(response, data);
    return response;
  } catch {
    return NextResponse.json({ message: "Unable to connect to authentication server. Please try again." }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
