"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { apiService, type AdminPermissionRole, type AdminRoleAccount, type AdminRoleAccounts, type AdminRoleCatalog } from "@/lib/api-service";

export default function ManageRolePage() {
  const [catalog, setCatalog] = useState<AdminRoleCatalog>({ roles: [], catalog: [], resources: {} });
  const [accounts, setAccounts] = useState<AdminRoleAccounts>({ items: [], total: 0, page: 1, pageSize: 25 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<AdminPermissionRole | null>(null);
  const [name, setName] = useState("");
  const [grants, setGrants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<{ account: AdminRoleAccount; roleId: string | null } | null>(null);
  const busy = useRef(false);
  const sequence = useRef(0);

  async function load(page = 1, nextFilter = filter) {
    const token = ++sequence.current;
    setLoading(true); setError(""); setReady(false);
    try {
      const [roles, result] = await Promise.all([apiService.adminRoles.list(), apiService.adminRoles.accounts(nextFilter, page)]);
      if (token === sequence.current) { setCatalog(roles); setAccounts(result); setFilter(nextFilter); setReady(true); }
    } catch (err) {
      if (token === sequence.current) setError(err instanceof Error ? err.message : "Unable to load roles");
    } finally { if (token === sequence.current) setLoading(false); }
  }
  useEffect(() => {
    let cancelled = false;
    const token = ++sequence.current;
    void Promise.all([apiService.adminRoles.list(), apiService.adminRoles.accounts()]).then(([roles, result]) => {
      if (!cancelled && token === sequence.current) { setCatalog(roles); setAccounts(result); setReady(true); }
    }).catch(err => {
      if (!cancelled && token === sequence.current) setError(err instanceof Error ? err.message : "Unable to load roles");
    }).finally(() => { if (!cancelled && token === sequence.current) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function saveRole() {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError(""); setNotice("");
    try {
      if (editing) await apiService.adminRoles.update({ ...editing, name, permissions: grants });
      else await apiService.adminRoles.create(name, grants);
      setEditing(null); setName(""); setGrants([]);
      setNotice("Permission role saved. Assigned admins use these permissions on their next request.");
      await load(accounts.page);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save role"); }
    finally { busy.current = false; setSaving(false); }
  }
  async function assign() {
    if (!pending || busy.current) return;
    busy.current = true; setSaving(true); setError(""); setNotice("");
    try {
      await apiService.adminRoles.assign(pending.account, pending.roleId);
      setPending(null); setNotice("Account permissions saved."); await load(accounts.page);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to assign role"); }
    finally { busy.current = false; setSaving(false); }
  }
  const button = "rounded-lg border px-4 py-2 disabled:opacity-50";
  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      <PageHeader title="Manage Roles" subtitle="Define permissions for admin accounts" />
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-700">{notice}</p>}
      <p className="text-sm text-gray-600">Admins without a permission role have full access. A permission role limits access to the selected domains. Account and security administration require an unrestricted admin.</p>
      <button className={button} disabled={saving || loading || !!pending} onClick={() => void load(accounts.page)}>Reload</button>
      {loading && <p role="status">Loading roles…</p>}
      {ready && <>
        <AdminCard>
          <h2 className="mb-4 font-semibold">{editing ? `Edit ${editing.name}` : "Create permission role"}</h2>
          <form className="space-y-4" onSubmit={event => { event.preventDefault(); void saveRole(); }}>
            <label className="block">Role name<input className="mt-1 block w-full rounded-lg border p-2" required maxLength={80} value={name} disabled={saving} onChange={event => setName(event.target.value)} /></label>
            <fieldset disabled={saving} className="space-y-3"><legend className="mb-2 font-medium">Allowed actions</legend>
              {Object.entries(catalog.resources).map(([key, label]) => <div key={key} className="flex flex-wrap gap-5">
                <span className="w-48">{label}</span>
                {["read", "write"].map(action => <label key={action} className="flex items-center gap-2"><input type="checkbox" checked={grants.includes(`${key}.${action}`)} onChange={event => setGrants(current => event.target.checked ? [...current, `${key}.${action}`] : current.filter(value => value !== `${key}.${action}`))} />{action === "read" ? "View" : "Create, edit and delete"}</label>)}
              </div>)}
            </fieldset>
            <div className="flex gap-3"><button className={button} disabled={saving || !!pending || !name.trim()} type="submit">{saving ? "Saving…" : "Save role"}</button>
              {editing && <button className={button} disabled={saving} type="button" onClick={() => { setEditing(null); setName(""); setGrants([]); }}>Cancel edit</button>}</div>
          </form>
        </AdminCard>
        <AdminCard><h2 className="mb-4 font-semibold">Permission roles</h2>
          {!catalog.roles.length && <p>No permission roles yet.</p>}
          <ul className="space-y-3">{catalog.roles.map(role => <li key={role.id} className="flex items-center justify-between gap-4 border-b pb-3"><span>{role.name} · {role.permissions.length} allowed actions</span><button disabled={saving || !!pending} className={button} onClick={() => { setEditing(role); setName(role.name); setGrants(role.permissions); }}>{`Edit ${role.name}`}</button></li>)}</ul>
        </AdminCard>
        <AdminCard><h2 className="mb-4 font-semibold">Assign admin permissions</h2>
          <form className="mb-4 flex gap-3" onSubmit={event => { event.preventDefault(); void load(1, search); }}><input aria-label="Search admins" className="min-w-0 flex-1 rounded-lg border p-2" maxLength={150} placeholder="Name or email" value={search} disabled={saving || !!pending} onChange={event => setSearch(event.target.value)} /><button className={button} disabled={saving || !!pending}>Search</button></form>
          {pending && <div role="alert" className="mb-4 space-y-3 rounded-lg bg-amber-50 p-4"><p>Change {pending.account.name} to {pending.roleId ? catalog.roles.find(role => role.id === pending.roleId)?.name : "unrestricted admin access"}?</p><button className={button} disabled={saving} onClick={() => void assign()}>Confirm change</button> <button className={button} disabled={saving} onClick={() => setPending(null)}>Cancel</button></div>}
          <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th className="p-3">Admin</th><th className="p-3">Login</th><th className="p-3">Permission role</th></tr></thead><tbody>{accounts.items.map(account => <tr key={account.id} className="border-t"><td className="p-3">{account.name}<span className="block text-sm text-gray-500">{account.email}</span></td><td className="p-3">{account.loginEnabled ? "Enabled" : "Disabled"}</td><td className="p-3"><select className="rounded-lg border p-2" aria-label={`Permission role for ${account.email}`} value={account.roleId ?? ""} disabled={saving || !!pending} onChange={event => setPending({ account, roleId: event.target.value || null })}><option value="">Unrestricted admin</option>{catalog.roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></td></tr>)}</tbody></table></div>
          {!accounts.items.length && <p>No matching admins.</p>}
          <div className="mt-4 flex items-center gap-3"><button className={button} disabled={saving || !!pending || accounts.page <= 1} onClick={() => void load(accounts.page - 1)}>Previous</button><span>Page {accounts.page} · {accounts.total} admins</span><button className={button} disabled={saving || !!pending || accounts.page * accounts.pageSize >= accounts.total} onClick={() => void load(accounts.page + 1)}>Next</button></div>
        </AdminCard>
      </>}
    </div>
  );
}
