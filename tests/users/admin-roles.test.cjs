const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../auth/load-ts.cjs');
const id='11111111-1111-4111-8111-111111111111';

test('admin role client encodes account filters and sends versions and previous assignment state',async()=>{
  const calls=[];
  const {apiService}=loadTs('lib/api-service.ts',{'./session-client':{sessionFetch:async(...args)=>{calls.push(args);return Response.json({});},withSessionLock:fn=>fn()}});
  await apiService.adminRoles.accounts('a+b@example.invalid',2);
  await apiService.adminRoles.update({id,name:'Office',permissions:['classes.read'],version:4});
  await apiService.adminRoles.assign({id,roleId:null},id);
  assert.match(calls[0][0],/search=a%2Bb%40example.invalid&page=2&pageSize=25/);
  assert.deepEqual(JSON.parse(calls[1][1].body),{name:'Office',permissions:['classes.read'],version:4});
  assert.deepEqual(JSON.parse(calls[2][1].body),{roleId:id,previousRoleId:null});
});
test('role proxy guards admin sessions, origin, IDs and JSON before forwarding backend conflicts',async()=>{
  let user=null,origin=true;const calls=[];
  const {proxyAdminRoles}=loadTs('lib/admin-roles-proxy.ts',{'./auth-server':{
    getVerifiedUser:async()=>({user,accessToken:'cookie-token'}),isSameOrigin:()=>origin,
    authFetch:async(...args)=>{calls.push(args);return Response.json({message:'Reload'},{status:409});}
  }});
  const get=new Request('http://localhost/api/admin-roles');
  assert.equal((await proxyAdminRoles(get,'roles')).status,401);
  user={role:'instructor'};assert.equal((await proxyAdminRoles(get,'roles')).status,403);user={role:'admin'};
  const patch=body=>new Request('http://localhost/api/admin-roles/accounts/'+id,{method:'PATCH',body});
  origin=false;assert.equal((await proxyAdminRoles(patch('{}'),'accounts',id)).status,403);origin=true;
  assert.equal((await proxyAdminRoles(patch('{}'),'accounts','bad')).status,400);
  assert.equal((await proxyAdminRoles(patch('bad'),'accounts',id)).status,400);
  assert.equal(calls.length,0);
  const result=await proxyAdminRoles(patch('{"roleId":null,"previousRoleId":null}'),'accounts',id);
  assert.equal(result.status,409);assert.equal(result.headers.get('cache-control'),'no-store');
  assert.equal(calls[0][0],'/admin-roles/accounts/'+id);assert.equal(calls[0][1].headers.Authorization,'Bearer cookie-token');
});
test('dynamic role and assignment routes await params and use the protected proxy',async()=>{
  for(const [file,action] of [['app/api/admin-roles/[id]/route.ts','roles'],['app/api/admin-roles/accounts/[id]/route.ts','accounts']]){
    let args;const route=loadTs(file,{'@/lib/admin-roles-proxy':{proxyAdminRoles:async(...values)=>{args=values;return Response.json({});}}});
    const request=new Request('http://localhost/api/admin-roles/'+id,{method:'PATCH'});
    await route.PATCH(request,{params:Promise.resolve({id})});assert.deepEqual(args,[request,action,id]);
  }
});
