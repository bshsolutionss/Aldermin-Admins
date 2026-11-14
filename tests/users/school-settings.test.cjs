const {test}=require('node:test');const assert=require('node:assert/strict');const {loadTs}=require('../auth/load-ts.cjs');
const saved={schoolName:'School',schoolCode:null,contactEmail:null,contactPhone:null,address:null,timezone:'Asia/Karachi',version:1,updatedAt:'2026-11-13T00:00:00Z'};
const history={items:[],total:0,page:1,pageSize:10};
function mount(api){
 const state=[],effects=[];let cursor=0;
 const react={useState(value){const k=cursor++;if(!(k in state))state[k]=value;return[state[k],next=>{state[k]=typeof next==='function'?next(state[k]):next;}];},useRef(value){const k=cursor++;if(!(k in state))state[k]={current:value};return state[k];},useEffect(fn){const k=cursor++;if(!(k in state)){state[k]=true;effects.push(fn);}}};
 const {useSchoolSettings}=loadTs('lib/use-school-settings.ts',{react,'./api-service':{apiService:{schoolSettings:api}}});
 const render=()=>{cursor=0;return useSchoolSettings();};return{render,start:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);}};
}
test('settings client sends only explicit fields/version and requests paginated history',async()=>{
 const calls=[];const {apiService}=loadTs('lib/api-service.ts',{'./session-client':{sessionFetch:async(...args)=>{calls.push(args);return Response.json({});},withSessionLock:fn=>fn()}});
 await apiService.schoolSettings.save({schoolName:'School',timezone:'UTC',version:0});await apiService.schoolSettings.history(2);
 assert.equal(calls[0][0],'/api/school-settings');assert.equal(calls[0][1].method,'PUT');assert.deepEqual(JSON.parse(calls[0][1].body),{schoolName:'School',timezone:'UTC',version:0});assert.match(calls[1][0],/page=2&pageSize=10/);
});
test('settings proxy guards verified admin/origin/JSON and preserves backend conflicts and schema gates',async()=>{
 let user=null,origin=true,status=409;const calls=[];
 const {proxySchoolSettings}=loadTs('lib/school-settings-proxy.ts',{'./auth-server':{getVerifiedUser:async()=>({user,accessToken:'cookie-token'}),isSameOrigin:()=>origin,authFetch:async(...args)=>{calls.push(args);return Response.json({message:'Reload'},{status});}}});
 const get=new Request('http://localhost/api/school-settings/history?page=2');const put=body=>new Request('http://localhost/api/school-settings',{method:'PUT',body});
 assert.equal((await proxySchoolSettings(get,true)).status,401);user={role:'instructor'};assert.equal((await proxySchoolSettings(get,true)).status,403);user={role:'admin'};
 origin=false;assert.equal((await proxySchoolSettings(put('{}'))).status,403);origin=true;
 assert.equal((await proxySchoolSettings(put('bad'))).status,400);assert.equal(calls.length,0);
 assert.equal((await proxySchoolSettings(put('{}'))).status,409);status=503;
 const response=await proxySchoolSettings(get,true);assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(calls[1][0],'/school-settings/history?page=2');assert.equal(calls[1][1].headers.Authorization,'Bearer cookie-token');
});
test('failed settings writes preserve unsaved inputs and persisted values; successful writes use the returned version',async()=>{
 let fail=true;
 const hook=mount({get:async()=>({settings:saved}),history:async()=>history,save:async input=>{if(fail)throw Error('Settings changed. Reload.');return{settings:{...input,version:2},changed:true};}});
 await hook.start();hook.render().setDraft(current=>({...current,schoolName:'Unsaved'}));await hook.render().save();
 assert.equal(hook.render().draft.schoolName,'Unsaved');assert.equal(hook.render().settings.schoolName,'School');assert.match(hook.render().error,/Reload/);
 fail=false;await hook.render().save();assert.equal(hook.render().draft.version,2);assert.equal(hook.render().settings.schoolName,'Unsaved');assert.match(hook.render().notice,/saved/);
});
test('unapplied settings schema shows retryable error without fabricating configured school details',async()=>{
 let fail=true;const hook=mount({get:async()=>{if(fail)throw Error('Awaiting approved migration');return{settings:null};},history:async()=>history});
 await hook.start();assert.equal(hook.render().ready,false);assert.equal(hook.render().settings,null);assert.equal(hook.render().draft.schoolName,'');
 fail=false;await hook.render().reload();assert.equal(hook.render().ready,true);assert.equal(hook.render().draft.version,0);
});
test('duplicate save clicks cannot submit concurrent writes',async()=>{
 let resolve,writes=0;const hook=mount({get:async()=>({settings:saved}),history:async()=>history,save:()=>{writes++;return new Promise(done=>{resolve=done;});}});
 await hook.start();const first=hook.render().save();await hook.render().save();assert.equal(writes,1);resolve({settings:saved,changed:false});await first;
});
test('an audit read failure after a successful save does not misreport the persisted change as a failed save',async()=>{
 let failHistory=false;const hook=mount({get:async()=>({settings:saved}),history:async()=>{if(failHistory)throw Error('Outage');return history;},save:async()=>({settings:{...saved,schoolName:'Persisted',version:2},changed:true})});
 await hook.start();failHistory=true;await hook.render().save();assert.equal(hook.render().settings.schoolName,'Persisted');assert.match(hook.render().error,/Settings are saved/);
});
