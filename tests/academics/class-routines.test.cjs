const {test}=require('node:test');const assert=require('node:assert/strict');const {loadTs}=require('../auth/load-ts.cjs');
const id='11111111-1111-4111-8111-111111111111',assignmentId='22222222-2222-4222-8222-222222222222',classroomId='33333333-3333-4333-8333-333333333333',yearId='44444444-4444-4444-8444-444444444444';
const allocation={id:assignmentId,classId:id,classSectionId:id,className:'Class 1',sectionName:'A',subjectName:'Math',staffId:id,teacherName:'Teacher',academicYearId:yearId};
const choices={academicYearId:yearId,academicYears:[{id:yearId,name:'2026'}],allocations:[allocation],classrooms:[{id:classroomId,roomNumber:'101',capacity:40}]};
const row={id,assignmentId,classroomId,classId:id,classSectionId:id,academicYearId:yearId,class:'Class 1',section:'A',subject:'Math',teacher:'Teacher',staffId:id,room:'101',day:'Monday',dayOfWeek:1,startTime:'08:00',endTime:'09:00'};
const event={preventDefault(){}};
test('Routine client uses one real API, including filters, options and the legacy getter',async()=>{
 const calls=[];const{apiService}=loadTs('lib/api-service.ts',{'./session-client':{sessionFetch:async(path,o)=>{calls.push([path,o.method||'GET']);return Response.json([]);},withSessionLock:fn=>fn()}});
 await apiService.classRoutines.getAll(yearId,id);await apiService.classRoutines.getOptions(yearId);await apiService.classRoutines.getById(id);
 await apiService.classRoutines.create({assignmentId,classroomId,dayOfWeek:1,startTime:'08:00',endTime:'09:00'});await apiService.classRoutines.update(id,{endTime:'10:00'});await apiService.classRoutines.delete(id);await apiService.academics.getRoutines();
 assert.deepEqual(calls,[['/api/class-routines?academicYearId='+yearId+'&classSectionId='+id,'GET'],['/api/class-routines/options?academicYearId='+yearId,'GET'],['/api/class-routines/'+id,'GET'],['/api/class-routines','POST'],['/api/class-routines/'+id,'PATCH'],['/api/class-routines/'+id,'DELETE'],['/api/class-routines','GET']]);
});
test('Routine proxy enforces verified admin, CSRF, IDs/JSON and preserves filter/error responses',async()=>{
 let user={role:'admin'},sameOrigin=true,calls=[];
 const{proxyClassRoutines}=loadTs('lib/class-routines-proxy.ts',{'@/lib/auth-server':{getVerifiedUser:async()=>({user,accessToken:'cookie-token'}),isSameOrigin:()=>sameOrigin,authFetch:async(path,o)=>{calls.push([path,o]);return Response.json({message:'Time overlap'},{status:409});}}});
 const get=()=>new Request('http://localhost/api/class-routines?academicYearId='+yearId);
 for(const role of ['student','instructor']){user={role};assert.equal((await proxyClassRoutines(get())).status,403);}
 user=null;assert.equal((await proxyClassRoutines(get())).status,401);user={role:'admin'};
 sameOrigin=false;assert.equal((await proxyClassRoutines(new Request('http://localhost/api/class-routines',{method:'POST'}))).status,403);sameOrigin=true;
 assert.equal((await proxyClassRoutines(get(),'bad')).status,400);
 assert.equal((await proxyClassRoutines(new Request('http://localhost/api/class-routines',{method:'POST',body:'bad'}))).status,400);assert.equal(calls.length,0);
 const res=await proxyClassRoutines(get(),'options');assert.equal(res.status,409);assert.equal(res.headers.get('cache-control'),'no-store');
 assert.equal(calls[0][0],'/class-routines/options?academicYearId='+yearId);assert.equal(calls[0][1].headers.Authorization,'Bearer cookie-token');
});
function mount(api){
 const state=[],effects=[];let cursor=0;const react={useState(v){const k=cursor++;if(!(k in state))state[k]=v;return[state[k],n=>{state[k]=typeof n==='function'?n(state[k]):n;}];},useRef(v){const k=cursor++;if(!(k in state))state[k]={current:v};return state[k];},useEffect(fn){const k=cursor++;if(!(k in state)){state[k]=true;effects.push(fn);}}};
 const{useClassRoutines}=loadTs('lib/use-class-routines.ts',{react,'./api-service':{apiService:{classRoutines:api}}});const render=()=>{cursor=0;return useClassRoutines();};
 return{render,start:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);}};
}
function fill(page){for(const[field,value]of Object.entries({class:id,section:id,subject:assignmentId,room:classroomId,day:'1',startTime:'08:00',endTime:'09:00'}))page.render().change(field,value);}
test('Routine form derives teacher, saves real IDs, edits/deletes persisted rows and reloads',async()=>{
 let rows=[],sent;const api={getOptions:async()=>choices,getAll:async()=>rows,create:async data=>{sent=data;rows=[row];return row;},update:async(key,data)=>{sent={id:key,...data};rows=[{...row,...data}];return rows[0];},delete:async()=>{rows=[];}};
 const page=mount(api);await page.start();fill(page);assert.equal(page.render().formData.teacher,id);await page.render().handleSubmit(event);
 assert.deepEqual(sent,{assignmentId,classroomId,dayOfWeek:1,startTime:'08:00',endTime:'09:00'});assert.equal(page.render().routines.length,1);
 const returned=mount(api);await returned.start();returned.render().edit(row);assert.equal(returned.render().formData.subject,assignmentId);
 returned.render().change('endTime','10:00');await returned.render().handleSubmit(event);assert.equal(sent.id,id);assert.equal(sent.endTime,'10:00');
 await returned.render().remove(id);assert.deepEqual(returned.render().routines,[]);assert.deepEqual(rows,[]);
});
test('Routine dependency changes clear stale IDs; invalid time ranges never call the API',async()=>{
 let writes=0;const page=mount({getOptions:async()=>choices,getAll:async()=>[],create:async()=>{writes++;return row;}});await page.start();fill(page);
 page.render().change('endTime','07:00');await page.render().handleSubmit(event);assert.equal(writes,0);assert.match(page.render().error,/end time/i);
 page.render().change('class','other');assert.equal(page.render().formData.section,'');assert.equal(page.render().formData.subject,'');assert.equal(page.render().formData.teacher,'');
});
test('Routine overlap failures retain form inputs; failed deletes retain rows; year filtering is forwarded',async()=>{
 let year;const page=mount({getOptions:async id=>({...choices,academicYearId:id||yearId}),getAll:async id=>{year=id;return[row];},create:async()=>{throw Error('Time overlap');},delete:async()=>{throw Error('Delete failed');}});await page.start();fill(page);
 await page.render().handleSubmit(event);assert.equal(page.render().formData.subject,assignmentId);assert.equal(page.render().error,'Time overlap');
 await page.render().remove(id);assert.equal(page.render().routines.length,1);assert.equal(page.render().error,'Delete failed');
 await page.render().reload(id);assert.equal(year,id);assert.equal(page.render().formData.subject,'');
});
test('Routine service outages show retryable error without inserting demo rows',async()=>{
 let failed=true;const page=mount({getOptions:async()=>choices,getAll:async()=>{if(failed)throw Error('Unavailable');return[row];}});await page.start();assert.deepEqual(page.render().routines,[]);assert.equal(page.render().error,'Unavailable');
 failed=false;await page.render().reload();assert.equal(page.render().routines.length,1);assert.equal(page.render().error,'');
});
test('Both routine routes keep their forms/tables and wire the shared real actions',()=>{
 const stub=()=>null;
 for(const file of ['app/admin/academics/routine/page.tsx','app/admin/academic/class-routine/page.tsx']){
  const calls=[];const logic={routines:[row],options:choices,formData:{},isLoading:false,saving:false,error:'',editingId:null,classes:[],sections:[],subjects:[],change:()=>{},handleSubmit:()=>calls.push('save'),edit:()=>calls.push('edit'),remove:()=>calls.push('delete'),reset:()=>{},reload:async()=>{}};
  const{default:Page}=loadTs(file,{'@/lib/use-class-routines':{useClassRoutines:()=>logic,routineDays:['Monday']},'@/components/common/PageHeader':{PageHeader:stub},'@/components/modules/academics/RoutineForm':{RoutineForm:stub},'@/components/common/DataTable':{DataTable:stub},'@/components/common/ListActionButtons':{ListActionButtons:stub},'@/components/ui/button':{Button:stub}});
  const walk=n=>!n||typeof n!=='object'?[]:[n,...[n.props?.children].flat(Infinity).flatMap(walk)];const nodes=walk(Page());
  if(file.includes('/academics/')){const table=nodes.find(n=>n.props?.searchKey==='class');assert.deepEqual(table.props.data,[row]);const a=table.props.columns.find(c=>c.header==='Action').accessor(row).props;a.onEdit();a.onDelete();nodes.find(n=>n.props?.change).props.handleSubmit(event);}
  else{const buttons=nodes.filter(n=>n.type==='button'&&!n.props.type&&n.props.onClick);buttons[0].props.onClick();buttons[1].props.onClick();nodes.find(n=>n.type==='form').props.onSubmit(event);}
  assert.deepEqual(calls,['edit','delete','save']);
 }
});
