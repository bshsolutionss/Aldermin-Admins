async function register() {
const {test}=await import("node:test");
const assert=(await import("node:assert/strict")).default;
const {loadTs}=await import("../auth/load-ts.mjs");
const id='11111111-1111-4111-8111-111111111111';
const row={id,roomNumber:'Hall A',capacity:40};

test('Classroom client routes CRUD and the legacy academic method to one real API',async()=>{
  const calls=[];
  const {apiService}=loadTs('lib/api-service.ts',{'./session-client':{sessionFetch:async(path,options)=>{calls.push([path,options.method||'GET',options.body]);return Response.json([]);},withSessionLock:fn=>fn()}});
  await apiService.classrooms.getAll();await apiService.classrooms.getById(id);await apiService.classrooms.create({roomNumber:'Hall A',capacity:40});
  await apiService.classrooms.update(id,{capacity:41});await apiService.classrooms.delete(id);await apiService.academics.getClassRooms();
  assert.deepEqual(calls.map(([p,m])=>[p,m]),[['/api/classrooms','GET'],['/api/classrooms/'+id,'GET'],['/api/classrooms','POST'],['/api/classrooms/'+id,'PATCH'],['/api/classrooms/'+id,'DELETE'],['/api/classrooms','GET']]);
  assert.deepEqual(JSON.parse(calls[2][2]),{roomNumber:'Hall A',capacity:40});
});

test('Classroom proxy enforces admin, same origin, UUID/JSON validation and preserves errors',async()=>{
  let user={role:'admin'},sameOrigin=true,calls=0;
  const {proxyClassrooms}=loadTs('lib/classrooms-proxy.ts',{'@/lib/auth-server':{getVerifiedUser:async()=>({user,accessToken:'cookie-token'}),isSameOrigin:()=>sameOrigin,authFetch:async(path,options)=>{calls++;assert.equal(path,'/classrooms/'+id);assert.equal(options.headers.Authorization,'Bearer cookie-token');return Response.json({message:'Room number already exists'},{status:409});}}});
  const get=()=>new Request('http://localhost/api/classrooms');
  for(const role of ['student','instructor']){user={role};assert.equal((await proxyClassrooms(get())).status,403);}
  user=null;assert.equal((await proxyClassrooms(get())).status,401);user={role:'admin'};
  sameOrigin=false;assert.equal((await proxyClassrooms(new Request('http://localhost/api/classrooms',{method:'POST'}))).status,403);sameOrigin=true;
  assert.equal((await proxyClassrooms(get(),'bad')).status,400);
  assert.equal((await proxyClassrooms(new Request('http://localhost/api/classrooms',{method:'POST',body:'invalid JSON'}))).status,400);
  assert.equal(calls,0);
  const res=await proxyClassrooms(new Request('http://localhost/api/classrooms',{method:'PATCH',body:JSON.stringify({capacity:41})}),id);
  assert.equal(res.status,409);assert.equal(res.headers.get('cache-control'),'no-store');
});

function mount(api){
  const state=[],effects=[];let cursor=0;
  const react={useState(value){const key=cursor++;if(!(key in state))state[key]=value;return[state[key],next=>{state[key]=typeof next==='function'?next(state[key]):next;}];},useRef(value){const key=cursor++;if(!(key in state))state[key]={current:value};return state[key];},useEffect(fn){const key=cursor++;if(!(key in state)){state[key]=true;effects.push(fn);}},useCallback:fn=>fn};
  const {useClassrooms}=loadTs('lib/use-classrooms.ts',{react,'./api-service':{apiService:{classrooms:api}}});
  const render=()=>{cursor=0;return useClassrooms();};
  return{render,start:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);}};
}
const event={preventDefault(){}};

