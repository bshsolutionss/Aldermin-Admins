import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser } from "@/lib/auth-server";
export async function GET(request: Request) {
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user)
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if (user.role !== "admin")
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 },
      );
    const result = await authFetch(
      "/admin-dashboard" + new URL(request.url).search,
      { method: "GET", headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return NextResponse.json(await result.json(), {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Dashboard temporarily unavailable. Please retry." },
      { status: 503 },
    );
  }
}
