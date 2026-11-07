import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PostIt } from "./PostIt";
import { PostItDialog } from "./PostItDialog";
import { sameDayInTz, useTimezone, formatInTz, getDtf } from "@/planagenda/lib/tz";

type Mode = "day" | "week" | "month" | "year";

function startOfWeek(d: Date) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x;
}

function tzDateKey(iso: string, tz: string): string {
  return getDtf("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}
function tzHour(iso: string, tz: string): number {
  return Number(getDtf("en-US", { timeZone: tz, hour: "2-digit", hour12: false }).format(new Date(iso)));
}

export function CalendarView({ items }: { items: Array<Record<string, unknown> & { id: string; start_at?: string; due_at?: string; status?: string; title?: string }> }) {
  const tz = useTimezone();
  const [mode, setMode] = useState<Mode>("week");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  const shift = (dir: number) => {
    const d = new Date(cursor);
    if (mode === "day") d.setDate(d.getDate() + dir);
    if (mode === "week") d.setDate(d.getDate() + dir * 7);
    if (mode === "month") d.setMonth(d.getMonth() + dir);
    if (mode === "year") d.setFullYear(d.getFullYear() + dir);
    setCursor(d);
  };

  // Hide done tasks from calendar
  const visibleItems = useMemo(() => items.filter((i) => i.status !== "done"), [items]);

  const rangeItems = useMemo(() => {
    return visibleItems.filter((i) => {
      const d = i.start_at || i.due_at; if (!d) return false;
      if (mode === "day") return sameDayInTz(d, cursor.toISOString(), tz);
      if (mode === "week") {
        const s = startOfWeek(cursor); const e = new Date(s); e.setDate(e.getDate() + 7);
        const t = new Date(d);
        return t >= s && t < e;
      }
      if (mode === "month") {
        const key = tzDateKey(d, tz); // YYYY-MM-DD
        const [y, m] = key.split("-").map(Number);
        return y === cursor.getFullYear() && m - 1 === cursor.getMonth();
      }
      return new Date(d).getFullYear() === cursor.getFullYear();
    });
  }, [visibleItems, mode, cursor, tz]);

  const title = useMemo(() => {
    if (mode === "day") return cursor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz });
    if (mode === "week") {
      const s = startOfWeek(cursor); const e = new Date(s); e.setDate(e.getDate() + 6);
      return `Semaine du ${s.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} au ${e.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    if (mode === "month") return cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return cursor.getFullYear().toString();
  }, [mode, cursor, tz]);

  return (
    <>
      <div className="pa-bento p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="p-2 rounded-full hover:bg-secondary/60"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setCursor(new Date())} className="text-sm px-3 py-1 rounded-full bg-secondary/60 hover:bg-secondary">Aujourd'hui</button>
          <button onClick={() => shift(1)} className="p-2 rounded-full hover:bg-secondary/60"><ChevronRight className="h-4 w-4" /></button>
          <span className="ml-3 font-medium">{title}</span>
          <span className="ml-2 text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary/40">{tz}</span>
        </div>
        <div className="flex gap-1 rounded-full bg-secondary/40 p-1">
          {(["day", "week", "month", "year"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1 text-xs rounded-full ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {m === "day" ? "Jour" : m === "week" ? "Semaine" : m === "month" ? "Mois" : "Année"}
            </button>
          ))}
        </div>
      </div>

      {mode === "week" && <WeekGrid cursor={cursor} items={rangeItems} tz={tz} onSelect={setSelected} />}
      {mode === "day" && <DayList date={cursor} items={rangeItems} tz={tz} onSelect={setSelected} />}
      {mode === "month" && <MonthGrid cursor={cursor} items={rangeItems} tz={tz} onSelect={setSelected} />}
      {mode === "year" && <YearGrid cursor={cursor} items={rangeItems} tz={tz} />}

      {selected && <PostItDialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)} item={selected} />}
    </>
  );
}

type ItemRow = Record<string, unknown> & { id: string; start_at?: string; due_at?: string; title?: string };
type GridProps = { cursor: Date; items: ItemRow[]; tz: string; onSelect: (i: ItemRow) => void };

function WeekGrid({ cursor, items, tz, onSelect }: GridProps) {
  const s = startOfWeek(cursor);
  const days = Array.from({ length: 7 }).map((_, i) => { const d = new Date(s); d.setDate(d.getDate() + i); return d; });
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {days.map((d) => {
        const dayItems = items.filter((i) => {
          const iso = i.start_at || i.due_at; if (!iso) return false;
          return sameDayInTz(iso, d.toISOString(), tz);
        });
        const isToday = sameDayInTz(d.toISOString(), new Date().toISOString(), tz);
        return (
          <div key={d.toISOString()} className={`pa-bento p-3 min-h-[300px] ${isToday ? "ring-2 ring-primary/60 pa-holo-glow" : ""}`}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs uppercase text-muted-foreground">{d.toLocaleDateString("fr-FR", { weekday: "short", timeZone: tz })}</span>
              <span className={`text-lg font-semibold ${isToday ? "pa-holo-text" : ""}`}>{Number(tzDateKey(d.toISOString(), tz).split("-")[2])}</span>
            </div>
            <div className="space-y-2">
              {dayItems.map((it) => <PostIt key={it.id} item={it} onClick={() => onSelect(it)} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayList({ date, items, tz, onSelect }: { date: Date; items: ItemRow[]; tz: string; onSelect: (i: ItemRow) => void }) {
  const hours = Array.from({ length: 14 }).map((_, i) => i + 7);
  return (
    <div className="pa-bento p-4">
      <div className="grid grid-cols-[60px_1fr] gap-2">
        {hours.map((h) => {
          const slot = items.filter((i) => {
            const iso = i.start_at || i.due_at; if (!iso) return false;
            return sameDayInTz(iso, date.toISOString(), tz) && tzHour(iso, tz) === h;
          });
          return (
            <div key={`row-${h}`} className="contents">
              <div className="text-xs text-muted-foreground pt-2">{String(h).padStart(2, "0")}:00</div>
              <div className="border-l border-border/40 pl-3 min-h-[60px] space-y-2">
                {slot.map((it) => <PostIt key={it.id} item={it} onClick={() => onSelect(it)} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthGrid({ cursor, items, tz, onSelect }: GridProps) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first);
  const cells = Array.from({ length: 42 }).map((_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  return (
    <div className="pa-bento p-3">
      <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-1">
        {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(l => <div key={l} className="text-center">{l}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const dayItems = items.filter((i) => {
            const iso = i.start_at || i.due_at; if (!iso) return false;
            return sameDayInTz(iso, d.toISOString(), tz);
          });
          const isToday = sameDayInTz(d.toISOString(), new Date().toISOString(), tz);
          return (
            <motion.div key={d.toISOString()} whileHover={{ scale: 1.02 }}
              className={`min-h-[80px] rounded-xl p-2 text-xs ${inMonth ? "bg-secondary/30" : "bg-secondary/10 opacity-50"} ${isToday ? "ring-2 ring-primary" : ""}`}>
              <div className={`font-semibold ${isToday ? "pa-holo-text" : ""}`}>{d.getDate()}</div>
              <div className="mt-1 space-y-1">
                {dayItems.slice(0, 3).map((it) => (
                  <button key={it.id} onClick={() => onSelect(it)} className="w-full text-left truncate rounded px-1 bg-primary/20 hover:bg-primary/30">
                    {it.title}
                  </button>
                ))}
                {dayItems.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayItems.length - 3}</div>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function YearGrid({ cursor, items, tz }: { cursor: Date; items: ItemRow[]; tz: string }) {
  const months = Array.from({ length: 12 }).map((_, m) => m);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {months.map((m) => {
        const count = items.filter((i) => {
          const iso = i.start_at || i.due_at; if (!iso) return false;
          const key = tzDateKey(iso, tz);
          const [y, mm] = key.split("-").map(Number);
          return y === cursor.getFullYear() && mm - 1 === m;
        }).length;
        return (
          <div key={m} className="pa-bento p-4">
            <div className="text-sm text-muted-foreground">{formatInTz(new Date(cursor.getFullYear(), m, 1).toISOString(), tz, { month: "long" })}</div>
            <div className="text-3xl font-bold pa-holo-text">{count}</div>
            <div className="text-xs text-muted-foreground">élément{count > 1 ? "s" : ""}</div>
          </div>
        );
      })}
    </div>
  );
}
