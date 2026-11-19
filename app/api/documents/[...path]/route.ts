import { proxyDocuments } from "@/lib/documents-proxy";
type Context = { params: Promise<{ path: string[] }> };
async function handler(request: Request, context: Context) { return proxyDocuments(request, (await context.params).path); }
export const GET = handler;
export const POST = handler;
export const PUT = handler;
