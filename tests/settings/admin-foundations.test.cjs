const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadTs}=require('../auth/load-ts.cjs');
const id='11111111-1111-4111-8111-111111111111';
const row={id,name:'Merit',archived:false,version:1,updatedAt:'2026-11-14T00:00:00Z'};

test('foundation client uses authenticated real endpoints, versions and server pagination',async()=>{
  const calls=[];
  const {foundationsApi:api}=loadTs('lib/admin-foundations-client.ts',{'./session-client':{sessionFetch:async(path,options)=>{calls.push([path,options]);return Response.json({});}}});
  await api.list('categories',2,'a & b',true);await api.save('groups',{name:'Chess'});await api.save('categories',{name:'Merit',version:1,archived:true},id);await api.weekends();await api.saveWeekends([0,6],2);await api.history(3);
  assert.equal(calls[0][0],'/api/admin-foundations/categories?page=2&pageSize=20&search=a+%26+b&archived=true');
  assert.equal(calls[1][1].method,'POST');assert.equal(calls[2][1].method,'PUT');assert.equal(calls[2][0],'/api/admin-foundations/categories/'+id);assert.deepEqual(JSON.parse(calls[4][1].body),{days:[0,6],version:2});
  for(const [,options]of calls)assert.equal(options.cache,'no-store');
});
test('foundation client surfaces validation/conflict/unavailable responses without fabricated records',async()=>{
  let response=Response.json({message:['Invalid date','Invalid version']},{status:400});
  const {foundationsApi:api}=loadTs('lib/admin-foundations-client.ts',{'./session-client':{sessionFetch:async()=>response}});
  await assert.rejects(api.weekends(),/Invalid date; Invalid version/);
  response=new Response('bad',{status:503});await assert.rejects(api.weekends(),/invalid response/);
});
test('foundation proxy rejects arbitrary paths, methods, cross-origin writes and unauthenticated/non-admin access',async()=>{
  let user={role:'admin'},origin=true,calls=0;
  const {proxyFoundations:proxy}=loadTs('lib/admin-foundations-proxy.ts',{'./auth-server':{getVerifiedUser:async()=>({user,accessToken:'cookie-token'}),isSameOrigin:()=>origin,authFetch:async()=>{calls++;return Response.json({});}}});
  const req=(method='GET',body)=>new Request('http://localhost/api/admin-foundations/categories',{method,...(body?{body}:{})});
  for(const parts of [['users'],['categories','bad'],['categories',id,'bad'],['history',id],['weekends',id],['../users']])assert.equal((await proxy(req(),parts)).status,404);
  assert.equal((await proxy(req('DELETE'),['categories',id])).status,405);
  origin=false;assert.equal((await proxy(req('POST'),['categories'])).status,403);origin=true;
  for(const role of ['student','instructor']){user={role};assert.equal((await proxy(req(),['categories'])).status,403);}
  user=null;assert.equal((await proxy(req(),['categories'])).status,401);user={role:'admin'};
  assert.equal((await proxy(req('POST','invalid'),['categories'])).status,400);assert.equal(calls,0);
});
test('foundation proxy forwards cookie token, bound route/query and original API errors without caching',async()=>{
  let captured;
  const {proxyFoundations:proxy}=loadTs('lib/admin-foundations-proxy.ts',{'./auth-server':{getVerifiedUser:async()=>({user:{role:'admin'},accessToken:'verified'}),isSameOrigin:()=>true,authFetch:async(...args)=>{captured=args;return Response.json({message:'Stale version'},{status:409});}}});
  const response=await proxy(new Request('http://localhost/api/admin-foundations/categories',{method:'PUT',body:JSON.stringify({name:'Merit',version:1,archived:true})}),['categories',id]);
  assert.equal(response.status,409);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(captured[0],'/admin-foundations/categories/'+id);assert.equal(captured[1].headers.Authorization,'Bearer verified');
});
function mount(file,symbol,api,...args){
  const state=[],effects=[];let cursor=0;
  const react={useState(value){const key=cursor++;if(!(key in state))state[key]=value;return[state[key],next=>state[key]=typeof next==='function'?next(state[key]):next];},useRef(value){const key=cursor++;if(!(key in state))state[key]={current:value};return state[key];},useEffect(fn,deps){const key=cursor++,before=state[key];if(!before||deps.some((v,i)=>v!==before.deps[i])){state[key]={deps,cleanup:before?.cleanup};effects.push(()=>{state[key].cleanup?.();state[key].cleanup=fn();});}}};
  react.useCallback=(fn,deps)=>{const key=cursor++,before=state[key];if(!before||deps.some((value,index)=>value!==before.deps[index]))state[key]={deps,fn};return state[key].fn;};
  const hook=loadTs(file,{react,'./admin-foundations-client':{foundationsApi:api}})[symbol];
  const render=()=>{cursor=0;return hook(...args);};
  return{render,flush:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);},start:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);}};
}
const records=api=>mount('lib/use-foundation-records.ts','useFoundationRecords',api,'categories');
test('catalog page logic persists creates and versioned archive/restore, and survives remount',async()=>{
  let stored=[],received;
  const api={list:async(_r,page=1)=>({items:[...stored],total:stored.length,page,pageSize:20}),save:async(_r,input,key)=>{received=input;const record={...row,...input,id:key||id,version:key?stored[0].version+1:1};stored=[record];return{record,changed:true};}};
  const page=records(api);await page.start();assert.deepEqual(page.render().items,[]);
  page.render().setDraft({name:' Merit '});assert.equal(await page.render().save(),true);assert.deepEqual(received,{name:'Merit'});assert.equal(page.render().draft.name,'');
  await page.render().archive(page.render().items[0]);assert.equal(received.version,1);assert.equal(page.render().items[0].archived,true);
  await page.render().archive(page.render().items[0]);assert.equal(page.render().items[0].archived,false);
  const reopened=records(api);await reopened.start();assert.equal(reopened.render().items[0].name,'Merit');
});
test('failed catalog writes retain edited draft and record; load failures disable writes until retry',async()=>{
  let failed=false,writes=0;
  const page=records({list:async()=>{if(failed)throw Error('Unavailable');return{items:[row],total:1,page:1,pageSize:20};},save:async()=>{writes++;throw Error('Version changed');}});
  await page.start();page.render().edit(row);page.render().setDraft({name:'Draft'});assert.equal(await page.render().save(),false);assert.equal(page.render().draft.name,'Draft');assert.equal(page.render().editing.id,id);assert.equal(page.render().items[0].name,'Merit');
  failed=true;await page.render().reload();assert.equal(page.render().ready,false);assert.equal(await page.render().save(),false);assert.equal(writes,1);
  failed=false;await page.render().reload();assert.equal(page.render().ready,true);
});
test('late catalog responses cannot replace a newer search result',async()=>{
  let finish;
  const page=records({list:async(_r,_p,search)=>search?{items:[{...row,name:'New'}],total:1,page:1,pageSize:20}:new Promise(resolve=>finish=resolve)});
  await page.start();page.render().setSearch('New');await page.flush();assert.equal(page.render().items[0].name,'New');
  finish({items:[row],total:1,page:1,pageSize:20});await new Promise(setImmediate);assert.equal(page.render().items[0].name,'New');
});
test('weekends remain visibly unconfigured, save with version and retain draft after conflict',async()=>{
  let fail=false,calls=[];
  const page=mount('lib/use-weekends.ts','useWeekends',{weekends:async()=>({weekends:null}),saveWeekends:async(days,version)=>{calls.push([days,version]);if(fail)throw Error('Stale version');return{weekends:{days,version:1,updatedAt:''},changed:true};}});
  await page.start();assert.equal(page.render().version,0);assert.deepEqual(page.render().days,[]);
  page.render().setDays([0,6]);await page.render().save();assert.deepEqual(calls[0],[[0,6],0]);assert.equal(page.render().version,1);
  fail=true;page.render().setDays([5]);await page.render().save();assert.deepEqual(page.render().days,[5]);assert.equal(page.render().version,1);assert.match(page.render().error,/Stale/);
  page.render().setDays([0,1,2,3,4,5,6]);await page.render().save();assert.equal(calls.length,2);
});
test('duplicate saves are suppressed while the first catalog write is pending',async()=>{
  let finish,writes=0;
  const page=records({list:async()=>({items:[],total:0,page:1,pageSize:20}),save:async()=>{writes++;return new Promise(resolve=>finish=resolve);}});
  await page.start();page.render().setDraft({name:'Merit'});const pending=page.render().save();await page.render().save();assert.equal(writes,1);finish({record:row,changed:true});await pending;
});
