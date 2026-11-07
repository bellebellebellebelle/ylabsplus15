import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Mail, CalendarPlus, ListTodo, StickyNote } from "lucide-react";
import { motion } from "motion/react";

export const Route = createFileRoute("/_authenticated/crm/activities")({
  component: Activities,
  head: () => ({ meta: [{ title: "Activités — Nova CRM" }] }),
});

const ICON: Record<string, any> = { email: Mail, meeting: CalendarPlus, task: ListTodo, note: StickyNote };

function Activities() {
  const q = useQuery({
    queryKey: ["all-acts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_activities")
        .select("*, opportunities:crm_opportunities(name,company)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("acts-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_activities" }, () => q.refetch())
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [q]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">Flux</p>
        <h1 className="font-display text-4xl font-bold text-white">Toutes les activités</h1>
      </div>
      <div className="glass rounded-3xl p-4">
        <ul className="divide-y divide-white/10">
          {(q.data ?? []).map((a: any, i: number) => {
            const Icon = ICON[a.type] ?? StickyNote;
            return (
              <motion.li key={a.id} initial={{opacity:0, x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}} className="flex items-center gap-3 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 text-white"><Icon className="h-4 w-4"/></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{a.title}</p>
                  <p className="truncate text-xs text-white/60">
                    {a.opportunities?.name ?? "—"} · {new Date(a.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">{a.status}</span>
                {a.external_url && <a href={a.external_url} target="_blank" rel="noreferrer" className="text-white/80"><ExternalLink className="h-4 w-4"/></a>}
              </motion.li>
            );
          })}
          {(q.data ?? []).length === 0 && <li className="p-4 text-sm text-white/70">Aucune activité pour l'instant.</li>}
        </ul>
      </div>
    </div>
  );
}
