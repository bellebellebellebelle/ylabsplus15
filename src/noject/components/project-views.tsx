import * as React from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line,
  ComposedChart, CartesianGrid, ReferenceLine, Legend,
} from "recharts";

type Task = {
  id: string; title: string; status: string; priority: string;
  parent_task_id: string | null; start_date?: string | null; due_date?: string | null;
  estimated_hours?: number | null; actual_hours?: number | null; position?: number;
};

const P_COLORS: Record<string, string> = {
  basse: "#3b82f6", moyenne: "#10b981", haute: "#f59e0b", critique: "#ef4444",
};

// Utils
function daysBetween(a: Date, b: Date) { return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000)); }

// ===== Gantt =====
export function GanttView({ tasks, project }: { tasks: Task[]; project: any }) {
  const roots = tasks.filter(t => !t.parent_task_id);
  const validTasks = roots.filter(t => t.start_date || t.due_date);
  if (validTasks.length === 0) return <Empty label="Ajoutez des dates aux tâches pour afficher le Gantt" />;

  const projectStart = new Date(project.start_date ?? validTasks[0].start_date ?? validTasks[0].due_date!);
  const projectEnd = new Date(project.end_date ?? validTasks[validTasks.length - 1].due_date ?? new Date());
  const totalDays = Math.max(1, daysBetween(projectStart, projectEnd) + 1);

  return (
    <div className="bento p-4 overflow-x-auto">
      <h3 className="font-display text-lg font-semibold mb-3">Diagramme de Gantt</h3>
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[220px_1fr] gap-2 text-xs text-white/70 mb-2">
          <div>Tâche</div>
          <div className="relative h-6">
            {Array.from({ length: Math.min(totalDays, 12) + 1 }, (_, i) => {
              const d = new Date(projectStart.getTime() + (i * totalDays / Math.min(totalDays, 12)) * 86400000);
              return <div key={i} className="absolute -translate-x-1/2 top-0" style={{ left: `${(i / Math.min(totalDays, 12)) * 100}%` }}>{d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</div>;
            })}
          </div>
        </div>
        <div className="space-y-2">
          {validTasks.map(t => {
            const s = new Date(t.start_date ?? t.due_date!);
            const e = new Date(t.due_date ?? t.start_date!);
            const offset = Math.max(0, daysBetween(projectStart, s));
            const dur = Math.max(1, daysBetween(s, e) + 1);
            const left = (offset / totalDays) * 100;
            const width = (dur / totalDays) * 100;
            return (
              <div key={t.id} className="grid grid-cols-[220px_1fr] gap-2 items-center">
                <div className="text-sm truncate">{t.title}</div>
                <div className="relative h-7 bg-white/5 rounded-md">
                  <div
                    className="absolute h-full rounded-md flex items-center px-2 text-[10px] font-semibold"
                    style={{
                      left: `${left}%`, width: `${Math.max(2, width)}%`,
                      background: `linear-gradient(90deg, ${P_COLORS[t.priority] ?? "#FF204E"}cc, ${P_COLORS[t.priority] ?? "#FF204E"})`,
                      opacity: t.status === "termine" ? 0.5 : 1,
                    }}
                  >
                    {t.status === "termine" ? "✓" : `${dur}j`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===== WBS / Organigramme (tree) =====
export function WbsView({ tasks }: { tasks: Task[] }) {
  const roots = tasks.filter(t => !t.parent_task_id);
  if (roots.length === 0) return <Empty label="Aucune tâche" />;
  return (
    <div className="bento p-4">
      <h3 className="font-display text-lg font-semibold mb-3">Organigramme des tâches (WBS)</h3>
      <div className="flex flex-wrap gap-3 justify-center">
        {roots.map(r => (
          <div key={r.id} className="flex flex-col items-center">
            <NodeCard t={r} />
            {tasks.filter(c => c.parent_task_id === r.id).length > 0 && (
              <>
                <div className="w-px h-5 bg-white/30" />
                <div className="flex gap-2 flex-wrap justify-center">
                  {tasks.filter(c => c.parent_task_id === r.id).map(c => (
                    <div key={c.id} className="flex flex-col items-center">
                      <div className="w-px h-3 bg-white/20" />
                      <NodeCard t={c} small />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeCard({ t, small }: { t: Task; small?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-white/15 backdrop-blur px-3 py-2 max-w-[180px] text-center ${small ? "text-xs" : "text-sm"}`}
      style={{ background: `linear-gradient(135deg, ${P_COLORS[t.priority] ?? "#FF204E"}40, transparent)` }}
    >
      <div className={t.status === "termine" ? "line-through opacity-60" : ""}>{t.title}</div>
      <div className="text-[10px] uppercase text-white/60 mt-0.5">{t.priority}</div>
    </div>
  );
}

// ===== CPM =====
export function CpmView({ tasks }: { tasks: Task[] }) {
  // Compute critical path: longest chain by duration (est_hours ?? days between dates ?? 1)
  const roots = tasks.filter(t => !t.parent_task_id && (t.start_date || t.due_date));
  const dur = (t: Task) => {
    if (t.estimated_hours) return t.estimated_hours;
    if (t.start_date && t.due_date) return Math.max(1, daysBetween(new Date(t.start_date), new Date(t.due_date)) + 1) * 8;
    return 8;
  };
  const chained = [...roots].sort((a, b) => (new Date(a.start_date ?? a.due_date!).getTime()) - (new Date(b.start_date ?? b.due_date!).getTime()));
  const totalHours = chained.reduce((s, t) => s + dur(t), 0);

  return (
    <div className="bento p-4">
      <h3 className="font-display text-lg font-semibold mb-1">Méthode du chemin critique (CPM)</h3>
      <div className="text-xs text-white/70 mb-3">Durée totale estimée : <b>{totalHours} h</b> · Chaîne : {chained.length} tâches</div>
      <div className="flex flex-wrap items-center gap-2">
        {chained.map((t, i) => (
          <React.Fragment key={t.id}>
            <div className="rounded-xl border border-[oklch(0.68_0.28_15/0.6)] bg-[oklch(0.68_0.28_15/0.15)] px-3 py-2 text-sm">
              <div className="font-semibold">{t.title}</div>
              <div className="text-[10px] text-white/70">{dur(t)}h · {t.priority}</div>
            </div>
            {i < chained.length - 1 && <span className="text-[oklch(0.68_0.28_15)]">→</span>}
          </React.Fragment>
        ))}
        {chained.length === 0 && <Empty label="Ajoutez des dates aux tâches" />}
      </div>
    </div>
  );
}

// ===== Pareto =====
export function ParetoView({ tasks }: { tasks: Task[] }) {
  const counts: Record<string, number> = {};
  for (const t of tasks) counts[t.priority] = (counts[t.priority] ?? 0) + 1;
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, [, v]) => s + v, 0);
  let cum = 0;
  const data = rows.map(([k, v]) => { cum += v; return { label: k, value: v, cumulative: Math.round((cum / total) * 100) }; });
  return (
    <div className="bento p-4 h-80">
      <h3 className="font-display text-lg font-semibold mb-2">Diagramme de Pareto (priorités)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="#fff2" />
          <XAxis dataKey="label" stroke="#fffa" />
          <YAxis yAxisId="left" stroke="#fffa" />
          <YAxis yAxisId="right" orientation="right" stroke="#fffa" domain={[0, 100]} />
          <Tooltip />
          <Bar yAxisId="left" dataKey="value" fill="#FF204E" radius={4} />
          <Line yAxisId="right" dataKey="cumulative" stroke="#00E5FF" strokeWidth={2} />
          <ReferenceLine yAxisId="right" y={80} stroke="#fbbf24" strokeDasharray="4 4" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ===== Timeline =====
export function TimelineView({ tasks, events }: { tasks: Task[]; events: any[] }) {
  const items = [
    ...tasks.filter(t => t.due_date).map(t => ({ date: new Date(t.due_date!), title: t.title, type: "task", status: t.status })),
    ...events.map(e => ({ date: new Date(e.start_at), title: e.title, type: "event", status: "" })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
  if (items.length === 0) return <Empty label="Aucun élément à afficher" />;
  return (
    <div className="bento p-4">
      <h3 className="font-display text-lg font-semibold mb-3">Chronologie du projet</h3>
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-white/20" />
        {items.map((i, idx) => (
          <div key={idx} className="relative mb-4">
            <div className={`absolute -left-4 top-1 size-3 rounded-full ${i.type === "event" ? "bg-[#00E5FF]" : i.status === "termine" ? "bg-green-400" : "bg-[#FF204E]"} shadow-[0_0_10px]`} />
            <div className="text-xs text-white/60">{i.date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}</div>
            <div className="font-medium">{i.title}</div>
            <div className="text-[10px] uppercase text-white/50">{i.type === "event" ? "Événement agenda" : "Échéance tâche"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Fishbone (Ishikawa) =====
export function FishboneView({ risks, objective }: { risks: any[]; objective: string }) {
  const categories = ["Méthode", "Personne", "Matériel", "Environnement", "Mesure", "Management"];
  const chunked = categories.map((c, i) => ({
    name: c,
    items: risks.filter((_, idx) => idx % categories.length === i).map((r: any) => r.name),
  }));
  return (
    <div className="bento p-4">
      <h3 className="font-display text-lg font-semibold mb-3">Diagramme en arêtes de poisson (Ishikawa)</h3>
      <div className="relative overflow-x-auto">
        <svg viewBox="0 0 900 400" className="w-full h-[380px]">
          <line x1="20" y1="200" x2="820" y2="200" stroke="#FF204E" strokeWidth="3" />
          <polygon points="820,190 850,200 820,210" fill="#FF204E" />
          <text x="855" y="205" fill="white" fontSize="14" fontWeight="700">{objective?.slice(0, 30) || "Objectif"}</text>
          {chunked.map((cat, i) => {
            const x = 120 + i * 130;
            const up = i % 2 === 0;
            const y1 = up ? 60 : 340;
            return (
              <g key={cat.name}>
                <line x1={x} y1={y1} x2={x + 40} y2={200} stroke="#FFFFFF80" strokeWidth="2" />
                <text x={x - 30} y={y1 + (up ? -6 : 16)} fill="#FF204E" fontSize="13" fontWeight="700">{cat.name}</text>
                {cat.items.slice(0, 3).map((it: string, j: number) => (
                  <text key={j} x={x - 20} y={y1 + (up ? 14 + j * 14 : -14 - j * 14)} fill="#ffffffbb" fontSize="11">• {it.slice(0, 22)}</text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ===== Control chart =====
export function ControlChartView({ tasks }: { tasks: Task[] }) {
  // Group by week: tasks completed count
  const buckets: Record<string, number> = {};
  for (const t of tasks) {
    if (t.status !== "termine" || !t.due_date) continue;
    const d = new Date(t.due_date);
    const key = `S${Math.ceil(d.getDate() / 7)}-${d.getMonth() + 1}`;
    buckets[key] = (buckets[key] ?? 0) + 1;
  }
  const data = Object.entries(buckets).map(([k, v]) => ({ label: k, value: v }));
  const mean = data.reduce((s, d) => s + d.value, 0) / Math.max(1, data.length);
  const std = Math.sqrt(data.reduce((s, d) => s + (d.value - mean) ** 2, 0) / Math.max(1, data.length));
  const UCL = mean + 3 * std;
  const LCL = Math.max(0, mean - 3 * std);
  return (
    <div className="bento p-4 h-80">
      <h3 className="font-display text-lg font-semibold mb-2">Graphique de contrôle (tâches livrées / semaine)</h3>
      {data.length === 0 ? <Empty label="Aucune tâche terminée avec échéance" /> : (
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={data}>
            <CartesianGrid stroke="#fff2" />
            <XAxis dataKey="label" stroke="#fffa" />
            <YAxis stroke="#fffa" />
            <Tooltip />
            <Legend />
            <ReferenceLine y={mean} stroke="#10b981" label={{ value: `Moy ${mean.toFixed(1)}`, fill: "#fff", position: "right" }} />
            <ReferenceLine y={UCL} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `LSC`, fill: "#fff", position: "right" }} />
            <ReferenceLine y={LCL} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `LIC`, fill: "#fff", position: "right" }} />
            <Line dataKey="value" stroke="#FF204E" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ===== Org / Stakeholders =====
export function OrgChartView({ stakeholders, projectName }: { stakeholders: any[]; projectName: string }) {
  return (
    <div className="bento p-4">
      <h3 className="font-display text-lg font-semibold mb-3">Organigramme</h3>
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-xl border border-white/20 px-4 py-2 bg-[oklch(0.68_0.28_15/0.2)] font-semibold">{projectName}</div>
        <div className="w-px h-6 bg-white/30" />
        <div className="flex flex-wrap gap-3 justify-center">
          {stakeholders.length === 0 && <div className="text-white/60 text-sm">Aucune partie prenante définie</div>}
          {stakeholders.map((s, i) => (
            <div key={i} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm max-w-[180px] text-center">
              <div className="font-semibold">{s.role}</div>
              <div className="text-xs text-white/60 mt-0.5">{s.responsibility}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="text-center text-white/60 text-sm py-6">{label}</div>;
}
