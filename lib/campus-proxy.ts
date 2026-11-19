import { NextResponse } from "next/server";
import { authFetch, getVerifiedUser, isSameOrigin } from "./auth-server";
const resources = [
  "question-groups",
  "questions",
  "exams",
  "exam-questions",
  "participants",
  "attempts",
  "answers",
  "office-catalogs",
  "inquiries",
  "visits",
  "correspondence",
  "complaints",
  "room-types",
  "buildings",
  "rooms",
  "allocations",
  "history",
];
const writable = resources.filter(
  (r) => !["attempts", "answers", "history"].includes(r),
);
const editable = writable.filter((r) => !["visits", "allocations"].includes(r));
const choices = [
  "question-groups",
  "questions",
  "subjects",
  "exams",
  "office-catalogs",
  "room-types",
  "buildings",
  "rooms",
  "students",
  "users",
  "staff",
  "classes",
  "enrollments",
  "allocations",
];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function proxyCampus(
  request: Request,
  parts: string[],
  learner = false,
) {
  const [resource, id, action] = parts,
    method = request.method;
  const allowed = learner
    ? (method === "GET" &&
        ((parts.length === 1 && resource === "exams") ||
          (parts.length === 2 && resource === "attempts" && uuid.test(id)))) ||
      (parts.length === 3 &&
        uuid.test(id) &&
        ((method === "POST" &&
          ((resource === "exams" && action === "start") ||
            (resource === "attempts" && action === "submit"))) ||
          (method === "PUT" &&
            resource === "attempts" &&
            action === "answers")))
    : (method === "GET" &&
        ((parts.length === 1 && resources.includes(resource)) ||
          (parts.length === 2 &&
            resource === "options" &&
            choices.includes(id)))) ||
      (method === "POST" &&
        parts.length === 1 &&
        writable.includes(resource)) ||
      (method === "PUT" &&
        uuid.test(id) &&
        ((parts.length === 2 && editable.includes(resource)) ||
          (parts.length === 3 &&
            (
              {
                exams: "status",
                attempts: "finalize",
                inquiries: "admit",
                visits: "checkout",
                allocations: "end",
              } as Record<string, string>
            )[resource] === action)));
  if (!allowed)
    return NextResponse.json(
      { message: "Unknown school operation" },
      { status: 404 },
    );
  if (method !== "GET" && !isSameOrigin(request))
    return NextResponse.json(
      { message: "Cross-origin request denied" },
      { status: 403 },
    );
  try {
    const { user, accessToken } = await getVerifiedUser();
    if (!user)
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    if (user.role !== (learner ? "student" : "admin"))
      return NextResponse.json(
        {
          message: learner ? "Student login required" : "Admin access required",
        },
        { status: 403 },
      );
    const init: RequestInit = {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    if (method !== "GET") {
      try {
        init.body = JSON.stringify(await request.json());
      } catch {
        return NextResponse.json(
          { message: "Invalid JSON body" },
          { status: 400 },
        );
      }
      init.headers = { ...init.headers, "Content-Type": "application/json" };
    }
    const response = await authFetch(
      "/" +
        (learner ? "online-exam-session" : "online-campus") +
        "/" +
        parts.join("/") +
        (method === "GET" ? new URL(request.url).search : ""),
      init,
    );
    return NextResponse.json(await response.json(), {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        message: "School operations are temporarily unavailable. Please retry.",
      },
      { status: 503 },
    );
  }
}
