import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, getVerifiedUser } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { accessToken } = await getVerifiedUser();

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const backendRes = await fetch(`${API_BASE_URL}/courses/${id}`, {
      headers,
      cache: "no-store",
    });

    const data = await backendRes.json();
    const response = NextResponse.json(data, { status: backendRes.status });
    return response;
  } catch (error) {
    console.error("GET /api/courses/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve course" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();

    const backendRes = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await backendRes.json();
    const response = NextResponse.json(data, { status: backendRes.status });
    return response;
  } catch (error) {
    console.error("PATCH /api/courses/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { user, accessToken } = await getVerifiedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const backendRes = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: backendRes.status });
    return response;
  } catch (error) {
    console.error("DELETE /api/courses/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to delete course" },
      { status: 500 }
    );
  }
}

