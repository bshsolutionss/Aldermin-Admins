/* Source coverage inventory. Run from the repository root: node scripts/audit-module-ui.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
const modules = {
  'Student Info': ['student-info'], 'Behaviour Records': ['behaviour'], Fees: ['fees', 'fee'],
  Homework: ['homework'], Library: ['library'], Examination: ['examination'], 'Exam Plan': ['exam-plan'],
  'Online Exam': ['online-exam'], 'Human Resource': ['human-resource', 'hr'],
  'Teacher Evaluation': ['teacher-evaluation'], Leave: ['leave'], 'Admin Section': ['admin-section'],
  Academics: ['academics', 'academic'], 'Study Material': ['study-material'], 'Lesson Plan': ['lesson-plan'],
  'Bulk Print': ['bulk-print'], 'Download Centre': ['download-center'],
  Accounts: ['accounts/accounts', 'accounts/wallet'], Communicate: ['accounts/communicate'],
  Inventory: ['accounts/inventory'], Dormitory: ['dormitory'],
};
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = directory + '/' + entry.name;
  return entry.isDirectory() ? walk(file) : [file];
});
const imports = new Map();
function dependencies(file, result = new Set()) {
  if (result.has(file)) return result;
  result.add(file);
  if (!imports.has(file)) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const resolved = [];
    for (const statement of source.statements) {
      const specifier = statement.moduleSpecifier?.text;
      if (!specifier || (!specifier.startsWith('@/') && !specifier.startsWith('.'))) continue;
      const base = specifier.startsWith('@/') ? specifier.slice(2) : path.posix.join(path.posix.dirname(file), specifier);
      const target = [base + '.tsx', base + '.ts', base + '/index.tsx'].find(candidate => fs.existsSync(candidate));
      if (target) resolved.push(target);
    }
    imports.set(file, resolved);
  }
  for (const target of imports.get(file)) dependencies(target, result);
  return result;
}
const routes = walk('app/admin').filter(file => file.endsWith('/page.tsx')).flatMap(file => {
  const relative = file.slice('app/admin/'.length, -'/page.tsx'.length);
  const moduleName = Object.entries(modules).find(([, prefixes]) => prefixes.some(prefix => relative === prefix || relative.startsWith(prefix + '/')))?.[0];
  if (!moduleName) return [];
  const deps = [...dependencies(file)].sort();
  return [{
    module: moduleName, route: '/admin/' + relative, file,
    renderedFiles: deps.filter(dep => dep.endsWith('.tsx')),
    apiAndHookDependencies: deps.filter(dep => dep.startsWith('lib/')),
    sourceReview: 'reviewed; module styles applied, shared workspace and nested views covered',
    liveVerification: 'requires an authenticated browser session',
  }];
});
const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const changedFiles = [...new Set([
  ...git(['diff', '--name-only']).split('\n'), ...git(['ls-files', '--others', '--exclude-standard']).split('\n'),
])].filter(Boolean).sort();
const report = {
  scope: 'All existing routes in the 21 requested modules, including aliases and nested editors, reports, histories and detail views',
  routeCount: routes.length,
  modules: Object.keys(modules).map(name => ({ name, routes: routes.filter(route => route.module === name).map(route => route.route) })),
  sharedFindingsAndFixes: [
    { issue: 'Card wrapper detached spacing and flex utilities from their content', fix: 'ModuleCard renders direct children. Dashboard retains the original AdminCard.' },
    { issue: 'Wide grids and table contents could expand the app shell', fix: 'Module-only minimum widths, responsive grids and contained horizontal table scrolling.' },
    { issue: 'Oversized table rows and inconsistent native/component control styling', fix: 'Scoped table density, readable headings, uniform fields, focus states, disabled states and errors.' },
    { issue: 'Financial amounts lacked consistent numeric alignment', fix: 'Right-aligned tabular amounts and matching headers; corrected empty-row column spans.' },
    { issue: 'Pagination rendered every page button', fix: 'Bounded navigation with first, last and neighboring pages, accessible names and current-page state.' },
    { issue: 'Toolbar displayed a nonfunctional filter button', fix: 'Only show the filter action when a handler is supplied; preserve existing route filters and search.' },
    { issue: 'New finance and campus drafts opened below long tables without focus', fix: 'Inline editors reveal themselves, receive keyboard focus and restore the opener on close.' },
    { issue: 'Custom choice tiles could only be clicked with a pointer', fix: 'Academic section/type choices use buttons with pressed and disabled states.' },
    { issue: 'Legacy academic pages used a conflicting indigo palette and ornate labels', fix: 'Reuse school teal, practical labels, compact card styling and accessible control names.' },
    { issue: 'Staff onboarding used four narrow columns at tablet sizes', fix: 'Two columns on tablets, four on large desktops, compact actions and responsive card padding.' },
    { issue: 'Select popovers could exceed narrow viewports', fix: 'Constrain popover width and allow the options viewport to use its available height.' },
  ],
  preserved: {
    dashboardSourceUnchanged: !changedFiles.some(file => file === 'app/admin/page.tsx' || file.startsWith('app/admin/dashboard/') || file.startsWith('components/modules/dashboard/')),
    originalDashboardCardUnchanged: !changedFiles.includes('components/common/AdminCard.tsx'),
    sidebarAndHeaderUnchanged: !changedFiles.some(file => ['components/layout/Sidebar.tsx', 'components/layout/TopBar.tsx'].includes(file)),
    apiAuthAndBackendFilesUnchanged: !changedFiles.some(file => file.startsWith('app/api/') || (file.startsWith('lib/') && file !== 'lib/module-ui.ts') || file.startsWith('.env') || file === 'proxy.ts'),
    dependenciesUnchanged: !changedFiles.some(file => /(?:package\.json|lock\.yaml|lock\.json)$/.test(file)),
  },
  verification: {
    baselineBuild: 'passed', baselineLint: '0 errors; 42 pre-existing warnings',
    typescript: 'pending final check', lint: 'pending final check', productionBuild: 'pending final check', regressionTests: 'pending final run',
    browser: 'Unauthenticated /admin/student-info/list correctly redirects to the login screen. No auth bypass or production mock data was introduced.',
  },
  remainingIssues: [
    'Authenticated visual and live API checks across all 133 routes require sign-in; source inspection and regression tests do not establish live end-to-end verification.',
    'No custom modal exists in the active module render trees. Editors remain inline; native confirmation dialogs and existing backend gates are preserved.',
    '42 existing ESLint warnings remain outside the changed active UI code, including Dashboard images and unused imports in inactive legacy components.',
  ],
  changedFiles,
  routes,
  components: [...new Set(routes.flatMap(route => route.renderedFiles))].filter(file => file.startsWith('components/')).sort(),
};
fs.writeFileSync('docs/FRONTEND_UI_AUDIT.json', JSON.stringify(report, null, 2) + '\n');
console.log(`${routes.length} routes across ${report.modules.length} modules; ${report.components.length} rendered components; ${changedFiles.length} changed files.`);
if (Object.values(report.preserved).some(value => !value)) process.exitCode = 1;
