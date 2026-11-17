// Date helpers. All dates are "YYYY-MM-DD" strings handled in UTC to avoid
// daylight-saving surprises.
import type { ISODate } from "./types";

const DAY = 86400000;

export function toISO(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function todayISO(): ISODate {
  const now = new Date();
  // local calendar date, not UTC date
  const local = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return toISO(local);
}

export function parseISO(s: ISODate): number {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function isValidISO(s: string | undefined | null): s is ISODate {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = parseISO(s);
  return !Number.isNaN(t) && toISO(new Date(t)) === s;
}

export function addDays(s: ISODate, n: number): ISODate {
  return toISO(new Date(parseISO(s) + n * DAY));
}

export function diffDays(a: ISODate, b: ISODate): number {
  // a - b in whole days
  return Math.round((parseISO(a) - parseISO(b)) / DAY);
}

/** 0 = Monday … 6 = Sunday */
export function weekdayMon0(s: ISODate): number {
  const d = new Date(parseISO(s)).getUTCDay(); // 0 = Sunday
  return (d + 6) % 7;
}

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function dayShort(s: ISODate) {
  return DAY_SHORT[weekdayMon0(s)];
}
export function dayLong(s: ISODate) {
  return DAY_LONG[weekdayMon0(s)];
}
export function fmtShort(s: ISODate) {
  const d = new Date(parseISO(s));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
export function fmtLong(s: ISODate) {
  const d = new Date(parseISO(s));
  return `${DAY_LONG[weekdayMon0(s)]} ${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]}`;
}
export function fmtDayMonth(s: ISODate) {
  const d = new Date(parseISO(s));
  return `${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]}`;
}
export function dayNum(s: ISODate) {
  return new Date(parseISO(s)).getUTCDate();
}
/** Monday of the week containing s */
export function weekStart(s: ISODate): ISODate {
  return addDays(s, -weekdayMon0(s));
}
export const WEEKDAY_NAMES = DAY_LONG;
export const WEEKDAY_SHORT = DAY_SHORT;
