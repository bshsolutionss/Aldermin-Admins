async function register() {
const {test}=await import("node:test");
const assert=(await import("node:assert/strict")).default;
const {loadTs}=await import("../auth/load-ts.mjs");
const id='11111111-1111-4111-8111-111111111111';
const yearId='22222222-2222-4222-8222-222222222222';
test('Classes client routes every CRUD operation to real API',async()=>{
  const calls=[];
  const {apiService}=loadTs('lib/api-service.ts',{'./session-client':{sessionFetch:async(path,options)=>{calls.push([path,options.method||'GET']);return Response.json([]);},withSessionLock:fn=>fn()}});
  await apiService.classes.getAll();await apiService.classes.getById(id);await apiService.classes.getSectionIds(id);
  await apiService.classes.create({academicYearId:yearId,name:'Class 1'});await apiService.classes.update(id,{academicYearId:yearId,name:'Class 2'});await apiService.classes.delete(id);
  assert.deepEqual(calls,[['/api/classes','GET'],['/api/classes/'+id,'GET'],['/api/classes/'+id+'/sections','GET'],['/api/classes','POST'],['/api/classes/'+id,'PATCH'],['/api/classes/'+id,'DELETE']]);
});
test('Classes proxy requires admin, blocks foreign origins and preserves backend validation errors',async()=>{
  let role='admin',signedIn=true,calls=0;
  const {proxyClasses}=loadTs('lib/classes-proxy.ts',{'@/lib/auth-server':{
    getVerifiedUser:async()=>({user:signedIn?{role}:null,accessToken:'cookie-token'}),isSameOrigin:r=>r.headers.get('origin')!=='https://external.invalid',
    authFetch:async(path,options)=>{calls++;assert.equal(options.headers.Authorization,'Bearer cookie-token');assert.equal(path,'/classes/'+id);return Response.json({message:'Class name already exists for this academic year'},{status:409});},
  }});
  for(const denied of ['student','instructor']){role=denied;assert.equal((await proxyClasses(new Request('http://localhost/api/classes'))).status,403);}
  role='admin';signedIn=false;assert.equal((await proxyClasses(new Request('http://localhost/api/classes'))).status,401);signedIn=true;
  assert.equal((await proxyClasses(new Request('http://localhost/api/classes',{method:'POST',headers:{origin:'https://external.invalid'}}))).status,403);
  assert.equal((await proxyClasses(new Request('http://localhost/api/classes'),'invalid')).status,400);assert.equal(calls,0);
  const response=await proxyClasses(new Request('http://localhost/api/classes',{method:'PATCH',body:JSON.stringify({academicYearId:yearId,name:'A'})}),id);assert.equal(response.status,409);assert.equal(response.headers.get('cache-control'),'no-store');
});
test('Classes proxy appends sub-path for section lookups',async()=>{
  let seen;
  const {proxyClasses}=loadTs('lib/classes-proxy.ts',{'@/lib/auth-server':{
    getVerifiedUser:async()=>({user:{role:'admin'},accessToken:'cookie-token'}),isSameOrigin:()=>true,
    authFetch:async(path)=>{seen=path;return Response.json([]);},
  }});
  await proxyClasses(new Request('http://localhost/api/classes/'+id+'/sections'),id,'sections');
  assert.equal(seen,'/classes/'+id+'/sections');
});
const Form=()=>null,Table=()=>null,Actions=()=>null;
function mount(api){
  const state=[],effects=[];let cursor=0;
  const react={useCallback:fn=>fn,useState(value){const key=cursor++;if(!(key in state))state[key]=value;return[state[key],next=>{state[key]=typeof next==='function'?next(state[key]):next;}];},useRef(value){const key=cursor++;if(!(key in state))state[key]={current:value};return state[key];},useEffect(fn){const key=cursor++;if(!(key in state)){state[key]=true;effects.push(fn);}}};
  const stub=()=>null;
  const Page=loadTs('app/admin/academics/class/page.tsx',{react,'@/lib/api-service':{apiService:{classes:api.classes,sections:api.sections,academicYears:api.academicYears}},'@/components/common/PageHeader':{PageHeader:stub},'@/components/modules/academics/ClassForm':{ClassForm:Form},'@/components/common/DataTable':{DataTable:Table},'@/components/common/ListActionButtons':{ListActionButtons:Actions},'@/components/ui/button':{Button:stub}}).default;
  const walk=node=>!node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(walk)];
  const render=()=>{cursor=0;return walk(Page());};
  return{start:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);await new Promise(setImmediate);},render,table:()=>render().find(n=>n.type===Table).props,form:()=>render().find(n=>n.type===Form).props};
}
test('Classes page reloads persisted rows after writes/remount, supports section assignment, and survives navigation',async()=>{
  let stored=[],fail=false;
  const academicYears=[{id:yearId,name:'2030-2031',isCurrent:true}];
  const sections=[{id:'sec-a',name:'A'},{id:'sec-b',name:'B'}];
  const sectionLinks={};
  const api={
    classes:{
      getAll:async()=>[...stored],
      getSectionIds:async(classId)=>sectionLinks[classId]||[],
      create:async data=>{if(fail)throw Error('Class name already exists for this academic year');const row={id,...data};stored=[row];sectionLinks[id]=data.sectionIds||[];return row;},
      update:async(key,data)=>{const row={id:key,...data};stored=[row];sectionLinks[key]=data.sectionIds||[];return row;},
      delete:async()=>{stored=[];delete sectionLinks[id];},
    },
    sections:{getAll:async()=>sections},
    academicYears:{getAll:async()=>academicYears},
  };
  const page=mount(api);await page.start();
  page.form().setClassName('Class 9');await page.form().onSubmit({preventDefault(){}});
  assert.equal(page.table().data[0].name,'Class 9');

  const returned=mount(api);await returned.start();assert.equal(returned.table().data[0].name,'Class 9');
  const actions=()=>returned.table().columns.find(c=>c.header==='Action').accessor(returned.table().data[0]).props;
  await actions().onEdit();await new Promise(setImmediate);
  assert.deepEqual(returned.form().selectedSections,[]);
  returned.form().toggleSection('sec-a');
  returned.form().setClassName('Class 9 Updated');
  await returned.form().onSubmit({preventDefault(){}});
  assert.equal(returned.table().data[0].name,'Class 9 Updated');
  assert.deepEqual(sectionLinks[id],['sec-a']);

  fail=true;returned.form().setClassName('Class 9 Updated');await returned.form().onSubmit({preventDefault(){}});
  assert.ok(returned.render().some(n=>n.props?.role==='alert'));
  fail=false;

  global.window={confirm:()=>true};try{actions().onDelete();await new Promise(setImmediate);assert.deepEqual(returned.table().data,[]);}finally{delete global.window;}
});

