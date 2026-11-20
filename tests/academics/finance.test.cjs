async function registerTests(){
const {test}=await import('node:test');
const assert=(await import('node:assert/strict')).default;
const {loadTs}=await import('../auth/load-ts.mjs');
const id='11111111-1111-4111-8111-111111111111';
const page={items:[],total:0,page:1,pageSize:20,currency:'PKR'};
const client=(fetcher=async()=>Response.json({}))=>loadTs('lib/finance-client.ts',{'./session-client':{sessionFetch:fetcher}});
test('finance proxy rejects arbitrary paths, non-admins, cross-origin writes and invalid JSON',async()=>{
  let user={role:'admin'},origin=true;const calls=[];
  const {proxyFinance:proxy}=loadTs('lib/finance-proxy.ts',{'./auth-server':{getVerifiedUser:async()=>({user,accessToken:'verified-cookie-token'}),isSameOrigin:()=>origin,authFetch:async(...args)=>{calls.push(args);return Response.json({message:'Conflict'},{status:409});}}});
  const request=(method='GET',body)=>new Request('http://localhost/api/finance/accounts?page=2',{method,...(body===undefined?{}:{body})});
  for(const parts of [['users'],['options','users'],['reports','users'],['accounts','bad']])assert.equal((await proxy(request(),parts)).status,404);
  assert.equal((await proxy(request('DELETE'),['accounts',id])).status,404);
  assert.equal((await proxy(request('PUT','{}'),['invoices',id])).status,404);
  user=null;assert.equal((await proxy(request(),['accounts'])).status,401);
  user={role:'student'};assert.equal((await proxy(request(),['history'])).status,403);
  user={role:'admin'};origin=false;assert.equal((await proxy(request('POST','{}'),['payments'])).status,403);
  origin=true;assert.equal((await proxy(request('POST','bad'),['payments'])).status,400);assert.equal(calls.length,0);
  const response=await proxy(request('PUT','{"version":1}'),['payroll',id,'pay']);
  assert.equal(response.status,409);assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(calls[0][0],'/finance/payroll/'+id+'/pay');assert.equal(calls[0][1].headers.Authorization,'Bearer verified-cookie-token');
});
test('client preserves exact decimal input and retries while removing forged derived fields',async()=>{
  const calls=[];const {financeApi,formatMinor}=client(async(...args)=>{calls.push(args);return Response.json({record:{id}});});
  await financeApi.save('payments',{requestId:id,bookingDate:'2026-01-01',invoiceId:id,method:'bank',accountId:id,amount:'9999999999.99',reference:'Receipt',memo:'',createdBy:'forged',paid:999});
  assert.deepEqual(JSON.parse(calls[0][1].body),{requestId:id,bookingDate:'2026-01-01',memo:'',invoiceId:id,method:'bank',accountId:id,amount:'9999999999.99',reference:'Receipt'});
  assert.equal(formatMinor('999999999999'),'9999999999.99');assert.equal(formatMinor('-1'),'-0.01');assert.equal(formatMinor('1'),'0.01');
  assert.throws(()=>financeApi.save('invoices',{},id),/cannot be edited/);
  await financeApi.action('payroll',id,'pay',{requestId:id,version:4,bankId:id,bookingDate:'2026-01-02',memo:'',status:'paid',amount:'1'});
  assert.equal(JSON.parse(calls[1][1].body).version,4);assert.equal(JSON.parse(calls[1][1].body).status,undefined);
});
function nodes(tree) {if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return tree.props?[tree,...Object.values(tree.props).flatMap(nodes)]:[];}
function content(node){if(node===null||node===undefined)return '';if(typeof node==='string'||typeof node==='number')return String(node);if(Array.isArray(node))return node.map(content).join('');return content(node.props?.children);}
function mount(api,props={title:'Invoices',resource:'invoices'}) {
  const slots=[],effects=[];let cursor=0;
  const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];},useRef(value){const i=cursor++;if(!(i in slots))slots[i]={current:value};return slots[i];},useEffect(fn,deps){const i=cursor++,before=slots[i];if(!before||deps.some((v,k)=>v!==before.deps[k])){slots[i]={deps,cleanup:before?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}}};
  const Panel=loadTs('components/modules/finance/FinancePanel.tsx',{react,'@/components/ui/input':{Input:'input'},'@/components/common/PageHeader':{PageHeader:'PageHeader'},'@/components/common/AdminCard':{AdminCard:'AdminCard'}, '@/components/common/ModuleCard': {ModuleCard: 'AdminCard'}, '@/components/common/ModuleEditor': {ModuleEditor: 'AdminCard'},'@/components/ui/button':{Button:'Button'},'@/components/modules/settings/SchoolCurrencyField':{SchoolCurrencyField:'SchoolCurrencyField'},'@/lib/use-finance-settings':{},'@/lib/finance-client':{...client(),financeApi:api}}).default;
  const render=()=>{cursor=0;return Panel(props);};
  return {render,find:predicate=>nodes(render()).find(predicate),flush:async()=>{render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);}};
}
test('failed finance writes retain the original draft and request ID; duplicate submissions post once',async()=>{
  const calls=[];let reject;
  const h=mount({list:async()=>page,save:async(...args)=>{calls.push(args);return new Promise((_resolve,no)=>{reject=no;});}});
  await h.flush();h.find(n=>n.type==='Button'&&content(n).startsWith('New invoices')).props.onClick();
  const form=()=>h.find(n=>n.type==='form');
  const pending=form().props.onSubmit({preventDefault(){}});
  await form().props.onSubmit({preventDefault(){}});assert.equal(calls.length,1);
  const requestId=calls[0][1].requestId;assert.match(requestId,/^[\da-f-]{36}$/);
  reject(Error('Financial conflict'));await pending;
  assert.ok(h.find(n=>n.props.role==='alert'&&content(n).includes('Financial conflict')));
  const retry=form().props.onSubmit({preventDefault(){}});assert.equal(calls[1][1].requestId,requestId);
  reject(Error('Retry conflict'));await retry;
});
test('unapproved finance gates prevent new writes and failed reads do not display stale records',async()=>{
  const {FinanceError}=client();const h=mount({list:async()=>{throw new FinanceError('Migration pending',503);}});
  await h.flush();assert.equal(h.find(n=>n.type==='Button'&&content(n).startsWith('New invoices')).props.disabled,true);
  assert.ok(h.find(n=>n.props.role==='alert'&&content(n).includes('Migration pending')));
});
test('late searches cannot overwrite the newest financial response',async()=>{
  let oldResolve;const h=mount({list:async(_r,q)=>q.search==='old'?new Promise(resolve=>{oldResolve=resolve;}):({...page,items:[{id,title:q.search||'Initial',amount:'100',paid:'0'}]})});
  await h.flush();const search=()=>h.find(n=>n.props['aria-label']==='Search financial records');search().props.onChange({target:{value:'old'}});await h.flush();search().props.onChange({target:{value:'Newest'}});await h.flush();oldResolve({...page,items:[{id,title:'Old',amount:'100',paid:'0'}]});await new Promise(setImmediate);
  assert.ok(nodes(h.render()).some(n=>n.type==='td'&&content(n)==='Newest'));assert.ok(!nodes(h.render()).some(n=>n.type==='td'&&content(n)==='Old'));
});
test('finance API wrapper resolves route params before delegating',async()=>{
  let seen;const route=loadTs('app/api/finance/[...path]/route.ts',{'@/lib/finance-proxy':{proxyFinance:async(...args)=>{seen=args;return Response.json({});}}});
  const req=new Request('http://localhost/api/finance/settings',{method:'PUT'});await route.PUT(req,{params:Promise.resolve({path:['settings']})});assert.deepEqual(seen,[req,['settings']]);
});

}
void registerTests();
