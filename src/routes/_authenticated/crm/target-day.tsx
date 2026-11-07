import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTargetDay, syncAllInbound } from "@/crm/lib/google.functions";
import { aiNextBestActions } from "@/crm/lib/ai.functions";
import { useTimezone, formatInTz } from "@/crm/lib/format";
import { Button } from "@/components/ui/button";
import { Target, CalendarDays, CheckSquare, Mail, RefreshCw, Sparkles, ArrowRight, ListTodo, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export const Route = createFileRoute("/_authenticated/crm/target-day")({
  component: TargetDay,
  head: () => ({ meta: [{ title: "Target Day — Nova CRM" }] }),
});

function TargetDay() {
  const qc = useQueryClient();
  const tz = useTimezone();
  const getDay = useServerFn(getTargetDay);
  const syncFn = useServerFn(syncAllInbound);
  const nbaFn = useServerFn(aiNextBestActions);

  const q = useQuery({
    queryKey: ["target-day", tz],
    queryFn: () => getDay({ data: { tz } }),
    refetchInterval: 60_000,
  });

  const syncMut = useMutation({
    mutationFn: () => syncFn({}),
    onSuccess: (r: any) => {
      toast.success(`${r.total} email(s) synchronisé(s), ${r.notified} nouveau(x) reçu(s)`);
      qc.invalidateQueries({ queryKey: ["target-day"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const nbaMut = useMutation({
    mutationFn: () => nbaFn({}),
    onSuccess: () => toast.success("Actions prioritaires générées"),
    onError: (e: any) => toast.error(e.message),
  });

  const d = q.data;
  const meetings = (d?.activities ?? []).filter((a: any) => a.type === "meeting");
  const tasks = (d?.activities ?? []).filter((a: any) => a.type === "task");
  const notes = (d?.activities ?? []).filter((a: any) => a.type === "note");
  const emails = (d?.activities ?? []).filter((a: any) => a.type === "email");
  const inbound = d?.inbound ?? [];
  const checklist = d?.checklist ?? [];
  const oppMap = d?.opps ?? {};

  const totalItems = meetings.length + tasks.length + inbound.length + checklist.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Plan d'action journalier</p>
          <h1 className="font-display text-4xl font-bold text-white flex items-center gap-3">
            <Target className="h-8 w-8" /> Target Day
          </h1>
          <p className="mt-1 text-sm text-white/70">
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: tz }).format(new Date())} · {tz}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => syncMut.mutate()} disabled={syncMut.isPending} className="rounded-full bg-white/20 text-white">
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMut.isPending ? "animate-spin" : ""}`} />
            Synchroniser toutes les boîtes
          </Button>
          <Button onClick={() => nbaMut.mutate()} disabled={nbaMut.isPending} className="rounded-full bg-white text-[#FF5722]">
            <Sparkles className="mr-2 h-4 w-4" />
            {nbaMut.isPending ? "IA…" : "Générer mes priorités IA"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Rendez-vous" value={meetings.length} icon={<CalendarDays className="h-4 w-4" />} />
        <Stat label="Tâches" value={tasks.length} icon={<ListTodo className="h-4 w-4" />} />
        <Stat label="Reçus" value={inbound.length} icon={<Mail className="h-4 w-4" />} />
        <Stat label="Checklist" value={checklist.length} icon={<CheckSquare className="h-4 w-4" />} />
      </div>

      {totalItems === 0 && (
        <div className="glass rounded-3xl p-8 text-center text-white/70">
          Aucun rendez-vous, tâche ou email prévu aujourd'hui. Profitez-en pour lancer une analyse IA sur vos opportunités !
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Rendez-vous du jour" icon={<CalendarDays className="h-4 w-4" />} items={meetings} tz={tz} oppMap={oppMap} />
        <Section title="Tâches planifiées" icon={<ListTodo className="h-4 w-4" />} items={tasks} tz={tz} oppMap={oppMap} />
        <InboundSection items={inbound} tz={tz} oppMap={oppMap} />
        <ChecklistSection items={checklist} oppMap={oppMap} />
        {notes.length > 0 && <Section title="Notes du jour" icon={<StickyNote className="h-4 w-4" />} items={notes} tz={tz} oppMap={oppMap} />}
        {emails.length > 0 && <Section title="Emails envoyés aujourd'hui" icon={<Mail className="h-4 w-4" />} items={emails} tz={tz} oppMap={oppMap} />}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass halo rounded-3xl p-4">
      <div className="flex items-center justify-between text-white/70">
        <span className="text-xs uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

function Section({ title, icon, items, tz, oppMap }: any) {
  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="mb-3 flex items-center gap-2 font-display text-lg text-white">{icon}{title} ({items.length})</h3>
      <ul className="space-y-2">
        {items.map((a: any) => (
          <li key={a.id} className="rounded-2xl bg-white/10 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{a.title}</p>
                <p className="text-xs text-white/60">
                  {a.scheduled_at && formatInTz(a.scheduled_at, tz)}
                  {a.opportunity_id && oppMap[a.opportunity_id] && ` · ${oppMap[a.opportunity_id].name}`}
                </p>
                {a.content && <p className="mt-1 line-clamp-2 text-xs text-white/70">{a.content}</p>}
              </div>
              {a.opportunity_id && (
                <Link to="/crm/opportunities/$id" params={{ id: a.opportunity_id }} className="shrink-0 text-white/60 hover:text-white">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="text-xs text-white/60">Rien de prévu.</li>}
      </ul>
    </div>
  );
}

function InboundSection({ items, tz, oppMap }: any) {
  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="mb-3 flex items-center gap-2 font-display text-lg text-white"><Mail className="h-4 w-4" />Emails reçus aujourd'hui ({items.length})</h3>
      <ul className="space-y-2">
        {items.map((e: any) => (
          <li key={e.id} className="rounded-2xl bg-white/10 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{e.subject || "(sans sujet)"}</p>
                <p className="truncate text-xs text-white/60">
                  {e.from_email} · {formatInTz(e.received_at, tz)}
                  {e.opportunity_id && oppMap[e.opportunity_id] && ` · ${oppMap[e.opportunity_id].name}`}
                </p>
                {e.snippet && <p className="mt-1 line-clamp-2 text-xs text-white/70">{e.snippet}</p>}
              </div>
              {e.opportunity_id && (
                <Link to="/crm/opportunities/$id" params={{ id: e.opportunity_id }} className="shrink-0 text-white/60 hover:text-white">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="text-xs text-white/60">Aucun email reçu aujourd'hui.</li>}
      </ul>
    </div>
  );
}

function ChecklistSection({ items, oppMap }: any) {
  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="mb-3 flex items-center gap-2 font-display text-lg text-white"><CheckSquare className="h-4 w-4" />Actions prioritaires ({items.length})</h3>
      <ul className="space-y-2">
        {items.map((c: any) => (
          <li key={c.id} className="flex items-start gap-2 rounded-2xl bg-white/10 p-3">
            <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${c.priority === "high" ? "bg-red-300" : "bg-yellow-200"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white">{c.title}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50">
                {c.category} · {c.priority}
                {c.opportunity_id && oppMap[c.opportunity_id] && ` · ${oppMap[c.opportunity_id].name}`}
              </p>
            </div>
            {c.opportunity_id && (
              <Link to="/crm/opportunities/$id" params={{ id: c.opportunity_id }} className="text-white/60 hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="text-xs text-white/60">Aucune action prioritaire.</li>}
      </ul>
    </div>
  );
}
