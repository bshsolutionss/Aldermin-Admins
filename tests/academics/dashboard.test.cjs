async function register() {
  const { test } = await import("node:test"),
    assert = (await import("node:assert/strict")).default,
    { loadTs } = await import("../auth/load-ts.mjs");
  const stub = () => null;
  const summary = {
    year: 2026,
    today: "2026-11-17",
    timezone: "UTC",
    schoolName: null,
    students: { total: 0, male: 0, female: 0, other: 0 },
    staff: { total: 0, teachers: 0 },
    finance: {
      currency: null,
      income: "0",
      expense: "0",
      fees: { collected: "0", pending: "0", overdue: "0" },
      monthly: [{ month: "2026-01", income: "0", expense: "0" }],
    },
    notices: [],
    events: [],
  };
  const walk = (n) =>
    !n || typeof n !== "object"
      ? []
      : [n, ...[n.props?.children].flat(Infinity).flatMap(walk)];
  const text = (n) =>
    n == null || typeof n === "boolean"
      ? ""
      : typeof n !== "object"
        ? String(n)
        : [n.props?.children].flat(Infinity).map(text).join("");
  test("dashboard proxy forwards only verified Admin reads, preserves failures and disables caching", async () => {
    let user = null;
    const calls = [];
    const { GET } = loadTs("app/api/admin-dashboard/route.ts", {
      "@/lib/auth-server": {
        getVerifiedUser: async () => ({ user, accessToken: "cookie" }),
        authFetch: async (path, init) => {
          calls.push([path, init]);
          return Response.json({ message: "Unavailable" }, { status: 503 });
        },
      },
    });
    const req = new Request("http://localhost/api/admin-dashboard?year=2026");
    assert.equal((await GET(req)).status, 401);
    user = { role: "student" };
    assert.equal((await GET(req)).status, 403);
    assert.equal(calls.length, 0);
    user = { role: "admin" };
    const response = await GET(req);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(calls[0][0], "/admin-dashboard?year=2026");
    assert.equal(calls[0][1].headers.Authorization, "Bearer cookie");
  });
  test("dashboard client encodes real filters and propagates errors without demo fallback", async () => {
    const calls = [];
    let ok = true;
    const { dashboardApi } = loadTs("lib/dashboard-client.ts", {
      "./session-client": {
        sessionFetch: async (path, init) => {
          calls.push([path, init]);
          return ok
            ? Response.json(summary)
            : Response.json({ message: "Service offline" }, { status: 503 });
        },
      },
    });
    assert.deepEqual(await dashboardApi.summary(2026), summary);
    assert.equal(calls[0][0], "/api/admin-dashboard?year=2026");
    assert.equal(calls[0][1].cache, "no-store");
    ok = false;
    await assert.rejects(dashboardApi.summary(), /Service offline/);
  });
  test("dashboard provider ignores old responses and exposes genuine retryable empty/error states", async () => {
    const slots = [],
      effects = [];
    let cursor = 0,
      resolveOld,
      fail = false;
    const react = {
      createContext: () => ({ Provider: stub }),
      useState(value) {
        const i = cursor++;
        if (!(i in slots))
          slots[i] = typeof value === "function" ? value() : value;
        return [
          slots[i],
          (v) => (slots[i] = typeof v === "function" ? v(slots[i]) : v),
        ];
      },
      useEffect(fn, deps) {
        const i = cursor++,
          old = slots[i];
        if (!old || deps.some((d, j) => d !== old.deps[j])) {
          slots[i] = { deps, cleanup: old?.cleanup };
          effects.push(() => {
            slots[i].cleanup?.();
            slots[i].cleanup = fn();
          });
        }
      },
    };
    const { DashboardProvider } = loadTs("lib/use-dashboard.tsx", {
      react,
      "./dashboard-client": {
        dashboardApi: {
          summary: async (year) => {
            if (fail) throw Error("Offline");
            if (year === 2025)
              return new Promise((resolve) => (resolveOld = resolve));
            return { ...summary, year: year ?? 2026 };
          },
        },
      },
    });
    const render = () => {
        cursor = 0;
        return DashboardProvider({ children: null }).props.value;
      },
      flush = async () => {
        render();
        effects.splice(0).forEach((fn) => fn());
        await new Promise(setImmediate);
        return render();
      };
    await flush();
    render().setYear(2025);
    await flush();
    render().setYear(2024);
    await flush();
    resolveOld({ ...summary, year: 2025 });
    await new Promise(setImmediate);
    assert.equal(render().data.year, 2024);
    fail = true;
    render().retry();
    await flush();
    assert.equal(render().data, null);
    assert.equal(render().loading, false);
    assert.match(render().error, /Offline/);
  });
  test("dashboard cards render actual zero totals and unconfigured currency without sample counts or fake money", () => {
    const common = {
      "@/components/common/AdminCard": { AdminCard: stub },
      "@/lib/use-dashboard": {
        useDashboard: () => ({
          data: summary,
          loading: false,
          setYear: () => {},
        }),
      },
      "@/lib/utils": {
        cn: (...args) => args.filter((v) => typeof v === "string").join(" "),
      },
      "@/lib/finance-client": { formatMinor: () => "0.00" },
    };
    const { StatCards } = loadTs(
        "components/modules/dashboard/StatCards.tsx",
        common,
      ),
      { FinancialOverview } = loadTs(
        "components/modules/dashboard/FinancialOverview.tsx",
        common,
      ),
      { NoticeBoard, MessagesCard } = loadTs(
        "components/modules/dashboard/LiveDashboardCards.tsx",
        common,
      );
    assert.ok(text(StatCards()).includes("Active Students0"));
    assert.ok(!text(StatCards()).includes("1,230"));
    assert.ok(text(FinancialOverview()).includes("Currency not configured"));
    assert.ok(!text(FinancialOverview()).includes("PKR"));
    assert.ok(text(NoticeBoard()).includes("No current published notices"));
    assert.ok(!text(MessagesCard()).includes("John Doe"));
    assert.ok(text(MessagesCard()).includes("No upcoming published events"));
  });
  test("earnings graph uses persisted monthly amounts and declines unsafe numeric plotting", () => {
    let value = {
      ...summary,
      finance: {
        ...summary.finance,
        currency: "PKR",
        monthly: [{ month: "2026-01", income: "150", expense: "25" }],
      },
    };
    const chart = () => null;
    const { EarningChart } = loadTs(
      "components/modules/dashboard/EarningChart.tsx",
      {
        react: { useSyncExternalStore: () => true },
        "@/components/common/AdminCard": { AdminCard: stub },
        "@/lib/use-dashboard": {
          useDashboard: () => ({ data: value, loading: false }),
        },
        recharts: Object.fromEntries(
          [
            "AreaChart",
            "Area",
            "XAxis",
            "YAxis",
            "CartesianGrid",
            "Tooltip",
            "ResponsiveContainer",
          ].map((k) => [k, k === "AreaChart" ? chart : stub]),
        ),
      },
    );
    assert.deepEqual(
      walk(EarningChart()).find((n) => n.type === chart).props.data,
      [{ month: "2026-01", income: 1.5, expense: 0.25 }],
    );
    value = {
      ...value,
      finance: {
        ...value.finance,
        monthly: [
          { month: "2026-01", income: "9007199254740993", expense: "0" },
        ],
      },
    };
    assert.ok(
      text(EarningChart()).includes("exceed the supported plotting range"),
    );
  });
}
void register();
