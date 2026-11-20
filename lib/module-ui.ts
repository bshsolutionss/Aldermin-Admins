/** Every admin workflow shares the same layout, including settings and reports. */
export function isModuleRoute(pathname: string) {
  const segments = pathname.split("/");
  return segments[1] === "admin" && Boolean(segments[2]) && segments[2] !== "dashboard";
}
