"use client";

import { Input as LmsInput } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { ModuleEditor } from "@/components/common/ModuleEditor";
import { PageHeader } from "@/components/common/PageHeader";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Button } from "@/components/ui/button";
import { SchoolCurrencyField } from "@/components/modules/settings/SchoolCurrencyField";
import { useFinanceSettings } from "@/lib/use-finance-settings";
import {
  financeApi,
  FinanceError,
  formatMinor,
  type FinanceChoice,
  type FinanceInput,
  type FinancePage,
  type FinanceReport,
  type FinanceResource,
  type FinanceRow,
} from "@/lib/finance-client";
const field = "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm";
type Spec = {
  key: string;
  label: string;
  choice?: FinanceChoice;
  type?: string;
  values?: string[];
};
const money = (key: string, label: string): Spec => ({
  key,
  label,
  type: "amount",
});
const choice = (key: string, label: string, kind: FinanceChoice): Spec => ({
  key,
  label,
  choice: kind,
});
const booking: Spec[] = [
  { key: "bookingDate", label: "Posting date", type: "date" },
  { key: "memo", label: "Memo", type: "optional" },
];
const specs: Record<string, Spec[]> = {
  groups: [{ key: "name", label: "Group name" }],
  types: [
    { key: "name", label: "Fee name" },
    choice("groupId", "Fee group", "groups"),
    money("amount", "Fee amount"),
  ],
  accounts: [
    { key: "name", label: "Account name" },
    { key: "code", label: "Account code" },
    {
      key: "kind",
      label: "Classification",
      values: ["asset", "liability", "equity", "income", "expense"],
    },
    { key: "isBank", label: "Bank / cash account", type: "checkbox" },
  ],
  invoices: [
    choice("studentId", "Student", "students"),
    choice("feeTypeId", "Fee type", "types"),
    { key: "title", label: "Invoice title" },
    choice("receivableId", "Receivable asset account", "accounts"),
    choice("revenueId", "Fee income account", "accounts"),
    ...booking,
    { key: "dueDate", label: "Due date", type: "date" },
    money("waiver", "Waiver"),
    money("fine", "Fine"),
  ],
  payments: [
    choice("invoiceId", "Invoice", "invoices"),
    { key: "method", label: "Payment method", values: ["bank", "wallet"] },
    choice("accountId", "Bank / cash or wallet liability account", "accounts"),
    money("amount", "Payment amount"),
    ...booking,
    { key: "reference", label: "Receipt reference", type: "optional" },
  ],
  journals: [
    choice("debitId", "Debit account", "accounts"),
    choice("creditId", "Credit account", "accounts"),
    money("amount", "Amount"),
    ...booking,
  ],
  payroll: [
    choice("staffId", "Staff", "staff"),
    { key: "period", label: "Payroll period", type: "month" },
    money("gross", "Gross salary"),
    money("deduction", "Deduction"),
    choice("expenseId", "Payroll expense account", "accounts"),
    choice("payableId", "Salary payable liability account", "accounts"),
    ...booking,
  ],
  "wallet-requests": [
    choice("studentId", "Student", "students"),
    { key: "kind", label: "Request type", values: ["deposit", "refund"] },
    choice("liabilityId", "Wallet liability account", "accounts"),
    choice("bankId", "Bank / cash account", "accounts"),
    money("amount", "Amount"),
    ...booking,
    { key: "reference", label: "Reference", type: "optional" },
  ],
  pay: [
    choice("bankId", "Pay from bank / cash account", "accounts"),
    ...booking,
  ],
  decision: [
    { key: "status", label: "Decision", values: ["approved", "rejected"] },
    { key: "note", label: "Decision reason" },
  ],
};
const columns: Record<string, string[]> = {
  groups: ["name", "archived"],
  types: ["name", "amount", "archived"],
  accounts: ["code", "name", "kind", "is_bank", "balance", "archived"],
  invoices: [
    "title",
    "student_name",
    "gross",
    "waiver",
    "fine",
    "amount",
    "paid",
    "due_date",
  ],
  payments: ["invoice_id", "amount", "payment_date", "method", "reference"],
  journals: ["kind", "booking_date", "amount", "memo"],
  payroll: [
    "staff_name",
    "period",
    "gross",
    "deduction",
    "amount",
    "status",
    "paid_date",
  ],
  "wallet-requests": [
    "student_id",
    "kind",
    "amount",
    "booking_date",
    "status",
    "reference",
  ],
  "wallet-movements": ["student_id", "liability_id", "amount", "created_at"],
  "trial-balance": ["code", "name", "kind", "debit", "credit", "balance"],
  "profit-loss": ["code", "name", "kind", "debit", "credit", "balance"],
  dues: ["title", "student_name", "amount", "due", "due_date"],
  wallet: ["student_name", "liability_id", "balance"],
  history: ["resource", "record_id", "version", "actor_id", "created_at"],
};
const moneyColumns = [
  "amount",
  "gross",
  "waiver",
  "fine",
  "paid",
  "deduction",
  "debit",
  "credit",
  "balance",
  "due",
];
const label = (key: string) =>
  key.replaceAll("_", " ").replace(/\b\w/g, (s) => s.toUpperCase());
