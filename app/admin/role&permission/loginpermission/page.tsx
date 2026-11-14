"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoginPermissions } from "@/lib/use-login-permissions";

export default function LoginPermissionPage() {
  const access = useLoginPermissions();
  const { data, loading, saving } = access;
  const [pending, setPending] = React.useState<(typeof data.items)[number] | null>(null);
  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Login Permissions"
        subtitle="Manage user login access"
      />
      {access.error && <p role="alert" className="bg-red-50 text-red-700 p-4 rounded-xl">{access.error}</p>}
      {access.notice && <p role="status" className="bg-emerald-50 text-emerald-700 p-4 rounded-xl">{access.notice}</p>}
      <AdminCard className="p-6">
        <form className="flex gap-3 mb-6" onSubmit={event => { event.preventDefault(); setPending(null); void access.load(1, access.search); }}>
          <Input aria-label="Search accounts" placeholder="Search name, email or role" value={access.search} maxLength={150} onChange={event => access.setSearch(event.target.value)} />
          <Button type="submit" disabled={loading || !!saving}>Search</Button>
          <Button type="button" variant="secondary" disabled={loading || !!saving} onClick={() => void access.load(data.page)}>Retry</Button>
        </form>
        <p className="text-sm text-gray-500 mb-4">Disabling access ends current sessions and blocks new sign-ins. You cannot disable your own account.</p>
        {pending && <div role="alert" className="border border-amber-200 bg-amber-50 p-4 rounded-xl mb-4 space-y-3">
          <p>Disable login access for {pending.name} ({pending.email})?</p>
          <div className="flex gap-3">
            <Button disabled={!!saving} onClick={async () => { await access.toggle(pending); setPending(null); }}>Disable access</Button>
            <Button variant="secondary" disabled={!!saving} onClick={() => setPending(null)}>Cancel</Button>
          </div>
        </div>}
        <div className="overflow-x-auto">
          {loading ? <p className="py-10 text-center">Loading accounts…</p> : <table className="w-full text-sm text-left">
            <thead><tr className="border-b"><th className="p-3">Account</th><th className="p-3">Role</th><th className="p-3">Login access</th><th className="p-3">Action</th></tr></thead>
            <tbody>{data.items.map(user => <tr key={user.id} className="border-b border-gray-100">
              <td className="p-3"><p className="font-semibold">{user.name}</p><p className="text-gray-500">{user.email}</p></td>
              <td className="p-3 capitalize">{user.role}</td>
              <td className="p-3">{user.loginEnabled ? "Enabled" : "Disabled"}</td>
              <td className="p-3"><Button size="sm" variant="secondary" disabled={!!saving} onClick={() => user.loginEnabled ? setPending(user) : void access.toggle(user)}>{saving === user.id ? "Saving…" : user.loginEnabled ? "Disable" : "Enable"}</Button></td>
            </tr>)}</tbody>
          </table>}
          {!loading && !data.items.length && !access.error && <p className="py-10 text-center text-gray-500">No matching accounts.</p>}
        </div>
        <div className="flex items-center justify-between gap-4 mt-6">
          <span className="text-sm text-gray-500">{data.total} accounts · Page {data.page}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={loading || !!saving || data.page <= 1} onClick={() => void access.load(data.page - 1)}>Previous</Button>
            <Button size="sm" variant="secondary" disabled={loading || !!saving || data.page * data.pageSize >= data.total} onClick={() => void access.load(data.page + 1)}>Next</Button>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
