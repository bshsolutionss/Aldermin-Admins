import { sessionFetch } from './session-client';
export type ReportKind = 'classes'|'enrollments'|'student-login'|'access-history'|'exam-summary';
export type ReportRow = {id:string;[key:string]:unknown};
export type ReportPage = {items:ReportRow[];total:number;page:number;pageSize:number;basis:string};
export const adminReportsApi = {
  async list(kind:ReportKind,page=1,search='',classSectionId='',examTypeId=''):Promise<ReportPage> {
    const q=new URLSearchParams({page:String(page),pageSize:'20',search,...(classSectionId?{classSectionId}:{}),...(examTypeId?{examTypeId}:{})});
    const response=await sessionFetch('/api/admin-reports/'+kind+'?'+q,{cache:'no-store'});
    const data=await response.json();
    if(!response.ok) throw new Error(Array.isArray(data.message)?data.message.join('; '):data.message||'Unable to load report');
    return data;
  },
};
