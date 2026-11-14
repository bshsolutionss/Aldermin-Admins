import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, getVerifiedUser } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const getMine = searchParams.get("mine") === "true";

    if (getMine) {
      const { user, accessToken } = await getVerifiedUser();
      if (!user) {
        return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
      }

      const backendRes = await fetch(`${API_BASE_URL}/courses/mine`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const data = await backendRes.json();
      const response = NextResponse.json(data, { status: backendRes.status });
      return response;
    }

    // Default: fetch published courses
    const backendRes = await fetch(`${API_BASE_URL}/courses`, {
      cache: "no-store",
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json(
      { message: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, accessToken } = await getVerifiedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { message: "Course title is required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${API_BASE_URL}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: title.trim(),
        description: description?.trim() || undefined,
      }),
      cache: "no-store",
    });

    const data = await backendRes.json();

    const response = NextResponse.json(data, { status: backendRes.status });
    return response;
  } catch (error) {
    console.error("POST /api/courses error:", error);
    return NextResponse.json(
      { message: "Failed to create course" },
      { status: 500 }
    );
  }
}

