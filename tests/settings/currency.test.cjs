async function registerTests() {
  const { test } = await import("node:test");
  const assert = (await import("node:assert/strict")).default;
  const { loadTs } = await import("../auth/load-ts.mjs");
  const walk = n => !n || typeof n !== "object" ? [] : [n, ...[n.props?.children].flat(Infinity).flatMap(walk)];
  const text = n => n == null || typeof n === "boolean" ? "" : typeof n !== "object" ? String(n) : [n.props?.children].flat(Infinity).map(text).join("");

  function mount(api) {
    const slots = [], effects = [];
    let cursor = 0;
    const react = {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], v => slots[i] = typeof v === "function" ? v(slots[i]) : v]; },
      useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
      useEffect(fn, deps) { const i = cursor++, before = slots[i]; if (!before || deps.some((v, k) => v !== before.deps[k])) { slots[i] = { deps, cleanup: before?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
    };
    const { useFinanceSettings } = loadTs("lib/use-finance-settings.ts", { react, "./finance-client": { financeApi: api } });
    const render = () => { cursor = 0; return useFinanceSettings(); };
    return { render, async flush() { render(); effects.splice(0).forEach(fn => fn()); await new Promise(setImmediate); return render(); } };
  }

  test("currency dropdown offers PKR, USD, AED and other supported currencies without selecting a default", () => {
    const { SchoolCurrencyField } = loadTs("components/modules/settings/SchoolCurrencyField.tsx");
    const select = walk(SchoolCurrencyField({ value: "", onChange() {} })).find(n => n.type === "select");
    assert.equal(select.props.value, "");
    assert.equal(select.props.required, true);
    assert.equal(select.props["aria-label"], "School Currency");
    const codes = walk(select).filter(n => n.type === "option").map(n => n.props.value);
    for (const code of ["PKR", "USD", "AED", "EUR", "GBP"]) assert.ok(codes.includes(code));
    assert.ok(walk(SchoolCurrencyField({ value: "XTS", onChange() {} })).some(n => n.type === "option" && n.props.value === "XTS"));
  });

  test("unconfigured currency remains empty; save uses Finance API and confirms with a fresh read", async () => {
    let record = null; const writes = []; let reads = 0;
    const h = mount({ settings: async () => { reads++; return { record }; }, saveSettings: async input => { writes.push(input); record = { currency: input.currency, version: 1 }; return { record }; } });
    await h.flush(); assert.equal(h.render().currency, ""); assert.equal(await h.render().save(), false); assert.equal(writes.length, 0);
    h.render().setCurrency("PKR"); assert.equal(await h.render().save(), true);
    assert.deepEqual(writes, [{ currency: "PKR", version: 0 }]); assert.equal(reads, 2);
    assert.equal(h.render().record.currency, "PKR"); assert.match(h.render().notice, /saved and reloaded/);
    const reopened = mount({ settings: async () => ({ record }) });
    await reopened.flush(); assert.equal(reopened.render().currency, "PKR");
  });

  test("failed or unconfirmed currency saves retain the selection and never report success", async () => {
    let writeFails = true, readFails = false;
    const h = mount({ settings: async () => { if (readFails) throw Error("Read unavailable"); return { record: { currency: "USD", version: 2 } }; }, saveSettings: async () => { if (writeFails) throw Error("Currency is fixed after financial amounts are recorded"); readFails = true; return { record: { currency: "PKR", version: 3 } }; } });
    await h.flush(); h.render().setCurrency("PKR"); assert.equal(await h.render().save(), false);
    assert.equal(h.render().currency, "PKR"); assert.equal(h.render().record.currency, "USD"); assert.equal(h.render().notice, ""); assert.match(h.render().error, /fixed/);
    writeFails = false; assert.equal(await h.render().save(), false);
    assert.equal(h.render().record.version, 3); assert.equal(h.render().notice, ""); assert.match(h.render().error, /saved, but confirmation failed/);
  });

  test("duplicate clicks issue one currency write and confirmation rejects a mismatched value", async () => {
    let resolve, writes = 0;
    const h = mount({ settings: async () => ({ record: { currency: "USD", version: 1 } }), saveSettings: () => { writes++; return new Promise(done => { resolve = done; }); } });
    await h.flush(); h.render().setCurrency("PKR"); const saving = h.render().save(); assert.equal(await h.render().save(), false); assert.equal(writes, 1);
    resolve({ record: { currency: "PKR", version: 2 } }); assert.equal(await saving, false); assert.equal(h.render().notice, ""); assert.match(h.render().error, /does not match/);
  });

  test("General Settings saves existing fields before currency and stops if the general save fails", async () => {
    const calls = []; let generalSucceeds = false;
    const state = { ready: true, draft: {}, settings: {}, history: { items: [], page: 1, total: 0, pageSize: 10 }, save: async () => { calls.push("school-settings"); return generalSucceeds; } };
    const finance = { ready: true, currency: "PKR", setCurrency() {}, save: async () => { calls.push("finance/settings"); return true; } };
    const { default: Page } = loadTs("app/admin/settings/general-settings/general-settings-inner/page.tsx", {
      react: { useRef: value => ({ current: value }) },
      "@/components/common/PageHeader": { PageHeader: "PageHeader" }, "@/components/common/AdminCard": { AdminCard: "AdminCard" },
      "@/components/modules/settings/SchoolCurrencyField": { SchoolCurrencyField: "SchoolCurrencyField" },
      "@/lib/use-school-settings": { useSchoolSettings: () => state }, "@/lib/use-finance-settings": { useFinanceSettings: () => finance },
    });
    let tree = Page(); assert.ok(walk(tree).some(n => n.type === "SchoolCurrencyField"));
    for (const name of ["School name", "School code", "Contact email", "Contact phone", "Address", "Timezone"]) assert.ok(text(tree).includes(name));
    walk(tree).find(n => n.type === "form").props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate); assert.deepEqual(calls, ["school-settings"]);
    generalSucceeds = true; tree = Page(); walk(tree).find(n => n.type === "form").props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate); assert.deepEqual(calls, ["school-settings", "school-settings", "finance/settings"]);
  });

  test("dashboard warning follows loaded currency and links to the actual Finance section", () => {
    let currency = null;
    const { DashboardStatus } = loadTs("components/modules/dashboard/DashboardStatus.tsx", {
      "@/lib/use-dashboard": { useDashboard: () => ({ data: { finance: { currency } }, loading: false }) },
      "@/components/ui/button": { Button: "Button" }, "@/lib/utils": { cn: () => "" },
    });
    assert.match(text(DashboardStatus()), /Configure the school currency/);
    assert.ok(walk(DashboardStatus()).some(n => n.type === "a" && n.props.href.endsWith("#finance-settings")));
    currency = "PKR"; assert.ok(!text(DashboardStatus()).includes("Configure the school currency"));
  });
}
void registerTests();
