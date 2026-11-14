import { NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth-server";
export async function GET() {
  try {
    const { user } = await getVerifiedUser();
    return NextResponse.json(user ?? { message: "Unauthenticated" }, {
      status: user ? 200 : 401, headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ message: "Authentication service is temporarily unavailable. Please try again." }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
