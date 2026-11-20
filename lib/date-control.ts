export type DateControlType = "date" | "datetime-local" | "month" | "time";
export const dateControlTypes = new Set<string>(["date", "datetime-local", "month", "time"]);

export function calendarDate(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function calendarDays(year: number, month: number): (string | null)[] {
  const first = new Date(`${calendarDate(year, month, 1)}T12:00:00`);
  const last = new Date(first);
  last.setMonth(month + 1, 0);
  return Array.from({ length: Math.ceil((first.getDay() + last.getDate()) / 7) * 7 }, (_, index) => {
    const day = index - first.getDay() + 1;
    return day > 0 && day <= last.getDate() ? calendarDate(year, month, day) : null;
  });
}

export function temporalFormat(type: DateControlType) {
  return type === "time" ? "HH:mm" : type === "month" ? "YYYY-MM" : type === "datetime-local" ? "YYYY-MM-DDTHH:mm" : "YYYY-MM-DD";
}

export function dateInRange(date: string, min?: string | number, max?: string | number) {
  return (!min || date >= String(min).slice(0, 10)) && (!max || date <= String(max).slice(0, 10));
}
