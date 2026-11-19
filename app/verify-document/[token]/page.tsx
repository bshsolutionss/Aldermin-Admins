import { authFetch } from "@/lib/auth-server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Document verification", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function VerifyDocument({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let record: { document_no: string; kind: string; issued_on: string; expires_on: string | null; status: string } | null = null;
  let error = "Document not found.";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    try {
      const response = await authFetch("/document-verification/" + token);
      if (response.ok) record = await response.json();
      else if (response.status !== 404) error = "Verification is temporarily unavailable. Please retry.";
    } catch { error = "Verification is temporarily unavailable. Please retry."; }
  }
  return <main className="max-w-2xl mx-auto p-8 space-y-4"><h1 className="text-2xl font-semibold">Document verification</h1>{record ? <dl className="space-y-2"><dt>Document reference</dt><dd>{record.document_no}</dd><dt>Status</dt><dd>{record.status}</dd><dt>Type</dt><dd>{record.kind}</dd><dt>Issued on (UTC date)</dt><dd>{record.issued_on}</dd><dt>Expires on (UTC date)</dt><dd>{record.expires_on ?? "No expiry recorded"}</dd></dl> : <p role="alert">{error}</p>}<p className="text-sm">Verification shows current status. Recipient details are private.</p></main>;
}
