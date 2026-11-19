async function registerTests() {
  const { test } = await import("node:test"),
    assert = (await import("node:assert/strict")).default,
    { loadTs } = await import("../auth/load-ts.mjs");
  const id = "11111111-1111-4111-8111-111111111111",
    page = { items: [], total: 0, page: 1, pageSize: 20 };
  const real = () =>
    loadTs("lib/examinations-client.ts", {
      "./session-client": { sessionFetch: async () => Response.json({}) },
    });
  function mount(api) {
    const slots = [],
      effects = [];
    let cursor = 0;
    const react = {
      useState(value) {
        const i = cursor++;
        if (!(i in slots))
          slots[i] = typeof value === "function" ? value() : value;
        return [
          slots[i],
          (next) =>
            (slots[i] = typeof next === "function" ? next(slots[i]) : next),
        ];
      },
      useRef(value) {
        const i = cursor++;
        if (!(i in slots)) slots[i] = { current: value };
        return slots[i];
      },
      useCallback(fn, deps) {
        const i = cursor++,
          before = slots[i];
        if (!before || deps.some((v, k) => v !== before.deps[k]))
          slots[i] = { fn, deps };
        return slots[i].fn;
      },
      useEffect(fn, deps) {
        const i = cursor++,
          before = slots[i];
        if (!before || deps.some((v, k) => v !== before.deps[k])) {
          slots[i] = { deps, cleanup: before?.cleanup };
          effects.push(() => {
            slots[i].cleanup?.();
            slots[i].cleanup = fn();
          });
        }
      },
    };
    const { useExaminations } = loadTs("lib/use-examinations.ts", {
      react,
      "./examinations-client": { ...real(), examinationsApi: api },
    });
    const render = () => {
      cursor = 0;
      return useExaminations("assessments");
    };
    return {
      render,
      flush: async () => {
        render();
        effects.splice(0).forEach((fn) => fn());
        await new Promise(setImmediate);
      },
    };
  }
  test("examination proxy enforces verified admins, same origin and strict resource/action paths", async () => {
    let user = { role: "admin" },
      origin = true;
    const calls = [];
    const { proxyExaminations: proxy } = loadTs("lib/examinations-proxy.ts", {
      "./auth-server": {
        getVerifiedUser: async () => ({ user, accessToken: "cookie-token" }),
        isSameOrigin: () => origin,
        authFetch: async (path, init) => {
          calls.push([path, init]);
          return Response.json({ message: "Conflict" }, { status: 409 });
        },
      },
    });
    const req = (method = "GET", body) =>
      new Request("http://localhost/api/examinations/types?page=2", {
        method,
        ...(body === undefined ? {} : { body }),
      });
    for (const parts of [
      ["users"],
      ["options", "users"],
      ["assessments", "bad", "roster"],
    ])
      assert.equal((await proxy(req(), parts)).status, 404);
    assert.equal((await proxy(req("DELETE"), ["types", id])).status, 404);
    user = null;
    assert.equal((await proxy(req(), ["types"])).status, 401);
    user = { role: "student" };
    assert.equal((await proxy(req(), ["history"])).status, 403);
    user = { role: "admin" };
    origin = false;
    assert.equal(
      (await proxy(req("PUT", "{}"), ["assessments", id, "marks"])).status,
      403,
    );
    origin = true;
    assert.equal((await proxy(req("POST", "bad"), ["types"])).status, 400);
    assert.equal(calls.length, 0);
    const response = await proxy(req("PUT", "{}"), [
      "assessments",
      id,
      "attendance",
    ]);
    assert.equal(response.status, 409);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(
      calls[0][0],
      "/examinations/assessments/" + id + "/attendance",
    );
    assert.equal(calls[0][1].headers.Authorization, "Bearer cookie-token");
  });
  test("client strips derived scope/actor/result fields and retains exact retry identities and versions", async () => {
    const calls = [];
    const { examinationsApi: api, blankExam } = loadTs(
      "lib/examinations-client.ts",
      {
        "./session-client": {
          sessionFetch: async (path, init) => {
            calls.push([path, init]);
            return Response.json({});
          },
        },
      },
    );
    const draft = {
      ...blankExam(),
      typeId: id,
      assignmentId: id,
      title: "Test",
      version: 3,
      actorId: id,
      studentId: id,
    };
    await api.save("assessments", draft, id);
    await api.save("assessments", draft, id);
    const body = JSON.parse(calls[0][1].body);
    assert.equal(body.requestId, draft.requestId);
    assert.equal(body.version, 3);
    assert.ok(!("actorId" in body));
    assert.ok(!("assessmentId" in body));
    assert.equal(calls[0][1].body, calls[1][1].body);
    await api.record(id, "marks", {
      enrollmentId: id,
      status: "absent",
      version: 0,
      score: null,
      feedback: "Absent",
      maxMarks: 9999,
    });
    assert.deepEqual(JSON.parse(calls[2][1].body), {
      enrollmentId: id,
      status: "absent",
      score: null,
      feedback: "Absent",
      version: 0,
    });
    await api.roster(id, 2, "A & B");
    assert.match(calls[3][0], /page=2/);
    assert.match(calls[3][0], /search=A\+%26\+B/);
  });
  test("failed assessment writes retain draft/request ID and duplicate clicks submit only once", async () => {
    let reject,
      calls = 0;
    const h = mount({
      list: async () => page,
      save: () => {
        calls++;
        return new Promise((_yes, no) => (reject = no));
      },
    });
    await h.flush();
    h.render().setDraft({ ...h.render().draft, title: "Unsaved exam" });
    const requestId = h.render().draft.requestId,
      pending = h.render().save();
    assert.equal(await h.render().save(), false);
    assert.equal(calls, 1);
    reject(Error("Conflict"));
    assert.equal(await pending, false);
    assert.equal(h.render().draft.title, "Unsaved exam");
    assert.equal(h.render().draft.requestId, requestId);
    assert.match(h.render().error, /Conflict/);
  });
  test("editing preserves the persisted version and normalizes database schedule times", async () => {
    let sent;
    const h = mount({
      list: async () => page,
      save: async (_r, input) => {
        sent = input;
        return { changed: true };
      },
    });
    await h.flush();
    h.render().edit({
      ...real().blankExam(),
      id,
      title: "Saved",
      version: 4,
      startTime: "09:30:00",
      endTime: "10:30:00",
    });
    assert.equal(h.render().draft.startTime, "09:30");
    await h.render().save();
    assert.equal(sent.version, 4);
    assert.equal(h.render().editing, undefined);
  });
  test("unapplied schema disables mutations and late searches cannot replace newer results", async () => {
    let fail = true,
      oldResolve;
    const h = mount({
      list: async (_r, _page, search) => {
        if (fail) throw Error("Migration pending");
        if (search === "old")
          return new Promise((resolve) => (oldResolve = resolve));
        return { ...page, items: [{ id, title: "Newest", version: 1 }] };
      },
    });
    await h.flush();
    assert.equal(h.render().ready, false);
    assert.equal(await h.render().save(), false);
    fail = false;
    h.render().setSearch("old");
    const old = h.render().load();
    h.render().setSearch("new");
    await h.render().load();
    oldResolve({ ...page, items: [{ id, title: "Old" }] });
    await old;
    assert.equal(h.render().data.items[0].title, "Newest");
  });
  test("examination API wrapper awaits params and delegates to the protected proxy", async () => {
    let seen;
    const route = loadTs("app/api/examinations/[...segments]/route.ts", {
      "@/lib/examinations-proxy": {
        proxyExaminations: async (...args) => {
          seen = args;
          return Response.json({});
        },
      },
    });
    const req = new Request(
      "http://localhost/api/examinations/assessments/" + id + "/marks",
      { method: "PUT" },
    );
    await route.PUT(req, {
      params: Promise.resolve({ segments: ["assessments", id, "marks"] }),
    });
    assert.deepEqual(seen, [req, ["assessments", id, "marks"]]);
  });
}
void registerTests();
