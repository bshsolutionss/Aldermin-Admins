/** Includes legacy aliases, while excluding Dashboard and unrelated admin tools. */
const moduleRoots = new Set([
  "student-info", "behaviour", "fees", "fee", "homework", "library",
  "examination", "exam-plan", "online-exam", "human-resource", "hr",
  "teacher-evaluation", "leave", "admin-section", "academics", "academic",
  "study-material", "lesson-plan", "bulk-print", "download-center", "accounts", "dormitory",
]);

export function isModuleRoute(pathname: string) {
  const segments = pathname.split("/");
  return segments[1] === "admin" && moduleRoots.has(segments[2]);
}
