'use client';
import { useEffect,useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { AdminCard } from '@/components/common/AdminCard';
import { Button } from '@/components/ui/button';
import { adminReportsApi,type ReportKind,type ReportPage } from '@/lib/admin-reports-client';
import { schoolRecordsApi,type SchoolOptions } from '@/lib/school-records-client';
import { examinationsApi } from '@/lib/examinations-client';
const columns:Record<ReportKind,string[]>={classes:['year','class','section','enrollments','students'],enrollments:['admission','student','year','class','section','roll','start','end'],'student-login':['name','email','enabled','session_version','policy_updated'],'access-history':['account','email','role','changed_by','previous_enabled','login_enabled','created_at'],'exam-summary':['admission','student','expected','graded','maximum','score','percentage','passed','position','subjects']};
const display=(v:unknown)=>v===null||v===undefined?'Not recorded':typeof v==='object'?JSON.stringify(v):String(v);
export function reportCsv(data:ReportPage,keys:string[]) {
  const quote=(v:unknown)=>'"'+display(v).replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
  return [keys.map(quote).join(','),...data.items.map(row=>keys.map(k=>quote(row[k])).join(','))].join('\r\n');
}
export function AdminReportPanel({kind,title}:{kind:ReportKind;title:string}) {
  const [page,setPage]=useState(1),[search,setSearch]=useState(''),[revision,setRevision]=useState(0);
  const [data,setData]=useState<ReportPage|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const [options,setOptions]=useState<SchoolOptions|null>(null),[types,setTypes]=useState<{id:string;label:string}[]>([]),[typePage,setTypePage]=useState(1),[typeTotal,setTypeTotal]=useState(0),[optionError,setOptionError]=useState('');
  const [placement,setPlacement]=useState(''),[exam,setExam]=useState('');
  const aggregate=kind==='exam-summary',ready=!aggregate||Boolean(placement&&exam);
  useEffect(()=>{
    let active=true;
    if(aggregate) void Promise.all([schoolRecordsApi.options(),examinationsApi.options('types',typePage)]).then(([o,t])=>{if(active){setOptions(o);setTypes(t.items);setTypeTotal(t.total);setOptionError('');}},e=>{if(active)setOptionError(e instanceof Error?e.message:'Unable to load exam choices');});
    return ()=>{active=false;};
  },[aggregate,typePage,revision]);
  useEffect(()=>{
    let active=true;
    if(ready) void adminReportsApi.list(kind,page,search,placement,exam).then(result=>{if(active){setData(result);setError('');setLoading(false);}},e=>{if(active){setData(null);setError(e instanceof Error?e.message:'Unable to load report');setLoading(false);}});
    return ()=>{active=false;};
  },[kind,page,search,placement,exam,revision,ready]);
  function change(action:()=>void){setData(null);setError('');setLoading(true);setPage(1);action();}
  function exportPage(){if(!data)return;const url=URL.createObjectURL(new Blob([reportCsv(data,columns[kind])],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=kind+'-page-'+page+'.csv';a.click();URL.revokeObjectURL(url);}
  return <div className="container mx-auto space-y-6"><PageHeader title={title} subtitle="Persisted school records"/><AdminCard><div className="space-y-4 p-6">
    {aggregate&&<><label>Class and section <select value={placement} onChange={e=>change(()=>setPlacement(e.target.value))}><option value="">Choose class</option>{options?.placements.map(o=><option key={o.id} value={o.id}>{o.yearName} / {o.className} / {o.sectionName}</option>)}</select></label><label>Exam type <select value={exam} onChange={e=>change(()=>setExam(e.target.value))}><option value="">Choose exam type</option>{types.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label><Button variant="outline" disabled={typePage===1} onClick={()=>setTypePage(typePage-1)}>Previous exam types</Button><Button variant="outline" disabled={typePage*20>=typeTotal} onClick={()=>setTypePage(typePage+1)}>More exam types</Button></>}
    <label>Search report <input className="ml-2 rounded-xl border p-2" value={search} onChange={e=>change(()=>setSearch(e.target.value))}/></label><Button variant="outline" onClick={()=>{setLoading(true);setData(null);setRevision(revision+1);}}>Reload report</Button>
    {optionError&&<p role="alert">{optionError}</p>}{!ready?<p>Choose an exam type and class to view results.</p>:<>{loading&&<p>Loading report…</p>}{error&&<p role="alert">{error}</p>}{data&&<><p>{data.basis}</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{columns[kind].map(c=><th key={c}>{c.replaceAll('_',' ')}</th>)}</tr></thead><tbody>{data.items.map(row=><tr className="border-t" key={row.id}>{columns[kind].map(c=><td className="p-2" key={c}>{display(row[c])}</td>)}</tr>)}</tbody></table></div>{!data.items.length&&<p>No matching recorded data.</p>}<div className="flex gap-3"><Button variant="outline" disabled={page===1} onClick={()=>{setLoading(true);setData(null);setPage(page-1);}}>Previous</Button><span>Page {page} · {data.total} records</span><Button variant="outline" disabled={page*data.pageSize>=data.total} onClick={()=>{setLoading(true);setData(null);setPage(page+1);}}>Next</Button><Button disabled={!data.items.length} onClick={exportPage}>Export this page as CSV</Button></div></>}</>}
  </div></AdminCard></div>;
}
