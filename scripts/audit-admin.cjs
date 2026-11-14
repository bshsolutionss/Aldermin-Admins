// Static evidence inventory. This does not execute page actions or assert completion.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const backend = path.resolve(root, '../../lms/lms-backend');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const relative = p => path.relative(root, p).replaceAll('\\', '/');
const api = fs.readFileSync(path.join(root, 'lib/api-service.ts'), 'utf8');
const ast = ts.createSourceFile('api-service.ts', api, ts.ScriptTarget.Latest, true);
const contracts = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'apiService' && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
    for (const group of node.initializer.properties) {
      if (!ts.isPropertyAssignment(group) || !ts.isObjectLiteralExpression(group.initializer)) continue;
      for (const method of group.initializer.properties) {
        if (!method.name) continue;
        const source = method.getText(ast);
        contracts[`${group.name.getText(ast)}.${method.name.getText(ast)}`] = {
          remote: /clientRequest/.test(source),
          proxy: (source.match(/["`](\/api\/[^"`?$]+)/) || [])[1] || null,
          delegate: (source.match(/apiService\.([\w]+\.[\w]+)/) || [])[1] || null,
        };
      }
    }
  }
  ts.forEachChild(node, visit);
}
visit(ast);
function resolveContract(name, visited = new Set()) {
  if (name.startsWith('schoolOperationsApi.')) return {remote:true,proxy:'/api/school-operations'};
  if (name.startsWith('schoolContentApi.')) return {remote:true,proxy:'/api/school-content'};
  if (name.startsWith('schoolRecordsApi.')) {
    const attendance = ['attendance', 'saveAttendance'].includes(name.split('.')[1]);
    return { remote: true, proxy: attendance ? '/api/school-attendance' : '/api/student-records' };
  }
  if (name.startsWith('foundationsApi.')) {
    const method = name.split('.')[1];
    const suffix = ['weekends', 'saveWeekends'].includes(method) ? '/weekends' : method === 'history' ? '/history' : '';
    return { remote: true, proxy: '/api/admin-foundations' + suffix };
  }
  if (visited.has(name)) return { remote: false };
  visited.add(name);
  const contract = contracts[name] || { remote: false };
  return contract.delegate ? resolveContract(contract.delegate, visited) : contract;
}
const cache = new Map();
function inspect(file, seen = new Set()) {
  if (seen.has(file)) return [];
  seen.add(file);
  let source = cache.get(file);
  if (source === undefined) { source = fs.readFileSync(file, 'utf8'); cache.set(file, source); }
  const records = [{ file: relative(file), source }];
  for (const m of source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)) {
    const base = m[1].startsWith('@/') ? path.join(root, m[1].slice(2)) : m[1].startsWith('.') ? path.resolve(path.dirname(file), m[1]) : null;
    if (!base || /lib[\\/]api-service$/.test(base)) continue;
    const resolved = [base + '.tsx', base + '.ts', path.join(base, 'index.tsx'), path.join(base, 'index.ts')].find(p => fs.existsSync(p));
    if (resolved) records.push(...inspect(resolved, seen));
  }
  return records;
}
const sidebar = fs.readFileSync(path.join(root, 'components/layout/Sidebar.tsx'), 'utf8');
const models = {
  'school-subject-assignments': 'SubjectAssignment / 1794355300000; reconciliation 1794430000000 APPLIED and PostgreSQL verified',
  'classrooms': 'Classroom / 1794430100000 APPLIED and PostgreSQL verified',
  'class-routines': 'ClassRoutine / 1794430200000 APPLIED and PostgreSQL verified',
  'school-subjects': 'SchoolSubject / 1794355200000',
  'class-teacher-assignments': 'ClassTeacherAssignment / 1794355800000',
  'classes': 'Class + ClassSection / 1794355600000',
  'sections': 'Section / 1794355500000',
  'academic-years': 'AcademicYear / 1794355400000',
  'hr/departments': 'Department / 1794355700000',
  'hr/designations': 'Designation / 1794355700000',
  'hr/staff': 'Staff / 1794355700000',
  'users': 'User + RoleChangeLog / 1793800775686 + 1793812516415',
  'users/login-permissions': 'User login policies + audit / 1794500000000 APPLIED; PostgreSQL 7/7 PASS',
  'admin-roles': 'Admin permission roles + assignments + audit / 1794500100000 APPLIED; PostgreSQL 8/8 PASS',
  'admin-roles/accounts': 'Admin permission roles + assignments + audit / 1794500100000 APPLIED; PostgreSQL 8/8 PASS',
  'school-settings': 'School Settings + audit / 1794500200000 APPLIED; PostgreSQL 7/7 PASS',
  'school-settings/history': 'School Settings + audit / 1794500200000 APPLIED; PostgreSQL 7/7 PASS',
  'admin-foundations': 'School holidays + weekends + student category/group catalogs + audit / 1794670000000 APPLIED; PostgreSQL 9/9 PASS',
  'admin-foundations/weekends': 'School weekends + audit / 1794670000000 APPLIED; PostgreSQL 9/9 PASS',
  'admin-foundations/history': 'Calendar/catalog audit / 1794670000000 APPLIED; PostgreSQL 9/9 PASS',
  'student-records': 'Student profiles + guardians + dated enrollments + audit / 1794671000000 APPLIED; PostgreSQL acceptance PASS',
  'school-attendance': 'Student/staff attendance + audit / 1794671100000 APPLIED; PostgreSQL acceptance PASS',
  'school-content': 'Files/attachments + study materials + notices/events / 1794672000000 + 1794672100000 APPLIED; PostgreSQL 7/7 PASS. Proxy maps to school-files/materials/notices/events; generic action review required.',
  'school-operations': 'Library catalogs/books/members/loans + inventory catalogs/items/ledger / 1794673000000 + 1794673100000 PREPARED; NOT applied. Generic list/save requires resource/action review.',
};
const aliases = {
  '/admin/academic/class': 'classes', '/admin/academic/section': 'sections',
  '/admin/academic/subject': 'school-subjects', '/admin/academic/assign-class-teacher': 'class-teacher-assignments',
  '/admin/human-resource/staff': 'hr/staff', '/admin/human-resource/staff/add': 'hr/staff',
  '/admin/human-resource/department': 'hr/departments', '/admin/human-resource/designation': 'hr/designations',
};
const dependency = route => /academic/.test(route) ? 'academic year -> class/section -> staff/subject -> allocation -> room/routine' : /student-info/.test(route) ? 'category/group -> student/guardian -> enrollment -> attendance/promotion' : /reports|bulk-print|dashboard/.test(route) ? 'persisted source modules first' : /fee|accounts|payroll|leave/.test(route) ? 'students/staff -> transactional financial and leave foundations' : 'academic/student/staff foundations; see roadmap phases 3-5';
const tests = walk(path.join(root, 'tests')).filter(p => /test\.cjs$/.test(p)).map(p => ({ file: relative(p), text: fs.readFileSync(p, 'utf8') }));
const rows = walk(path.join(root, 'app/admin')).filter(p => p.endsWith(path.sep + 'page.tsx')).sort().map(file => {
  const route = '/' + relative(file).replace(/^app\//, '').replace(/\/page\.tsx$/, '');
  const files = inspect(file);
  const calls = [...new Set(files.flatMap(f => [
    ...[...f.source.matchAll(/apiService\.([\w]+\.[\w]+)/g)].map(m => m[1]),
    ...[...f.source.matchAll(/foundationsApi\.(\w+)\s*\(/g)].map(m => 'foundationsApi.' + m[1]),
    ...[...f.source.matchAll(/schoolRecordsApi\.(\w+)\s*\(/g)].map(m => 'schoolRecordsApi.' + m[1]),
    ...[...f.source.matchAll(/schoolContentApi\.(\w+)\s*\(/g)].map(m => 'schoolContentApi.' + m[1]),
    ...[...f.source.matchAll(/schoolOperationsApi\.(\w+)\s*\(/g)].map(m => 'schoolOperationsApi.' + m[1]),
  ]))];
  const real = calls.filter(c => resolveContract(c).remote);
  const fake = calls.filter(c => !resolveContract(c).remote);
  const proxies = [...new Set(real.map(c => resolveContract(c).proxy).filter(Boolean))];
  const resources = proxies.map(p => p.replace(/^\/api\//, '').replace(/\/$/, ''));
  const ui = [...new Set(files.flatMap(f => [...f.source.matchAll(/\b(onSubmit|onClick|onChange|onEdit|onDelete|onView|handle\w+)\b/g)].map(m => m[1])))];
  const mock = files.filter(f => /localStorage|Math\.random|console\.log|(?:mock|dummy|initialData|sampleData)/i.test(f.source)).map(f => f.file);
  const explicitTests = tests.filter(t => t.text.includes(relative(file))).map(t => t.file);
  return { route, file: relative(file), navigation: sidebar.includes(`"${route}"`) ? 'sidebar' : 'not directly linked', ui,
    calls, real, fake, proxies, nest: resources.map(r => '/api/v1/' + r.replace(/^hr\//, '')),
    models: [...new Set(resources.map(r => models[r] || models[r.split('/options')[0]] || 'inspect endpoint contract').concat(aliases[route] ? [models[aliases[route]] + ' already exists; reuse for this legacy UI'] : []))],
    status: real.length ? 'PARTIAL: real calls; action/coverage review required' : 'MISSING: no real domain API in page/import graph',
    mockEvidence: mock, dependency: dependency(route), tests: explicitTests,
  };
});
const controllers = walk(path.join(backend, 'src')).filter(p => p.endsWith('.controller.ts')).map(p => path.relative(backend, p).replaceAll('\\', '/'));
fs.writeFileSync(path.join(root, 'docs/ADMIN_ROUTE_AUDIT.json'), JSON.stringify({ date: '2026-11-14', method: 'Static import graph plus centralized and foundation-client API contract resolution. Dynamic foundation list/save resource segments require action review. Runtime acceptance is tracked separately. Not directly linked does not prove unused.', controllers, routes: rows }, null, 2) + '\n');
const escape = s => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const heading = '# Admin route audit\n\nDate: 2026-11-14. Primary checklist: owner-supplied Admin Backend Roadmap PDF.\n\nReconciliation, classrooms/routines, login policies, permission roles, General Settings, calendar/catalogs, student/guardian/enrollment/student/staff attendance and files/attachments/study materials/notices/events are applied after explicit approvals and PostgreSQL-tested. Library and Inventory operations are PREPARED; their separate two-migration batch remains unapplied pending approval and persistence acceptance.\n\n' +
  `${rows.length} Admin pages inspected, including local import graphs and centralized API contracts. Sidebar links identify navigation evidence only; unlinked pages remain in scope. No route is considered complete merely because a page or API exists.\n\n` +
  'Database: 23 migrations and 41 public tables including history. All 34 prior application tables and all 21 prior migration-history rows were preserved at the files/content batch commit, including 84 refresh tokens, 7 users and both original assignments. Subsequent school activity is preserved; the next approved batch always captures a fresh baseline. Library/Inventory migrations remain unapplied.\n\n' +
  'API methods below are exact calls found in the page/import graph. UI evidence lists handler names; these are not assertions that every handler works. No direct test match means coverage was not established, rather than that no test exists. Full evidence and controller inventory: [JSON](./ADMIN_ROUTE_AUDIT.json).\n\n' +
  '| Route / navigation | UI actions found | API calls / proxy -> Nest resource | Entity / migration | Status / test evidence | Next dependency |\n|---|---|---|---|---|---|\n';
fs.writeFileSync(path.join(root, 'docs/ADMIN_ROUTE_AUDIT.md'), heading + rows.map(r => `| [${escape(r.route)}](../${r.file}) (${r.navigation}) | ${escape(r.ui.join(', ') || 'none')} | ${escape(r.calls.join(', ') || 'none')}; ${escape(r.proxies.join(', ') || 'no proxy')} -> ${escape(r.nest.join(', ') || 'no endpoint')} | ${escape(r.models.join('; ') || 'no domain tables/migrations found')} | ${escape(r.status)}; ${escape(r.tests.join(', ') || 'no direct route test match')}${r.fake.length ? '; mock methods: ' + escape(r.fake.join(', ')) : ''} | ${escape(r.dependency)} |`).join('\n') + '\n');
console.log(JSON.stringify({ pages: rows.length, realApiPages: rows.filter(r => r.real.length).length, pagesWithoutRealApi: rows.filter(r => !r.real.length).length }));
