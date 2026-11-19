async function register() {
const {test}=await import("node:test");
const assert=(await import("node:assert/strict")).default;
const {loadTs}=await import("../auth/load-ts.mjs");
const {NextResponse}=await import("next/server.js");
const subjectId='11111111-1111-4111-8111-111111111111',teacherId='22222222-2222-4222-8222-222222222222';
const classSectionId='44444444-4444-4444-8444-444444444444';
const choices={subjects:[{id:subjectId,name:'Math'}],classSections:[{id:classSectionId,className:'Class 1',sectionName:'A',academicYearName:'2026'}],teachers:[{id:teacherId,name:'Real teacher',staffNo:'T-1'}]};
const row={id:'33333333-3333-4333-8333-333333333333',subjectId,staffId:teacherId,classSectionId,legacy:false,className:'Class 1',section:'A',subject:'Math',teacher:'Real teacher'};
const Form=()=>null;
function mount(api){
  const state=[],effects=[];let i=0;
  const react={useState(value){const key=i++;if(!(key in state))state[key]=value;return[state[key],next=>{state[key]=typeof next==='function'?next(state[key]):next;}];},useRef(value){const key=i++;if(!(key in state))state[key]={current:value};return state[key];},useEffect(fn){const key=i++;if(!(key in state)){state[key]=true;effects.push(fn);}}};
  const stub=()=>null;
  const Page=loadTs('app/admin/academics/assign-subject/page.tsx',{
    react,'@/lib/api-service':{apiService:api},'@/components/common/PageHeader':{PageHeader:stub},
    '@/components/modules/academics/AssignSubjectForm':{AssignSubjectForm:Form},'@/components/ui/button':{Button:stub},
    '@/components/common/DataTable':{DataTable:stub},'@/components/common/ListActionButtons':{ListActionButtons:stub},
  }).default;
  function nodes(node){if(!node||typeof node!=='object')return[];return[node,...[node.props?.children].flat(Infinity).flatMap(nodes)];}
  const render=()=>{i=0;return nodes(Page());};
  return{start:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);},form:()=>render().find(n=>n.type===Form).props,table:()=>render().find(n=>n.props?.searchKey==='subject').props,alerts:()=>render().filter(n=>n.props?.role==='alert')};
}
test('assignment page saves IDs through API, reloads on remount/refresh and persists deletes',async()=>{
  let stored=[],sent;
  const api={academics:{getSubjectAssignments:async()=>stored,getSubjects:async()=>[{id:subjectId,name:'Math'}]},subjectAssignments:{getOptions:async()=>choices,create:async input=>{sent=input;stored=[row];return row;},getAll:async()=>stored,delete:async()=>{stored=[];}}};
  const page=mount(api);await page.start();
  page.form().setSelectedSubject(subjectId);page.form().setSelectedTeacher(teacherId);page.form().setSelectedSection(classSectionId);
  await page.form().handleSubmit({preventDefault(){}});
  assert.deepEqual(sent,{subjectId,staffId:teacherId,classSectionId});assert.deepEqual(page.table().data,[row]);
  for(let i=0;i<2;i++){const returned=mount(api);await returned.start();assert.deepEqual(returned.table().data,[row]);}
  await page.table().columns.find(c=>c.header==='Action').accessor(row).props.onDelete();await new Promise(setImmediate);
  const refreshed=mount(api);await refreshed.start();assert.deepEqual(refreshed.table().data,[]);
});
test('failed assignment save preserves selections and shows error without a fabricated row',async()=>{
  const page=mount({academics:{getSubjectAssignments:async()=>[],getSubjects:async()=>[]},subjectAssignments:{getOptions:async()=>({...choices,teachers:[]}),create:async()=>{throw Error('Save failed');}}});
  await page.start();page.form().setSelectedSubject(subjectId);page.form().setSelectedTeacher(teacherId);page.form().setSelectedSection(classSectionId);
  await page.form().handleSubmit({preventDefault(){}});
  assert.deepEqual(page.table().data,[]);assert.equal(page.form().selectedSubject,subjectId);assert.equal(page.alerts().length,1);
});
test('assignment proxies forward authenticated save, load, options and delete requests',async()=>{
  const calls=[];const helper={getVerifiedUser:async()=>({user:{role:'admin'},accessToken:'token'}),isSameOrigin:()=>true,authFetch:async(path,options)=>{calls.push([path,options]);return NextResponse.json(row);}};
  const {proxySchoolSubjects}=loadTs('lib/school-subjects-proxy.ts',{'@/lib/auth-server':helper});
  for(const [method,id] of [['GET',undefined],['GET','options'],['POST',undefined],['DELETE',row.id]]){
    const req=new Request('http://localhost/api/school-subject-assignments',{method,...(method==='POST'?{body:JSON.stringify({subjectId,staffId:teacherId,classSectionId})}:{})});
    assert.equal((await proxySchoolSubjects(req,id,'school-subject-assignments')).status,200);
  }
  assert.deepEqual(calls.map(([p,o])=>[p,o.method]),[['/school-subject-assignments','GET'],['/school-subject-assignments/options','GET'],['/school-subject-assignments','POST'],['/school-subject-assignments/'+row.id,'DELETE']]);
  assert.ok(calls.every(([,o])=>o.headers.Authorization==='Bearer token'));
});