test('a selected section cannot substitute for a missing current academic year',async()=>{
  let writes=0;
  const page=mount({academicYears:{getAll:async()=>[]},sections:{getAll:async()=>[{id:'section-a',name:'A'}]},classes:{getAll:async()=>[],create:async()=>{writes++;}}});
  await page.start();
  page.form().setClassName('Grade 1');page.form().toggleSection('section-a');
  assert.equal(page.form().canSubmit,false);
  assert.ok(page.render().some(n=>n.props?.role==='status'));
  await page.form().onSubmit({preventDefault(){}});
  assert.equal(writes,0);
});

test('reloading setup finds a newly configured current year, preserves selections and shows the created class',async()=>{
  let years=[],stored=[],payload;
  const page=mount({academicYears:{getAll:async()=>years},sections:{getAll:async()=>[{id:'section-a',name:'A'}]},classes:{getAll:async()=>stored,create:async input=>{payload=input;stored=[{id,...input}];return stored[0];}}});
  await page.start();page.form().setClassName('Grade 1');page.form().toggleSection('section-a');
  years=[{id:yearId,isCurrent:true}];
  const reload=page.render().find(n=>n.props?.children==='Reload class setup');
  await reload.props.onClick();await new Promise(setImmediate);
  assert.equal(page.form().className,'Grade 1');assert.deepEqual(page.form().selectedSections,['section-a']);assert.equal(page.form().canSubmit,true);
  await page.form().onSubmit({preventDefault(){}});
  assert.equal(payload.academicYearId,yearId);assert.deepEqual(payload.sectionIds,['section-a']);
  assert.equal(page.table().data[0].name,'Grade 1');assert.equal(page.table().title,'Registered Grades');
});

test('a year API failure is reported as a load error and Retry reloads all class prerequisites',async()=>{
  let unavailable=true,yearReads=0,sectionReads=0,writes=0;
  const page=mount({academicYears:{getAll:async()=>{yearReads++;if(unavailable)throw Error('Academic Year service unavailable');return[{id:yearId,isCurrent:true}];}},sections:{getAll:async()=>{sectionReads++;return[];}},classes:{getAll:async()=>[],create:async()=>{writes++;}}});
  await page.start();assert.equal(page.form().disabled,true);
  assert.ok(page.render().some(n=>n.props?.role==='alert'&&n.props.children.includes('Academic Year service unavailable')));
  assert.ok(!page.render().some(n=>n.props?.role==='status'));
  page.form().setClassName('Grade 1');await page.form().onSubmit({preventDefault(){}});assert.equal(writes,0);
  unavailable=false;await page.render().find(n=>n.props?.children==='Retry').props.onClick();await new Promise(setImmediate);
  assert.equal(yearReads,2);assert.equal(sectionReads,2);assert.equal(page.form().disabled,false);assert.equal(page.form().canSubmit,true);
});

test('editing an existing class preserves its academic year even when no year is current',async()=>{
  let payload;
  const existing={id,name:'Existing Grade',academicYearId:yearId,passingMarks:33};
  const page=mount({academicYears:{getAll:async()=>[{id:yearId,isCurrent:false}]},sections:{getAll:async()=>[]},classes:{getAll:async()=>[existing],getSectionIds:async()=>[],update:async(key,input)=>{assert.equal(key,id);payload=input;return {...existing,...input};}}});
  await page.start();
  page.table().columns.find(column=>column.header==='Action').accessor(existing).props.onEdit();await new Promise(setImmediate);
  assert.equal(page.form().canSubmit,true);
  page.form().setClassName('Updated Grade');await page.form().onSubmit({preventDefault(){}});
  assert.equal(payload.academicYearId,yearId);assert.equal(payload.name,'Updated Grade');
});

}
void register();
