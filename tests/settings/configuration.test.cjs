async function register(){
 const {test}=await import('node:test'),assert=(await import('node:assert/strict')).default,{loadTs}=await import('../auth/load-ts.mjs');const stub=()=>null;
 const common={'@/components/common/PageHeader':{PageHeader:stub},'@/components/common/AdminCard':{AdminCard:stub},'@/components/ui/button':{Button:stub}};
 const walk=n=>!n||typeof n!=='object'?[]:[n,...[n.props?.children].flat(Infinity).flatMap(walk)],text=n=>n==null||typeof n==='boolean'?'':typeof n!=='object'?String(n):[n.props?.children].flat(Infinity).map(text).join('');
 function mount(api){const slots=[],effects=[];let cursor=0;const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},useEffect(fn,deps){const i=cursor++,before=slots[i];if(!before||deps.some((v,k)=>v!==before.deps[k])){slots[i]={deps,cleanup:before?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}}};const {ConfigurationProfile}=loadTs('components/modules/settings/ConfigurationProfile.tsx',{...common,react,'@/lib/admin-configuration-client':{adminConfigurationApi:api}});const render=()=>{cursor=0;return ConfigurationProfile({scope:'base',title:'Setup'});};return {render,async flush(){for(let i=0;i<3;i++){render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);}return render();}};}
 const profile={installed:true,fields:[{key:'pageSize',label:'Page size',type:'number',min:10,max:100}],record:{scope:'base',settings:{pageSize:20},version:2},history:[],note:'Profiles do not activate providers.'};
 test('configuration proxy rejects unverified actors, arbitrary profiles, cross-origin writes and malformed JSON',async()=>{
  const calls=[];const {GET,PUT}=loadTs('app/api/admin-configuration/[scope]/route.ts',{'@/lib/auth-server':{getVerifiedUser:async()=>({user:{role:'admin'},accessToken:'cookie'}),isSameOrigin:r=>r.headers.get('origin')==='http://localhost',authFetch:async(...args)=>{calls.push(args);return Response.json({message:'Pending approval'},{status:503});}}});const context={params:Promise.resolve({scope:'base'})};
  assert.equal((await GET(new Request('http://localhost'),{params:Promise.resolve({scope:'passwords'})})).status,404);
  assert.equal((await PUT(new Request('http://localhost',{method:'PUT',headers:{origin:'https://foreign.example'}}),context)).status,403);
  assert.equal((await PUT(new Request('http://localhost',{method:'PUT',headers:{origin:'http://localhost'},body:'{'}),context)).status,400);
  const result=await GET(new Request('http://localhost'),context);assert.equal(result.status,503);assert.equal(result.headers.get('cache-control'),'no-store');assert.equal(calls.length,1);
 });
 test('unapplied configuration remains visibly unsaved and cannot submit a profile',async()=>{
  let writes=0;const ui=mount({read:async()=>({...profile,installed:false,record:null}),save:async()=>{writes++;}});const tree=await ui.flush();assert.equal(walk(tree).find(n=>n.type==='fieldset').props.disabled,true);assert.match(text(tree),/approved and applied/);walk(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});await new Promise(setImmediate);assert.equal(writes,0);
 });
 test('configuration save conflicts preserve drafts and suppress duplicate writes without weakening optimistic versions',async()=>{
  let reject;const sent=[];const ui=mount({read:async()=>profile,save:(...args)=>{sent.push(args);return new Promise((_resolve,r)=>{reject=r;});}});let tree=await ui.flush();walk(tree).find(n=>n.type==='input').props.onChange({target:{value:'30'}});const submit=()=>walk(ui.render()).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});submit();submit();assert.equal(sent.length,1);assert.deepEqual(sent[0],['base',{pageSize:30},2]);reject(Error('Reload after conflict'));await new Promise(setImmediate);tree=ui.render();assert.equal(walk(tree).find(n=>n.type==='input').props.value,'30');assert.match(text(tree),/Reload after conflict/);
 });
}
void register();
