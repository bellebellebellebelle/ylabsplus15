import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getInstructions } from "@/planagenda/lib/planning.functions";

export const COMMON_TIMEZONES = [
  { id: "Indian/Reunion", label: "🇷🇪 Réunion (Indian/Reunion, UTC+4)" },
  { id: "Europe/Paris", label: "🇫🇷 Paris (Europe/Paris)" },
  { id: "Europe/London", label: "🇬🇧 Londres (Europe/London)" },
  { id: "America/New_York", label: "🇺🇸 New York" },
  { id: "America/Los_Angeles", label: "🇺🇸 Los Angeles" },
  { id: "Asia/Tokyo", label: "🇯🇵 Tokyo" },
  { id: "Asia/Dubai", label: "🇦🇪 Dubai" },
  { id: "Africa/Nairobi", label: "🌍 Nairobi" },
  { id: "Australia/Sydney", label: "🇦🇺 Sydney" },
  { id: "UTC", label: "UTC" },
];

/** Read the timezone from the user's agent instructions (defaults to Indian/Reunion). */
export function useTimezone(): string {
  const get = useServerFn(getInstructions);
  const { data } = useQuery({
    queryKey: ["instructions"],
    queryFn: () => get(),
    staleTime: 5 * 60_000,
  });
  return (data as { timezone?: string } | null)?.timezone || "Indian/Reunion";
}

const DTF_CACHE = new Map<string, Intl.DateTimeFormat>();
/** Cached Intl formatter: creating Intl.DateTimeFormat is expensive, reuse per (locale, options). */
export function getDtf(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const k = locale + JSON.stringify(opts);
  let f = DTF_CACHE.get(k);
  if (!f) { f = new Intl.DateTimeFormat(locale, opts); DTF_CACHE.set(k, f); }
  return f;
}
const dayKey = (d: Date, tz: string) => getDtf("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** Format a UTC ISO string as a wall clock in the given timezone. */
export function formatInTz(iso: string | null | undefined, tz: string, opts?: Intl.DateTimeFormatOptions): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("fr-FR", { timeZone: tz, ...opts });
}

/** Convert a UTC ISO string to the "YYYY-MM-DDTHH:mm" string suitable for <input type="datetime-local"> in tz. */
export function utcToZonedInput(iso: string | null | undefined, tz: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = getDtf("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Compute the offset in ms of a timezone at a given UTC instant. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const dtf = getDtf("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUTC - utcMs;
}

/** Convert a "YYYY-MM-DDTHH:mm" wall clock in tz to a UTC ISO string. */
export function zonedInputToUtcISO(input: string, tz: string): string | null {
  if (!input) return null;
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, hh, mm] = m;
  const guess = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm));
  const offset = tzOffsetMs(guess, tz);
  return new Date(guess - offset).toISOString();
}

/** Return true if the UTC ISO falls on "today" in the given timezone. */
export function isTodayInTz(iso: string | null | undefined, tz: string): boolean {
  if (!iso) return false;
  return sameDayInTz(iso, new Date().toISOString(), tz);
}

export function sameDayInTz(a: string, b: string, tz: string): boolean {
  const key = (iso: string) => dayKey(new Date(iso), tz);
  return key(a) === key(b);
}

/** Returns diff in whole days between iso date and "today", computed in tz. */
export function dayDiffInTz(iso: string | null | undefined, tz: string): number | null {
  if (!iso) return null;
  const key = (d: Date) => dayKey(d, tz);
  const target = key(new Date(iso));
  const today = key(new Date());
  const [ty, tm, td] = target.split("-").map(Number);
  const [oy, om, od] = today.split("-").map(Number);
  const targetUTC = Date.UTC(ty, tm - 1, td);
  const todayUTC = Date.UTC(oy, om - 1, od);
  return Math.round((targetUTC - todayUTC) / 86400_000);
}
