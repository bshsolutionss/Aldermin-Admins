async function register() {
const {test}=await import("node:test");
const assert=(await import("node:assert/strict")).default;
const {loadTs}=await import("../auth/load-ts.mjs");
const id='11111111-1111-4111-8111-111111111111';
const placement='22222222-2222-4222-8222-222222222222';
const profile={admissionNo:'ADM-1',firstName:'Ada',lastName:'Student',birthDate:'2010-01-01',gender:'female',email:null,phone:null,address:null,medicalNotes:null,categoryId:null,groupId:null};
const student={...profile,id,version:1,active:true};
const options={placements:[{id:placement,className:'Class',sectionName:'Section',yearName:'Year',academicYearId:'year',startDate:'2026-01-01',endDate:'2026-12-31'}],categories:[],groups:[],today:'2026-05-01'};
test('school record client sends real UUID routes, bounded filters, explicit enrollments and attendance versions',async()=>{
 const calls=[];const {schoolRecordsApi:api}=loadTs('lib/school-records-client.ts',{'./session-client':{sessionFetch:async(path,init)=>{calls.push([path,init]);return Response.json({});}}});
 await api.options();await api.students(2,'A & B',false);await api.student(id);await api.createStudent(profile);await api.updateStudent(id,{...profile,active:false,version:1});await api.guardian(id,{name:'Parent',relationship:'Mother',isPrimary:true});await api.enroll(id,{classSectionId:placement,rollNo:'R1',startDate:'2026-01-01',endDate:'2026-12-31'});await api.endEnrollment(id,placement,'2026-06-01',1);await api.attendance('students','2026-05-01',placement,2);await api.saveAttendance('students','2026-05-01',[{targetId:placement,status:'absent',note:'',version:0}]);
 assert.equal(calls[1][0],'/api/student-records/students?page=2&pageSize=20&search=A+%26+B&active=false');assert.equal(calls[3][1].method,'POST');assert.equal(calls[4][1].method,'PUT');assert.equal(JSON.parse(calls[7][1].body).version,1);assert.match(calls[8][0],/classSectionId=/);assert.deepEqual(JSON.parse(calls[9][1].body).entries[0],{targetId:placement,status:'absent',note:'',version:0});
});
test('school record proxy limits paths/methods, validates IDs and rejects unauthorized or foreign-origin writes',async()=>{
 let user={role:'admin'},origin=true,called=0;
 const {proxySchoolRecords:proxy}=loadTs('lib/school-records-proxy.ts',{'./auth-server':{getVerifiedUser:async()=>({user,accessToken:'cookie-token'}),isSameOrigin:()=>origin,authFetch:async()=>{called++;return Response.json({message:'Stale'},{status:409});}}});
 const req=(method='GET',body)=>new Request('http://localhost/api/student-records/students',{method,...(body?{body}:{})});
 for(const path of [['users'],['students','bad'],['students',id,'unknown'],['students',id,'guardians','bad'],['students',id,'enrollments',placement,'extra']])assert.equal((await proxy(req(),'student-records',path)).status,404);
 user=null;assert.equal((await proxy(req(),'student-records',['students'])).status,401);user={role:'student'};assert.equal((await proxy(req(),'student-records',['students'])).status,403);user={role:'admin'};
 origin=false;assert.equal((await proxy(req('POST'),'student-records',['students'])).status,403);origin=true;
 assert.equal((await proxy(req('POST','invalid'),'student-records',['students'])).status,400);assert.equal(called,0);
 const response=await proxy(req('PUT','{}'),'student-records',['students',id]);assert.equal(response.status,409);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal((await proxy(req('POST','{}'),'school-attendance',['staff'])).status,404);
});
function mount(file,symbol,api,...args){
 const state=[],effects=[];let cursor=0;
 const react={useState(value){const key=cursor++;if(!(key in state))state[key]=value;return[state[key],next=>state[key]=typeof next==='function'?next(state[key]):next];},useRef(value){const key=cursor++;if(!(key in state))state[key]={current:value};return state[key];},useCallback(fn,deps){const key=cursor++,before=state[key];if(!before||deps.some((v,i)=>v!==before.deps[i]))state[key]={fn,deps};return state[key].fn;},useEffect(fn,deps){const key=cursor++,before=state[key];if(!before||deps.some((v,i)=>v!==before.deps[i])){state[key]={deps,cleanup:before?.cleanup};effects.push(()=>{state[key].cleanup?.();state[key].cleanup=fn();});}}};
 const hook=loadTs(file,{react,'./school-records-client':{schoolRecordsApi:api}})[symbol];
 const render=()=>{cursor=0;return hook(...args);};
 const flush=async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);};return{render,flush,start:flush};
}
const editor=(api,key)=>mount('lib/use-student-editor.ts','useStudentEditor',api,key);
const register=api=>mount('lib/use-attendance-register.ts','useAttendanceRegister',api,'students');
test('student admission saves profile and explicit enrollment together without synthetic IDs, rolls or years',async()=>{
 let received;const page=editor({options:async()=>options,createStudent:async input=>{received=input;return{student,guardian:null,enrollment:{...input.enrollment,id:placement,studentId:id,version:1}};}});
 await page.start();page.render().setInput(profile);assert.equal(await page.render().saveProfile(),false);assert.match(page.render().error,/placement/);
 page.render().selectPlacement(placement);page.render().setEnrollment({...page.render().enrollment,rollNo:'R1'});assert.equal(await page.render().saveProfile(),true);assert.equal(received.enrollment.rollNo,'R1');assert.equal(received.enrollment.classSectionId,placement);assert.equal(received.enrollment.startDate,'2026-01-01');assert.equal(page.render().student.id,id);assert.equal(page.render().enrollments.length,1);
});
test('failed admission keeps drafts, duplicate writes are suppressed, and saved profiles use optimistic versions',async()=>{
 let finish,calls=0;const page=editor({options:async()=>options,student:async()=>({student,guardians:[],enrollments:[]}),updateStudent:async()=>{calls++;return new Promise(resolve=>finish=resolve);}},id);
 await page.start();page.render().setInput({...profile,firstName:'Draft'});const pending=page.render().saveProfile();assert.equal(await page.render().saveProfile(),false);assert.equal(calls,1);finish(Promise.reject(Error('Version changed')));await pending;assert.equal(page.render().input.firstName,'Draft');assert.equal(page.render().student.firstName,'Ada');assert.equal(page.render().student.version,1);
});
test('guardian and enrollment actions save independently and retain failed guardian drafts',async()=>{
 let fails=true;
 const page=editor({options:async()=>options,student:async()=>({student,guardians:[],enrollments:[]}),guardian:async(_id,input)=>{if(fails)throw Error('Primary guardian already exists');return{...input,id:placement,studentId:id,version:1};},enroll:async(_id,input)=>({...input,id:placement,studentId:id,version:1})},id);
 await page.start();page.render().setGuardian({name:'Parent',relationship:'Mother',isPrimary:true,email:null,phone:null,address:null});assert.equal(await page.render().saveGuardian(),false);assert.equal(page.render().guardian.name,'Parent');fails=false;assert.equal(await page.render().saveGuardian(),true);assert.equal(page.render().guardians.length,1);
 page.render().selectPlacement(placement);page.render().setEnrollment({...page.render().enrollment,rollNo:'R1'});assert.equal(await page.render().enroll(),true);assert.equal(page.render().enrollments.length,1);
});
const unmarked={targetId:id,name:'Ada Student',reference:'ADM-1',rollNo:'R1',id:null,status:null,note:'',version:0};
const attendancePage=items=>({items,total:items.length,page:1,pageSize:50,date:'2026-05-01',calendar:{today:'2026-05-01',weekend:null,holiday:null}});
test('attendance loads actual enrollment IDs as unmarked and submits only explicitly edited rows',async()=>{
 let stored=[unmarked,{...unmarked,targetId:placement,name:'Other'}],received;
 const page=register({options:async()=>options,attendance:async()=>attendancePage(stored),saveAttendance:async(_kind,date,entries)=>{received={date,entries};stored=stored.map(item=>item.targetId===id?{...item,status:'absent',version:1}:item);return{changed:1,items:[]};}});
 await page.start();page.render().setPlacement(placement);await page.flush();assert.equal(page.render().items[0].status,null);
 page.render().change(id,{status:'absent'});await page.render().save();assert.deepEqual(received,{date:'2026-05-01',entries:[{targetId:id,status:'absent',note:'',version:0}]});assert.equal(page.render().items[1].status,null);assert.deepEqual(page.render().dirty,[]);
});
test('failed attendance batches retain edits and freeze date/page changes until save or explicit discard',async()=>{
 const page=register({options:async()=>options,attendance:async()=>attendancePage([unmarked]),saveAttendance:async()=>{throw Error('Stale register');}});
 await page.start();page.render().setPlacement(placement);await page.flush();page.render().change(id,{status:'late',note:'Bus delay'});page.render().setDate('2026-05-02');page.render().setPage(2);assert.equal(page.render().date,'2026-05-01');assert.equal(page.render().page,1);await page.render().save();assert.equal(page.render().items[0].note,'Bus delay');assert.deepEqual(page.render().dirty,[id]);assert.match(page.render().error,/Stale/);await page.render().reload();assert.deepEqual(page.render().dirty,[]);
});
test('editing a note without choosing attendance status never sends a batch',async()=>{
 let calls=0;const page=register({options:async()=>options,attendance:async()=>attendancePage([unmarked]),saveAttendance:async()=>{calls++;}});
 await page.start();page.render().setPlacement(placement);await page.flush();page.render().change(id,{note:'Note'});await page.render().save();assert.equal(calls,0);assert.match(page.render().error,/Choose a status/);
});
test('unapplied registry errors disable profile submission and retain an empty real-data state',async()=>{
 const page=editor({options:async()=>{throw Error('Migration required');}});await page.start();assert.equal(page.render().ready,false);assert.equal(page.render().student,null);assert.deepEqual(page.render().options.placements,[]);assert.equal(await page.render().saveProfile(),false);assert.match(page.render().error,/Migration/);
});

}
void register();
