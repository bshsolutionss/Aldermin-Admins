"use client";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegistry, useSchoolOperations } from "@/lib/use-school-operations";
import {
  schoolOperationsApi,
  type RegistryResource,
  type OperationResource,
  type RegistryInput,
  type LoanInput,
  type MovementInput,
  type ChoiceResource,
} from "@/lib/school-operations-client";
import { OperationChoice } from "./OperationChoice";
type Field = {
  key: keyof RegistryInput;
  label: string;
  required?: boolean;
  max?: number;
  choice?: ChoiceResource;
  number?: boolean;
};
const fields: Record<RegistryResource, Field[]> = {
  "library-categories": [
    { key: "name", label: "Category", required: true, max: 120 },
  ],
  "library-subjects": [
    { key: "name", label: "Subject", required: true, max: 120 },
  ],
  books: [
    { key: "code", label: "Book Code", required: true, max: 60 },
    { key: "title", label: "Title", required: true, max: 200 },
    { key: "isbn", label: "ISBN", max: 30 },
    { key: "author", label: "Author", max: 160 },
    { key: "publisher", label: "Publisher", max: 160 },
    { key: "copies", label: "Total Copies", required: true, number: true },
    { key: "categoryId", label: "Category", choice: "library-categories" },
    { key: "subjectId", label: "Subject", choice: "library-subjects" },
  ],
  members: [
    { key: "code", label: "Membership Code", required: true, max: 60 },
    {
      key: "studentId",
      label: "Student Owner (choose exactly one owner)",
      choice: "owners/students",
    },
    { key: "staffId", label: "Staff Owner", choice: "owners/staff" },
  ],
  "inventory-categories": [
    { key: "name", label: "Category", required: true, max: 120 },
  ],
  stores: [
    { key: "name", label: "Store", required: true, max: 120 },
    { key: "contact", label: "Location / Contact", max: 300 },
  ],
  suppliers: [
    { key: "name", label: "Supplier", required: true, max: 120 },
    { key: "contact", label: "Contact", max: 300 },
  ],
  items: [
    { key: "code", label: "Item Code", required: true, max: 60 },
    { key: "name", label: "Item Name", required: true, max: 120 },
    { key: "unit", label: "Whole Unit Label", required: true, max: 30 },
    {
      key: "categoryId",
      label: "Category",
      required: true,
      choice: "inventory-categories",
    },
  ],
};
function Messages({
  error,
  notice,
  reload,
  disabled,
}: {
  error: string;
  notice: string;
  reload: () => Promise<void>;
  disabled: boolean;
}) {
  return (
    <>
      {error && (
        <p role="alert" className="text-destructive">
          {error}{" "}
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => void reload()}
          >
            Reload
          </Button>
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-700">
          {notice}
        </p>
      )}
    </>
  );
}
function Controls({
  state,
  archive = false,
  statuses,
}: {
  state: ReturnType<typeof useSchoolOperations>;
  archive?: boolean;
  statuses?: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        aria-label="Search records"
        placeholder="Search records…"
        className="max-w-sm"
        value={state.search}
        disabled={state.saving}
        onChange={(event) => state.setSearch(event.target.value)}
      />
      {archive && (
        <label className="text-sm flex gap-2">
          <input
            type="checkbox"
            checked={state.archived}
            disabled={state.saving}
            onChange={(event) => state.setArchived(event.target.checked)}
          />
          Show archived
        </label>
      )}
      {statuses && (
        <select
          aria-label="Record status"
          className="h-12 border border-gray-200 rounded-xl px-3 bg-white"
          disabled={state.saving}
          value={state.status}
          onChange={(event) => state.setStatus(event.target.value)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
function Pagination({
  state,
}: {
  state: ReturnType<typeof useSchoolOperations>;
}) {
  return (
    <div className="flex justify-between items-center gap-3 pt-4">
      <Button
        variant="outline"
        disabled={state.loading || state.saving || state.page <= 1}
        onClick={() => state.setPage(state.page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm">
        Page {state.page} · {state.total} records
      </span>
      <Button
        variant="outline"
        disabled={
          state.loading || state.saving || state.page * 20 >= state.total
        }
        onClick={() => state.setPage(state.page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
function History({ resource }: { resource: OperationResource }) {
  const [open, setOpen] = useState(false),
    [page, setPage] = useState(1),
    [rows, setRows] = useState<
      {
        id: string;
        recordId: string;
        version: number;
        actorName: string;
        createdAt: string;
      }[]
    >([]),
    [total, setTotal] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const sequence = useRef(0);
  async function load(next: number) {
    const token = ++sequence.current;
    setBusy(true);
    setError("");
    try {
      const data = await schoolOperationsApi.history(resource, next);
      if (token === sequence.current) {
        setPage(next);
        setRows(data.items);
        setTotal(data.total);
      }
    } catch (err) {
      if (token === sequence.current)
        setError(err instanceof Error ? err.message : "Unable to load history");
    } finally {
      if (token === sequence.current) setBusy(false);
    }
  }
  return (
    <AdminCard className="p-6 space-y-4">
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => {
          setOpen(!open);
          if (!open) void load(page);
        }}
      >
        {open ? "Hide" : "Show"} Audit History
      </Button>
      {open && (
        <>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
              <Button variant="ghost" onClick={() => void load(page)}>
                Retry
              </Button>
            </p>
          )}
          {rows.map((row) => (
            <p className="text-sm" key={row.id}>
              Version {row.version} · {row.actorName} ·{" "}
              {new Date(row.createdAt).toLocaleString()} · {row.recordId}
            </p>
          ))}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              disabled={busy || page <= 1}
              onClick={() => void load(page - 1)}
            >
              Previous
            </Button>
            <span>
              {page} · {total} events
            </span>
            <Button
              variant="ghost"
              disabled={busy || page * 10 >= total}
              onClick={() => void load(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </AdminCard>
  );
}
export function RegistryPanel({
  resource,
  title,
}: {
  resource: RegistryResource;
  title: string;
}) {
  const state = useRegistry(resource);
  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader title={title} subtitle="Manage saved school records" />
      <Messages {...state} reload={state.load} disabled={state.saving} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <AdminCard className="p-8 lg:col-span-4">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void state.save();
            }}
          >
            <h2 className="font-semibold">
              {state.editing ? "Edit Record" : "Create Record"}
            </h2>
            <fieldset
              disabled={state.saving || !state.ready}
              className="space-y-5"
            >
              {fields[resource].map((field) => (
                <div key={field.key}>
                  <Label htmlFor={"operation-" + field.key}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </Label>
                  {field.choice ? (
                    <OperationChoice
                      resource={field.choice}
                      value={state.draft[field.key] as string | null}
                      onChange={(value) =>
                        state.setDraft({ ...state.draft, [field.key]: value })
                      }
                      disabled={
                        state.saving ||
                        !state.ready ||
                        (resource === "members" && !!state.editing)
                      }
                    />
                  ) : (
                    <Input
                      id={"operation-" + field.key}
                      required={field.required}
                      maxLength={field.max}
                      min={field.number ? 0 : undefined}
                      max={field.number ? 1000000 : undefined}
                      step={field.number ? 1 : undefined}
                      type={field.number ? "number" : "text"}
                      value={state.draft[field.key] as string | number}
                      onChange={(event) =>
                        state.setDraft({
                          ...state.draft,
                          [field.key]: field.number
                            ? Number(event.target.value)
                            : event.target.value,
                        })
                      }
                    />
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full py-6">
                {state.saving ? "Saving…" : "Save Record"}
              </Button>
            </fieldset>
            {state.editing && (
              <Button
                type="button"
                disabled={state.saving}
                variant="outline"
                onClick={state.reset}
              >
                Cancel Edit
              </Button>
            )}
          </form>
        </AdminCard>
        <div className="lg:col-span-8 space-y-5">
          <Controls state={state} archive />
          <AdminCard className="p-6 space-y-4">
            {state.loading ? (
              <p>Loading records…</p>
            ) : !state.ready ? (
              <p>Records could not load. Retry using Reload.</p>
            ) : !state.items.length ? (
              <p>No matching saved records.</p>
            ) : (
              state.items.map((row) => (
                <article
                  key={row.id}
                  className="border-b border-gray-200 pb-4 space-y-3"
                >
                  <h2 className="font-semibold">
                    {row.title || row.name || row.code}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {row.code} · Version {row.version}
                    {row.archived ? " · Archived" : ""}
                  </p>
                  {resource === "books" && (
                    <p className="text-sm">
                      {row.author} · {row.publisher} · {row.copies} copies,{" "}
                      {row.available} available
                    </p>
                  )}
                  {resource === "items" && (
                    <p className="text-sm">Whole unit: {row.unit}</p>
                  )}
                  {row.contact && <p className="text-sm">{row.contact}</p>}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={state.saving}
                      onClick={() => state.edit(row)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={state.saving}
                      onClick={() => void state.archive(row)}
                    >
                      {row.archived ? "Restore" : "Archive"}
                    </Button>
                  </div>
                </article>
              ))
            )}
            <Pagination state={state} />
          </AdminCard>
        </div>
      </div>
      <History resource={resource} />
    </div>
  );
}
export function LoanPanel({
  title = "Issue and Return Books",
  initialStatus = "all",
}: {
  title?: string;
  initialStatus?: string;
}) {
  const state = useSchoolOperations("loans", initialStatus);
  const [draft, setDraft] = useState<LoanInput>({
      requestId: "",
      bookId: "",
      memberId: "",
      issuedOn: "",
      dueOn: "",
      note: "",
    }),
    [returnedOn, setReturnedOn] = useState("");
  const request = useRef("");
  function change(patch: Partial<LoanInput>) {
    if (state.saving) return;
    request.current = "";
    setDraft({ ...draft, ...patch, requestId: "" });
  }
  async function issue() {
    if (!draft.bookId || !draft.memberId) {
      state.setError("Choose a real book and library member.");
      return;
    }
    request.current ||= crypto.randomUUID();
    await state.act(
      () => schoolOperationsApi.issue({ ...draft, requestId: request.current }),
      () => {
        request.current = "";
        setDraft({
          requestId: "",
          bookId: "",
          memberId: "",
          issuedOn: "",
          dueOn: "",
          note: "",
        });
      },
    );
  }
  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title={title}
        subtitle="Saved loans, availability and explicit returns"
      />
      <Messages {...state} reload={state.load} disabled={state.saving} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <AdminCard className="p-8 lg:col-span-4">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void issue();
            }}
          >
            <fieldset
              disabled={!state.ready || state.saving}
              className="space-y-5"
            >
              <Label>Book *</Label>
              <OperationChoice
                resource="books"
                value={draft.bookId || null}
                onChange={(bookId) => change({ bookId: bookId ?? "" })}
                disabled={!state.ready || state.saving}
              />
              <Label>Member *</Label>
              <OperationChoice
                resource="members"
                value={draft.memberId || null}
                onChange={(memberId) => change({ memberId: memberId ?? "" })}
                disabled={!state.ready || state.saving}
              />
              <Label htmlFor="loan-issued">Issue Date *</Label>
              <Input
                id="loan-issued"
                required
                type="date"
                value={draft.issuedOn}
                onChange={(event) => change({ issuedOn: event.target.value })}
              />
              <Label htmlFor="loan-due">Due Date *</Label>
              <Input
                id="loan-due"
                required
                type="date"
                value={draft.dueOn}
                onChange={(event) => change({ dueOn: event.target.value })}
              />
              <Label htmlFor="loan-note">Note</Label>
              <Input
                id="loan-note"
                maxLength={1000}
                value={draft.note}
                onChange={(event) => change({ note: event.target.value })}
              />
              <Button className="w-full py-6" type="submit">
                {state.saving ? "Saving…" : "Issue One Copy"}
              </Button>
            </fieldset>
          </form>
        </AdminCard>
        <div className="lg:col-span-8 space-y-5">
          <Controls
            state={state}
            statuses={["all", "open", "returned", "overdue"]}
          />
          <AdminCard className="p-6 space-y-4">
            <Label htmlFor="return-date">
              Return Date (required to complete a return)
            </Label>
            <Input
              id="return-date"
              type="date"
              value={returnedOn}
              disabled={state.saving}
              onChange={(event) => setReturnedOn(event.target.value)}
            />
            {state.loading ? (
              <p>Loading loans…</p>
            ) : !state.ready ? (
              <p>Loans could not load.</p>
            ) : !state.items.length ? (
              <p>No matching loans.</p>
            ) : (
              state.items.map((row) => (
                <article
                  key={row.id}
                  className="border-b border-gray-200 pb-4 space-y-2"
                >
                  <h2 className="font-semibold">
                    {row.bookTitle} · {row.memberCode}
                  </h2>
                  <p className="text-sm">
                    Issued {row.issuedOn} · Due {row.dueOn} ·{" "}
                    {row.returnedOn
                      ? "Returned " + row.returnedOn
                      : "Outstanding"}
                  </p>
                  <p className="text-sm">{row.note}</p>
                  {!row.returnedOn && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={state.saving || !returnedOn}
                      onClick={() =>
                        void state.act(() =>
                          schoolOperationsApi.returnLoan(
                            row.id,
                            returnedOn,
                            row.version,
                          ),
                        )
                      }
                    >
                      Record Return
                    </Button>
                  )}
                </article>
              ))
            )}
            <Pagination state={state} />
          </AdminCard>
        </div>
      </div>
      <History resource="loans" />
    </div>
  );
}
export function MovementPanel({
  title,
  initialKind = "receive",
}: {
  title: string;
  initialKind?: MovementInput["kind"];
}) {
  const state = useSchoolOperations("movements", initialKind);
  const empty = (): MovementInput => ({
    requestId: "",
    itemId: "",
    storeId: "",
    kind: initialKind,
    quantity: 1,
    movementOn: "",
    supplierId: null,
    studentId: null,
    staffId: null,
    sourceId: null,
    reference: "",
    note: "",
  });
  const [draft, setDraft] = useState<MovementInput>(empty);
  const request = useRef("");
  function change(patch: Partial<MovementInput>) {
    if (state.saving) return;
    request.current = "";
    setDraft({ ...draft, ...patch, requestId: "" });
  }
  async function save() {
    if (!draft.itemId || !draft.storeId) {
      state.setError("Choose a real item and store.");
      return;
    }
    request.current ||= crypto.randomUUID();
    await state.act(
      () => schoolOperationsApi.move({ ...draft, requestId: request.current }),
      () => {
        request.current = "";
        setDraft(empty());
      },
    );
  }
  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title={title}
        subtitle="Append-only whole-unit stock movements"
      />
      <Messages {...state} reload={state.load} disabled={state.saving} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <AdminCard className="p-8 lg:col-span-4">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <fieldset
              disabled={state.saving || !state.ready}
              className="space-y-5"
            >
              <Label htmlFor="movement-kind">Movement *</Label>
              <select
                id="movement-kind"
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-3"
                value={draft.kind}
                onChange={(event) =>
                  change({
                    kind: event.target.value as MovementInput["kind"],
                    supplierId: null,
                    studentId: null,
                    staffId: null,
                    sourceId: null,
                  })
                }
              >
                {["receive", "issue", "return", "sale"].map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
              <Label>Item *</Label>
              <OperationChoice
                resource="items"
                value={draft.itemId || null}
                onChange={(value) => change({ itemId: value ?? "" })}
                disabled={state.saving || !state.ready}
              />
              <Label>Store *</Label>
              <OperationChoice
                resource="stores"
                value={draft.storeId || null}
                onChange={(value) => change({ storeId: value ?? "" })}
                disabled={state.saving || !state.ready}
              />
              {draft.kind === "receive" && (
                <>
                  <Label>Supplier *</Label>
                  <OperationChoice
                    resource="suppliers"
                    value={draft.supplierId}
                    onChange={(supplierId) => change({ supplierId })}
                    disabled={state.saving || !state.ready}
                  />
                </>
              )}
              {draft.kind === "issue" && (
                <>
                  <Label>
                    Student Recipient (choose exactly one recipient)
                  </Label>
                  <OperationChoice
                    resource="owners/students"
                    value={draft.studentId}
                    onChange={(studentId) =>
                      change({ studentId, staffId: null })
                    }
                    disabled={state.saving || !state.ready}
                  />
                  <Label>Staff Recipient</Label>
                  <OperationChoice
                    resource="owners/staff"
                    value={draft.staffId}
                    onChange={(staffId) => change({ staffId, studentId: null })}
                    disabled={state.saving || !state.ready}
                  />
                </>
              )}
              {draft.kind === "return" && (
                <>
                  <Label>Original Issue *</Label>
                  <OperationChoice
                    resource="movements"
                    value={draft.sourceId}
                    onChange={(sourceId) => change({ sourceId })}
                    disabled={state.saving || !state.ready}
                  />
                  <p className="text-xs text-gray-500">
                    Item and store must match the original issue. Returns cannot
                    exceed its outstanding quantity.
                  </p>
                </>
              )}
              <Label htmlFor="movement-quantity">Whole Quantity *</Label>
              <Input
                id="movement-quantity"
                type="number"
                min={1}
                max={1000000}
                step={1}
                required
                value={draft.quantity}
                onChange={(event) =>
                  change({ quantity: Number(event.target.value) })
                }
              />
              <Label htmlFor="movement-date">Movement Date *</Label>
              <Input
                id="movement-date"
                type="date"
                required
                value={draft.movementOn}
                onChange={(event) => change({ movementOn: event.target.value })}
              />
              <Label htmlFor="movement-ref">
                External Reference {draft.kind === "sale" ? "*" : ""}
              </Label>
              <Input
                id="movement-ref"
                required={draft.kind === "sale"}
                maxLength={160}
                value={draft.reference}
                onChange={(event) => change({ reference: event.target.value })}
              />
              <Label htmlFor="movement-note">Note</Label>
              <Input
                id="movement-note"
                maxLength={1000}
                value={draft.note}
                onChange={(event) => change({ note: event.target.value })}
              />
              <Button type="submit" className="w-full py-6">
                {state.saving ? "Saving…" : "Record Movement"}
              </Button>
            </fieldset>
          </form>
          <p className="mt-4 text-xs text-gray-500">
            Sales record physical stock and an external reference. Financial
            invoices and ledger posting are handled separately.
          </p>
        </AdminCard>
        <div className="lg:col-span-8 space-y-5">
          <Controls
            state={state}
            statuses={["all", "receive", "issue", "return", "sale"]}
          />
          <AdminCard className="p-6 space-y-4">
            {state.loading ? (
              <p>Loading movements…</p>
            ) : !state.ready ? (
              <p>Movements could not load.</p>
            ) : !state.items.length ? (
              <p>No matching movements.</p>
            ) : (
              state.items.map((row) => (
                <article
                  className="border-b border-gray-200 pb-4 space-y-2"
                  key={row.id}
                >
                  <h2 className="font-semibold">
                    {row.itemName} · {row.storeName}
                  </h2>
                  <p className="text-sm">
                    {row.kind} · {row.quantity} · {row.movementOn}
                  </p>
                  <p className="text-sm">
                    {row.reference} · {row.note}
                  </p>
                </article>
              ))
            )}
            <Pagination state={state} />
          </AdminCard>
        </div>
      </div>
      <History resource="movements" />
    </div>
  );
}
export function StockPanel() {
  const state = useSchoolOperations("stock");
  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title="Stock by Store"
        subtitle="Balances derived from saved receipts, issues, returns and sales"
      />
      <Messages {...state} reload={state.load} disabled={state.saving} />
      <Controls state={state} />
      <AdminCard className="p-6 space-y-4">
        {state.loading ? (
          <p>Loading stock…</p>
        ) : !state.ready ? (
          <p>Stock could not load.</p>
        ) : !state.items.length ? (
          <p>No recorded stock movements.</p>
        ) : (
          state.items.map((row) => (
            <article
              key={row.itemId + "-" + row.storeId}
              className="border-b border-gray-200 pb-4"
            >
              <h2>
                {row.itemName} · {row.storeName}
              </h2>
              <p>
                {row.quantity} {row.unit}
              </p>
            </article>
          ))
        )}
        <Pagination state={state} />
      </AdminCard>
    </div>
  );
}
