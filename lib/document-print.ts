import type { DocumentIssue } from "./documents-client";
import { documentFields } from "./documents-client";

export function escapeDocumentText(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
const dimension = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
const image = (value: string | null, cls: string, alt: string) => value && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 800000
  ? `<img class="${cls}" src="${value}" alt="${escapeDocumentText(alt)}">` : "";
export function documentPrintHtml(items: DocumentIssue[], origin: string, preview = false) {
  const url = new URL(origin);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid verification origin");
  const trustedOrigin = url.origin;
  const pageStyles: string[] = [];
  const cards = items.map((item, index) => {
    const { template, subject, assets } = item.snapshot, l = template.layout;
    const font = ["serif", "sans-serif", "monospace"].includes(l.font) ? l.font : "serif";
    const align = ["left", "center", "right"].includes(l.align) ? l.align : "center";
    const values = { ...subject.values, fullName: subject.fullName, reference: subject.reference };
    const body = template.body.replace(/{{(.*?)}}/g, (_match, field: keyof typeof values) => String(values[field] || "Not recorded"));
    const fields = l.fields.filter(f => f !== "portrait").map(f => `<div><span>${escapeDocumentText(documentFields[f])}: </span>${escapeDocumentText(values[f] || "Not recorded")}</div>`).join("");
    const verifyUrl = trustedOrigin + "/verify-document/" + encodeURIComponent(item.verification_token);
    if (item.kind === "certificate") pageStyles.push(`@page document${index}{size:${dimension(l.widthMm,40,320)+16}mm ${dimension(l.heightMm,40,320)+16}mm;margin:8mm}`);
    return `<article class="document ${item.kind === "certificate" ? "certificate" : "id-card"}" style="${item.kind === "certificate" ? `page:document${index};` : ""}width:${dimension(l.widthMm, 40, 320)}mm;min-height:${dimension(l.heightMm, 40, 320)}mm;font-family:${font};font-size:${dimension(l.fontSize, 8, 48)}pt;text-align:${align}">
      ${image(assets.background, "background", "Background artwork")}<div class="content">${preview ? '<p class="preview">PREVIEW — NOT ISSUED</p>' : ""}
      <h1>${escapeDocumentText(template.heading)}</h1>${l.fields.includes("portrait") ? image(assets.portrait, "portrait", "Portrait") : ""}
      <p class="body">${escapeDocumentText(body)}</p><div class="fields">${fields}</div>${image(assets.signature, "signature", "Signature or seal")}
      <footer>${escapeDocumentText(item.document_no)}<br>Issued: ${escapeDocumentText(item.issued_on)}${item.expires_on ? " · Expires: " + escapeDocumentText(item.expires_on) : ""}${preview ? "" : `<br><a href="${escapeDocumentText(verifyUrl)}">Verify current status</a><br><small>${escapeDocumentText(verifyUrl)}</small>`}</footer></div></article>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><title>Issued documents</title><style>
  *{box-sizing:border-box}body{margin:8mm;color:#111;background:white}.documents{display:flex;flex-wrap:wrap;gap:5mm;align-items:flex-start}.document{position:relative;border:1px solid #999;padding:6mm;overflow:hidden;break-inside:avoid;max-width:100%}.certificate{break-after:page}.content{position:relative;z-index:1;overflow-wrap:anywhere}h1{font-size:1.3em;margin:0 0 4mm}.body{white-space:pre-wrap}.fields{font-size:.65em;line-height:1.6}.background{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.22}.portrait{max-width:22mm;max-height:28mm;object-fit:contain}.signature{display:block;max-width:35mm;max-height:16mm;margin:4mm auto}footer{font:8pt sans-serif;margin-top:4mm;overflow-wrap:anywhere}.preview{color:#9a3412;font:10pt sans-serif}@media print{body{margin:0}.document{max-width:none}a{color:#111;text-decoration:none}}@page{size:auto;margin:8mm}
  ${pageStyles.join("")}</style></head><body><main class="documents">${cards}</main></body></html>`;
}

export async function renderPrintWindow(popup: Window, html: string) {
  popup.opener = null;
  popup.document.open(); popup.document.write(html); popup.document.close();
  await Promise.all(Array.from(popup.document.images).map(img => img.decode()));
  await popup.document.fonts.ready;
  if (popup.closed) throw new Error("Print window was closed. The print request remains in history.");
  popup.focus(); popup.print();
}
