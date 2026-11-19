async function register() {
const {test,afterEach,mock}=await import("node:test");
const assert=(await import("node:assert/strict")).default;
const {NextRequest}=await import("next/server.js");
const {loadTs}=await import("./load-ts.mjs");
afterEach(()=>mock.restoreAll());
const student={id:'student-id',name:'Real Student',email:'student@example.test',role:'student'};
const helper=()=>loadTs('lib/auth-server.ts',{'next/headers':{cookies:async()=>({get:()=>undefined})}});
const req=(body)=>new NextRequest('http://localhost/api/auth/register',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json'},body:JSON.stringify(body)});
test('invalid credentials never resolve to client login success or attempt session verification',async()=>{
  mock.method(globalThis,'fetch',async()=>{throw Error('must not verify');});
  const {apiService}=loadTs('lib/api-service.ts',{'./session-client':{withSessionLock:fn=>fn(),sessionFetch:async()=>Response.json({message:'Invalid email or password'},{status:401})}});
  await assert.rejects(apiService.auth.login({email:'random@example.invalid',password:'random',portal:'portal'}),/Invalid email or password/);
  assert.equal(fetch.mock.callCount(),0);
});
for(const failure of ['missing cookie','malformed success','wrong user','wrong role'])test('client rejects unverified login: '+failure,async()=>{
  mock.method(globalThis,'fetch',async()=>failure==='missing cookie'?Response.json({message:'Unauthenticated'},{status:401}):Response.json(failure==='wrong user'?{...student,id:'other'}:failure==='wrong role'?{...student,role:'admin'}:student));
  const {apiService}=loadTs('lib/api-service.ts',{'./session-client':{withSessionLock:fn=>fn(),sessionFetch:async()=>Response.json(failure==='malformed success'?{message:'success'}:{user:student})}});
  await assert.rejects(apiService.auth.login({email:student.email,password:'password',portal:'portal'}),/verified session/);
});
test('client accepts valid cookie session only after verification, for both portal roles',async()=>{
  for(const role of ['student','instructor']){
    const user={...student,role};mock.method(globalThis,'fetch',async()=>Response.json(user));
    const {apiService}=loadTs('lib/api-service.ts',{'./session-client':{withSessionLock:fn=>fn(),sessionFetch:async()=>Response.json({user})}});
    assert.equal((await apiService.auth.login({email:user.email,password:'password',portal:'portal'})).user.role,role);
    mock.restoreAll();
  }
});
test('registration proxy forwards real request and returns only safe student profile without session cookies',async()=>{
  mock.method(globalThis,'fetch',async(_url,options)=>{assert.deepEqual(JSON.parse(options.body),{name:'Student',email:student.email,password:'password123'});return Response.json({user:{...student,passwordHash:'must-not-leak'}},{status:201});});
  const res=await loadTs('app/api/auth/register/route.ts',{'@/lib/auth-server':helper()}).POST(req({name:' Student ',email:student.email.toUpperCase(),password:'password123'}));
  assert.equal(res.status,201);assert.equal((await res.json()).user.passwordHash,undefined);assert.equal(res.headers.get('set-cookie'),null);
});
test('registration proxy rejects privilege fields before contacting backend',async()=>{
  mock.method(globalThis,'fetch',async()=>{throw Error('must not fetch');});
  for(const role of ['admin','instructor']){
    const res=await loadTs('app/api/auth/register/route.ts',{'@/lib/auth-server':helper()}).POST(req({name:'Student',email:student.email,password:'password123',role}));assert.equal(res.status,400);
  }
  assert.equal(fetch.mock.callCount(),0);
});
test('registration proxy propagates duplicate/validation failures and rejects fake success',async()=>{
  for(const status of [400,409,200]){
    mock.method(globalThis,'fetch',async()=>Response.json({message:status===409?'Email already registered':'invalid'},{status}));
    const res=await loadTs('app/api/auth/register/route.ts',{'@/lib/auth-server':helper()}).POST(req({name:'Student',email:student.email,password:'password123'}));assert.equal(res.status,status===200?503:status);mock.restoreAll();
  }
});

}
void register();
