import { sessionFetch } from './session-client';
export type OperationResource='download-types'|'download-links'|'seats'|'transport-routes'|'transport-assignments'|'subject-sessions'|'subject-attendance'|'carry-runs'|'messages'|'delivery-attempts'|'history';
export type OperationRow=Record<string,unknown>&{id:string;version:number};
export type OperationPage={installed:boolean;items:OperationRow[];total:number;page:number;pageSize:number;note:string};
export type OperationOptions={installed:boolean;options:Record<string,{id:string;label:string}[]>;page:number;note:string};
async function call<T>(path:string,method='GET',body?:unknown):Promise<T>{const r=await sessionFetch('/api/admin-operations/'+path,{method,cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw new Error(Array.isArray(data.message)?data.message.join('; '):data.message||'Unable to load operational records');return data;}
export const adminOperationsApi={
 list:(resource:OperationResource,page=1,search='',scopeId='',date='')=>call<OperationPage>(resource+'?'+new URLSearchParams({page:String(page),search,...(scopeId?{scopeId}:{}),...(date?{date}:{})})),
 options:(resource:OperationResource,page=1,search='')=>call<OperationOptions>('options/'+resource+'?'+new URLSearchParams({page:String(page),search})),
 save:(resource:OperationResource,values:Record<string,unknown>,requestId:string,id?:string,version?:number)=>call<{record:OperationRow}>(resource+(id?'/'+encodeURIComponent(id):''),id?'PUT':'POST',{values,...(id?{version}:{requestId})}),
 deliver:(row:OperationRow)=>call<{record:OperationRow}>('messages/'+encodeURIComponent(row.id)+'/deliver','POST',{values:{},version:row.version}),
};
