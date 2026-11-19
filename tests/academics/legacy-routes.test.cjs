async function registerTests(){
  const {test}=await import('node:test'),assert=(await import('node:assert/strict')).default,{loadTs}=await import('../auth/load-ts.mjs');
  test('legacy Academic and HR routes reuse the actual approved pages without separate mock state',()=>{
    const aliases={
      'app/admin/academic/assign-class-teacher/page.tsx':'@/app/admin/academics/assign-teacher/page',
      'app/admin/academic/class/page.tsx':'@/app/admin/academics/class/page',
      'app/admin/academic/section/page.tsx':'@/app/admin/academics/section/page',
      'app/admin/human-resource/department/page.tsx':'@/app/admin/hr/department/page',
      'app/admin/human-resource/designation/page.tsx':'@/app/admin/hr/designation/page',
      'app/admin/human-resource/staff/page.tsx':'@/app/admin/hr/staff-list/page',
      'app/admin/human-resource/staff/add/page.tsx':'@/app/admin/hr/add-staff/page',
      'app/admin/human-resource/staff-attendance/page.tsx':'@/app/admin/hr/attendance/page',
    };
    for(const [file,target] of Object.entries(aliases)){
      const existingPage=()=>null;
      assert.equal(loadTs(file,{[target]:{default:existingPage,__esModule:true}}).default,existingPage,file);
    }
  });
}
void registerTests();
