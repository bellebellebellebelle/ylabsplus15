import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/noject/lib/projects.functions";
import { Sparkles, FolderKanban, CheckCircle2, Clock, TrendingUp, Plus } from "lucide-react";
import { motion } from "motion/react";

export const Route = createFileRoute("/_authenticated/noject/dashboard")({ component: Cockpit });

function Cockpit() {
  const fetchProjects = useServerFn(listProjects);
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => fetchProjects({}) });

  const list = projects.data ?? [];
  const active = list.filter((p: any) => p.status === "actif").length;
  const done = list.filter((p: any) => p.status === "termine").length;
  const avgProgress = list.length ? Math.round(list.reduce((s: number, p: any) => s + (p.progress ?? 0), 0) / list.length) : 0;

  return (
    <div className="space-y-6">
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="chip"><span className="live-dot" /> Live</div>
          <h1 className="mt-2 font-display text-4xl font-bold">Cockpit</h1>
          <p className="text-muted-foreground">Vue d'ensemble de vos projets en temps réel.</p>
        </div>
        <Link to="/noject/projects" className="btn-holo hover:btn-holo-hover"><Plus className="size-4" /> Nouveau projet</Link>
      </motion.header>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={<FolderKanban className="size-4" />} label="Projets actifs" value={active} accent />
        <Kpi icon={<CheckCircle2 className="size-4" />} label="Terminés" value={done} />
        <Kpi icon={<TrendingUp className="size-4" />} label="Avancement moyen" value={`${avgProgress}%`} />
        <Kpi icon={<Sparkles className="size-4" />} label="Total projets" value={list.length} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bento-holo p-6 md:col-span-2 min-h-[240px]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Projets récents</h2>
            <Link to="/noject/projects" className="text-sm underline">Tout voir</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {list.length === 0 && <div className="text-muted-foreground text-sm">Aucun projet pour le moment. Créez votre premier projet dans l'onglet Projets.</div>}
            {list.slice(0, 5).map((p: any) => (
              <Link key={p.id} to="/noject/projects/$projectId" params={{ projectId: p.id }} className="flex items-center gap-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-3 transition">
                <div className="size-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${p.color ?? "#FF204E"}, #5D0E41)` }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">Phase: {p.phase} · {p.progress ?? 0}%</div>
                </div>
                <div className="chip">{p.status}</div>
              </Link>
            ))}
          </div>
        </div>
        <div className="bento p-6 min-h-[240px]">
          <h2 className="font-display text-xl font-semibold">Assistant IA</h2>
          <p className="mt-2 text-sm text-muted-foreground">Un plan de projet complet en 30 secondes: phases, tâches, risques, KPI. Configurez votre modèle préféré dans les paramètres.</p>
          <div className="mt-4 flex gap-2">
            <Link to="/noject/projects" className="btn-holo">Nouveau projet IA</Link>
            <Link to="/noject/settings" className="btn-ghost">Réglages IA</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, accent, subtle }: { icon: React.ReactNode; label: string; value: any; accent?: boolean; subtle?: string }) {
  return (
    <div className={accent ? "bento-holo p-5" : "bento p-5"}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/70">{icon} {label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      {subtle && <div className="text-xs text-white/60 mt-1 truncate">{subtle}</div>}
    </div>
  );
}
