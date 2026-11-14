"use client";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { useWeekends } from "@/lib/use-weekends";
import { FoundationHistory } from "@/components/modules/settings/FoundationHistory";

const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export default function WeekendPage() {
  const state = useWeekends();
  return <div className="space-y-6"><PageHeader title="Weekend" subtitle="Configure and manage weekend" />
    <AdminCard><div className="p-6 space-y-6">
      {state.error && <p role="alert" className="text-destructive">{state.error}</p>}
      {state.notice && <p role="status" className="text-green-700">{state.notice}</p>}
      {state.loading ? <p>Loading weekend settings…</p> : state.ready && <p>{state.version === 0 ? "Weekends have not been configured. Select the school’s weekend days and save." : "Select the school’s weekend days. Leave all days unchecked for a seven-day school week."}</p>}
      <form onSubmit={event => { event.preventDefault(); void state.save(); }} className="space-y-6"><fieldset disabled={!state.ready || state.saving} className="flex flex-wrap gap-6"><legend className="mb-4 font-semibold">Weekend days</legend>{names.map((name, day) => <label key={day} className="flex gap-2 items-center"><input type="checkbox" checked={state.days.includes(day)} onChange={event => state.setDays(event.target.checked ? [...state.days, day] : state.days.filter(value => value !== day))} />{name}</label>)}</fieldset><div className="flex gap-3"><Button type="submit" disabled={!state.ready || state.saving}>{state.saving ? "Saving…" : "Save Changes"}</Button><Button type="button" variant="outline" disabled={state.saving} onClick={() => void state.reload()}>Reload</Button></div></form>
    </div></AdminCard><FoundationHistory />
  </div>;
}
