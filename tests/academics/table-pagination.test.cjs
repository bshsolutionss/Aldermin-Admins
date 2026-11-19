async function registerTests(){
  const {test}=await import('node:test'),assert=(await import('node:assert/strict')).default,{loadTs}=await import('../auth/load-ts.mjs');
  const walk=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(walk):n.props?[n,...Object.values(n.props).flatMap(walk)]:[];
  test('deleting the final row on the final page shows the remaining page instead of trapping the table',()=>{
    const state=['',2];let cursor=0;const react={useState:()=>{const i=cursor++;return [state[i],v=>{state[i]=v;}];},useMemo:fn=>fn()};
    const stub=name=>({[name]:name}),ui={Table:'Table',TableBody:'TableBody',TableCell:'TableCell',TableHead:'TableHead',TableHeader:'TableHeader',TableRow:'TableRow'};
    const {DataTable}=loadTs('components/common/DataTable.tsx',{react,'@/components/common/AdminCard':stub('AdminCard'),'@/components/ui/table':ui,'@/components/common/ListToolbar':stub('ListToolbar'),'@/components/common/ListPagination':stub('ListPagination')});
    const props={columns:[{header:'Name',accessor:'name'}],searchKey:'name',pageSize:1};
    let nodes=walk(DataTable({...props,data:[{id:'1',name:'One'},{id:'2',name:'Two'}]}));assert.equal(nodes.find(n=>n.type==='ListPagination').props.currentPage,2);
    cursor=0;nodes=walk(DataTable({...props,data:[{id:'1',name:'One'}]}));assert.equal(nodes.find(n=>n.type==='ListPagination'),undefined);assert.ok(nodes.some(n=>n.type==='TableCell'&&n.props.children==='One'));
  });
  test('empty pagination shows zero results and disables both directions',()=>{
    const {ListPagination}=loadTs('components/common/ListPagination.tsx',{'@/components/ui/button':{Button:'Button'}}),nodes=walk(ListPagination({currentPage:1,totalPages:0,totalRecords:0,pageSize:10,onPageChange(){}}));
    assert.ok(nodes.filter(n=>n.type==='Button').every(n=>n.props.disabled===true));assert.ok(nodes.filter(n=>n.type==='span').every(n=>n.props.children===0));
  });
}
void registerTests();
