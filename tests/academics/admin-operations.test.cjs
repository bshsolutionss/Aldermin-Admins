async function register(){
 const {test}=await import('node:test'),assert=(await import('node:assert/strict')).default,{loadTs}=await import('../auth/load-ts.mjs');const stub=()=>null;
 const common={'@/components/ui/input':{Input:'input'},'@/components/common/PageHeader':{PageHeader:stub},'@/components/common/AdminCard':{AdminCard:stub}, '@/components/common/ModuleCard': {ModuleCard: stub}, '@/components/common/ModuleEditor': {ModuleEditor: stub},'@/components/ui/button':{Button:stub},'@/lib/document-print':{escapeDocumentText:v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}};
 const walk=n=>!n||typeof n!=='object'?[]:[n,...[n.props?.children].flat(Infinity).flatMap(walk)];const text=n=>n==null||typeof n==='boolean'?'':typeof n!=='object'?String(n):[n.props?.children].flat(Infinity).map(text).join('');
 function mount(api,resource='messages'){const slots=[],effects=[];let cursor=0;const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},useEffect(fn,deps){const i=cursor++,before=slots[i];if(!before||deps.some((v,k)=>v!==before.deps[k])){slots[i]={deps,cleanup:before?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}}};const mod=loadTs('components/modules/reports/OperationalPanel.tsx',{...common,react,'@/lib/admin-operations-client':{adminOperationsApi:api}});const render=()=>{cursor=0;return mod.OperationalPanel({resource,title:'Operations'});};return {...mod,render,async flush(){for(let i=0;i<3;i++){render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);}return render();}};}
 const page={installed:true,items:[],total:0,page:1,pageSize:20,note:''},options=async()=>({installed:true,options:{},note:''});
 test('operational migration gate disables form writes and displays no invented records',async()=>{
  let writes=0;const ui=mount({list:async()=>({...page,installed:false}),options,save:()=>writes++});const tree=await ui.flush();assert.equal(walk(tree).find(n=>n.type==='fieldset').props.disabled,true);assert.match(text(tree),/explicitly approved and applied/);walk(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});await new Promise(setImmediate);assert.equal(writes,0);
 });
 test('failed message saves retain the draft, suppress duplicate submission and reuse request ID on retry',async()=>{
  let reject;const calls=[];const ui=mount({list:async()=>page,options,save:(...args)=>{calls.push(args);return new Promise((_r,j)=>reject=j);}});let tree=await ui.flush();const inputs=()=>walk(ui.render()).filter(n=>n.type==='input');inputs().find(n=>n.props.maxLength===254).props.onChange({target:{value:'one@example.invalid'}});const submit=()=>walk(ui.render()).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});submit();submit();assert.equal(calls.length,1);reject(Error('Network unknown; retry safely'));await new Promise(setImmediate);tree=ui.render();assert.match(text(tree),/Network unknown/);assert.equal(inputs().find(n=>n.props.maxLength===254).props.value,'one@example.invalid');submit();assert.equal(calls.length,2);assert.equal(calls[0][2],calls[1][2]);reject(Error('Still unavailable'));await new Promise(setImmediate);
 });
 test('CSV and print use bounded persisted rows with escaped names and formula-safe fields',()=>{
  const {operationalPrint,operationalCsv}=mount({});const rows=[{id:'row',version:1,student:'<script>alert(1)</script>',seat:'=HYPERLINK("bad")'}];const html=operationalPrint('Exam <plan>',rows,['student','seat']);assert.ok(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);assert.match(html,/Content-Security-Policy/);assert.match(operationalCsv(rows,['seat']),/"'=HYPERLINK/);assert.throws(()=>operationalPrint('Empty',[],['seat']));
 });
 test('simple download forms omit unrelated reference queries and keep actions below all fields',async()=>{
  let queries=0;const ui=mount({list:async()=>page,options:async()=>{queries++;return{installed:true,options:{},page:1,note:''};}},'download-types');
  const tree=await ui.flush(),nodes=walk(tree);
  assert.equal(queries,0);
  assert.equal(nodes.some(n=>n.props?.['data-slot']==='reference-choices'),false);
  const actions=nodes.find(n=>n.props?.['data-slot']==='form-actions');
  assert.match(text(actions),/Save record/);assert.match(text(actions),/Cancel/);
  assert.equal(walk(actions).some(n=>n.type==='input'||n.type==='textarea'),false);
 });
 test('transport keeps real reference choices while simple email forms omit them',async()=>{
  let queries=0;const api={list:async()=>page,options:async()=>{queries++;return{installed:true,options:{staff:[]},page:1,note:''};}};
  const transport=await mount(api,'transport-routes').flush();
  assert.ok(queries>0);assert.ok(walk(transport).some(n=>n.props?.['data-slot']==='reference-choices'));
  const emails=await mount(api,'messages').flush();
  assert.equal(walk(emails).some(n=>n.props?.['data-slot']==='reference-choices'),false);
 });
 test('operational proxy rejects forged paths and cross-origin delivery and preserves migration-gate status',async()=>{
  const calls=[];const {GET,POST,PUT}=loadTs('app/api/admin-operations/[...path]/route.ts',{'@/lib/auth-server':{getVerifiedUser:async()=>({user:{role:'admin'},accessToken:'cookie'}),isSameOrigin:r=>r.headers.get('origin')==='http://localhost',authFetch:async(...args)=>{calls.push(args);return Response.json({message:'Pending approval'},{status:503});}}});const context=path=>({params:Promise.resolve({path})});
  assert.equal((await GET(new Request('http://localhost'),context(['passwords']))).status,404);assert.equal((await PUT(new Request('http://localhost',{method:'PUT'}),context(['messages','../users']))).status,404);assert.equal((await POST(new Request('http://localhost',{method:'POST',headers:{origin:'https://foreign.example'}}),context(['messages']))).status,403);
  assert.equal((await POST(new Request('http://localhost',{method:'POST',headers:{origin:'http://localhost'},body:'{'}),context(['messages']))).status,400);const result=await GET(new Request('http://localhost?search=a%26b'),context(['messages']));assert.equal(result.status,503);assert.equal(result.headers.get('cache-control'),'no-store');assert.match(calls[0][0],/search=a%26b/);
 });
 test('all eight operational route wrappers load the real shared workflow',()=>{
  const paths=['accounts/communicate/emailsmsandlog','accounts/communicate/sendemailandsms','download-center/type','exam-plan/seat-plan','fee/carry-forward','fees/carry-forward','reports/studentreports/student-transport-report','reports/studentreports/subject-attendance-report'];for(const path of paths){const {default:Page}=loadTs('app/admin/'+path+'/page.tsx',{'@/components/modules/reports/OperationalPanel':{OperationalWorkspace:stub}});assert.equal(Page().type,stub);}
 });
}
void register();
