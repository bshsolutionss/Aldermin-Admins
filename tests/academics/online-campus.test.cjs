async function registerTests(){
const {test}=await import('node:test'),assert=(await import('node:assert/strict')).default,{loadTs}=await import('../auth/load-ts.mjs');
const id='11111111-1111-4111-8111-111111111111',page={items:[],total:0,page:1,pageSize:20};
const client=(fetcher=async()=>Response.json({}))=>loadTs('lib/campus-client.ts',{'./session-client':{sessionFetch:fetcher}});
test('campus proxy separates Admin and learner paths and rejects cross-origin or forged routes',async()=>{
  let user={role:'admin'},origin=true;const calls=[];
  const {proxyCampus:proxy}=loadTs('lib/campus-proxy.ts',{'./auth-server':{getVerifiedUser:async()=>({user,accessToken:'verified-cookie'}),isSameOrigin:()=>origin,authFetch:async(...args)=>{calls.push(args);return Response.json({message:'Conflict'},{status:409});}}});
  const req=(method='GET',body)=>new Request('http://localhost/api/online-campus/rooms?page=2',{method,...(body===undefined?{}:{body})});
  for(const parts of [['users'],['options','passwords'],['rooms','bad']])assert.equal((await proxy(req(),parts)).status,404);
  assert.equal((await proxy(req('DELETE'),['questions',id])).status,404);assert.equal((await proxy(req('PUT','{}'),['visits',id])).status,404);
  user=null;assert.equal((await proxy(req(),['rooms'])).status,401);user={role:'student'};assert.equal((await proxy(req(),['questions'])).status,403);
  assert.equal((await proxy(req(),['questions'],true)).status,404);origin=false;assert.equal((await proxy(req('POST','{}'),['exams',id,'start'],true)).status,403);
  origin=true;assert.equal((await proxy(req('POST','bad'),['exams',id,'start'],true)).status,400);assert.equal(calls.length,0);
  const response=await proxy(req('POST','{"requestId":"'+id+'"}'),['exams',id,'start'],true);assert.equal(response.status,409);assert.equal(calls[0][0],'/online-exam-session/exams/'+id+'/start');assert.equal(response.headers.get('Cache-Control'),'no-store');
  user={role:'admin'};assert.equal((await proxy(req(),['exams'],true)).status,403);
});
test('campus client strips question scopes, actors, scores and forged student privilege fields',async()=>{
  const calls=[],{campusApi}=client(async(...args)=>{calls.push(args);return Response.json({record:{id}});});
  await campusApi.save('exams',{requestId:id,version:0,assignmentId:id,title:'Exam',opensAt:'2026-01-01T12:00:00Z',closesAt:'2026-01-01T13:00:00Z',durationMinutes:30,passPercent:50,staffId:'forged',classSectionId:'forged',createdBy:'forged'});
  const body=JSON.parse(calls[0][1].body);assert.equal(body.requestId,id);assert.equal(body.staffId,undefined);assert.equal(body.classSectionId,undefined);
  await campusApi.admit(id,{requestId:id,version:2,admissionNo:'A1',firstName:'A',lastName:'B',birthDate:'2010-01-01',gender:'female',role:'admin',userId:'forged',email:''});
  assert.deepEqual(JSON.parse(calls[1][1].body),{requestId:id,version:2,student:{admissionNo:'A1',firstName:'A',lastName:'B',birthDate:'2010-01-01',gender:'female'}});
  await campusApi.action('exams',id,'status',{version:4,status:'published',correctIndex:0,score:100});assert.deepEqual(JSON.parse(calls[2][1].body),{version:4,status:'published'});
});
function nodes(tree){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return tree.props?[tree,...Object.values(tree.props).flatMap(nodes)]:[];}
function content(node){if(node===null||node===undefined)return '';if(typeof node==='string'||typeof node==='number')return String(node);if(Array.isArray(node))return node.map(content).join('');return content(node.props?.children);}
function mount(api,props={title:'Online exams',resource:'exams'}){
  const slots=[],effects=[];let cursor=0;
  const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},useRef(value){const i=cursor++;if(!(i in slots))slots[i]={current:value};return slots[i];},useEffect(fn,deps){const i=cursor++,before=slots[i];if(!before||deps.some((v,k)=>v!==before.deps[k])){slots[i]={deps,cleanup:before?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}}};
  const Panel=loadTs('components/modules/online-campus/CampusPanel.tsx',{react,'@/components/common/PageHeader':{PageHeader:'PageHeader'},'@/components/common/AdminCard':{AdminCard:'AdminCard'},'@/components/ui/button':{Button:'Button'},'@/lib/campus-client':{...client(),campusApi:api}}).default;
  const render=()=>{cursor=0;return Panel(props);};return {render,find:fn=>nodes(render()).find(fn),flush:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);}};
}
test('failed exam writes retain the draft/request ID and concurrent submit clicks only send once',async()=>{
  const calls=[];let reject;const h=mount({list:async()=>page,save:async(...args)=>{calls.push(args);return new Promise((_resolve,no)=>{reject=no;});}});
  await h.flush();h.find(n=>n.type==='Button'&&content(n)==='New record').props.onClick();const submit=()=>h.find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
  const pending=submit();await submit();assert.equal(calls.length,1);const requestId=calls[0][1].requestId;reject(Error('Exam conflict'));await pending;
  assert.ok(h.find(n=>n.props.role==='alert'&&content(n).includes('Your draft is retained')));const retry=submit();assert.equal(calls[1][1].requestId,requestId);reject(Error('Retry conflict'));await retry;
});
test('unapproved campus schema disables mutations and does not fabricate rows',async()=>{
  const {CampusError}=client(),h=mount({list:async()=>{throw new CampusError('Migration pending',503);}});await h.flush();assert.equal(h.find(n=>n.type==='Button'&&content(n)==='New record').props.disabled,true);assert.ok(h.find(n=>n.props.role==='alert'&&content(n).includes('Migration pending')));assert.equal(nodes(h.render()).filter(n=>n.type==='td'&&content(n)==='No records found.').length,0);
});
test('late front-office searches cannot overwrite a newer persisted list',async()=>{
  let oldResolve;const h=mount({list:async(_r,q)=>q.search==='old'?new Promise(resolve=>{oldResolve=resolve;}):({...page,items:[{id,version:1,name:q.search||'Initial',status:'new'}]})},{title:'Inquiries',resource:'inquiries'});await h.flush();const search=()=>h.find(n=>n.props['aria-label']==='Search school records');search().props.onChange({target:{value:'old'}});await h.flush();search().props.onChange({target:{value:'Newest'}});await h.flush();oldResolve({...page,items:[{id,name:'Old',version:1,status:'new'}]});await new Promise(setImmediate);assert.ok(nodes(h.render()).some(n=>n.type==='td'&&content(n)==='Newest'));assert.ok(!nodes(h.render()).some(n=>n.type==='td'&&content(n)==='Old'));
});
test('both route wrappers resolve params and retain the separate learner authorization mode',async()=>{
  const calls=[],mock={'@/lib/campus-proxy':{proxyCampus:async(...args)=>{calls.push(args);return Response.json({});}}};const admin=loadTs('app/api/online-campus/[...path]/route.ts',mock),learner=loadTs('app/api/online-exam-session/[...path]/route.ts',mock),req=new Request('http://localhost/api/online-campus/exams');await admin.GET(req,{params:Promise.resolve({path:['exams']})});await learner.GET(req,{params:Promise.resolve({path:['exams']})});assert.deepEqual(calls[0],[req,['exams']]);assert.deepEqual(calls[1],[req,['exams'],true]);
});
}
void registerTests();
