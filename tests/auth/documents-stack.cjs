// Manual local-stack acceptance. Requires the backend's active rollback fixture
// and a production Next server on the fixture's exact loopback port.
async function main(){
 const assert=(await import('node:assert/strict')).default,fs=(await import('node:fs')).default,{tmpdir}=await import('node:os'),{join}=await import('node:path'),{randomUUID}=await import('node:crypto');
 const fixture=JSON.parse(fs.readFileSync(join(tmpdir(),'aldermin-document-stack-fixture.json'),'utf8'));
 assert.equal(fixture.frontend,'http://localhost:43101');assert.match(fixture.email,/@example\.invalid$/);
 const login=await fetch(fixture.frontend+'/api/auth/login',{method:'POST',headers:{Origin:fixture.frontend,'Content-Type':'application/json'},body:JSON.stringify({email:fixture.email,password:fixture.password,portal:'admin'})});assert.equal(login.status,200);const user=await login.json();assert.equal(user.user.name,'ROLLBACK UI FIXTURE ADMIN');
 const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 async function api(path,method='GET',body,status=200){const r=await fetch(fixture.frontend+'/api/documents/'+path,{method,headers:{Cookie:cookie,Origin:fixture.frontend,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;}
 for(const path of ['admin-section/certificate','admin-section/id-card','admin-section/generate-certificate','admin-section/generate-id','bulk-print/certificate','bulk-print/id']){const r=await fetch(fixture.frontend+'/admin/'+path,{headers:{Cookie:cookie},redirect:'manual'});assert.equal(r.status,200,path);assert.match(await r.text(),/Institutional|Issuance|Print/);}
 const seen=[];
 for(const kind of ['certificate','id-card']){
  const audience=kind==='certificate'?'student':'staff';
  const template={requestId:randomUUID(),kind,audience,name:'ROLLBACK Stack '+randomUUID(),heading:'Stack acceptance',body:'Issued to {{fullName}}',layout:{font:'serif',fontSize:12,align:'center',widthMm:kind==='certificate'?297:57,heightMm:kind==='certificate'?210:89,fields:['reference','fullName']},backgroundFileId:null,signatureFileId:null,archived:false,version:0};
  const saved=(await api('templates','POST',template,201)).record;assert.equal(saved.version,1);
  const issue={requestId:randomUUID(),templateId:saved.id,templateVersion:1,subjectId:audience==='student'?fixture.studentId:fixture.staffId,issuedOn:new Date().toISOString().slice(0,10),expiresOn:null,allowInactive:false};
  const issued=(await api('issues','POST',{items:[issue]},201)).items[0];assert.equal((await api('issues','POST',{items:[issue]},201)).items[0].id,issued.id);
  await api('templates/'+saved.id,'PUT',{...template,heading:'Changed after issuance',version:1});assert.equal((await api('issues/'+issued.id)).record.snapshot.template.heading,'Stack acceptance');
  for(const method of ['print','html-export']){const payload={requestId:randomUUID(),method,issueIds:[issued.id]};const print=await api('print-jobs','POST',payload,201);assert.equal((await api('print-jobs','POST',payload,201)).job.id,print.job.id);assert.equal(print.items[0].id,issued.id);}
  const history=await api('history?kind='+kind);assert.ok(history.items.some(e=>e.record_id===issued.id));
  const publicPage=await fetch(fixture.frontend+'/verify-document/'+issued.verification_token);assert.equal(publicPage.status,200);const html=await publicPage.text();assert.ok(html.includes(issued.document_no));assert.ok(!html.includes('ROLLBACK UI FIXTURE ADMIN'));assert.ok(!html.includes('ROLLBACK STAFF FIXTURE'));
  await api('issues/'+issued.id+'/revoke','POST',{requestId:randomUUID(),reason:'Rollback acceptance correction'},201);await api('print-jobs','POST',{requestId:randomUUID(),method:'print',issueIds:[issued.id]},409);
  seen.push({kind,designer:'PASS',issuance:'PASS',immutableSnapshot:'PASS',printAndExport:'PASS',history:'PASS',publicPrivacy:'PASS',revocation:'PASS'});
 }
 const report={checkedAt:new Date().toISOString(),frontend:'production Next.js',backend:'actual Nest AppModule',persistence:'live PostgreSQL outer rollback fixture',routeResponses:6,workflows:seen};fs.writeFileSync('docs/DOCUMENT_STACK_ACCEPTANCE.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
void main().catch(e=>{console.error(e);process.exitCode=1;});

