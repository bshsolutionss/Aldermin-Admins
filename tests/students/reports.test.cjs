async function register() {
const { test } = await import("node:test");
const assert = (await import("node:assert/strict")).default;
const { loadTs } = await import("../auth/load-ts.mjs");
const stub = () => null;
const common = {'@/components/ui/input':{Input:'input'}, '@/components/common/PageHeader': { PageHeader: stub }, '@/components/common/AdminCard': { AdminCard: stub }, '@/components/common/ModuleCard': {ModuleCard: stub }, '@/components/common/ModuleEditor': {ModuleEditor: stub }, '@/components/ui/button': { Button: stub } };
const walk = node => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];

test('student CSV quotes separators and neutralizes spreadsheet formulas', () => {
  const { studentCsv } = loadTs('components/modules/reports/StudentReports.tsx', { ...common, '@/lib/school-records-client': { schoolRecordsApi: {} } });
  const csv = studentCsv([{ admissionNo: '=1+1', firstName: 'A,"B"', lastName: '  +formula', className: null, sectionName: 'B', rollNo: '1' }]);
  assert.match(csv, /"'=1\+1"/);
  assert.match(csv, /"A,""B"""/);
  assert.match(csv, /"'\+formula"/);
});

test('attendance report requests selected date and renders persisted status', async () => {
  const slots = [], effects = [], calls = [];
  let cursor = 0;
  const react = { useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; }]; }, useEffect(fn) { cursor++; effects.push(fn); } };
  const { AttendanceReport } = loadTs('components/modules/reports/AttendanceReport.tsx', { ...common, react, '@/lib/school-records-client': { schoolRecordsApi: { attendance: async (...args) => { calls.push(args); return { items: [{ targetId: '1', name: 'Student', reference: 'A1', status: 'present', note: '' }], total: 1, page: 1, pageSize: 50 }; } } } });
  let tree = AttendanceReport({ kind: 'staff' }); effects.shift()(); effects.shift()();
  walk(tree).find(node => node.type === 'input').props.onChange({ target: { value: '2026-05-01' } });
  cursor = 0; tree = AttendanceReport({ kind: 'staff' }); effects.shift()(); effects.shift()(); await new Promise(setImmediate);
  cursor = 0; tree = AttendanceReport({ kind: 'staff' });
  assert.deepEqual(calls, [['staff', '2026-05-01', '', 1]]);
  assert.ok(walk(tree).some(node => node.type === 'td' && node.props.children === 'present'));
});

test('student attendance requires a real class placement before requesting data', async () => {
  const slots = [], effects = [], calls = [];
  let cursor = 0;
  const react = { useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; }]; }, useEffect(fn) { cursor++; effects.push(fn); } };
  const api = { options: async () => ({ placements: [{ id: 'class-1', yearName: 'Year', className: 'A', sectionName: 'B' }] }), attendance: async (...args) => { calls.push(args); return { items: [], total: 0, page: 1, pageSize: 50 }; } };
  const { AttendanceReport } = loadTs('components/modules/reports/AttendanceReport.tsx', { ...common, react, '@/lib/school-records-client': { schoolRecordsApi: api } });
  let tree = AttendanceReport({ kind: 'students' }); effects.shift()(); effects.shift()(); await new Promise(setImmediate);
  walk(tree).find(node => node.type === 'input').props.onChange({ target: { value: '2026-05-01' } });
  cursor = 0; tree = AttendanceReport({ kind: 'students' }); effects.shift()(); effects.shift()(); await new Promise(setImmediate);
  assert.equal(calls.length, 0);
  walk(tree).find(node => node.type === 'select').props.onChange({ target: { value: 'class-1' } });
  cursor = 0; AttendanceReport({ kind: 'students' }); effects.shift()(); effects.shift()(); await new Promise(setImmediate);
  assert.deepEqual(calls, [['students', '2026-05-01', 'class-1', 1]]);
});

}
void register();
