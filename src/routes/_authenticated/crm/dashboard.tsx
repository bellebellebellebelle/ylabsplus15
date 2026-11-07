import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { aiNextBestActions, aiPipelineInsights, getLatestInsights } from "@/crm/lib/ai.functions";
import { Briefcase, TrendingUp, Sparkles, ExternalLink, ArrowRight, AlertCircle, CalendarDays, Flame, Clock } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/crm/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Cockpit — Nova CRM" }] }),
});

function Dashboard() {
  const qc = useQueryClient();
  const nba = useServerFn(aiNextBestActions);
  const insights = useServerFn(aiPipelineInsights);
  const getInsights = useServerFn(getLatestInsights);

  const oppsQ = useQuery({
    queryKey: ["opps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_opportunities").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60_000,
  });

  const actsQ = useQuery({
    queryKey: ["acts-recent"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_activities").select("*").order("created_at", { ascending: false }).limit(8);
      return data ?? [];
    },
  });

  // Native agenda: Calendsky appointments + scheduled CRM meetings.
  const upcomingQ = useQuery({
    queryKey: ["upcoming-native"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const [a, m] = await Promise.all([
        supabase.from("calendsky_appointments").select("*").gte("start_at", now).order("start_at").limit(6),
        supabase.from("crm_activities").select("id,title,scheduled_at,opportunity_id").eq("type", "meeting").gte("scheduled_at", now).order("scheduled_at").limit(6),
      ]);
      const events = [
        ...((a.data ?? []) as any[]).map((e) => ({ id: `a-${e.id}`, summary: e.title ?? "Rendez-vous", start: e.start_at, url: "/calendsky/planning" })),
        ...((m.data ?? []) as any[]).map((e) => ({ id: `m-${e.id}`, summary: e.title ?? "Rendez-vous", start: e.scheduled_at, url: e.opportunity_id ? `/crm/opportunities/${e.opportunity_id}` : "/crm/activities" })),
      ].sort((x, y) => +new Date(x.start) - +new Date(y.start));
      return { events };
    },
    refetchInterval: 60_000,
  });
  const savedQ = useQuery({ queryKey: ["saved-insights"], queryFn: () => getInsights({}), refetchInterval: 30_000 });

  const nbaMut = useMutation({ mutationFn: () => nba({}), onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-insights"] }) });
  const insightsMut = useMutation({ mutationFn: () => insights({}), onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-insights"] }) });

  useEffect(() => {
    const ch = supabase
      .channel("dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_opportunities" }, () => {
        qc.invalidateQueries({ queryKey: ["opps"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_activities" }, () => {
        qc.invalidateQueries({ queryKey: ["acts-recent"] });
      })
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [qc]);

  const opps = oppsQ.data ?? [];
  const pipeline = opps.reduce((sum, o: any) => sum + Number(o.value_amount || 0), 0);
  const wins = opps.filter((o: any) => o.stage === "won").length;
  const openCount = opps.filter((o: any) => !["won", "lost"].includes(o.stage)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Cockpit</p>
          <h1 className="font-display text-4xl font-bold text-white">Bonjour ✨</h1>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <BentoStat label="Pipeline" value={`${pipeline.toLocaleString("fr-FR")} €`} icon={<TrendingUp />} className="md:col-span-2" delay={0} />
        <BentoStat label="Opportunités ouvertes" value={String(openCount)} icon={<Briefcase />} className="md:col-span-2" delay={0.05} />
        <BentoStat label="Deals gagnés" value={String(wins)} icon={<Sparkles />} className="md:col-span-2" delay={0.1} />

        {/* Next best actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass halo md:col-span-4 rounded-3xl p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">
              <span className="holo-text">Actions IA recommandées</span>
            </h2>
            <Button size="sm" onClick={() => nbaMut.mutate()} disabled={nbaMut.isPending} className="rounded-full bg-white/20 text-white hover:bg-white/30">
              {nbaMut.isPending ? "Analyse…" : "Analyser"}
            </Button>
          </div>
          {(() => {
            const nbaData = nbaMut.data ?? savedQ.data?.nba?.payload;
            const savedAt = savedQ.data?.nba?.created_at;
            if (!nbaData) return <p className="text-sm text-white/70">Lancez l'analyse pour obtenir les prochaines actions prioritaires. Les résultats seront sauvegardés et consultables à tout moment.</p>;
            return (
              <>
                {savedAt && !nbaMut.data && <p className="mb-2 text-xs text-white/60">Dernière analyse : {new Date(savedAt).toLocaleString("fr-FR")}</p>}
                {nbaData.summary && <p className="mb-3 rounded-2xl bg-white/10 p-3 text-xs text-white/90">{nbaData.summary}</p>}
                <ul className="space-y-3">
                  {(nbaData.actions || []).map((a: any, i: number) => (
                    <li key={i} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                      <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${a.urgency === "high" ? "bg-red-300" : a.urgency === "medium" ? "bg-yellow-200" : "bg-emerald-200"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{a.action}</p>
                        <p className="text-xs text-white/70">{a.why}</p>
                        {a.opportunityName && <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/50">{a.opportunityName}</p>}
                      </div>
                      {a.opportunityId && (
                        <Link to="/crm/opportunities/$id" params={{ id: a.opportunityId }} className="text-white/80 hover:text-white">
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            );
          })()}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass md:col-span-2 rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold text-white">Activités récentes</h2>
          <ul className="mt-3 space-y-2">
            {(actsQ.data ?? []).slice(0, 6).map((a: any) => (
              <li key={a.id} className="flex items-center justify-between rounded-xl bg-white/10 p-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{a.title}</p>
                  <p className="text-xs text-white/60">{a.type} · {new Date(a.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                {a.external_url && (
                  <a href={a.external_url} target="_blank" rel="noreferrer" className="text-white/80"><ExternalLink className="h-4 w-4" /></a>
                )}
              </li>
            ))}
            {(actsQ.data ?? []).length === 0 && <li className="text-xs text-white/60">Aucune activité.</li>}
          </ul>
        </motion.div>

        {/* Pipeline Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="glass halo md:col-span-4 rounded-3xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white"><span className="holo-text">Radar pipeline IA</span></h2>
            <Button size="sm" onClick={() => insightsMut.mutate()} disabled={insightsMut.isPending} className="rounded-full bg-white/20 text-white hover:bg-white/30">
              {insightsMut.isPending ? "Analyse…" : "Scanner"}
            </Button>
          </div>
          {(() => {
            const pipeData = insightsMut.data ?? savedQ.data?.pipeline?.payload;
            const savedAt = savedQ.data?.pipeline?.created_at;
            if (!pipeData) return <p className="text-sm text-white/70">Détecte automatiquement les opportunités chaudes et stagnantes. Résultats sauvegardés.</p>;
            return (
              <>
                {savedAt && !insightsMut.data && <p className="mb-2 text-xs text-white/60">Dernier scan : {new Date(savedAt).toLocaleString("fr-FR")}</p>}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="mb-2 flex items-center gap-2 text-sm text-white"><Flame className="h-4 w-4 text-orange-200" /> Deals chauds</p>
                    <ul className="space-y-1 text-xs text-white/80">
                      {(pipeData.hot ?? []).map((h: any, i: number) => (
                        <li key={i} className="rounded-lg bg-white/10 p-2">
                          {h.id ? (
                            <Link to="/crm/opportunities/$id" params={{ id: h.id }} className="font-medium text-white">▸ {h.name ?? ""} — {h.reason}</Link>
                          ) : (<span>▸ {h.reason}</span>)}
                        </li>
                      ))}
                      {(pipeData.hot ?? []).length === 0 && <li className="text-white/60">Aucun signal.</li>}
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="mb-2 flex items-center gap-2 text-sm text-white"><Clock className="h-4 w-4 text-yellow-200" /> Stagnants</p>
                    <ul className="space-y-1 text-xs text-white/80">
                      {(pipeData.stalled ?? []).map((h: any, i: number) => (
                        <li key={i} className="rounded-lg bg-white/10 p-2">
                          {h.id ? (
                            <Link to="/crm/opportunities/$id" params={{ id: h.id }} className="font-medium text-white">▸ {h.name ?? ""} — {h.reason}</Link>
                          ) : (<span>▸ {h.reason}</span>)}
                        </li>
                      ))}
                      {(pipeData.stalled ?? []).length === 0 && <li className="text-white/60">Aucun blocage détecté.</li>}
                    </ul>
                  </div>
                  {pipeData.summary && <p className="md:col-span-2 rounded-2xl bg-white/10 p-3 text-xs text-white/90">{pipeData.summary}</p>}
                </div>
              </>
            );
          })()}
        </motion.div>

        {/* Upcoming meetings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="glass md:col-span-2 rounded-3xl p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-white"><CalendarDays className="h-4 w-4" />Rendez-vous à venir</h2>
          <ul className="space-y-2">
            {(upcomingQ.data?.events ?? []).slice(0, 6).map((e: any) => (
              <li key={e.id} className="rounded-xl bg-white/10 p-2 text-sm">
                <a href={e.url} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{e.summary}</p>
                    <p className="text-xs text-white/60">{new Date(e.start).toLocaleString("fr-FR")}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/70" />
                </a>
              </li>
            ))}
            {(upcomingQ.data?.events ?? []).length === 0 && (
              <li className="text-xs text-white/60">
                Aucun rendez-vous à venir.
              </li>
            )}
          </ul>
        </motion.div>



        {/* Recent opportunities */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass md:col-span-6 rounded-3xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Opportunités</h2>
            <Link to="/crm/opportunities" className="text-sm text-white/80 underline underline-offset-4">Tout voir</Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {opps.slice(0, 6).map((o: any) => (
              <Link key={o.id} to="/crm/opportunities/$id" params={{ id: o.id }} className="group rounded-2xl bg-white/10 p-4 transition-transform hover:-translate-y-0.5 hover:bg-white/15">
                <p className="text-xs uppercase tracking-widest text-white/60">{o.stage}</p>
                <p className="mt-1 font-display text-lg font-semibold text-white">{o.name}</p>
                <p className="text-sm text-white/70">{o.company ?? "—"}</p>
                <p className="mt-2 text-sm text-white">{Number(o.value_amount || 0).toLocaleString("fr-FR")} {o.currency}</p>
              </Link>
            ))}
            {opps.length === 0 && (
              <Link to="/crm/opportunities" className="rounded-2xl border-2 border-dashed border-white/30 p-6 text-center text-white/80 hover:bg-white/10">
                + Créer votre première opportunité
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function BentoStat({ label, value, icon, className = "", delay = 0 }: { label: string; value: string; icon: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass halo rounded-3xl p-6 ${className}`}
    >
      <div className="flex items-center justify-between text-white/80">
        <span className="text-xs uppercase tracking-widest">{label}</span>
        <span className="opacity-80">{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
}
