import { sessionFetch } from "./session-client";
import type { Page } from "./school-records-client";
export type DocumentKind="certificate"|"id-card";
export type DocumentAudience="student"|"staff";
export const documentFields={reference:"Admission / Staff No",fullName:"Full Name",className:"Class / Grade",fatherName:"Father",motherName:"Mother",address:"Address",phone:"Phone",birthDate:"Date of Birth",role:"Role",portrait:"Portrait"} as const;
export type DocumentField=keyof typeof documentFields;
export type DocumentLayout={font:"serif"|"sans-serif"|"monospace";fontSize:number;align:"left"|"center"|"right";widthMm:number;heightMm:number;fields:DocumentField[]};
export type TemplateInput={requestId:string;kind:DocumentKind;audience:DocumentAudience;name:string;heading:string;body:string;layout:DocumentLayout;backgroundFileId:string|null;signatureFileId:string|null;archived:boolean;version:number};
export type DocumentTemplate={id:string;request_id:string;kind:DocumentKind;audience:DocumentAudience;name:string;heading:string;body:string;layout:DocumentLayout;background_file_id:string|null;signature_file_id:string|null;archived:boolean;version:number};
export type DocumentSummary={id:string;kind:DocumentKind;audience:DocumentAudience;document_no:string;issued_on:string;expires_on:string|null;status:"valid"|"revoked"|"expired"|"not-yet-valid";subject_name:string;template_name:string};
export type DocumentIssue=DocumentSummary&{verification_token:string;snapshot:{template:{name:string;heading:string;body:string;version:number;layout:DocumentLayout};subject:{reference:string;fullName:string;values:Partial<Record<DocumentField,string>>};assets:{background:string|null;signature:string|null;portrait:string|null}}};
export type IssueInput={requestId:string;templateId:string;templateVersion:number;subjectId:string;issuedOn:string;expiresOn:string|null;allowInactive?:boolean};
export type DocumentHistory={id:string;action:string;record_id:string;created_at:string;detail:string;actor_name:string};
export type TemplateEvent={id:string;version:number;created_at:string;actor_name:string;before_state:DocumentTemplate|null;after_state:DocumentTemplate};
export type DocumentChoice={id:string;name:string;reference:string};
export function blankTemplate(kind:DocumentKind):TemplateInput{return {requestId:crypto.randomUUID(),kind,audience:"student",name:"",heading:"",body:"",layout:{font:"serif",fontSize:kind==="certificate"?24:10,align:"center",widthMm:kind==="certificate"?297:57,heightMm:kind==="certificate"?210:89,fields:["reference","fullName","className"]},backgroundFileId:null,signatureFileId:null,archived:false,version:0};}
export function templateInput(row:DocumentTemplate):TemplateInput{return {requestId:row.request_id,kind:row.kind,audience:row.audience,name:row.name,heading:row.heading,body:row.body,layout:row.layout,backgroundFileId:row.background_file_id,signatureFileId:row.signature_file_id,archived:row.archived,version:row.version};}
async function call<T>(path:string,method="GET",body?:unknown):Promise<T>{
 const response=await sessionFetch("/api/documents/"+path,{method,cache:"no-store",...(body===undefined?{}:{headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})});
 const result=await response.json().catch(()=>{throw new Error("Invalid document service response. Please retry.");});
 if(!response.ok)throw new Error(Array.isArray(result.message)?result.message.join("; "):result.message||"Document request failed");
 return result as T;
}
const query=(kind:DocumentKind,page:number,search="",audience="all")=>new URLSearchParams({kind,page:String(page),pageSize:"20",search,audience});
export const documentsApi={
 image:(id:string)=>call<{data:string}>("assets/"+encodeURIComponent(id)),
 templates:(kind:DocumentKind,page=1,search="",audience="all")=>call<Page<DocumentTemplate>>("templates?"+query(kind,page,search,audience)),
 issues:(kind:DocumentKind,page=1,search="",audience="all")=>call<Page<DocumentSummary>>("issues?"+query(kind,page,search,audience)),
 history:(kind:DocumentKind,page=1)=>call<Page<DocumentHistory>>("history?"+query(kind,page)),
 templateHistory:(id:string,page=1)=>call<Page<TemplateEvent>>("templates/"+encodeURIComponent(id)+"/history?page="+page+"&pageSize=20"),
 subjects:(audience:DocumentAudience,page=1,search="",includeInactive=false)=>call<Page<DocumentChoice>>("options/"+audience+"?"+new URLSearchParams({page:String(page),pageSize:"20",search,includeInactive:String(includeInactive)})),
 saveTemplate:(input:TemplateInput,id?:string)=>call<{record:DocumentTemplate}>("templates"+(id?"/"+encodeURIComponent(id):""),id?"PUT":"POST",input),
 issue:(items:IssueInput[])=>call<{items:DocumentIssue[]}>("issues","POST",{items}),
 get:(id:string)=>call<{record:DocumentIssue}>("issues/"+encodeURIComponent(id)),
 revoke:(id:string,requestId:string,reason:string)=>call("issues/"+encodeURIComponent(id)+"/revoke","POST",{requestId,reason}),
 print:(requestId:string,issueIds:string[],method:"print"|"html-export")=>call<{job:{id:string};items:DocumentIssue[]}>("print-jobs","POST",{requestId,issueIds,method}),
};

