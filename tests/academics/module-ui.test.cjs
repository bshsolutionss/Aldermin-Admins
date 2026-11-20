async function registerTests() {
  const { test } = await import('node:test');
  const assert = (await import('node:assert/strict')).default;
  const fs = (await import('node:fs')).default;
  const { loadTs } = await import('../auth/load-ts.mjs');
  const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node)
    ? node.flatMap(walk) : node.props ? [node, ...Object.values(node.props).flatMap(walk)] : [];

  test('every audited nested route receives module UI while both Dashboard paths stay excluded', () => {
    const { isModuleRoute } = loadTs('lib/module-ui.ts');
    const audit = JSON.parse(fs.readFileSync('docs/FRONTEND_UI_AUDIT.json', 'utf8'));
    assert.ok(audit.routes.length >= 133);
    for (const { route } of audit.routes) assert.equal(isModuleRoute(route), true, route);
    for (const route of ['/admin', '/admin/', '/admin/dashboard', '/admin/dashboard/detail', '/auth/login', '/admin/settings/general-settings/holiday']) {
      assert.equal(isModuleRoute(route), false, route);
    }
  });

  test('a ten-thousand-page table keeps navigation bounded and preserves selected page callbacks', () => {
    let selected;
    const { ListPagination } = loadTs('components/common/ListPagination.tsx', { '@/components/ui/button': { Button: 'Button' } });
    const nodes = walk(ListPagination({ currentPage: 5000, totalPages: 10000, totalRecords: 100000, pageSize: 10, onPageChange: page => { selected = page; } }));
    const buttons = nodes.filter(n => n.type === 'Button');
    assert.equal(buttons.length, 7);
    assert.equal(buttons.filter(n => n.props['aria-current'] === 'page').length, 1);
    buttons.find(n => n.props['aria-label'] === 'Page 5001').props.onClick();
    assert.equal(selected, 5001);
    buttons.find(n => n.props['aria-label'] === 'Previous page').props.onClick();
    assert.equal(selected, 4999);
  });

  test('module cards keep content as direct children so spacing and horizontal layouts work', () => {
    const { ModuleCard } = loadTs('components/common/ModuleCard.tsx', { '@/lib/utils': { cn: (...parts) => parts.filter(Boolean).join(' ') } });
    const children = ['first control', 'second control'];
    const tree = ModuleCard({ children, className: 'flex flex-wrap gap-4' });
    assert.equal(tree.props.children[1], children);
    assert.equal(tree.props['data-slot'], 'module-card');
  });

  test('toolbar exposes search and only presents a filter action when it can be used', () => {
    const { ListToolbar } = loadTs('components/common/ListToolbar.tsx', {
      '@/components/ui/input': { Input: 'Input' }, '@/components/ui/button': { Button: 'Button' },
    });
    let query, filtered = false;
    let nodes = walk(ListToolbar({ onSearch: value => { query = value; }, showAddButton: false }));
    assert.equal(nodes.filter(n => n.type === 'Button').length, 0);
    const input = nodes.find(n => n.type === 'Input');
    assert.ok(input.props['aria-label']);
    input.props.onChange({ target: { value: 'Class 10' } });
    assert.equal(query, 'Class 10');
    nodes = walk(ListToolbar({ showAddButton: false, onFilter: () => { filtered = true; } }));
    nodes.find(n => n.type === 'Button').props.onClick();
    assert.equal(filtered, true);
  });
}
void registerTests();