function Pager({
  page,
  total,
  change,
  disabled = false,
}: {
  page: number;
  total: number;
  change: (p: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || page === 1}
        onClick={() => change(page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {page} · {total} records
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || page * 20 >= total}
        onClick={() => change(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
function Choice({
  kind,
  value,
  onChange,
  disabled,
}: {
  kind: FinanceChoice;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [data, setData] = useState<{
      items: { id: string; label: string }[];
      total: number;
    }>({ items: [], total: 0 });
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      try {
        const next = await financeApi.options(kind, page, search);
        if (active) setData(next);
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Unable to load choices");
          setData({ items: [], total: 0 });
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [kind, page, search, retry]);
  return (
    <div className="space-y-2">
      <input
        aria-label={"Search " + kind}
        className={field}
        value={search}
        disabled={disabled}
        placeholder="Search choices"
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <select
        required
        className={field}
        value={value}
        disabled={disabled || loading || !!error}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose a record</option>
        {value && !data.items.some((r) => r.id === value) && (
          <option value={value}>Selected: {value}</option>
        )}
        {data.items.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert">
          {error}{" "}
          <button type="button" onClick={() => setRetry((v) => v + 1)}>
            Retry choices
          </button>
        </p>
      )}
      <Pager
        page={page}
        total={data.total}
        change={setPage}
        disabled={disabled || loading}
      />
    </div>
  );
}
type Draft = {
  input: FinanceInput;
  id?: string;
  operation: string;
  target?: FinanceResource;
};
function blank(operation: string, kind?: string): Draft {
  return {
    operation,
    input: {
      version: 0,
      requestId: crypto.randomUUID(),
      name: "",
      archived: false,
      amount: "",
      waiver: "0",
      fine: "0",
      deduction: "0",
      memo: "",
      reference: "",
      isBank: false,
      kind: kind ?? "asset",
      method: "bank",
      status: "approved",
      note: "",
    },
  };
}
export function FinanceSettings() {
  const settings = useFinanceSettings();
  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title="Fees and Invoice Settings"
        subtitle="Configure the currency used for school finance"
      />
      <AdminCard className="p-6">
        <form
          className="max-w-md space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void settings.save();
          }}
        >
          <SchoolCurrencyField value={settings.currency} onChange={settings.setCurrency} disabled={settings.saving || !settings.ready} />
          {settings.error && <p role="alert">{settings.error}</p>}
          {settings.notice && <p role="status">{settings.notice}</p>}
          <Button disabled={settings.saving || !settings.ready || !settings.currency}>Save currency</Button>
          <Button
            type="button"
            variant="outline"
            disabled={settings.saving}
            onClick={settings.reload}
          >
            Reload
          </Button>
        </form>
      </AdminCard>
    </div>
  );
}
export default function FinancePanel({
  title,
  resource = "invoices",
  report,
  kind,
  status,
  readOnly = false,
  bankOnly = false,
}: {
  title: string;
  resource?: FinanceResource;
  report?: FinanceReport;
  kind?: string;
  status?: string;
  readOnly?: boolean;
  bankOnly?: boolean;
}) {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [reload, setReload] = useState(0),
    [data, setData] = useState<FinancePage>({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      currency: null,
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [saveError, setSaveError] = useState(""),
    [notice, setNotice] = useState(""),
    [gate, setGate] = useState(false),
    [draft, setDraft] = useState<Draft | null>(null),
    [busy, setBusy] = useState(false);
  const lock = useRef(false),
    refresh = () => setReload((v) => v + 1);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      const query: Record<string, string> = {
        page: String(page),
        pageSize: "20",
        search,
        ...(kind ? { kind } : {}),
        ...(status ? { status } : {}),
        ...(bankOnly ? { bank: "true" } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      };
      try {
        const next = await (report
          ? financeApi.report(report, query)
          : financeApi.list(resource, query));
        if (active) {
          setData(next);
          setGate(false);
        }
      } catch (e) {
        if (active) {
          setData({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            currency: null,
          });
          setError(e instanceof Error ? e.message : "Unable to load finance");
          setGate(e instanceof FinanceError && e.status === 503);
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [
    resource,
    report,
    page,
    search,
    from,
    to,
    kind,
    status,
    bankOnly,
    reload,
  ]);
  const mutable = !readOnly && !report && !!specs[resource],
    catalog = ["groups", "types", "accounts"].includes(resource),
    disabled = !!draft || busy;
  const start = (next: Draft) => {
    setDraft(next);
    setSaveError("");
    setNotice("");
  };
  const edit = (row: FinanceRow) => {
    const input: FinanceInput = {
      name: String(row.name),
      version: Number(row.version),
      archived: !!row.archived,
    };
    if (resource === "types")
      Object.assign(input, {
        groupId: String(row.group_id),
        amount: formatMinor(row.amount),
      });
    if (resource === "accounts")
      Object.assign(input, {
        code: String(row.code),
        kind: String(row.kind),
        isBank: !!row.is_bank,
      });
    start({ operation: resource, id: row.id, input });
  };
  const keys = columns[report ?? resource] ?? ["id", "amount", "status"];
  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title={title}
        subtitle="School financial records"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading || disabled || !!error}
              onClick={() => window.print()}
            >
              Print current page
            </Button>
            {mutable && (
              <Button
                type="button"
                disabled={loading || gate || disabled || !!error}
                onClick={() => {
                  const next = blank(
                    resource,
                    kind ??
                      (resource === "wallet-requests" ? "deposit" : undefined),
                  );
                  if (bankOnly) next.input.isBank = true;
                  start(next);
                }}
              >
                New{" "}
                {resource === "journals"
                  ? (kind ?? "transaction")
                  : resource.replaceAll("-", " ")}
              </Button>
            )}
          </div>
        }
      />
      <AdminCard className="p-6 space-y-4">
        <p className="text-sm text-gray-500">
          Currency: {data.currency ?? "configure in Fees Settings"}. Posted
          amounts use two decimal places.
        </p>
        {data.basis && <p>{data.basis}</p>}
        <fieldset disabled={disabled} className="flex flex-wrap items-end gap-3">
          <input
            aria-label="Search financial records"
            hidden={!!report}
            className={field + " max-w-sm"}
            placeholder="Search records"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <label>
            From
            <LmsInput
              className={field}
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            To
            <LmsInput
              className={field}
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <Button type="button" variant="outline" onClick={refresh}>
            Refresh
          </Button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {loading ? (
          <p role="status">Loading financial records…</p>
        ) : (
          <div role="region" aria-label="Scrollable records" tabIndex={0} className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {keys.map((k) => (
                    <th key={k} scope="col" data-numeric={moneyColumns.includes(k)} className="p-3 text-left">
                      {label(k)}
                    </th>
                  ))}
                  {mutable && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.items.map((row, index) => (
                  <tr
                    key={
                      row.id ??
                      String(row.student_id) + String(row.liability_id) + index
                    }
                    className="border-t"
                  >
                    {keys.map((k) => (
                      <td key={k} data-numeric={moneyColumns.includes(k)} className="p-3">
                        {moneyColumns.includes(k)
                          ? formatMinor(row[k])
                          : typeof row[k] === "boolean"
                            ? row[k]
                              ? "Yes"
                              : "No"
                            : String(row[k] ?? "—")}
                      </td>
                    ))}
                    {mutable && (
                      <td className="p-3">
                        {catalog && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={disabled || gate}
                            onClick={() => edit(row)}
                          >
                            Edit
                          </Button>
                        )}
                        {resource === "invoices" &&
                          BigInt(String(row.amount)) >
                            BigInt(String(row.paid ?? "0")) && (
                            <Button
                              type="button"
                              disabled={disabled || gate}
                              onClick={() => {
                                const d = blank("payments");
                                d.input.invoiceId = row.id;
                                start(d);
                              }}
                            >
                              Record payment
                            </Button>
                          )}
                        {resource === "payroll" &&
                          row.status === "generated" && (
                            <Button
                              type="button"
                              disabled={disabled || gate}
                              onClick={() => {
                                const d = blank("pay");
                                d.id = row.id;
                                d.target = "payroll";
                                d.input.version = Number(row.version);
                                start(d);
                              }}
                            >
                              Record salary payment
                            </Button>
                          )}
                        {resource === "wallet-requests" &&
                          row.status === "pending" && (
                            <Button
                              type="button"
                              disabled={disabled || gate}
                              onClick={() =>
                                start({
                                  operation: "decision",
                                  id: row.id,
                                  target: "wallet-requests",
                                  input: {
                                    version: Number(row.version),
                                    status: "approved",
                                    note: "",
                                  },
                                })
                              }
                            >
                              Review request
                            </Button>
                          )}
                      </td>
                    )}
                  </tr>
                ))}
                {!data.items.length && !error && (
                  <tr>
                    <td colSpan={keys.length + (mutable ? 1 : 0)} className="p-6 text-center">
                      No financial records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pager
          page={page}
          total={data.total}
          change={setPage}
          disabled={disabled || loading}
        />
      </AdminCard>
      {draft && (
        <ModuleEditor label="Record editor">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (lock.current || gate) return;
              lock.current = true;
              setBusy(true);
              setSaveError("");
              try {
                if (draft.operation === "pay" || draft.operation === "decision")
                  await financeApi.action(
                    draft.target as "payroll" | "wallet-requests",
                    draft.id!,
                    draft.operation,
                    draft.input,
                  );
                else
                  await financeApi.save(
                    draft.operation as FinanceResource,
                    draft.input,
                    draft.id,
                  );
                setDraft(null);
                setNotice("Financial record saved");
                refresh();
              } catch (e) {
                setSaveError(
                  e instanceof Error
                    ? e.message
                    : "Unable to save financial record",
                );
              } finally {
                lock.current = false;
                setBusy(false);
              }
            }}
          >
            <h2 className="text-lg font-semibold">
              {draft.id ? "Update" : "New"}{" "}
              {draft.operation.replaceAll("-", " ")}
            </h2>
            <fieldset
              disabled={busy}
              className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {(specs[draft.operation] ?? []).map((spec) => (
                <label key={spec.key} className="block space-y-2">
                  <span>{spec.label}</span>
                  {spec.choice ? (
                    <Choice
                      kind={spec.choice}
                      value={String(draft.input[spec.key] ?? "")}
                      disabled={
                        busy ||
                        (draft.operation === "payments" &&
                          resource === "invoices" &&
                          spec.key === "invoiceId")
                      }
                      onChange={(value) =>
                        setDraft({
                          ...draft,
                          input: { ...draft.input, [spec.key]: value },
                        })
                      }
                    />
                  ) : spec.values ? (
                    <select
                      className={field}
                      required
                      value={String(draft.input[spec.key] ?? "")}
                      disabled={!!draft.id && catalog && spec.key === "kind"}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          input: { ...draft.input, [spec.key]: e.target.value },
                        })
                      }
                    >
                      <option value="">Choose</option>
                      {spec.values.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  ) : spec.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={!!draft.input[spec.key]}
                      disabled={!!draft.id && catalog}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          input: {
                            ...draft.input,
                            [spec.key]: e.target.checked,
                          },
                        })
                      }
                    />
                  ) : (
                    <LmsInput
                      className={field}
                      required={spec.type !== "optional"}
                      type={
                        ["date", "month"].includes(spec.type ?? "")
                          ? spec.type
                          : "text"
                      }
                      inputMode={spec.type === "amount" ? "decimal" : undefined}
                      pattern={
                        spec.type === "amount"
                          ? "(0|[1-9][0-9]{0,9})(\\.[0-9]{1,2})?"
                          : undefined
                      }
                      maxLength={
                        spec.key === "memo"
                          ? 1000
                          : spec.key === "code"
                            ? 30
                            : 200
                      }
                      readOnly={!!draft.id && catalog && spec.key === "code"}
                      value={String(draft.input[spec.key] ?? "")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          input: { ...draft.input, [spec.key]: e.target.value },
                        })
                      }
                    />
                  )}
                </label>
              ))}
              {catalog && draft.id && (
                <label>
                  <input
                    type="checkbox"
                    checked={!!draft.input.archived}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        input: { ...draft.input, archived: e.target.checked },
                      })
                    }
                  />{" "}
                  Archived
                </label>
              )}
            </fieldset>
            {draft.operation === "journals" && (
              <p>
                {kind === "income"
                  ? "Debit a bank/cash asset and credit an income account."
                  : kind === "expense"
                    ? "Debit an expense account and credit a bank/cash asset."
                    : "Debit the receiving bank/cash account and credit the sending bank/cash account."}
              </p>
            )}
            {saveError && (
              <p role="alert">
                {saveError} Your draft is retained. Reload the list after
                discarding if a version changed.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={busy || gate}>
                {busy ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setDraft(null);
                  setSaveError("");
                }}
              >
                Discard draft
              </Button>
            </div>
          </form>
        </ModuleEditor>
      )}
    </div>
  );
}
