async function registerTests() {
  const { test } = await import("node:test");
  const assert = (await import("node:assert/strict")).default;
  const fs = (await import("node:fs")).default;
  const path = (await import("node:path")).default;
  const ts = (await import("typescript")).default;
  const { loadTs } = await import("../auth/load-ts.mjs");
  const root = path.resolve(__dirname, "../..");
  const views = [
    ["routes", "transport-routes", "transport-routes"],
    ["vehicle", "transport-vehicles", "transport-routes"],
    ["assignvehicle", "transport-assignments", "transport-assignments"],
  ];
  const stub = () => null;

  test("every Transport sidebar destination has a real App Router page", () => {
    const source = ts.createSourceFile("Sidebar.tsx", fs.readFileSync(path.join(root, "components/layout/Sidebar.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let transport;
    function visit(node) {
      if (ts.isObjectLiteralExpression(node) && node.properties.some(p => ts.isPropertyAssignment(p) && p.name.getText(source) === "label" && ts.isStringLiteral(p.initializer) && p.initializer.text === "Transport")) transport = node;
      ts.forEachChild(node, visit);
    }
    visit(source);
    assert.ok(transport, "Transport navigation must remain present");
    const links = [];
    function collect(node) {
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === "href" && ts.isStringLiteral(node.initializer)) links.push(node.initializer.text);
      ts.forEachChild(node, collect);
    }
    collect(transport);
    assert.deepEqual(links, views.map(([slug]) => "/admin/transport/" + slug));
    for (const href of links) assert.ok(fs.existsSync(path.join(root, "app", href, "page.tsx")), href + " must resolve directly, including on refresh");
  });

  test("Transport pages render the existing backend-driven workspace at their own URLs", () => {
    const shared = loadTs("components/modules/reports/OperationalPanel.tsx", {
      "@/components/common/PageHeader": { PageHeader: stub },
      "@/components/common/AdminCard": { AdminCard: stub }, '@/components/common/ModuleCard': {ModuleCard: stub }, '@/components/common/ModuleEditor': {ModuleEditor: stub },
      "@/components/ui/button": { Button: stub },
      "@/lib/admin-operations-client": {},
      "@/lib/document-print": {},
    });
    for (const [slug, kind, resource] of views) {
      const { default: Page } = loadTs("app/admin/transport/" + slug + "/page.tsx", {
        "@/components/modules/reports/OperationalPanel": shared,
      });
      const page = Page();
      assert.equal(page.type, shared.OperationalWorkspace);
      assert.equal(page.props.kind, kind);
      const tree = shared.OperationalWorkspace(page.props);
      const panels = tree.props.children.flat(Infinity).filter(n => n?.type === shared.OperationalPanel);
      assert.deepEqual(panels.map(n => n.props.resource), [resource]);
      assert.equal(panels[0].props.readOnly, undefined, "existing create/edit functionality remains available");
    }
    const report = shared.OperationalWorkspace({ kind: "transport", title: "Student Transport Report" });
    assert.deepEqual(report.props.children.flat(Infinity).filter(n => n?.type === shared.OperationalPanel).map(n => n.props.resource), ["transport-routes", "transport-assignments"]);
  });
}
void registerTests();
