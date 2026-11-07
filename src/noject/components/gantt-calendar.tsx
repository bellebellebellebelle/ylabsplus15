import * as React from "react";
import { format, addDays, differenceInDays, startOfWeek, addWeeks, addMonths, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

type Task = {
  id: string; title: string; status: string; priority: string;
  parent_task_id: string | null;
  start_date?: string | null; due_date?: string | null;
  dependency_ids?: string[] | null;
  color?: string | null;
  estimated_hours?: number | null;
};

const P_COLORS: Record<string, string> = {
  basse: "#3b82f6", moyenne: "#10b981", haute: "#f59e0b", critique: "#ef4444",
};

type Zoom = "day" | "week" | "month";

// Compute an effective [start, end] span for a task. Falls back gracefully
// when only one date is set so the bar always reflects a realistic duration.
function taskSpan(t: Task): { start: Date; end: Date; days: number } | null {
  const hasStart = !!t.start_date;
  const hasEnd = !!t.due_date;
  if (!hasStart && !hasEnd) return null;

  // Duration fallback: estimated_hours -> days (8h = 1d), else 3 days
  const fallbackDays = t.estimated_hours ? Math.max(1, Math.ceil(Number(t.estimated_hours) / 8)) : 3;

  let s: Date, e: Date;
  if (hasStart && hasEnd) {
    s = new Date(t.start_date!); e = new Date(t.due_date!);
    if (e < s) e = s;
  } else if (hasStart) {
    s = new Date(t.start_date!); e = addDays(s, fallbackDays - 1);
  } else {
    e = new Date(t.due_date!); s = addDays(e, -(fallbackDays - 1));
  }
  const days = differenceInDays(e, s) + 1;
  return { start: s, end: e, days };
}

export function GanttCalendar({ tasks, projectStart, projectEnd, onReschedule }: {
  tasks: Task[]; projectStart?: string | null; projectEnd?: string | null;
  onReschedule?: (taskId: string, newStart: string, newEnd: string) => void;
}) {
  const [zoom, setZoom] = React.useState<Zoom>("week");
  const [whatIf, setWhatIf] = React.useState(false);
  // Local override of dates while dragging or previewing (what-if)
  const [override, setOverride] = React.useState<Record<string, { start: string; end: string }>>({});

  const scheduled = tasks
    .filter(t => !t.parent_task_id)
    .map(t => {
      const ov = override[t.id];
      if (ov) return { ...t, start_date: ov.start, due_date: ov.end };
      return t;
    })
    .map(t => ({ t, span: taskSpan(t) }))
    .filter(x => x.span !== null) as { t: Task; span: { start: Date; end: Date; days: number } }[];

  // Time bounds
  const allDates = scheduled.flatMap(({ span }) => [span.start, span.end]);
  const minDate = projectStart ? new Date(projectStart)
    : allDates.length ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
  const maxDate = projectEnd ? new Date(projectEnd)
    : allDates.length ? new Date(Math.max(...allDates.map(d => d.getTime()))) : addDays(new Date(), 30);

  const start = addDays(minDate, -2);
  const end = addDays(maxDate, 4);
  const totalDays = Math.max(7, differenceInDays(end, start) + 1);

  const colW = zoom === "day" ? 44 : zoom === "week" ? 22 : 10;
  const totalW = totalDays * colW;

  // Header segments
  const header: { label: string; span: number }[] = [];
  if (zoom === "day") {
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(start, i);
      header.push({ label: format(d, "d MMM", { locale: fr }), span: 1 });
    }
  } else if (zoom === "week") {
    let cur = startOfWeek(start, { locale: fr });
    while (cur < end) {
      const next = addWeeks(cur, 1);
      const s = cur < start ? start : cur;
      const e = next > end ? end : next;
      header.push({ label: `S${format(cur, "w")} ${format(cur, "d MMM", { locale: fr })}`, span: differenceInDays(e, s) });
      cur = next;
    }
  } else {
    let cur = startOfMonth(start);
    while (cur < end) {
      const next = addMonths(cur, 1);
      const s = cur < start ? start : cur;
      const e = next > end ? end : next;
      header.push({ label: format(cur, "MMM yyyy", { locale: fr }), span: differenceInDays(e, s) });
      cur = next;
    }
  }

  // Critical path with current (possibly overridden) dates
  const critical = computeCriticalPath(scheduled.map(x => x.t));
  const criticalSet = new Set(critical);
  const projectEndComputed = scheduled.reduce((m, x) => (x.span.end > m ? x.span.end : m), start);

  // Positions
  const taskPos: Record<string, { top: number; left: number; width: number; midY: number; midXEnd: number; midXStart: number }> = {};
  const rowH = 40;

  const today = new Date();
  const todayLeft = differenceInDays(today, start) * colW;

  // Drag handling (what-if)
  const [dragging, setDragging] = React.useState<{ id: string; startX: number; origStart: Date; origEnd: Date } | null>(null);

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const shiftDays = Math.round(dx / colW);
      const s = addDays(dragging.origStart, shiftDays);
      const en = addDays(dragging.origEnd, shiftDays);
      setOverride(o => ({ ...o, [dragging.id]: { start: s.toISOString().slice(0, 10), end: en.toISOString().slice(0, 10) } }));
    };
    const onUp = () => {
      const ov = override[dragging.id];
      if (ov && onReschedule) onReschedule(dragging.id, ov.start, ov.end);
      setDragging(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, colW, override, onReschedule]);

  return (
    <div className="bento p-4 print:bg-white">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h3 className="font-display text-lg font-semibold flex-1">Diagramme de Gantt</h3>
        <div className="flex gap-1 items-center">
          <button
            onClick={() => { setWhatIf(w => !w); if (whatIf) setOverride({}); }}
            className={`chip !text-xs !normal-case ${whatIf ? "!bg-[#00E5FF]/25 !border-[#00E5FF]" : ""}`}
            title="Glisser les barres pour tester un nouveau planning"
          >
            {whatIf ? "🎯 What-if actif" : "🧪 What-if"}
          </button>
          {(["day","week","month"] as const).map(z => (
            <button key={z} onClick={() => setZoom(z)}
              className={`chip !text-xs !normal-case ${zoom === z ? "!bg-white/25 !border-white/40" : ""}`}>
              {z === "day" ? "Jour" : z === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
      </div>

      {whatIf && (
        <div className="text-xs text-white/70 mb-2 flex flex-wrap gap-3">
          <span>Date de fin projetée : <b className="text-[#00E5FF]">{format(projectEndComputed, "d MMM yyyy", { locale: fr })}</b></span>
          <span>Chemin critique : <b className="text-red-300">{critical.length} tâches</b></span>
          {Object.keys(override).length > 0 && <button className="underline" onClick={() => setOverride({})}>Réinitialiser</button>}
        </div>
      )}

      {scheduled.length === 0 ? (
        <div className="text-center text-white/60 py-6">Ajoutez des dates aux tâches pour afficher le calendrier.</div>
      ) : (
        <div className="overflow-auto max-h-[560px] rounded-xl border border-white/10">
          <div className="grid" style={{ gridTemplateColumns: `240px ${totalW}px` }}>
            <div className="sticky top-0 left-0 z-30 bg-[oklch(0.22_0.12_15)] border-b border-r border-white/15 px-3 py-2 text-xs uppercase text-white/70">Tâche</div>
            <div className="sticky top-0 z-20 bg-[oklch(0.22_0.12_15)] border-b border-white/15 relative" style={{ width: totalW }}>
              <div className="flex text-[10px] text-white/70">
                {header.map((h, i) => (
                  <div key={i} className="border-r border-white/10 px-1 py-2 truncate" style={{ width: h.span * colW }}>{h.label}</div>
                ))}
              </div>
            </div>
            <div className="border-r border-white/10">
              {scheduled.map(({ t }) => (
                <div key={t.id} className="border-b border-white/5 px-3 py-2 text-sm truncate" style={{ height: rowH }}>
                  {criticalSet.has(t.id) && <span className="text-red-300 mr-1">⚡</span>}
                  {t.title}
                </div>
              ))}
            </div>
            <div className="relative" style={{ width: totalW, height: scheduled.length * rowH }}>
              {header.reduce((acc, h) => {
                const last = acc[acc.length - 1] ?? 0;
                acc.push(last + h.span * colW);
                return acc;
              }, [] as number[]).map((x, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: x }} />
              ))}
              {todayLeft >= 0 && todayLeft <= totalW && (
                <div className="absolute top-0 bottom-0 border-l-2 border-[#FF204E]" style={{ left: todayLeft }}>
                  <div className="absolute -top-1 -translate-x-1/2 text-[9px] px-1 rounded bg-[#FF204E]">•</div>
                </div>
              )}
              {scheduled.map(({ t, span }, i) => {
                const left = Math.max(0, differenceInDays(span.start, start) * colW);
                const width = Math.max(colW * 0.7, span.days * colW);
                const top = i * rowH + 6;
                const midY = top + 14;
                taskPos[t.id] = { top, left, width, midY, midXStart: left, midXEnd: left + width };
                const isCritical = criticalSet.has(t.id);
                const barColor = t.color || P_COLORS[t.priority] || "#FF204E";
                const overridden = !!override[t.id];
                return (
                  <div key={t.id}
                    onMouseDown={whatIf ? (e) => {
                      setDragging({ id: t.id, startX: e.clientX, origStart: span.start, origEnd: span.end });
                    } : undefined}
                    className={`absolute rounded-md flex items-center px-2 text-[10px] font-semibold shadow-md ${whatIf ? "cursor-grab active:cursor-grabbing" : ""}`}
                    style={{
                      top, left, width, height: 28,
                      background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                      opacity: t.status === "termine" ? 0.45 : 1,
                      outline: overridden ? "2px dashed #00E5FF" : isCritical ? "2px solid #ef4444" : "1px solid rgba(255,255,255,.15)",
                      boxShadow: isCritical ? "0 0 12px rgba(239,68,68,.5)" : overridden ? "0 0 12px rgba(0,229,255,.6)" : undefined,
                    }}
                    title={`${t.title}\n${format(span.start, "d MMM", { locale: fr })} → ${format(span.end, "d MMM", { locale: fr })}\n${span.days} jour${span.days > 1 ? "s" : ""}`}
                  >
                    <span className="truncate">{t.status === "termine" ? "✓ " : ""}{span.days}j</span>
                  </div>
                );
              })}
              <svg className="absolute inset-0 pointer-events-none" width={totalW} height={scheduled.length * rowH}>
                {scheduled.flatMap(({ t }) => (t.dependency_ids ?? []).map(depId => {
                  const from = taskPos[depId];
                  const to = taskPos[t.id];
                  if (!from || !to) return null;
                  const x1 = from.midXEnd, y1 = from.midY;
                  const x2 = to.midXStart, y2 = to.midY;
                  const midX = (x1 + x2) / 2;
                  const stroke = criticalSet.has(depId) && criticalSet.has(t.id) ? "#ef4444" : "#ffffff88";
                  return (
                    <g key={`${depId}-${t.id}`}>
                      <path d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`}
                        stroke={stroke} strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                      <polygon points={`${x2},${y2} ${x2 - 6},${y2 - 3} ${x2 - 6},${y2 + 3}`} fill={stroke} />
                    </g>
                  );
                }))}
              </svg>
            </div>
          </div>
        </div>
      )}
      <div className="mt-2 text-[10px] text-white/60 flex items-center gap-3 flex-wrap">
        <span>⚡ = chemin critique</span>
        <span>Flèches en pointillés = dépendances</span>
        <span>Barre rouge verticale = aujourd'hui</span>
        {whatIf && <span>Cyan pointillé = tâche déplacée (simulation)</span>}
      </div>
    </div>
  );
}

function computeCriticalPath(tasks: Task[]): string[] {
  const byId = new Map(tasks.map(t => [t.id, t]));
  const dur = (t: Task) => {
    const s = taskSpan(t);
    return s ? s.days : 1;
  };
  const memo = new Map<string, { total: number; chain: string[] }>();
  const rec = (id: string): { total: number; chain: string[] } => {
    if (memo.has(id)) return memo.get(id)!;
    const t = byId.get(id);
    if (!t) return { total: 0, chain: [] };
    const deps = (t.dependency_ids ?? []).filter(d => byId.has(d));
    if (deps.length === 0) { const r = { total: dur(t), chain: [id] }; memo.set(id, r); return r; }
    const best = deps.map(rec).reduce((a, b) => a.total > b.total ? a : b);
    const r = { total: best.total + dur(t), chain: [...best.chain, id] };
    memo.set(id, r);
    return r;
  };
  let best: { total: number; chain: string[] } = { total: 0, chain: [] };
  for (const t of tasks) {
    const r = rec(t.id);
    if (r.total > best.total) best = r;
  }
  return best.chain;
}
