async function register() {
const { test } = await import("node:test");
const assert = (await import("node:assert/strict")).default;
const { loadTs } = await import("../auth/load-ts.mjs");
const { NextResponse } = await import("next/server.js");

const id = '11111111-1111-4111-8111-111111111111';
const record = { id, name:'Mathematics', code:'MATH', type:'Theory', createdAt:'2026-11-10', updatedAt:'2026-11-10' };

test('API client routes every subject operation and academic selector to School Subjects', async () => {
  const calls = [];
  const { apiService } = loadTs('lib/api-service.ts', { './session-client': {
    sessionFetch: async (path, options) => { calls.push([path,options]); return Response.json(options.method === 'DELETE' ? {success:true} : path.endsWith(id) || options.method === 'POST' ? record : []); },
    withSessionLock: fn => fn(),
  }});
  assert.deepEqual(await apiService.academics.getSubjects(), []);
  await apiService.schoolSubjects.getById(id);
  await apiService.schoolSubjects.create(record);
  await apiService.schoolSubjects.update(id,{name:'Lab'});
  await apiService.schoolSubjects.delete(id);
  assert.deepEqual(calls.map(([path,o])=>[path,o.method || 'GET']), [
    ['/api/school-subjects','GET'], ['/api/school-subjects/'+id,'GET'], ['/api/school-subjects','POST'], ['/api/school-subjects/'+id,'PATCH'], ['/api/school-subjects/'+id,'DELETE'],
  ]);
});

test('API client propagates validation failures and outages without mock fallback', async () => {
  for (const response of [Response.json({message:['Subject code already exists']},{status:409}), null]) {
    const { apiService } = loadTs('lib/api-service.ts', { './session-client': {
      sessionFetch: async () => { if (!response) throw Error('offline'); return response; }, withSessionLock:fn=>fn(),
    }});
    await assert.rejects(apiService.academics.getSubjects(), response ? /Subject code already exists/ : /offline/);
  }
});

function proxy(role='admin', response=Response.json(record), authorized=true) {
  const calls = [];
  const proxyModule = loadTs('lib/school-subjects-proxy.ts', { '@/lib/auth-server': {
    getVerifiedUser:async()=>({user:authorized ? {id,role}:null,accessToken:'cookie-token'}),
    isSameOrigin:req=> !req.headers.get('origin') || req.headers.get('origin') === 'http://localhost',
    authFetch:async(path,options)=>{calls.push([path,options]); if(response instanceof Error) throw response; return response;},
  }});
  return {...proxyModule,calls};
}
const req=(method='GET',body,origin)=>new Request('http://localhost/api/school-subjects',{
  method, headers:origin?{origin}:{}, ...(body===undefined?{}:{body:JSON.stringify(body)}),
});
for (const role of ['admin','instructor','student']) {
  test('Proxy enforces read/write permissions for '+role, async()=>{
    for (const method of ['GET','POST','PATCH','DELETE']) {
      const p=proxy(role);
      const response=await p.proxySchoolSubjects(req(method, ['POST','PATCH'].includes(method)?{name:'x'}:undefined), method==='GET'||method==='POST'?undefined:id);
      const allowed=role==='admin'||(role==='instructor'&&method==='GET');
      assert.equal(response.status,allowed?200:403);
      assert.equal(p.calls.length,allowed?1:0);
    }
  });
}
test('Proxy preserves backend status, cookie bearer, JSON and no-store headers', async()=>{
  const p=proxy('admin',Response.json({message:'duplicate'},{status:409}));
  const response=await p.proxySchoolSubjects(req('PATCH',{code:'MATH'}),id);
  assert.equal(response.status,409);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(p.calls[0][0],'/school-subjects/'+id);
  assert.equal(p.calls[0][1].headers.Authorization,'Bearer cookie-token');
  assert.deepEqual(JSON.parse(p.calls[0][1].body),{code:'MATH'});
});
test('Proxy rejects anonymous access, cross-origin writes, malformed JSON and IDs; outages return 503',async()=>{
  assert.equal((await proxy('admin',undefined,false).proxySchoolSubjects(req())).status,401);
  const cross=proxy(); assert.equal((await cross.proxySchoolSubjects(req('POST',{},'https://external.invalid'))).status,403); assert.equal(cross.calls.length,0);
  assert.equal((await proxy().proxySchoolSubjects(req(),'invalid')).status,400);
  assert.equal((await proxy().proxySchoolSubjects(new Request('http://localhost/api/school-subjects',{method:'POST',body:'{'}))).status,400);
  assert.equal((await proxy('admin',Error('offline')).proxySchoolSubjects(req())).status,503);
});

// Exercise the actual shared hook with a deterministic state/effect scheduler.
function harness(api) {
  const values=[]; let cursor=0; const effects=[];
  const react = {
    useState(initial) { const i=cursor++; if(!(i in values)) values[i]=initial; return [values[i],next=>{values[i]=typeof next==='function'?next(values[i]):next;}]; },
    useRef(initial) { const i=cursor++; if(!(i in values)) values[i]={current:initial}; return values[i]; },
    useCallback(fn) {cursor++;return fn;},
    useEffect(fn) {const i=cursor++;if(!(i in values)){values[i]=true;effects.push(fn);}},
  };
  const {useSchoolSubjects}=loadTs('lib/use-school-subjects.ts',{react,'./api-service':{apiService:{schoolSubjects:api}}});
  return {render:()=>{cursor=0;return useSchoolSubjects();},mount:async()=>{cursor=0;useSchoolSubjects();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);}};
}
const event={preventDefault(){}};
test('Shared page logic loads empty state, creates, edits, reloads and deletes persisted API results',async()=>{
  let stored=[]; const api={getAll:async()=>stored,create:async form=>{const saved={...record,...form};stored=[saved];return saved;},update:async(key,form)=>{stored=[{...record,...form}];return stored[0];},delete:async()=>{stored=[];return {success:true};}};
  const h=harness(api);await h.mount();assert.deepEqual(h.render().subjects,[]);
  h.render().setForm({name:'Mathematics',code:'MATH',type:'Theory'});
  await h.render().submit(event);assert.equal(h.render().subjects[0].id,id);assert.equal(h.render().form.name,'');
  h.render().edit(h.render().subjects[0]);assert.equal(h.render().editingId,id);
  h.render().setForm({name:'Physics Lab',code:null,type:'Practical'});
  await h.render().submit(event);assert.equal(h.render().subjects[0].name,'Physics Lab');
  await h.render().reload();assert.equal(h.render().subjects[0].type,'Practical');
  const remount=harness(api);await remount.mount();assert.equal(remount.render().subjects[0].name,'Physics Lab');
  await h.render().remove(id);assert.deepEqual(h.render().subjects,[]);
});
test('Shared page logic preserves failed save/delete state, exposes errors and prevents duplicate submissions',async()=>{
  let writes=0,finish;
  const api={getAll:async()=>[record],create:async()=>{writes++;await new Promise(resolve=>{finish=resolve;});throw Error('duplicate');},delete:async()=>{throw Error('denied');}};
  const h=harness(api);await h.mount();const form={name:'Unsaved',code:'MATH',type:'Theory'};h.render().setForm(form);
  const pending=h.render().submit(event);await h.render().submit(event);assert.equal(writes,1);finish();await pending;
  assert.deepEqual(h.render().form,form);assert.deepEqual(h.render().subjects,[record]);assert.equal(h.render().error,'duplicate');
  await h.render().remove(id);assert.deepEqual(h.render().subjects,[record]);assert.equal(h.render().error,'denied');
});
test('Shared page logic shows load failures and supports retry without fabricating rows',async()=>{
  let failed=true;const h=harness({getAll:async()=>{if(failed)throw Error('offline');return [];}});
  await h.mount();assert.equal(h.render().error,'offline');assert.deepEqual(h.render().subjects,[]);assert.equal(h.render().isLoading,false);
  failed=false;await h.render().reload();assert.equal(h.render().error,'');assert.deepEqual(h.render().subjects,[]);
});

