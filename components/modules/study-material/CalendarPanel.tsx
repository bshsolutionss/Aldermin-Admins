"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  schoolContentApi,
  type SchoolCalendar,
} from "@/lib/school-content-client";
export function CalendarPanel() {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [data, setData] = useState<SchoolCalendar | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const sequence = useRef(0);
  const invalidate = useCallback(() => {
    ++sequence.current;
  }, []);
  useEffect(() => {
    let active = true;
    void schoolContentApi
      .options()
      .then((options) => {
        if (active && options.today) {
          setFrom(options.today);
          setTo(options.today);
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : "Unable to load school dates",
          );
      });
    return () => {
      active = false;
      invalidate();
    };
  }, [invalidate]);
  async function load() {
    const token = ++sequence.current;
    setBusy(true);
    setError("");
    setData(null);
    try {
      const result = await schoolContentApi.calendar(from, to);
      if (token === sequence.current) setData(result);
    } catch (err) {
      if (token === sequence.current)
        setError(
          err instanceof Error ? err.message : "Unable to load calendar",
        );
    } finally {
      if (token === sequence.current) setBusy(false);
    }
  }
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return (
    <div className="container mx-auto space-y-8 pb-10">
      <PageHeader
        title="Calendar"
        subtitle="Published notices, events and the school calendar"
      />
      <AdminCard className="p-6 space-y-6">
        <form
          className="flex flex-wrap gap-4 items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <div>
            <Label htmlFor="calendar-from">From</Label>
            <Input
              id="calendar-from"
              type="date"
              required
              value={from}
              disabled={busy}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="calendar-to">Until</Label>
            <Input
              id="calendar-to"
              type="date"
              required
              value={to}
              disabled={busy}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
          <Button disabled={busy || !from || !to}>
            {busy ? "Loading…" : "Load Calendar"}
          </Button>
        </form>
        <p className="text-sm text-gray-500">
          Choose up to 93 days. Dates follow the school timezone; event times
          below display in your local timezone.
        </p>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {data && (
          <div className="space-y-6">
            <p className="text-sm">
              School timezone: {data.timezone}. Weekends:{" "}
              {data.weekendDays === null
                ? "Not configured"
                : data.weekendDays.length
                  ? data.weekendDays.map((day) => days[day]).join(", ")
                  : "None configured"}
              .
            </p>
            <section className="space-y-3">
              <h2 className="font-semibold">Holidays</h2>
              {data.holidays.length ? (
                data.holidays.map((item) => (
                  <p key={item.id}>
                    {item.name} · {item.startDate} to {item.endDate}
                  </p>
                ))
              ) : (
                <p>No holidays in this window.</p>
              )}
            </section>
            <section className="space-y-3">
              <h2 className="font-semibold">Notices</h2>
              {data.notices.length ? (
                data.notices.map((item) => (
                  <article key={item.id}>
                    <h3>
                      {item.title} · {item.audience}
                    </h3>
                    <p className="text-sm whitespace-pre-wrap">{item.body}</p>
                    <p className="text-xs">
                      {item.startDate} to {item.endDate}
                    </p>
                  </article>
                ))
              ) : (
                <p>No published notices in this window.</p>
              )}
            </section>
            <section className="space-y-3">
              <h2 className="font-semibold">Events</h2>
              {data.events.length ? (
                data.events.map((item) => (
                  <article key={item.id}>
                    <h3>{item.title}</h3>
                    <p className="text-sm">
                      {new Date(item.startsAt).toLocaleString()} to{" "}
                      {new Date(item.endsAt).toLocaleString()} · {item.location}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </article>
                ))
              ) : (
                <p>No published events in this window.</p>
              )}
            </section>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
