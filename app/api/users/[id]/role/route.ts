import { proxyUserAccess } from "@/lib/user-access-proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return proxyUserAccess(request, "role", (await context.params).id);
}

