import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
export interface AuthUser { id: string; name: string; email: string; role: string; }
export interface TokenPair { accessToken: string; refreshToken: string; expiresIn?: number; }

export class AuthServiceUnavailableError extends Error {
  constructor() {
    super("Authentication service is temporarily unavailable. Please try again.");
    this.name = "AuthServiceUnavailableError";
  }
}
export async function authFetch(path: string, options: RequestInit = {}) {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...options, cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
  } catch { throw new AuthServiceUnavailableError(); }
}
export function setAuthCookies(response: NextResponse, tokens: TokenPair) {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  response.cookies.set("access_token", tokens.accessToken, { ...options, maxAge: tokens.expiresIn ?? 900 });
  response.cookies.set("refresh_token", tokens.refreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 });
  response.headers.set("Cache-Control", "no-store");
}
export function clearAuthCookies(response: NextResponse) {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 0 };
  response.cookies.set("access_token", "", options);
  response.cookies.set("refresh_token", "", options);
  response.headers.set("Cache-Control", "no-store");
}
/** Verification is read-only. Only POST /api/auth/refresh rotates tokens. */
export async function getVerifiedUser(): Promise<{ user: AuthUser | null; accessToken: string | null }> {
  const accessToken = (await cookies()).get("access_token")?.value;
  if (!accessToken) return { user: null, accessToken: null };
  const res = await authFetch("/users/me", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (res.status === 401) return { user: null, accessToken: null };
  if (!res.ok) throw new AuthServiceUnavailableError();
  let user: AuthUser;
  try {
    user = await res.json();
    if (!user.id || !user.email || !user.name || !user.role) throw new Error();
  } catch { throw new AuthServiceUnavailableError(); }
  return { user, accessToken };
}
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  return !origin || origin === new URL(request.url).origin;
}