test('Shared classroom logic creates/edits/deletes persisted rows and reloads on remount',async()=>{
  let stored=[],payload;
  const api={getAll:async()=>[...stored],create:async data=>{payload=data;stored=[{id,...data}];return stored[0];},update:async(key,data)=>{stored=[{id:key,...data}];return stored[0];},delete:async()=>{stored=[];}};
  const page=mount(api);await page.start();page.render().setRoomNumber(' Hall A ');page.render().setCapacity('40');await page.render().handleSubmit(event);
  assert.deepEqual(payload,{roomNumber:'Hall A',capacity:40});assert.equal(page.render().rooms.length,1);
  const returned=mount(api);await returned.start();assert.equal(returned.render().rooms[0].roomNumber,'Hall A');
  returned.render().edit(returned.render().rooms[0]);assert.equal(returned.render().capacity,'40');returned.render().setCapacity('50');await returned.render().handleSubmit(event);
  assert.equal(returned.render().rooms[0].capacity,50);await returned.render().remove(id);assert.deepEqual(returned.render().rooms,[]);assert.deepEqual(stored,[]);
});

test('Failed classroom saves/deletes retain inputs and rows; invalid capacities never call API',async()=>{
  let writes=0;
  const page=mount({getAll:async()=>[row],create:async()=>{writes++;throw Error('Duplicate room');},delete:async()=>{throw Error('Classroom is in use');}});
  await page.start();page.render().setRoomNumber('Hall A');page.render().setCapacity('40');await page.render().handleSubmit(event);
  assert.equal(page.render().error,'Duplicate room');assert.equal(page.render().roomNumber,'Hall A');assert.equal(page.render().rooms.length,1);
  await page.render().remove(id);assert.equal(page.render().error,'Classroom is in use');assert.equal(page.render().rooms.length,1);
  for(const invalid of ['','0','-1','1.5','Infinity','2147483648']){page.render().setCapacity(invalid);await page.render().handleSubmit(event);}
  assert.equal(writes,1);
});

test('Classroom load outage shows an error and retry reads the backend without mock fallback',async()=>{
  let failed=true;
  const page=mount({getAll:async()=>{if(failed)throw Error('Unavailable');return[row];}});
  await page.start();assert.deepEqual(page.render().rooms,[]);assert.equal(page.render().error,'Unavailable');
  failed=false;await page.render().reload();assert.deepEqual(page.render().rooms,[row]);assert.equal(page.render().error,'');
});

test('Both classroom routes preserve their forms/tables and wire real actions to shared logic',()=>{
  const stub=()=>null;
  for(const file of ['app/admin/academics/classroom/page.tsx','app/admin/academic/class-room/page.tsx']){
    const calls=[];
    const logic={rooms:[row],roomNumber:'Hall A',capacity:'40',editingId:id,isLoading:false,saving:false,error:'',setRoomNumber:v=>calls.push(['number',v]),setCapacity:v=>calls.push(['capacity',v]),handleSubmit:()=>calls.push(['save']),edit:r=>calls.push(['edit',r.id]),remove:key=>calls.push(['delete',key]),reset:()=>{},reload:async()=>{}};
    const {default:Page}=loadTs(file,{'@/lib/use-classrooms':{useClassrooms:()=>logic},'@/components/common/PageHeader':{PageHeader:stub},'@/components/modules/academics/ClassRoomForm':{ClassRoomForm:stub},'@/components/common/DataTable':{DataTable:stub},'@/components/common/ListActionButtons':{ListActionButtons:stub},'@/components/ui/button':{Button:stub}});
    const walk=n=>!n||typeof n!=='object'?[]:[n,...[n.props?.children].flat(Infinity).flatMap(walk)];const nodes=walk(Page());
    if(file.includes('/academics/')){
      const table=nodes.find(n=>n.props?.searchKey==='roomNumber');assert.deepEqual(table.props.data,[row]);
      const actions=table.props.columns.find(c=>c.header==='Action').accessor(row).props;actions.onEdit();actions.onDelete();
      nodes.find(n=>n.props?.setRoomNumber).props.handleSubmit(event);
    }else{
      const buttons=nodes.filter(n=>n.type==='button'&&!n.props.type&&n.props.onClick);
      buttons[0].props.onClick();buttons[1].props.onClick();nodes.find(n=>n.type==='form').props.onSubmit(event);
    }
    assert.deepEqual(calls,[['edit',id],['delete',id],['save']]);
  }
});

}
void register();
