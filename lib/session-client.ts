let pendingSession: Promise<boolean> | null = null;
let fallbackLock: Promise<unknown> = Promise.resolve();
export async function withSessionLock<T>(action: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return await navigator.locks.request("aldermin-auth-session", action);
  }
  const pending = fallbackLock.then(action, action);
  fallbackLock = pending.catch(() => undefined);
  return pending;
}
/** Recheck cookies under the cross-tab lock before rotating a single-use token. */
export function ensureSession(): Promise<boolean> {
  if (!pendingSession) {
    pendingSession = withSessionLock(async () => {
      const profile = await fetch("/api/auth/me", { cache: "no-store" });
      if (profile.ok) return true;
      if (profile.status !== 401) throw new Error("Authentication service is temporarily unavailable. Please try again.");
      const refreshed = await fetch("/api/auth/refresh", { method: "POST", cache: "no-store" });
      if (refreshed.status === 401) return false;
      if (!refreshed.ok) throw new Error("Unable to renew your session. Please try again.");
      return true;
    }).finally(() => { pendingSession = null; });
  }
  return pendingSession;
}
export async function sessionFetch(endpoint: string, options: RequestInit) {
  let response = await fetch(endpoint, options);
  if (response.status === 401 && (!endpoint.startsWith("/api/auth/") || endpoint === "/api/auth/me")) {
    if (await ensureSession()) response = await fetch(endpoint, options);
  }
  return response;
}
