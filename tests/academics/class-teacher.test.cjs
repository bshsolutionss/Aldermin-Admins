async function register() {
const { test } = await import("node:test");
const assert = (await import("node:assert/strict")).default;
const { loadTs } = await import("../auth/load-ts.mjs");

const id = "11111111-1111-4111-8111-111111111111";
const yearId = "22222222-2222-4222-8222-222222222222";
const classId = "33333333-3333-4333-8333-333333333333";
const sectionA = "44444444-4444-4444-8444-444444444444";
const sectionB = "55555555-5555-4555-8555-555555555555";
const staffOne = "66666666-6666-4666-8666-666666666666";
const staffTwo = "77777777-7777-4777-8777-777777777777";

const choices = {
  academicYearId: yearId,
  classSections: [
    {
      id: sectionA,
      classId,
      className: "Class 10",
      sectionId: "a",
      sectionName: "A",
      academicYearId: yearId,
      academicYearName: "2026",
    },
    {
      id: sectionB,
      classId,
      className: "Class 10",
      sectionId: "b",
      sectionName: "B",
      academicYearId: yearId,
      academicYearName: "2026",
    },
  ],
  teachers: [
    {
      id: staffOne,
      staffNo: "S1",
      name: "Ada Lovelace",
      role: "Teacher",
      department: "Science",
      designation: null,
    },
    {
      id: staffTwo,
      staffNo: "S2",
      name: "Grace Hopper",
      role: "Teacher",
      department: "Math",
      designation: null,
    },
  ],
};

const row = {
  id,
  classSectionId: sectionA,
  staffId: staffOne,
  classId,
  className: "Class 10",
  sectionId: "a",
  sectionName: "A",
  academicYearId: yearId,
  academicYearName: "2026",
  staffNo: "S1",
  teacherRole: "Teacher",
  teacherName: "Ada Lovelace",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

test("Class teacher client routes every operation to the real API", async () => {
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
  await apiService.classTeacherAssignments.getAll();
  await apiService.classTeacherAssignments.getOptions();
  await apiService.classTeacherAssignments.getOptions(yearId);
  await apiService.classTeacherAssignments.create({
    classSectionId: sectionA,
    staffId: staffOne,
  });
  await apiService.classTeacherAssignments.update(id, { staffId: staffTwo });
  await apiService.classTeacherAssignments.delete(id);
  assert.deepEqual(calls, [
    ["/api/class-teacher-assignments", "GET"],
    ["/api/class-teacher-assignments/options", "GET"],
    [`/api/class-teacher-assignments/options?academicYearId=${yearId}`, "GET"],
    ["/api/class-teacher-assignments", "POST"],
    [`/api/class-teacher-assignments/${id}`, "PATCH"],
    [`/api/class-teacher-assignments/${id}`, "DELETE"],
  ]);
});

test("Class teacher proxy requires admin, blocks foreign origins and validates IDs", async () => {
  let role = "admin";
  let signedIn = true;
  let calls = 0;
  let lastPath = "";
  const { proxyClassTeacher } = loadTs("lib/class-teacher-proxy.ts", {
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
          { message: "This class section already has a class teacher" },
          { status: 409 },
        );
      },
    },
  });

  for (const denied of ["student", "instructor"]) {
    role = denied;
    assert.equal(
      (await proxyClassTeacher(new Request("http://localhost/api/class-teacher-assignments")))
        .status,
      403,
    );
  }
  role = "admin";
  signedIn = false;
  assert.equal(
    (await proxyClassTeacher(new Request("http://localhost/api/class-teacher-assignments")))
      .status,
    401,
  );
  signedIn = true;
  assert.equal(
    (
      await proxyClassTeacher(
        new Request("http://localhost/api/class-teacher-assignments", {
          method: "POST",
          headers: { origin: "https://external.invalid" },
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await proxyClassTeacher(
        new Request("http://localhost/api/class-teacher-assignments/not-a-uuid"),
        "not-a-uuid",
      )
    ).status,
    400,
  );
  assert.equal(calls, 0);

  const response = await proxyClassTeacher(
    new Request("http://localhost/api/class-teacher-assignments/" + id, {
      method: "PATCH",
      body: JSON.stringify({ staffId: staffTwo }),
    }),
    id,
  );
  assert.equal(response.status, 409);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(lastPath, `/class-teacher-assignments/${id}`);

  const options = await proxyClassTeacher(
    new Request("http://localhost/api/class-teacher-assignments/options"),
    undefined,
    "options",
  );
  assert.equal(options.status, 409);
  assert.equal(lastPath, "/class-teacher-assignments/options");
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
    ...extraMocks,
    ...components,
  }).default;
  const walk = (node) =>
    !node || typeof node !== "object"
      ? []
      : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];
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

function pageFor(api) {
  return mount(
    "app/admin/academics/assign-teacher/page.tsx",
    { classTeacherAssignments: api },
    {
      "@/components/common/PageHeader": { PageHeader: Header },
      "@/components/modules/academics/AssignTeacherForm": {
        AssignTeacherForm: Form,
      },
      "@/components/common/DataTable": { DataTable: Table },
      "@/components/common/ListActionButtons": { ListActionButtons: Actions },
      "@/components/ui/button": { Button: stub },
      "react-icons/fa": new Proxy({}, { get: () => stub }),
    },
  );
}

test("Class teacher page loads options and creates an assignment with real IDs", async () => {
  let stored = [];
  let created = null;
  const api = {
    getAll: async () => [...stored],
    getOptions: async () => choices,
    create: async (payload) => {
      created = payload;
      stored = [
        {
          ...row,
          ...payload,
          staffId: payload.staffId,
          staffNo: "S1",
          teacherName: "Ada Lovelace",
        },
      ];
    },
  };
  const page = pageFor(api);
  await page.start();
  assert.deepEqual(page.table(Table).data, []);
  assert.equal(page.form(Form).classes[0].name, "Class 10");

  page.form(Form).setSelectedClass(classId);
  assert.deepEqual(
    page.form(Form).sections.map((section) => section.name),
    ["A", "B"],
  );
  page.form(Form).setSelectedSection(sectionA);
  page.form(Form).setSelectedTeacher(staffOne);
  await page.form(Form).handleSubmit({ preventDefault() {} });

  assert.deepEqual(created, { classSectionId: sectionA, staffId: staffOne });
  assert.equal(page.table(Table).data[0].teacherName, "Ada Lovelace");
  assert.equal(page.form(Form).selectedSection, "");
});

test("Class teacher page edits and deletes persisted assignments", async () => {
  let stored = [{ ...row }];
  let updated = null;
  let deleted = null;
  const api = {
    getAll: async () => [...stored],
    getOptions: async () => choices,
    update: async (key, payload) => {
      updated = [key, payload];
      stored = [
        {
          ...stored[0],
          ...payload,
          staffId: payload.staffId,
          staffNo: "S2",
          teacherName: "Grace Hopper",
        },
      ];
    },
    delete: async (key) => {
      deleted = key;
      stored = [];
    },
  };
  const page = pageFor(api);
  await page.start();
  page.actions().onEdit();
  assert.equal(page.form(Form).editing, true);
  assert.equal(page.form(Form).selectedClass, classId);
  assert.equal(page.form(Form).selectedSection, sectionA);
  assert.equal(page.form(Form).selectedTeacher, staffOne);

  page.form(Form).setSelectedTeacher(staffTwo);
  await page.form(Form).handleSubmit({ preventDefault() {} });
  assert.deepEqual(updated, [
    id,
    { classSectionId: sectionA, staffId: staffTwo },
  ]);
  assert.equal(page.table(Table).data[0].teacherName, "Grace Hopper");
  assert.equal(page.form(Form).editing, false);

  global.window = { confirm: () => true };
  try {
    page.actions().onDelete();
    await new Promise(setImmediate);
    assert.equal(deleted, id);
    assert.deepEqual(page.table(Table).data, []);
  } finally {
    delete global.window;
  }
});

test("Class teacher page retains failed duplicate input and reports the error", async () => {
  let fail = false;
  const api = {
    getAll: async () => [],
    getOptions: async () => choices,
    create: async () => {
      if (fail) throw Error("This class section already has a class teacher");
    },
  };
  const page = pageFor(api);
  await page.start();
  page.form(Form).setSelectedClass(classId);
  page.form(Form).setSelectedSection(sectionA);
  page.form(Form).setSelectedTeacher(staffOne);
  fail = true;
  await page.form(Form).handleSubmit({ preventDefault() {} });

  assert.equal(page.form(Form).selectedSection, sectionA);
  assert.equal(page.form(Form).selectedTeacher, staffOne);
  assert.ok(page.render().some((node) => node.props?.role === "alert"));
});

}
void register();
