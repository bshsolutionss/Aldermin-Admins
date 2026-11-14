import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "@/lib/auth-server";

export async function proxySchoolSubjects(request: Request, id?: string, resource: "school-subjects" | "school-subject-assignments" = "school-subjects") {
  const mutation = request.method !== "GET";
  if (mutation && !isSameOrigin(request)) {
    return NextResponse.json({ message: "Cross-origin request denied" }, { status: 403 });
  }
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if (mutation ? user.role !== "admin" : !["admin", "instructor"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const options = resource === "school-subject-assignments" && id === "options" && !mutation;
    if (id && !options && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ message: "Invalid subject ID" }, { status: 400 });
    }
    let body: string | undefined;
    if (["POST", "PATCH"].includes(request.method)) {
      try { body = JSON.stringify(await request.json()); }
      catch { return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 }); }
    }
    const query = resource === "school-subject-assignments" && !mutation
      ? new URL(request.url).search : "";
    const response = await authFetch(`/${resource}${id ? `/${id}` : ""}${query}`, {
      method: request.method,
      headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body,
    });
    return NextResponse.json(await response.json(), {
      status: response.status, headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ message: "School Subjects service is temporarily unavailable. Please retry." }, { status: 503 });
  }
}
