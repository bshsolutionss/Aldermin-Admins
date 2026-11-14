const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadTs}=require('../auth/load-ts.cjs');
const id='11111111-1111-4111-8111-111111111111';
const year={id,name:'2026-2027',startDate:'2026-08-01',endDate:'2027-07-31',isCurrent:false};
test('Academic Year client uses real CRUD/current endpoints without fallback',async()=>{
  const calls=[];
  const {apiService}=loadTs('lib/api-service.ts',{'./session-client':{sessionFetch:async(path,options)=>{calls.push([path,options]);return Response.json([]);},withSessionLock:fn=>fn()}});
  await apiService.academicYears.getAll();await apiService.academicYears.getById(id);await apiService.academicYears.create(year);await apiService.academicYears.update(id,{name:'Edited'});await apiService.academicYears.setCurrent(id);await apiService.academicYears.delete(id);
  assert.deepEqual(calls.map(([p,o])=>[p,o.method||'GET']),[['/api/academic-years','GET'],['/api/academic-years/'+id,'GET'],['/api/academic-years','POST'],['/api/academic-years/'+id,'PATCH'],['/api/academic-years/'+id+'/current','PATCH'],['/api/academic-years/'+id,'DELETE']]);
});
test('Academic Year proxy enforces admin sessions, same origin, UUIDs and preserves backend errors',async()=>{
  let role='admin',signedIn=true,calls=0;
  const {proxyAcademicYears}=loadTs('lib/academic-years-proxy.ts',{'@/lib/auth-server':{
    getVerifiedUser:async()=>({user:signedIn?{role}:null,accessToken:'cookie-token'}),isSameOrigin:r=>r.headers.get('origin')!=='https://external.invalid',
    authFetch:async(path,options)=>{calls++;assert.equal(options.headers.Authorization,'Bearer cookie-token');assert.equal(path,'/academic-years/'+id+'/current');return Response.json({message:'Conflict'},{status:409});},
  }});
  for(const denied of ['student','instructor']){role=denied;assert.equal((await proxyAcademicYears(new Request('http://localhost/api/academic-years'))).status,403);}
  role='admin';signedIn=false;assert.equal((await proxyAcademicYears(new Request('http://localhost/api/academic-years'))).status,401);signedIn=true;
  assert.equal((await proxyAcademicYears(new Request('http://localhost/api/academic-years',{method:'POST',headers:{origin:'https://external.invalid'}}))).status,403);
  assert.equal((await proxyAcademicYears(new Request('http://localhost/api/academic-years'),'invalid')).status,400);assert.equal(calls,0);
  const response=await proxyAcademicYears(new Request('http://localhost/api/academic-years',{method:'PATCH'}),id,true);assert.equal(response.status,409);assert.equal(response.headers.get('cache-control'),'no-store');
});
const FormTable=()=>null;
function mount(api){
  const state=[],effects=[];let cursor=0;
  const react={useState(value){const key=cursor++;if(!(key in state))state[key]=value;return[state[key],next=>{state[key]=typeof next==='function'?next(state[key]):next;}];},useRef(value){const key=cursor++;if(!(key in state))state[key]={current:value};return state[key];},useEffect(fn){const key=cursor++;if(!(key in state)){state[key]=true;effects.push(fn);}}};
  const stub=()=>null;
  const Page=loadTs('app/admin/settings/general-settings/academic-year/page.tsx',{react,'@/lib/api-service':{apiService:{academicYears:api}},'@/components/common/PageHeader':{PageHeader:stub},'@/components/common/AdminCard':{AdminCard:stub},'@/components/common/DataTable':{DataTable:FormTable},'@/components/ui/input':{Input:stub},'@/components/ui/label':{Label:stub},'@/components/ui/button':{Button:stub}}).default;
  const walk=node=>!node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(walk)];
  const render=()=>{cursor=0;return walk(Page());};
  return{start:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);},render,table:()=>render().find(n=>n.type===FormTable).props,input:(key,value)=>render().find(n=>n.props?.id===key).props.onChange({target:{value}}),submit:async()=>{render().find(n=>n.type==='form').props.onSubmit({preventDefault(){}});await new Promise(setImmediate);}};
}
test('page reloads persisted API results on mount and after writes; failed saves preserve inputs',async()=>{
  let stored=[],fail=false;
  const api={getAll:async()=>stored,create:async data=>{if(fail)throw Error('Duplicate year');stored=[{...year,...data}];return stored[0];},setCurrent:async()=>{stored=[{...stored[0],isCurrent:true}];return stored[0];}};
  const page=mount(api);await page.start();assert.deepEqual(page.table().data,[]);
  page.input('year-name',year.name);page.input('year-start',year.startDate);page.input('year-end',year.endDate);await page.submit();assert.equal(page.table().data[0].id,id);
  const returned=mount(api);await returned.start();assert.equal(returned.table().data[0].name,year.name);
  const actions=returned.table().columns.find(c=>c.header==='Actions').accessor(stored[0]);await actions.props.children[1].props.onClick();await new Promise(setImmediate);assert.equal(returned.table().data[0].isCurrent,true);
  const currentActions=returned.table().columns.find(c=>c.header==='Actions').accessor(stored[0]);assert.equal(currentActions.props.children[2].props.disabled,true);
  fail=true;page.input('year-name','Unsaved name');page.input('year-start',year.startDate);page.input('year-end',year.endDate);await page.submit();assert.equal(page.render().find(n=>n.props?.id==='year-name').props.value,'Unsaved name');assert.ok(page.render().some(n=>n.props?.role==='alert'));
});