test('modern edit hydrates persisted IDs and updates the existing row', async()=>{
  let sent;
  const page=mount({academics:{getSubjectAssignments:async()=>[row]},subjectAssignments:{getOptions:async()=>choices,getAll:async()=>[row],update:async(id,body)=>{sent={id,body};return row;}}});
  await page.start();
  page.table().columns.find(c=>c.header==='Action').accessor(row).props.onEdit();
  assert.equal(page.form().selectedSection,classSectionId);
  assert.equal(page.form().selectedTeacher,teacherId);
  assert.equal(page.form().editing,true);
  await page.form().handleSubmit({preventDefault(){}});
  assert.deepEqual(sent,{id:row.id,body:{subjectId,classSectionId,staffId:teacherId}});
  assert.equal(page.form().editing,false);
});

test('legacy allocations remain visible without an edit action', async()=>{
  const legacy={...row,legacy:true,classSectionId:null,staffId:null};
  const page=mount({academics:{getSubjectAssignments:async()=>[legacy]},subjectAssignments:{getOptions:async()=>choices}});
  await page.start();
  assert.equal(page.table().columns.find(c=>c.header==='Action').accessor(legacy).props.onEdit,undefined);
  assert.match(page.table().columns.find(c=>c.header==='Logical Section').accessor(legacy),/legacy/);
});

test('query filters and PATCH pass through with backend status and CSRF protection',async()=>{
  let seen;
  const helper={getVerifiedUser:async()=>({user:{role:'admin'},accessToken:'token'}),isSameOrigin:()=>true,authFetch:async(path,options)=>{seen={path,options};return NextResponse.json({message:'Duplicate'},{status:409});}};
  const {proxySchoolSubjects}=loadTs('lib/school-subjects-proxy.ts',{'@/lib/auth-server':helper});
  const url='http://localhost/api/school-subject-assignments/options?academicYearId='+subjectId;
  assert.equal((await proxySchoolSubjects(new Request(url),'options','school-subject-assignments')).status,409);
  assert.equal(seen.path,'/school-subject-assignments/options?academicYearId='+subjectId);
  const req=new Request('http://localhost/api/school-subject-assignments/'+row.id,{method:'PATCH',body:JSON.stringify({staffId:teacherId})});
  assert.equal((await proxySchoolSubjects(req,row.id,'school-subject-assignments')).status,409);
  assert.equal(seen.options.method,'PATCH');
  helper.isSameOrigin=()=>false;
  assert.equal((await proxySchoolSubjects(req,row.id,'school-subject-assignments')).status,403);
  helper.isSameOrigin=()=>true;helper.getVerifiedUser=async()=>({user:{role:'student'}});
  assert.equal((await proxySchoolSubjects(new Request(url),'options','school-subject-assignments')).status,403);
  helper.getVerifiedUser=async()=>({user:null});
  assert.equal((await proxySchoolSubjects(new Request(url),'options','school-subject-assignments')).status,401);
});

function mountLegacy(api){
  const state=[],effects=[];let index=0;
  const react={useState(value){const key=index++;if(!(key in state))state[key]=value;return[state[key],next=>{state[key]=typeof next==='function'?next(state[key]):next;}];},useRef(value){const key=index++;if(!(key in state))state[key]={current:value};return state[key];},useEffect(fn){const key=index++;if(!(key in state)){state[key]=true;effects.push(fn);}}};
  const Page=loadTs('app/admin/academic/assign-subject/page.tsx',{react,'@/lib/api-service':{apiService:{subjectAssignments:api}}}).default;
  function nodes(node){if(!node||typeof node!=='object')return[];return[node,...[node.props?.children].flat(Infinity).flatMap(nodes)];}
  const render=()=>{index=0;return nodes(Page());};
  return {start:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);},nodes:render};
}

test('legacy route uses the same real create/edit/delete API and keeps its existing form/table',async()=>{
  let rows=[],saved,updated,deleted;
  const page=mountLegacy({getAll:async()=>rows,getOptions:async()=>choices,create:async body=>{saved=body;rows=[row];return row;},update:async(id,body)=>{updated={id,body};return row;},delete:async id=>{deleted=id;rows=[];}});
  await page.start();
  const select=(key,value)=>page.nodes().filter(n=>n.type==='select')[key].props.onChange({target:{value}});
  select(0,subjectId);select(1,classSectionId);select(2,teacherId);
  await page.nodes().find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
  assert.deepEqual(saved,{subjectId,classSectionId,staffId:teacherId});
  const buttons=()=>page.nodes().filter(n=>n.type==='button'&&n.props.onClick&&!n.props.type);
  buttons()[0].props.onClick();
  await page.nodes().find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
  assert.deepEqual(updated,{id:row.id,body:saved});
  buttons()[1].props.onClick();await new Promise(setImmediate);
  assert.equal(deleted,row.id);
  assert.equal(page.nodes().filter(n=>n.type==='tr').length,1); // header only
});

test('legacy route retains failed input and reports API errors',async()=>{
  const page=mountLegacy({getAll:async()=>[],getOptions:async()=>choices,create:async()=>{throw Error('Save failed');}});
  await page.start();
  for(const [key,value] of [subjectId,classSectionId,teacherId].entries())page.nodes().filter(n=>n.type==='select')[key].props.onChange({target:{value}});
  await page.nodes().find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
  assert.equal(page.nodes().filter(n=>n.type==='select')[1].props.value,classSectionId);
  assert.equal(page.nodes().filter(n=>n.props?.role==='alert').length,1);
  assert.equal(page.nodes().filter(n=>n.type==='tr').length,1);
});

}
void register();
