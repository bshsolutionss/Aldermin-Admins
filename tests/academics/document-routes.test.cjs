async function register() {
const { test } = await import("node:test");
const assert = (await import("node:assert/strict")).default;
const { loadTs } = await import("../auth/load-ts.mjs");
const stub = () => null;
const common = { '@/components/common/PageHeader': { PageHeader: stub }, '@/components/common/AdminCard': { AdminCard: stub }, '@/components/common/ModuleCard': {ModuleCard: stub }, '@/components/common/ModuleEditor': {ModuleEditor: stub }, '@/components/ui/button': { Button: stub }, '@/components/ui/table': Object.fromEntries(['Table','TableBody','TableCell','TableHead','TableHeader','TableRow'].map(k=>[k,stub])) };
const walk = n => !n || typeof n !== 'object' ? [] : [n,...[n.props?.children].flat(Infinity).flatMap(walk)];
const text = n => n == null || typeof n === 'boolean' ? '' : typeof n !== 'object' ? String(n) : [n.props?.children].flat(Infinity).map(text).join('');
const control = (tree,label,type='input') => walk(walk(tree).find(n=>n.type==='label'&&text(n).startsWith(label))).find(n=>n.type===type);
const button = (tree,label) => walk(tree).find(n=>n.type===stub&&n.props?.onClick&&text(n)===label);
const realClient=()=>loadTs('lib/documents-client.ts',{'./session-client':{sessionFetch:async()=>Response.json({})}});
const page=items=>({items,total:items.length,page:1,pageSize:20});
const template={id:'11111111-1111-4111-8111-111111111111',request_id:'22222222-2222-4222-8222-222222222222',kind:'certificate',audience:'student',name:'Persisted template',heading:'Achievement',body:'{{fullName}}',layout:{font:'serif',fontSize:24,align:'center',widthMm:297,heightMm:210,fields:['reference','fullName']},background_file_id:null,signature_file_id:null,archived:false,version:2};
const summary={id:'33333333-3333-4333-8333-333333333333',kind:'certificate',audience:'student',document_no:'DOC-REF',issued_on:'2026-11-16',expires_on:null,status:'valid',subject_name:'Persisted student',template_name:template.name};
function mount(file,component,props,api,extra={}) {
  const slots=[],effects=[];let cursor=0;
  const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},useEffect(fn,deps){const i=cursor++,before=slots[i];if(!before||deps.some((v,k)=>v!==before.deps[k])){slots[i]={deps,cleanup:before?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}}};
  const exports=loadTs(file,{...common,react,'@/lib/documents-client':{...realClient(),documentsApi:api},'@/lib/school-content-client':{schoolContentApi:{upload:async()=>{throw Error('Unexpected upload');}}},'@/lib/document-print':{documentPrintHtml:()=>'',renderPrintWindow:async()=>{}},'./DocumentDesigner':{DocumentPager:stub},...extra});
  const render=()=>{cursor=0;return exports[component](props);};
  return {render,async flush(){for(let i=0;i<3;i++){render();effects.splice(0).forEach(fn=>fn());await new Promise(setImmediate);}return render();}};
}
test('all six Admin routes retain their designer or batch layout and select the correct persisted workflow',()=>{
  for(const [path,component,kind,bulk] of [['app/admin/admin-section/certificate/page.tsx','DocumentDesigner','certificate',false],['app/admin/admin-section/id-card/page.tsx','DocumentDesigner','id-card',false],['app/admin/admin-section/generate-certificate/page.tsx','DocumentWorkspace','certificate',false],['app/admin/admin-section/generate-id/page.tsx','DocumentWorkspace','id-card',false],['app/admin/bulk-print/certificate/page.tsx','DocumentWorkspace','certificate',true],['app/admin/bulk-print/id/page.tsx','DocumentWorkspace','id-card',true]]) {
    const {default:Page}=loadTs(path,{['@/components/modules/documents/'+component]:{[component]:stub}});
    const element=Page();assert.equal(element.type,stub);assert.equal(element.props.kind,kind);assert.equal(!!element.props.bulk,bulk);
  }
});
test('both designers edit real versions, retain failed drafts and suppress duplicate writes',async()=>{
  for(const kind of ['certificate','id-card']) {
    let reject, sent=[];
    const saved={...template,kind};
    const ui=mount('components/modules/documents/DocumentDesigner.tsx','DocumentDesigner',{kind},{templates:async()=>page([saved]),saveTemplate:async(input,id)=>{sent.push({input,id});return new Promise((_resolve,r)=>{reject=r;});},image:async()=>({data:null})});
    let tree=await ui.flush();button(tree,'Edit '+saved.name).props.onClick();tree=ui.render();
    control(tree,kind==='certificate'?'Accolade Designation':'Blueprint Designation').props.onChange({target:{value:'Changed draft'}});
    const event={preventDefault(){}};const saving=walk(ui.render()).find(n=>n.type==='form').props.onSubmit(event);
    await walk(ui.render()).find(n=>n.type==='form').props.onSubmit(event);assert.equal(sent.length,1);
    reject(Error('Conflict: reload required'));await saving;tree=ui.render();
    assert.equal(control(tree,kind==='certificate'?'Accolade Designation':'Blueprint Designation').props.value,'Changed draft');
    assert.equal(sent[0].input.version,2);assert.equal(sent[0].id,template.id);assert.ok(text(tree).includes('Conflict: reload required'));
  }
});
test('both issuance routes retain exact batch identity after an uncertain response',async()=>{
  for(const kind of ['certificate','id-card']) {
    const sent=[];let fail=true;
    const ui=mount('components/modules/documents/DocumentWorkspace.tsx','DocumentWorkspace',{kind},{templates:async()=>page([{...template,kind}]),subjects:async()=>page([{id:'44444444-4444-4444-8444-444444444444',name:'Real candidate',reference:'A1'}]),issues:async()=>page([]),history:async()=>page([]),issue:async items=>{sent.push(structuredClone(items));if(fail)throw Error('Response lost');return {items:[summary]};}});
    let tree=await ui.flush();control(tree,'Document Template','select').props.onChange({target:{value:template.id}});tree=await ui.flush();
    walk(tree).find(n=>n.props?.['aria-label']==='Select Real candidate').props.onChange();
    await walk(ui.render()).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=ui.render();
    assert.ok(text(tree).includes('Retry Same Issuance Request'));
    assert.ok(walk(tree).find(n=>n.type==='fieldset').props.disabled);
    fail=false;await walk(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
    assert.deepEqual(sent[1],sent[0]);assert.equal(sent[0][0].templateVersion,2);assert.ok(text(ui.render()).includes('issued and recorded'));
  }
});
test('both bulk print routes require selection, audit the request and retain retries after rejection',async()=>{
  const oldWindow=global.window;
  try { for(const kind of ['certificate','id-card']) {
    let blocked=true,fail=true,prints=0,closed=0;const sent=[];
    global.window={location:{origin:'https://school.example'},open:()=>blocked?null:{close(){closed++;}}};
    const ui=mount('components/modules/documents/DocumentWorkspace.tsx','DocumentWorkspace',{kind,bulk:true},{issues:async()=>page([{...summary,kind}]),history:async()=>page([{id:'h',record_id:summary.id,action:'issued',actor_name:'Admin',created_at:'2026-11-16',detail:'Reference'}]),print:async(...args)=>{sent.push(args);if(fail)throw Error('Temporarily unavailable');return {job:{id:'job'},items:[]};}},{'@/lib/document-print':{documentPrintHtml:()=>'<html></html>',renderPrintWindow:async()=>{prints++;}}});
    let tree=await ui.flush();walk(tree).find(n=>n.props?.['aria-label']==='Print DOC-REF').props.onChange();
    await button(ui.render(),'Print Selected (1)').props.onClick();assert.equal(sent.length,0);
    // onClick dispatches asynchronously; wait for the promise chain to settle.
    blocked=false;button(ui.render(),'Print Selected (1)').props.onClick();await new Promise(setImmediate);assert.equal(closed,1);
    fail=false;button(ui.render(),'Print Selected (1)').props.onClick();await new Promise(setImmediate);
    assert.equal(sent[0][0],sent[1][0]);assert.equal(prints,1);assert.ok(text(ui.render()).includes('Print dialog requested and recorded'));
  }} finally {global.window=oldWindow;}
});
test('print HTML escapes registry and template text, disallows executable assets and preserves print dimensions',()=>{
  const print=loadTs('lib/document-print.ts',{'./documents-client':realClient()});
  const item={...summary,verification_token:'token',snapshot:{template:{...template,heading:'<script>bad()</script>',body:'<img onerror=bad()> {{fullName}}'},subject:{fullName:'<svg/onload=bad()>',reference:'A1',values:{}},assets:{background:'https://attacker.example/image',signature:'data:image/svg+xml;base64,xxx',portrait:null}}};
  const html=print.documentPrintHtml([item],'https://school.example');
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<svg'));assert.ok(!html.includes('attacker.example'));assert.ok(!html.includes('src="data:image/svg'));
  assert.match(html,/width:297mm/);assert.match(html,/default-src 'none'/);assert.match(html,/&lt;script&gt;/);
});
test('print window waits for images and fonts and does not report physical completion',async()=>{
  const {renderPrintWindow}=loadTs('lib/document-print.ts',{'./documents-client':realClient()});const calls=[];
  const popup={opener:{},closed:false,document:{open(){},write(){},close(){},images:[{decode:async()=>{calls.push('image');}}],fonts:{ready:Promise.resolve()}},focus(){calls.push('focus');},print(){calls.push('dialog');}};
  await renderPrintWindow(popup,'<html></html>');assert.deepEqual(calls,['image','focus','dialog']);assert.equal(popup.opener,null);
  popup.document.images=[{decode:async()=>{throw Error('Image failed');}}];await assert.rejects(renderPrintWindow(popup,''),/Image failed/);assert.equal(calls.filter(c=>c==='dialog').length,1);
});
test('public verification renders only the document reference and status, never recipient data',async()=>{
  let calls=0;
  const {default:Page}=loadTs('app/verify-document/[token]/page.tsx',{'@/lib/auth-server':{authFetch:async()=>{calls++;return Response.json({document_no:'CERT-1',kind:'certificate',issued_on:'2026-11-16',expires_on:null,status:'revoked',recipient:'PRIVATE NAME',snapshot:{secret:'PRIVATE SNAPSHOT'}});}}});
  const valid=await Page({params:Promise.resolve({token:'11111111-1111-4111-8111-111111111111'})});
  assert.ok(text(valid).includes('CERT-1'));assert.ok(text(valid).includes('revoked'));assert.ok(!text(valid).includes('PRIVATE'));
  await Page({params:Promise.resolve({token:'../../users'})});assert.equal(calls,1);
});

}
void register();
