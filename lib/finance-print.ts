import type { FinanceRow } from './finance-client';
import { formatMinor } from './finance-client';
import { escapeDocumentText as escape } from './document-print';
export function financePrintHtml(kind:'payments'|'payroll',rows:FinanceRow[],currency:string|null) {
  if(!rows.length||rows.length>20) throw new Error('Select between 1 and 20 records');
  const money=(v:unknown)=>escape((currency??'Currency unconfigured')+' '+formatMinor(v));
  const field=(label:string,value:unknown)=>'<p><b>'+escape(label)+':</b> '+escape(value??'Not recorded')+'</p>';
  const cards=rows.map(r=>'<article><h1>'+ (kind==='payments'?'Fee Payment Receipt':'Payroll Statement')+'</h1>'+field('Record',r.id)+(kind==='payments'?field('Student',r.student_name)+field('Admission',r.admission_no)+field('Invoice',r.invoice_title)+field('Paid on',r.payment_date)+field('Method',r.method)+field('Reference',r.reference):field('Staff',r.staff_name)+field('Period',r.period)+field('Status',r.status)+field('Paid on',r.paid_date))+(kind==='payroll'?'<p>Gross: '+money(r.gross)+'</p><p>Deduction: '+money(r.deduction)+'</p>':'')+'<p><b>'+(kind==='payments'?'Paid':'Net payroll')+': '+money(r.amount)+'</b></p><small>Generated from posted records. A payroll statement does not confirm payment unless its status is paid.</small></article>').join('');
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>Financial records</title><style>body{font:12pt sans-serif;color:#111}article{padding:12mm;border:1px solid #777;break-after:page;overflow-wrap:anywhere}small{font-size:9pt}@page{size:A4;margin:12mm}</style></head><body>'+cards+'</body></html>';
}
