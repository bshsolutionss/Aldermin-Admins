import { NextRequest, NextResponse } from "next/server";
import { authFetch, isSameOrigin } from "@/lib/auth-server";
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (typeof body?.email !== "string" || !body.email.trim()) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }
  try {
    const backend = await authFetch("/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email.trim().toLowerCase() }),
    });
    const data = await backend.json();
    return NextResponse.json({ message: data.message }, {
      status: backend.status, headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ message: "Unable to request a reset link. Please try again." }, { status: 503 });
  }
}
