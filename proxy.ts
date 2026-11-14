import { NextRequest, NextResponse } from "next/server";
import { sessionRecoveryUrl } from "./lib/session-navigation";

export function proxy(request: NextRequest) {
  const returnTo = request.nextUrl.pathname + request.nextUrl.search;
  const accessToken = request.cookies.get("access_token")?.value;
  // Only a navigation hint. The layout verifies identity and role with NestJS.
  let expired = !accessToken;
  if (accessToken) {
    try {
      const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString());
      expired = typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
    } catch { expired = true; }
  }
  if (expired && request.cookies.has("refresh_token")) {
    const response = NextResponse.redirect(new URL(sessionRecoveryUrl(returnTo), request.url));
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  const headers = new Headers(request.headers);
  headers.set("x-auth-return-to", returnTo);
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/admin/:path*"] };
