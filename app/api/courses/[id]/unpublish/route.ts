import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, getVerifiedUser } from "@/lib/auth-server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { user, accessToken } = await getVerifiedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const backendRes = await fetch(`${API_BASE_URL}/courses/${id}/unpublish`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const data = await backendRes.json();
    const response = NextResponse.json(data, { status: backendRes.status });
    return response;
  } catch (error) {
    console.error("PATCH unpublish error:", error);
    return NextResponse.json(
      { message: "Failed to unpublish course" },
      { status: 500 }
    );
  }
}

