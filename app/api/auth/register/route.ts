import { NextRequest, NextResponse } from "next/server";
import { authFetch, isSameOrigin } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
    Object.keys(body).some(key => !["name", "email", "password"].includes(key))) {
    return NextResponse.json({ message: "Provide name, email and password only. Public accounts are students." }, { status: 400 });
  }
  const { name, email, password } = body as Record<string, unknown>;
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ message: "Name, email and password are required" }, { status: 400 });
  }
  try {
    const backend = await authFetch("/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
    });
    const data = await backend.json();
    if (!backend.ok) return NextResponse.json({ message: Array.isArray(data.message) ? data.message.join(", ") : data.message ?? "Unable to register" }, { status: backend.status });
    if (backend.status !== 201 || !data.user?.id || !data.user.name || data.user.email !== email.trim().toLowerCase() || data.user.role !== "student") throw new Error();
    return NextResponse.json({ message: "Account created. Sign in with your email and password.", user: {
      id: data.user.id, name: data.user.name, email: data.user.email, role: "student",
    } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Registration service is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
