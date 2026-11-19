import { proxyExaminations } from "@/lib/examinations-proxy";
async function handler(
  request: Request,
  context: { params: Promise<{ segments: string[] }> },
) {
  return proxyExaminations(request, (await context.params).segments);
}
export { handler as GET, handler as POST, handler as PUT };
