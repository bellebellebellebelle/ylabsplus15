import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getPortfolio } from "@/noject/lib/coaching.functions";
import { getTimeReport } from "@/noject/lib/time-tracking.functions";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { FolderKanban, TrendingUp, Wallet, Clock, AlertTriangle, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/_authenticated/noject/portfolio")({ component: PortfolioPage });

const COLORS = ["#FF204E","#00E5FF","#f59e0b","#10b981","#8b5cf6","#ec4899","#f97316","#6366f1"];

function PortfolioPage() {
  const getP = useServerFn(getPortfolio);
  const getT = useServerFn(getTimeReport);
  const portfolio = useQuery({ queryKey: ["portfolio"], queryFn: () => getP() });
  const timeR = useQuery({ queryKey: ["time-report"], queryFn: () => getT() });

  const stats = useMemo(() => {
    const P = portfolio.data;
    if (!P) return null;
    const today = new Date();
    const active = P.projects.filter((p: any) => p.status === "actif").length;
    const totalBudget = P.projects.reduce((s: number, p: any) => s + Number(p.budget ?? 0), 0);
    const spent = P.expenses.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
    const overdueTasks = P.tasks.filter((t: any) => t.status !== "termine" && t.due_date && new Date(t.due_date) < today).length;
    const totalHours = P.timeEntries.reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0) / 3600;
    const perProject = P.projects.map((p: any) => {
      const pt = P.tasks.filter((t: any) => t.project_id === p.id);
      const pe = P.expenses.filter((e: any) => e.project_id === p.id).reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
      const ph = P.timeEntries.filter((e: any) => e.project_id === p.id).reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0) / 3600;
      const late = pt.filter((t: any) => t.status !== "termine" && t.due_date && new Date(t.due_date) < today).length;
      return {
        id: p.id, name: p.name, progress: p.progress ?? 0, phase: p.phase,
        budget: Number(p.budget ?? 0), spent: pe, remaining: Number(p.budget ?? 0) - pe,
        marginPct: p.budget ? Math.round(((Number(p.budget) - pe) / Number(p.budget)) * 100) : null,
        hours: ph, tasks: pt.length, late,
        health: p.health_score,
      };
    });
    return { active, totalBudget, spent, overdueTasks, totalHours, perProject };
  }, [portfolio.data]);

  const tReport = timeR.data;
  const timePerProject = useMemo(() => {
    if (!tReport) return [];
    const map = new Map<string, number>();
    for (const e of tReport.entries) {
      const p = tReport.projects.find((x: any) => x.id === e.project_id);
      const name = p?.name ?? "—";
      map.set(name, (map.get(name) ?? 0) + (e.duration_seconds ?? 0) / 3600);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }));
  }, [tReport]);

  if (!stats) return <div className="text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <header>
        <div className="chip"><FolderKanban className="size-3" /> Portefeuille</div>
        <h1 className="mt-2 font-display text-4xl font-bold">Portefeuille multi-projets</h1>
        <p className="text-muted-foreground">Vue consolidée : marges, retards, temps passé, ressources partagées.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        <Kpi icon={<FolderKanban className="size-4" />} label="Projets actifs" value={stats.active} accent />
        <Kpi icon={<Wallet className="size-4" />} label="Budget total" value={`${stats.totalBudget.toLocaleString("fr-FR")} €`} />
        <Kpi icon={<TrendingUp className="size-4" />} label="Dépensé" value={`${Math.round(stats.spent).toLocaleString("fr-FR")} €`}
             subtle={stats.totalBudget ? `${Math.round((stats.spent/stats.totalBudget)*100)}% consommé` : undefined} />
        <Kpi icon={<Clock className="size-4" />} label="Heures trackées" value={stats.totalHours.toFixed(1)} />
        <Kpi icon={<AlertTriangle className="size-4" />} label="Tâches en retard" value={stats.overdueTasks} accent={stats.overdueTasks > 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bento p-4 h-72">
          <h3 className="font-semibold mb-2 text-sm">Marge par projet (budget − dépenses)</h3>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={stats.perProject.map(p => ({ label: p.name.slice(0, 18), value: p.remaining }))}>
              <XAxis dataKey="label" stroke="#fff8" fontSize={10} />
              <YAxis stroke="#fff8" fontSize={10} />
              <Tooltip contentStyle={{ background: "#00224D", border: "1px solid #FF204E" }} />
              <Bar dataKey="value" fill="#00E5FF" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bento p-4 h-72">
          <h3 className="font-semibold mb-2 text-sm">Heures par projet</h3>
          {timePerProject.length === 0 ? <div className="text-white/50 text-xs">Aucune heure trackée.</div> : (
            <ResponsiveContainer width="100%" height="88%">
              <PieChart>
                <Tooltip contentStyle={{ background: "#00224D", border: "1px solid #FF204E" }} />
                <Pie data={timePerProject} dataKey="value" nameKey="label" outerRadius={80} label={(e) => e.label}>
                  {timePerProject.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bento p-4 overflow-x-auto">
        <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><HeartPulse className="size-4" /> Comparateur de projets</h3>
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-xs text-white/60">
            <tr>
              <th className="text-left py-1">Projet</th>
              <th className="text-left">Phase</th>
              <th className="text-right">Avancement</th>
              <th className="text-right">Budget</th>
              <th className="text-right">Dépensé</th>
              <th className="text-right">Marge</th>
              <th className="text-right">Heures</th>
              <th className="text-right">Retards</th>
              <th className="text-right">Santé IA</th>
            </tr>
          </thead>
          <tbody>
            {stats.perProject.map(p => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="py-1"><Link to="/noject/projects/$projectId" params={{ projectId: p.id }} className="hover:underline">{p.name}</Link></td>
                <td><span className="chip !text-[10px]">{p.phase}</span></td>
                <td className="text-right">{p.progress}%</td>
                <td className="text-right">{p.budget.toLocaleString("fr-FR")} €</td>
                <td className="text-right">{Math.round(p.spent).toLocaleString("fr-FR")} €</td>
                <td className={`text-right font-semibold ${p.remaining < 0 ? "text-red-400" : "text-[#00E5FF]"}`}>{Math.round(p.remaining).toLocaleString("fr-FR")} €</td>
                <td className="text-right">{p.hours.toFixed(1)}h</td>
                <td className={`text-right ${p.late > 0 ? "text-red-400" : ""}`}>{p.late}</td>
                <td className="text-right">{p.health != null ? <span className={`chip !text-[10px] ${p.health > 70 ? "!bg-green-500/30" : p.health > 40 ? "!bg-yellow-500/30" : "!bg-red-500/30"}`}>{p.health}</span> : "—"}</td>
              </tr>
            ))}
            {stats.perProject.length === 0 && <tr><td colSpan={9} className="text-center py-4 text-white/50">Aucun projet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, accent, subtle }: any) {
  return (
    <div className={accent ? "bento-holo p-4" : "bento p-4"}>
      <div className="flex items-center gap-2 text-[10px] uppercase text-white/70">{icon} {label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      {subtle && <div className="text-[10px] text-white/60 mt-1">{subtle}</div>}
    </div>
  );
}
