import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTimezone() {
  const q = useQuery({
    queryKey: ["profile-tz"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("timezone").maybeSingle();
      return (data as any)?.timezone || "Indian/Reunion";
    },
    staleTime: 60_000,
  });
  return q.data || "Indian/Reunion";
}

export function formatInTz(
  input: string | Date | null | undefined,
  tz: string,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
) {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", { ...opts, timeZone: tz }).format(d);
  } catch {
    return d.toLocaleString("fr-FR");
  }
}

export function todayRangeInTz(tz: string): { startISO: string; endISO: string } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  });
  const ymd = fmt.format(now); // YYYY-MM-DD in tz
  // Approximate day start/end in UTC by using the tz offset for that moment.
  const start = new Date(`${ymd}T00:00:00`);
  // Compute the tz offset at 'now' by comparing formatted parts.
  const tzOffsetMinutes = getTzOffsetMinutes(now, tz);
  const startUtc = new Date(start.getTime() - tzOffsetMinutes * 60_000);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startISO: startUtc.toISOString(), endISO: endUtc.toISOString() };
}

function getTzOffsetMinutes(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second),
  );
  return (asUTC - date.getTime()) / 60_000;
}
