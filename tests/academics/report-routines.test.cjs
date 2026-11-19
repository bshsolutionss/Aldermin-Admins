async function register() {
const { test } = await import("node:test");
const assert = (await import("node:assert/strict")).default;
const { loadTs } = await import("../auth/load-ts.mjs");
const stub = () => null;
const common = {
  '@/components/common/AdminCard': { AdminCard: stub },
  '@/components/common/PageHeader': { PageHeader: stub },
  '@/components/ui/button': { Button: stub },
};
const walk = node => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];

test('class routine report renders persisted rows and changes academic year', () => {
  let selected;
  const logic = { routines: [{ id: '1', class: 'Class A', section: 'B', day: 'Monday', startTime: '09:00', endTime: '10:00', subject: 'Math', teacher: 'Teacher', room: '1' }], options: { academicYearId: 'y1', academicYears: [{ id: 'y1', name: 'One' }, { id: 'y2', name: 'Two' }] }, isLoading: false, error: '', reload: async year => { selected = year; } };
  const { ClassRoutineReport } = loadTs('components/modules/reports/ClassRoutineReport.tsx', { ...common, '@/lib/use-class-routines': { useClassRoutines: () => logic } });
  const nodes = walk(ClassRoutineReport());
  assert.ok(nodes.some(node => node.type === 'td' && node.props.children === 'Math'));
  nodes.find(node => node.type === 'select').props.onChange({ target: { value: 'y2' } });
  assert.equal(selected, 'y2');
});

test('exam routine requests persisted schedules and renders the returned page', async () => {
  const slots = [], effects = [], calls = [];
  let cursor = 0;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; }]; },
    useEffect(fn) { cursor++; effects.push(fn); },
  };
  const { ExamRoutineReport } = loadTs('components/modules/reports/ExamRoutineReport.tsx', { ...common, react, '@/lib/examinations-client': { examinationsApi: { list: async (...args) => { calls.push(args); return { items: [{ id: 's', assessmentTitle: 'Final', className: 'A', sectionName: 'B', subjectName: 'Math', examDate: '2026-05-01', startTime: '09:00', endTime: '10:00', roomNumber: '1' }], page: 1, pageSize: 20, total: 1 }; } } } });
  ExamRoutineReport(); effects.shift()(); await new Promise(setImmediate);
  cursor = 0;
  const nodes = walk(ExamRoutineReport());
  assert.deepEqual(calls, [['schedules', 1]]);
  assert.ok(nodes.some(node => node.type === 'td' && node.props.children === 'Final'));
  assert.ok(nodes.some(node => node.type === 'td' && node.props.children === 'Math'));
});

}
void register();
