export function safeAdminReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/admin";
  const url = new URL(value, "http://session.local");
  if (url.origin !== "http://session.local" || (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/"))) return "/admin";
  return `${url.pathname}${url.search}`;
}
export function sessionRecoveryUrl(returnTo: string) {
  return `/auth/session?returnTo=${encodeURIComponent(safeAdminReturnTo(returnTo))}`;
}
