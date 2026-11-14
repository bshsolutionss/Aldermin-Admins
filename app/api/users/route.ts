import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, getVerifiedUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const { user, accessToken } = await getVerifiedUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    if (user.role?.toLowerCase() !== "admin") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const backendRes = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const data = await backendRes.json();

    const response = NextResponse.json(data, { status: backendRes.status });

    return response;
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
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

    if (user.role?.toLowerCase() !== "admin") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Register user via backend auth/register
    const registerRes = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
      cache: "no-store",
    });

    const regData = await registerRes.json();

    if (!registerRes.ok) {
      return NextResponse.json(
        {
          message: Array.isArray(regData.message)
            ? regData.message.join(", ")
            : regData.message ?? "Failed to create user",
        },
        { status: registerRes.status }
      );
    }

    const createdUser = regData.user;

    // If a non-student role is requested (e.g. admin or instructor), update the role
    if (role && role.toLowerCase() !== "student" && createdUser?.id) {
      try {
        const roleRes = await fetch(`${API_BASE_URL}/users/${createdUser.id}/role`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ role: role.toLowerCase() }),
          cache: "no-store",
        });

        if (roleRes.ok) {
          const roleData = await roleRes.json();
          createdUser.role = roleData.user?.role ?? role;
        }
      } catch (err) {
        console.error("Role update failed during user creation:", err);
      }
    }

    const response = NextResponse.json(
      { message: "User registered successfully", user: createdUser },
      { status: 201 }
    );

    return response;
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

