async function register() {
const { test } = await import("node:test");
const assert = (await import("node:assert/strict")).default;
const { loadTs } = await import("../auth/load-ts.mjs");

const id = "11111111-1111-4111-8111-111111111111";

test("HR client routes every CRUD operation to real API", async () => {
  const calls = [];
  const { apiService } = loadTs("lib/api-service.ts", {
    "./session-client": {
      sessionFetch: async (path, options) => {
        calls.push([path, options.method || "GET"]);
        return Response.json([]);
      },
      withSessionLock: (fn) => fn(),
    },
  });
  const staff = { staffNo: "S1", role: "Teacher", firstName: "A", lastName: "B" };
  await apiService.hr.getStaff();
  await apiService.hr.getStaffById(id);
  await apiService.hr.getStaffOptions("Teacher");
  await apiService.hr.getDepartments();
  await apiService.hr.createDepartment({ name: "A" });
  await apiService.hr.updateDepartment(id, { name: "B" });
  await apiService.hr.deleteDepartment(id);
  await apiService.hr.getDesignations();
  await apiService.hr.createDesignation({ name: "A" });
  await apiService.hr.updateDesignation(id, { name: "B" });
  await apiService.hr.deleteDesignation(id);
  await apiService.hr.getRoles();
  await apiService.hr.createStaff(staff);
  await apiService.hr.updateStaff(id, { lastName: "C" });
  await apiService.hr.deleteStaff(id);
  assert.deepEqual(calls, [
    ["/api/hr/staff", "GET"],
    [`/api/hr/staff/${id}`, "GET"],
    ["/api/hr/staff/options?role=Teacher", "GET"],
    ["/api/hr/departments", "GET"],
    ["/api/hr/departments", "POST"],
    [`/api/hr/departments/${id}`, "PATCH"],
    [`/api/hr/departments/${id}`, "DELETE"],
    ["/api/hr/designations", "GET"],
    ["/api/hr/designations", "POST"],
    [`/api/hr/designations/${id}`, "PATCH"],
    [`/api/hr/designations/${id}`, "DELETE"],
    ["/api/hr/staff/roles", "GET"],
    ["/api/hr/staff", "POST"],
    [`/api/hr/staff/${id}`, "PATCH"],
    [`/api/hr/staff/${id}`, "DELETE"],
  ]);
});

test("HR proxy requires admin, blocks foreign origins, validates IDs and preserves errors", async () => {
  let role = "admin";
  let signedIn = true;
  let calls = 0;
  let lastPath = "";
  const { proxyHr } = loadTs("lib/hr-proxy.ts", {
    "@/lib/auth-server": {
      getVerifiedUser: async () => ({
        user: signedIn ? { role } : null,
        accessToken: "cookie-token",
      }),
      isSameOrigin: (request) =>
        request.headers.get("origin") !== "https://external.invalid",
      authFetch: async (path, options) => {
        calls++;
        lastPath = path;
        assert.equal(options.headers.Authorization, "Bearer cookie-token");
        return Response.json(
          { message: "Staff number already exists" },
          { status: 409 },
        );
      },
    },
  });
  for (const denied of ["student", "instructor"]) {
    role = denied;
    assert.equal(
      (
        await proxyHr(new Request("http://localhost/api/hr/staff"), "staff")
      ).status,
      403,
    );
  }
  role = "admin";
  signedIn = false;
  assert.equal(
    (await proxyHr(new Request("http://localhost/api/hr/staff"), "staff"))
      .status,
    401,
  );
  signedIn = true;
  assert.equal(
    (
      await proxyHr(
        new Request("http://localhost/api/hr/staff", {
          method: "POST",
          headers: { origin: "https://external.invalid" },
        }),
        "staff",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await proxyHr(
        new Request("http://localhost/api/hr/staff"),
        "staff",
        "invalid",
      )
    ).status,
    400,
  );
  assert.equal(calls, 0);

  const response = await proxyHr(
    new Request("http://localhost/api/hr/staff", {
      method: "PATCH",
      body: JSON.stringify({ firstName: "A" }),
    }),
    "staff",
    id,
  );
  assert.equal(response.status, 409);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(lastPath, "/staff/" + id);

  const options = await proxyHr(
    new Request("http://localhost/api/hr/staff/options"),
    "staff",
    undefined,
    "options",
  );
  assert.equal(options.status, 409);
  assert.equal(lastPath, "/staff/options");
  assert.equal(calls, 2);
});

function mount(pagePath, apiService, components, extraMocks = {}) {
  const state = [];
  const effects = [];
  let cursor = 0;
  const react = {
    useState(value) {
      const key = cursor++;
      if (!(key in state)) state[key] = value;
      return [
        state[key],
        (next) => {
          state[key] = typeof next === "function" ? next(state[key]) : next;
        },
      ];
    },
    useRef(value) {
      const key = cursor++;
      if (!(key in state)) state[key] = { current: value };
      return state[key];
    },
    useEffect(fn) {
      const key = cursor++;
      if (!(key in state)) {
        state[key] = true;
        effects.push(fn);
      }
    },
  };
  const Page = loadTs(pagePath, {
    react,
    "@/lib/api-service": { apiService },
    "@/components/modules/study-material/FileAttachmentPanel": { FileAttachmentPanel: () => null },
    ...extraMocks,
    ...components,
  }).default;
  const walk = (node) =>
    !node || typeof node !== "object"
      ? []
      : [
          node,
          ...[node.props?.children].flat(Infinity).flatMap(walk),
        ];
  const render = () => {
    cursor = 0;
    return walk(Page());
  };
  return {
    start: async () => {
      render();
      effects.splice(0).forEach((fn) => fn());
      await new Promise(setImmediate);
    },
    render,
    table: (Table) => render().find((node) => node.type === Table).props,
    form: (Form) => render().find((node) => node.type === Form).props,
    actions: () => {
      const table = render().find((node) => node.type === Table);
      return table.props.columns.find((c) => c.header === "Action").accessor(
        table.props.data[0],
      ).props;
    },
  };
}

const Form = () => null;
const Table = () => null;
const Actions = () => null;
const Header = () => null;
const stub = () => null;

test("Department page reloads persisted rows and retains failed duplicate input", async () => {
  let stored = [];
  let fail = false;
  const api = {
    getDepartments: async () => [...stored],
    createDepartment: async (data) => {
      if (fail) throw Error("Department name already exists");
      stored = [{ id, ...data }];
    },
    updateDepartment: async (key, data) => {
      stored = [{ ...stored[0], id: key, ...data }];
    },
    deleteDepartment: async () => {
      stored = [];
    },
  };
  const page = mount("app/admin/hr/department/page.tsx", { hr: api }, {
    "@/components/common/PageHeader": { PageHeader: Header },
    "@/components/modules/hr/DepartmentForm": { DepartmentForm: Form },
    "@/components/common/DataTable": { DataTable: Table },
    "@/components/common/ListActionButtons": { ListActionButtons: Actions },
    "@/components/ui/button": { Button: stub },
  });
  await page.start();
  page.form(Form).setDepartmentTitle("Science");
  await page.form(Form).onSubmit({ preventDefault() {} });
  assert.equal(page.table(Table).data[0].name, "Science");

  page.actions().onEdit();
  page.form(Form).setDepartmentTitle("Mathematics");
  await page.form(Form).onSubmit({ preventDefault() {} });
  assert.equal(page.table(Table).data[0].name, "Mathematics");

  fail = true;
  page.form(Form).setDepartmentTitle("Mathematics");
  await page.form(Form).onSubmit({ preventDefault() {} });
  assert.equal(page.form(Form).departmentTitle, "Mathematics");
  assert.ok(page.render().some((node) => node.props?.role === "alert"));

  global.window = { confirm: () => true };
  try {
    page.actions().onDelete();
    await new Promise(setImmediate);
    assert.deepEqual(page.table(Table).data, []);
  } finally {
    delete global.window;
  }
});

test("Designation page reloads persisted rows and retains failed duplicate input", async () => {
  let stored = [];
  let fail = false;
  const api = {
    getDesignations: async () => [...stored],
    createDesignation: async (data) => {
      if (fail) throw Error("Designation name already exists");
      stored = [{ id, ...data }];
    },
    updateDesignation: async (key, data) => {
      stored = [{ ...stored[0], id: key, ...data }];
    },
    deleteDesignation: async () => {
      stored = [];
    },
  };
  const page = mount("app/admin/hr/designation/page.tsx", { hr: api }, {
    "@/components/common/PageHeader": { PageHeader: Header },
    "@/components/modules/hr/DesignationForm": { DesignationForm: Form },
    "@/components/common/DataTable": { DataTable: Table },
    "@/components/common/ListActionButtons": { ListActionButtons: Actions },
    "@/components/ui/button": { Button: stub },
  });
  await page.start();
  page.form(Form).setDesignationTitle("Principal");
  await page.form(Form).onSubmit({ preventDefault() {} });
  assert.equal(page.table(Table).data[0].name, "Principal");

  page.actions().onEdit();
  page.form(Form).setDesignationTitle("Vice Principal");
  await page.form(Form).onSubmit({ preventDefault() {} });
  assert.equal(page.table(Table).data[0].name, "Vice Principal");

  fail = true;
  page.form(Form).setDesignationTitle("Vice Principal");
  await page.form(Form).onSubmit({ preventDefault() {} });
  assert.equal(page.form(Form).designationTitle, "Vice Principal");
  assert.ok(page.render().some((node) => node.props?.role === "alert"));
});

test("Staff list loads API rows, routes edits and deletes persisted staff", async () => {
  let stored = [
    {
      id,
      staffNo: "S1",
      name: "Ada Lovelace",
      role: "Teacher",
      department: "Science",
      designation: "Lecturer",
      phone: "123",
      email: "ada@example.invalid",
    },
  ];
  const pushed = [];
  const api = {
    getStaff: async () => [...stored],
    deleteStaff: async (key) => {
      stored = stored.filter((staff) => staff.id !== key);
    },
  };
  const page = mount(
    "app/admin/hr/staff-list/page.tsx",
    { hr: api },
    {
      "@/components/common/PageHeader": { PageHeader: Header },
      "@/components/common/DataTable": { DataTable: Table },
      "@/components/common/ListActionButtons": { ListActionButtons: Actions },
      "@/components/ui/button": { Button: stub },
    },
    {
      "next/link": { default: stub },
      "next/navigation": {
        useRouter: () => ({ push: (path) => pushed.push(path) }),
      },
    },
  );
  await page.start();
  assert.equal(page.table(Table).data[0].staffNo, "S1");

  page.actions().onEdit();
  assert.deepEqual(pushed, [`/admin/hr/add-staff?id=${id}`]);

  global.window = { confirm: () => true };
  try {
    page.actions().onDelete();
    await new Promise(setImmediate);
    assert.deepEqual(page.table(Table).data, []);
  } finally {
    delete global.window;
  }
});

function field(page, name) {
  return page
    .render()
    .find(
      (node) =>
        ["input", "select", "textarea"].includes(node.type) &&
        node.props.name === name,
    );
}

function addStaffPage(api) {
  const pushed = [];
  return mount(
    "app/admin/hr/add-staff/page.tsx",
    { hr: api },
    {
      "@/components/common/PageHeader": { PageHeader: Header },
      "@/components/ui/button": { Button: stub },
    },
    {
      "next/navigation": {
        useRouter: () => ({ push: (path) => pushed.push(path) }),
      },
      "react-icons/fa": new Proxy({}, { get: () => stub }),
    },
  );
}

test("Add staff page submits normalized payload and loads edit records", async () => {
  let created = null;
  let updated = null;
  const api = {
    getRoles: async () => ["Teacher", "Accountant"],
    getDepartments: async () => [{ id: "d1", name: "Science" }],
    getDesignations: async () => [{ id: "g1", name: "Lecturer" }],
    getStaffById: async () => ({
      id,
      staffNo: "S1",
      role: "Teacher",
      firstName: "Ada",
      lastName: "Lovelace",
      departmentId: "d1",
      designationId: "g1",
      email: "ada@example.invalid",
      basicSalary: 2500,
    }),
    createStaff: async (payload) => {
      created = payload;
    },
    updateStaff: async (key, payload) => {
      updated = [key, payload];
    },
  };

  global.window = { location: { search: "" } };
  try {
    const page = addStaffPage(api);
    await page.start();
    for (const [name, value] of [
      ["staffNo", "S1"],
      ["role", "Teacher"],
      ["departmentId", "d1"],
      ["firstName", "Ada"],
      ["lastName", "Lovelace"],
      ["basicSalary", "1000.50"],
    ]) {
      field(page, name).props.onChange({ target: { name, value } });
    }
    const form = () => page.render().find((node) => node.type === "form");
    await form().props.onSubmit({ preventDefault() {} });
    assert.equal(created.staffNo, "S1");
    assert.equal(created.role, "Teacher");
    assert.equal(created.firstName, "Ada");
    assert.equal(created.lastName, "Lovelace");
    assert.equal(created.departmentId, "d1");
    assert.equal(created.designationId, null);
    assert.equal(created.email, null);
    assert.equal(created.basicSalary, 1000.5);
    assert.equal(created.isExpert, true);
    assert.equal(created.status, "active");
  } finally {
    delete global.window;
  }

  global.window = { location: { search: `?id=${id}` } };
  try {
    const page = addStaffPage(api);
    await page.start();
    assert.equal(field(page, "staffNo").props.value, "S1");
    assert.equal(field(page, "role").props.value, "Teacher");
    assert.equal(field(page, "firstName").props.value, "Ada");
    assert.equal(field(page, "basicSalary").props.value, "2500");
    field(page, "lastName").props.onChange({
      target: { name: "lastName", value: "Byron" },
    });
    const form = () => page.render().find((node) => node.type === "form");
    await form().props.onSubmit({ preventDefault() {} });
    assert.equal(updated[0], id);
    assert.equal(updated[1].lastName, "Byron");
    assert.equal(updated[1].staffNo, "S1");
  } finally {
    delete global.window;
  }
});


}
void register();
