"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from "lucide-react";
import { calendarDate, calendarDays, dateInRange, temporalFormat, type DateControlType } from "@/lib/date-control";
import { cn } from "@/lib/utils";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DateInput({ type = "date", className, ref: forwardedRef, onChange, onKeyDown, ...props }: Omit<React.ComponentProps<"input">, "type"> & { type?: DateControlType }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const [view, setView] = React.useState(() => new Date());
  const [uncontrolled, setUncontrolled] = React.useState(String(props.defaultValue ?? ""));
  const value = String(props.value ?? uncontrolled);
  const selectedDate = value.slice(0, 10);
  const time = (type === "time" ? value : value.split("T")[1]) || "00:00";
  const [hour = "00", minute = "00", second = "00"] = time.split(":");
  const seconds = props.step !== undefined && props.step !== "any" && Number(props.step) < 60;

  React.useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    // Keep native ISO, required, range and step validation without opening an OS picker.
    const validation = document.createElement("input");
    validation.type = type;
    validation.required = !!props.required;
    if (props.min !== undefined) validation.min = String(props.min);
    if (props.max !== undefined) validation.max = String(props.max);
    if (props.step !== undefined) validation.step = String(props.step);
    validation.value = value;
    input.setCustomValidity(value && !validation.value
      ? `Enter a valid value in ${temporalFormat(type)} format.`
      : validation.validationMessage);
  }, [value, type, props.required, props.min, props.max, props.step]);

  React.useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    const reset = () => { setUncontrolled(String(props.defaultValue ?? "")); setOpen(false); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [props.defaultValue]);

  React.useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node) && event.target !== inputRef.current) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    };
    const close = () => setOpen(false);
    const scroll = (event: Event) => { if (!panelRef.current?.contains(event.target as Node)) close(); };
    const disabled = new MutationObserver(() => { if (inputRef.current?.matches(":disabled, [readonly]")) close(); });
    if (inputRef.current) disabled.observe(inputRef.current, { attributes: true, attributeFilter: ["disabled", "readonly"] });
    for (let parent = inputRef.current?.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === "FIELDSET") disabled.observe(parent, { attributes: true, attributeFilter: ["disabled"] });
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", scroll, true);
    (panelRef.current?.querySelector<HTMLElement>("[data-selected='true']") || panelRef.current?.querySelector<HTMLElement>("button:not(:disabled), select"))?.focus();
    return () => {
      disabled.disconnect();
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [open]);

  const show = () => {
    const input = inputRef.current;
    if (!input || input.matches(":disabled") || props.readOnly) return;
    if (open) { setOpen(false); return; }
    const rect = input.getBoundingClientRect();
    const initial = new Date(`${selectedDate.length === 10 ? selectedDate : type === "month" && value ? value + "-01" : calendarDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())}T12:00:00`);
    setView(Number.isNaN(initial.getTime()) ? new Date() : initial);
    const height = type === "time" ? 215 : type === "month" ? 260 : type === "datetime-local" ? 475 : 385;
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 312)), top: rect.bottom + height < window.innerHeight ? rect.bottom + 8 : Math.max(8, rect.top - height - 8) });
    setOpen(true);
  };
  const commit = (next: string, close = true) => {
    const input = inputRef.current;
    if (!input || input.matches(":disabled") || props.readOnly) return;
    // Use a genuine input event so existing form handlers and FormData keep working.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    if (close) { setOpen(false); triggerRef.current?.focus(); }
  };
  const chooseDate = (date: string) => commit(type === "datetime-local" ? `${date}T${time}` : date, type !== "datetime-local");
  const chooseTime = (h: string, m: string, s: string) => {
    const next = `${h}:${m}${seconds ? ":" + s : ""}`;
    commit(type === "time" ? next : `${selectedDate.length === 10 ? selectedDate : calendarDate(view.getFullYear(), view.getMonth(), view.getDate())}T${next}`, false);
  };
  const moveMonth = (offset: number) => {
    const next = new Date(view);
    next.setDate(1); next.setMonth(next.getMonth() + offset);
    if (next.getFullYear() >= 1 && next.getFullYear() <= 9999) setView(next);
  };
  const year = view.getFullYear(), month = view.getMonth();

  return <span className="lms-date-field">
    <input {...props} type="text" data-date-type={type} data-slot="input"
      ref={node => { inputRef.current = node; if (typeof forwardedRef === "function") forwardedRef(node); else if (forwardedRef) forwardedRef.current = node; }}
      value={props.value === undefined ? undefined : value} defaultValue={props.value === undefined ? props.defaultValue : undefined}
      className={cn("lms-date-input", className)} placeholder={props.placeholder || temporalFormat(type)} autoComplete={props.autoComplete || "off"}
      onChange={event => { setUncontrolled(event.target.value); onChange?.(event); }}
      onKeyDown={event => { onKeyDown?.(event); if (!event.defaultPrevented && event.altKey && event.key === "ArrowDown") { event.preventDefault(); show(); } }} />
    <button ref={triggerRef} type="button" className="lms-date-trigger" disabled={props.disabled || props.readOnly} aria-label={type === "time" ? "Choose time" : "Choose date"} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={show}>
      {type === "time" ? <Clock3 size={17} /> : <CalendarDays size={17} />}
    </button>
    {open && createPortal(<div ref={panelRef} id={id} role="dialog" aria-label={type === "time" ? "Choose time" : "Choose date"} className="lms-calendar" style={{ ...position, maxHeight: `calc(100dvh - ${position.top + 8}px)` }}
      onKeyDown={event => { if (event.key === "Tab") { const targets = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), select, input") ?? []); const index = targets.indexOf(document.activeElement as HTMLElement); if (event.shiftKey && index === 0 || !event.shiftKey && index === targets.length - 1) { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); } } }}>
      <div className="lms-calendar-heading"><span>{type === "time" ? "Select time" : "Select date"}</span><button type="button" aria-label="Close picker" onClick={() => { setOpen(false); triggerRef.current?.focus(); }}><X size={16} /></button></div>
      {type !== "time" && <>
        <div className="lms-calendar-navigation">
          <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={17} /></button>
          <select aria-label="Month" value={month} onChange={event => { const next = new Date(view); next.setDate(1); next.setMonth(Number(event.target.value)); setView(next); }}>{months.map((name, index) => <option key={name} value={index}>{name}</option>)}</select>
          <input aria-label="Year" type="number" min={1} max={9999} value={year} onChange={event => { const nextYear = Number(event.target.value); if (nextYear >= 1 && nextYear <= 9999) { const next = new Date(view); next.setDate(1); next.setFullYear(nextYear); setView(next); } }} />
          <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={17} /></button>
        </div>
        {type === "month" ? <div className="lms-month-grid">{months.map((name, index) => { const next = calendarDate(year, index, 1).slice(0, 7); return <button type="button" key={name} disabled={(!!props.min && next < String(props.min)) || (!!props.max && next > String(props.max))} data-selected={value === next} onClick={() => commit(next)}>{name.slice(0, 3)}</button>; })}</div> : <>
          <div className="lms-calendar-grid" aria-hidden="true">{weekdays.map(day => <span key={day} className="lms-weekday">{day}</span>)}</div>
          <div className="lms-calendar-grid" aria-label={`${months[month]} ${year}`}>
            {calendarDays(year, month).map((date, index) => date ? <button key={date} type="button" aria-label={date} aria-pressed={selectedDate === date} data-selected={selectedDate === date} disabled={!dateInRange(date, props.min, props.max)} onClick={() => chooseDate(date)}>{Number(date.slice(-2))}</button> : <span key={`blank-${index}`} />)}
          </div>
        </>}
      </>}
      {(type === "time" || type === "datetime-local") && <div className="lms-calendar-time"><Clock3 size={16} aria-hidden="true" /><select aria-label="Hour" value={hour} onChange={event => chooseTime(event.target.value, minute, second)}>{Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(v => <option key={v}>{v}</option>)}</select><span>:</span><select aria-label="Minute" value={minute} onChange={event => chooseTime(hour, event.target.value, second)}>{Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(v => <option key={v}>{v}</option>)}</select>{seconds && <><span>:</span><select aria-label="Second" value={second} onChange={event => chooseTime(hour, minute, event.target.value)}>{Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(v => <option key={v}>{v}</option>)}</select></>}</div>}
      <div className="lms-calendar-footer"><button type="button" onClick={() => commit("")}>Clear</button><button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }}>Done</button></div>
    </div>, document.body)}
  </span>;
}
