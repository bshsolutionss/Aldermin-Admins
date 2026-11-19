async function register(){
 const {test}=await import('node:test'),assert=(await import('node:assert/strict')).default,{loadTs}=await import('../auth/load-ts.mjs');
 const stub=()=>null;
 const common={'@/components/common/PageHeader':{PageHeader:stub},'@/components/common/AdminCard':{AdminCard:stub},'@/components/ui/button':{Button:stub}};
 const walk=n=>!n||typeof n!=='object'?[]:[n,...[n.props?.children].flat(Infinity).flatMap(walk)];
 const text=n=>n==null||typeof n==='boolean'?'':typeof n!=='object'?String(n):[n.props?.children].flat(Infinity).map(text).join('');
 function mount(api){const slots=[],effects=[];let cursor=0;const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useEffect(fn,deps){const i=cursor++,before=slots[i];if(!before||deps.some((v,k)=>v!==before.deps[k])){slots[i]={deps,cleanup:before?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}}};const {AdminReportPanel}=loadTs('components/modules/reports/AdminReportPanel.tsx',{...common,react,'@/lib/admin-reports-client':{adminReportsApi:api},'@/lib/school-records-client':{schoolRecordsApi:{}},'@/lib/examinations-client':{examinationsApi:{}}});const render=()=>{cursor=0;return AdminReportPanel({kind:'classes',title:'Classes'});};return {render,async flush(){for(let i=0;i<3;i++){render();effects.splice(0).forEach(f=>f());await new Promise(setImmediate);}return render();}};}
 test('new report proxy allowlists reads, verifies Admin cookies and preserves backend failures without caching',async()=>{
  for(const [user,status] of [[null,401],[{role:'student'},403],[{role:'admin'},409]]) {
   const calls=[];const {GET}=loadTs('app/api/admin-reports/[kind]/route.ts',{'@/lib/auth-server':{getVerifiedUser:async()=>({user,accessToken:'cookie'}),authFetch:async(...args)=>{calls.push(args);return Response.json({message:'Conflict'},{status:409});}}});
   assert.equal((await GET(new Request('http://localhost/api/admin-reports/classes?search=x'),{params:Promise.resolve({kind:'classes'})})).status,status);
   assert.equal(calls.length,user?.role==='admin'?1:0);if(calls.length)assert.equal(calls[0][0],'/admin-reports/classes?search=x');
   assert.equal((await GET(new Request('http://localhost'),{params:Promise.resolve({kind:'users/passwords'})})).status,404);
  }
 });
 test('report failures clear old records, retry succeeds and late searches cannot replace the newest result',async()=>{
  const pending=[];const ui=mount({list:(...args)=>new Promise((resolve,reject)=>pending.push({args,resolve,reject}))});
  let tree=await ui.flush();pending[0].reject(Error('Offline'));tree=await ui.flush();assert.match(text(tree),/Offline/);
  walk(tree).find(n=>n.props?.onClick&&text(n)==='Reload report').props.onClick();await ui.flush();pending[1].resolve({items:[{id:'persisted',class:'Saved class'}],total:1,page:1,pageSize:20,basis:'Actual placements'});tree=await ui.flush();assert.match(text(tree),/Saved class/);
  walk(tree).find(n=>n.type==='input').props.onChange({target:{value:'older'}});await ui.flush();walk(ui.render()).find(n=>n.type==='input').props.onChange({target:{value:'newer'}});await ui.flush();
  pending[3].resolve({items:[{id:'new',class:'Newest class'}],total:1,page:1,pageSize:20,basis:'Recorded'});await ui.flush();pending[2].resolve({items:[{id:'old',class:'Old class'}],total:1,page:1,pageSize:20,basis:'Recorded'});tree=await ui.flush();assert.match(text(tree),/Newest class/);assert.doesNotMatch(text(tree),/Old class/);
 });
 test('report CSV quotes delimiters and formulas and preserves a genuine zero',()=>{
  const {reportCsv}=loadTs('components/modules/reports/AdminReportPanel.tsx',{...common,'@/lib/admin-reports-client':{},'@/lib/school-records-client':{},'@/lib/examinations-client':{}});
  const csv=reportCsv({items:[{a:'=1+1',b:'a,"b',c:0}]},['a','b','c']);assert.match(csv,/"'=1\+1"/);assert.match(csv,/"a,""b"/);assert.match(csv,/,"0"/);
 });
 test('financial and examination print output escapes all identities and never marks generated payroll as paid',()=>{
  const documents=loadTs('lib/document-print.ts',{'./documents-client':{documentFields:{}}});
  const finance=loadTs('lib/finance-print.ts',{'./finance-client':{formatMinor:v=>String(v)},'./document-print':documents});
  const html=finance.financePrintHtml('payroll',[{id:'1',staff_name:'<script>x</script>',amount:0,status:'generated',period:'2026-11'}],null);
  assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/Currency unconfigured/);assert.match(html,/generated/);assert.match(html,/does not confirm payment/);assert.throws(()=>finance.financePrintHtml('payments',[],null));
  const admission=loadTs('components/modules/examination/AdmissionPrint.tsx',{...common,'@/lib/examinations-client':{},'@/lib/document-print':documents});
  const card=admission.admissionHtml({items:[{enrollmentId:'e',name:'<img onerror=x>',admissionNo:'A1',rollNo:'1'}],assessment:{title:'Real exam'},schedule:{date:'2026-11-17'}},{startTime:'09:00',endTime:'10:00',roomNumber:'R1'},['e']);assert.doesNotMatch(card,/<img/);assert.match(card,/&lt;img/);assert.match(card,/No fee clearance or assigned seat is inferred/);
 });
}
void register();
