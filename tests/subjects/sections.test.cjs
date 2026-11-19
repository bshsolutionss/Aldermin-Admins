async function register() {
const {test}=await import("node:test");
const assert=(await import("node:assert/strict")).default;
const {loadTs}=await import("../auth/load-ts.mjs");
const id='11111111-1111-4111-8111-111111111111';
test('Sections client routes every CRUD operation to real API',async()=>{
  const calls=[];
  const {apiService}=loadTs('lib/api-service.ts',{'./session-client':{sessionFetch:async(path,options)=>{calls.push([path,options.method||'GET']);return Response.json([]);},withSessionLock:fn=>fn()}});
  await apiService.sections.getAll();await apiService.sections.getById(id);await apiService.sections.create({name:'A'});await apiService.sections.update(id,{name:'B'});await apiService.sections.delete(id);
  assert.deepEqual(calls,[['/api/sections','GET'],['/api/sections/'+id,'GET'],['/api/sections','POST'],['/api/sections/'+id,'PATCH'],['/api/sections/'+id,'DELETE']]);
});
test('Sections proxy requires admin, blocks foreign origins and preserves backend validation errors',async()=>{
  let role='admin',signedIn=true,calls=0;
  const {proxySections}=loadTs('lib/sections-proxy.ts',{'@/lib/auth-server':{
    getVerifiedUser:async()=>({user:signedIn?{role}:null,accessToken:'cookie-token'}),isSameOrigin:r=>r.headers.get('origin')!=='https://external.invalid',
    authFetch:async(path,options)=>{calls++;assert.equal(options.headers.Authorization,'Bearer cookie-token');assert.equal(path,'/sections/'+id);return Response.json({message:'Section name already exists'},{status:409});},
  }});
  for(const denied of ['student','instructor']){role=denied;assert.equal((await proxySections(new Request('http://localhost/api/sections'))).status,403);}
  role='admin';signedIn=false;assert.equal((await proxySections(new Request('http://localhost/api/sections'))).status,401);signedIn=true;
  assert.equal((await proxySections(new Request('http://localhost/api/sections',{method:'POST',headers:{origin:'https://external.invalid'}}))).status,403);
  assert.equal((await proxySections(new Request('http://localhost/api/sections'),'invalid')).status,400);assert.equal(calls,0);
  const response=await proxySections(new Request('http://localhost/api/sections',{method:'PATCH',body:JSON.stringify({name:'A'})}),id);assert.equal(response.status,409);assert.equal(response.headers.get('cache-control'),'no-store');
});
const Form=()=>null,Table=()=>null,Actions=()=>null;
function mount(api){
  const state=[],effects=[];let cursor=0;
  const react={useState(value){const key=cursor++;if(!(key in state))state[key]=value;return[state[key],next=>{state[key]=typeof next==='function'?next(state[key]):next;}];},useRef(value){const key=cursor++;if(!(key in state))state[key]={current:value};return state[key];},useEffect(fn){const key=cursor++;if(!(key in state)){state[key]=true;effects.push(fn);}}};
  const stub=()=>null;
  const Page=loadTs('app/admin/academics/section/page.tsx',{react,'@/lib/api-service':{apiService:{sections:api}},'@/components/common/PageHeader':{PageHeader:stub},'@/components/modules/academics/SectionForm':{SectionForm:Form},'@/components/common/DataTable':{DataTable:Table},'@/components/common/ListActionButtons':{ListActionButtons:Actions},'@/components/ui/button':{Button:stub}}).default;
  const walk=node=>!node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(walk)];
  const render=()=>{cursor=0;return walk(Page());};
  return{start:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);},render,table:()=>render().find(n=>n.type===Table).props,form:()=>render().find(n=>n.type===Form).props};
}
test('Sections reloads persisted rows after writes/remount and retains failed duplicate input',async()=>{
  let stored=[],fail=false;
  const api={getAll:async()=>[...stored],create:async data=>{if(fail)throw Error('Section name already exists');stored=[{id,...data}];},update:async(key,data)=>{stored=[{id:key,...data}];},delete:async()=>{stored=[];}};
  const page=mount(api);await page.start();page.form().setSectionName('A');await page.form().onSubmit({preventDefault(){}});assert.equal(page.table().data[0].name,'A');
  const returned=mount(api);await returned.start();assert.equal(returned.table().data[0].name,'A');
  const actions=()=>returned.table().columns.find(c=>c.header==='Action').accessor(returned.table().data[0]).props;
  actions().onEdit();returned.form().setSectionName('B');await returned.form().onSubmit({preventDefault(){}});assert.equal(returned.table().data[0].name,'B');
  fail=true;returned.form().setSectionName('B');await returned.form().onSubmit({preventDefault(){}});assert.equal(returned.form().sectionName,'B');assert.ok(returned.render().some(n=>n.props?.role==='alert'));
  global.window={confirm:()=>true};try{actions().onDelete();await new Promise(setImmediate);assert.deepEqual(returned.table().data,[]);}finally{delete global.window;}
});

}
void register();