function walk(node, predicate) {
  if(!node||typeof node!=='object')return [];
  return [...(predicate(node)?[node]:[]), ...[node.props?.children].flat(Infinity).flatMap(child=>walk(child,predicate))];
}
for (const path of ['app/admin/academic/subject/page.tsx','app/admin/academics/subjects/page.tsx']) {
  test('Existing route preserves rendering and connects real edit/delete/form controls: '+path,()=>{
    let edited,deleted;const submit=()=>{};
    const hook={subjects:[record],form:{name:'',code:'',type:'Theory'},editingId:null,isLoading:false,isSubmitting:false,error:'',reload(){},reset(){},edit:item=>{edited=item;},submit,remove:key=>{deleted=key;},setForm(){}};
    const stub=()=>null;
    const page=loadTs(path,{
      '@/lib/use-school-subjects':{useSchoolSubjects:()=>hook},
      '@/components/common/PageHeader':{PageHeader:stub},'@/components/modules/academics/SubjectForm':{SubjectForm:stub},
      '@/components/ui/button':{Button:stub},'@/components/common/DataTable':{DataTable:stub},'@/components/common/ListActionButtons':{ListActionButtons:stub},
    }).default();
    if(path.includes('/academic/')) {
      assert.equal(walk(page,n=>n.type==='form')[0].props.onSubmit,submit);
      walk(page,n=>n.props?.['aria-label']==='Edit Mathematics')[0].props.onClick();
      walk(page,n=>n.props?.['aria-label']==='Delete Mathematics')[0].props.onClick();
    } else {
      assert.ok(walk(page,n=>n.props?.onSubmit===submit).length);
      const table=walk(page,n=>Array.isArray(n.props?.columns))[0];
      const actions=table.props.columns.find(c=>c.header==='Action').accessor(record);
      actions.props.onEdit();actions.props.onDelete();
    }
    assert.equal(edited,record);assert.equal(deleted,id);
  });
}

}
void register();
