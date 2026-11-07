import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listProjects, proposeProjectPlan, createProjectFromPlan } from "@/noject/lib/projects.functions";
import { toast } from "sonner";
import { Sparkles, Plus, FolderKanban, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Route = createFileRoute("/_authenticated/noject/projects/")({ component: Projects });

function Projects() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const fetchProjects = useServerFn(listProjects);
  const propose = useServerFn(proposeProjectPlan);
  const commit = useServerFn(createProjectFromPlan);

  const projects = useQuery({ queryKey: ["projects"], queryFn: () => fetchProjects({}) });

  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [plan, setPlan] = useState<any>(null);

  const proposeMut = useMutation({
    mutationFn: (d: string) => propose({ data: { description: d, useAI: true } }),
    onSuccess: (p) => setPlan(p),
    onError: (e: any) => toast.error(e.message),
  });
  const commitMut = useMutation({
    mutationFn: () => commit({ data: { plan } }),
    onSuccess: ({ project }) => {
      toast.success("Projet créé !");
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false); setPlan(null); setDesc("");
      nav({ to: "/noject/projects/$projectId", params: { projectId: project.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="chip"><FolderKanban className="size-3" /> Projets</div>
          <h1 className="mt-2 font-display text-4xl font-bold">Mes projets</h1>
          <p className="text-muted-foreground">Créez un projet, l'IA le structure automatiquement.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-holo hover:btn-holo-hover"><Plus className="size-4" /> Nouveau projet</button>
      </div>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(projects.data ?? []).map((p: any) => (
          <Link key={p.id} to="/noject/projects/$projectId" params={{ projectId: p.id }}
            className="bento p-5 hover:shadow-[0_20px_60px_oklch(0.68_0.28_15/.35)] transition">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${p.color ?? "#FF204E"}, #5D0E41)` }} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.phase} · {p.status}</div>
              </div>
            </div>
            {p.objective && <p className="mt-3 text-sm text-white/80 line-clamp-2">{p.objective}</p>}
            <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[oklch(0.68_0.28_15)] to-[oklch(0.30_0.20_340)]" style={{ width: `${p.progress ?? 0}%` }} />
            </div>
          </Link>
        ))}
        {(!projects.data || projects.data.length === 0) && (
          <div className="bento p-8 text-center sm:col-span-2 lg:col-span-3">
            <div className="text-muted-foreground">Aucun projet. Créez le premier !</div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.98 }}
              onClick={e => e.stopPropagation()}
              className="bento-holo w-full max-w-3xl p-6 max-h-[85vh] overflow-auto">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5" />
                <h2 className="font-display text-2xl font-bold">Nouveau projet</h2>
              </div>
              {!plan ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Décrivez votre projet en détails. L'IA générera un plan complet.</p>
                  <textarea rows={6} className="input-field focus:input-field-focus resize-none"
                    placeholder="Ex: Lancer une marque de café de spécialité à Paris avec e-commerce et 2 boutiques d'ici 8 mois. Budget 120k€."
                    value={desc} onChange={e => setDesc(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
                    <button className="btn-holo hover:btn-holo-hover" disabled={proposeMut.isPending || desc.length < 5}
                      onClick={() => proposeMut.mutate(desc)}>
                      {proposeMut.isPending ? <><Loader2 className="size-4 animate-spin" /> Génération…</> : <><Sparkles className="size-4" /> Générer le plan IA</>}
                    </button>
                  </div>
                </div>
              ) : (
                <PlanEditor plan={plan} onChange={setPlan} onBack={() => setPlan(null)}
                  onConfirm={() => commitMut.mutate()} confirming={commitMut.isPending} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanEditor({ plan, onChange, onConfirm, onBack, confirming }: any) {
  const set = (k: string, v: any) => onChange({ ...plan, [k]: v });
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom"><input className="input-field" value={plan.name ?? ""} onChange={e => set("name", e.target.value)} /></Field>
        <Field label="Objectif"><input className="input-field" value={plan.objective ?? ""} onChange={e => set("objective", e.target.value)} /></Field>
        <Field label="Début"><input type="date" className="input-field" value={plan.start_date ?? ""} onChange={e => set("start_date", e.target.value)} /></Field>
        <Field label="Fin"><input type="date" className="input-field" value={plan.end_date ?? ""} onChange={e => set("end_date", e.target.value)} /></Field>
      </div>
      <Field label="Description">
        <textarea rows={3} className="input-field resize-none" value={plan.description ?? ""} onChange={e => set("description", e.target.value)} />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="bento p-3">
          <div className="text-xs uppercase text-white/70">Phases ({(plan.phases ?? []).length})</div>
          <ul className="mt-2 space-y-1 text-sm">
            {(plan.phases ?? []).map((p: any, i: number) => <li key={i}>• <b>{p.name}</b> — {p.duration_days}j</li>)}
          </ul>
        </div>
        <div className="bento p-3">
          <div className="text-xs uppercase text-white/70">Tâches ({(plan.tasks ?? []).length})</div>
          <ul className="mt-2 space-y-1 text-sm max-h-40 overflow-auto">
            {(plan.tasks ?? []).map((t: any, i: number) => <li key={i}>• {t.title} <span className="text-white/50">[{t.phase}, {t.priority}]</span></li>)}
          </ul>
        </div>
        <div className="bento p-3">
          <div className="text-xs uppercase text-white/70">Risques</div>
          <ul className="mt-2 space-y-1 text-sm">
            {(plan.risks ?? []).map((r: any, i: number) => <li key={i}>• {r.name} <span className="text-white/50">[{r.impact}]</span></li>)}
          </ul>
        </div>
        <div className="bento p-3">
          <div className="text-xs uppercase text-white/70">KPI</div>
          <ul className="mt-2 space-y-1 text-sm">
            {(plan.kpis ?? []).map((k: any, i: number) => <li key={i}>• {k.name}: {k.target}</li>)}
          </ul>
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <button className="btn-ghost" onClick={onBack}>Modifier la description</button>
        <button className="btn-holo hover:btn-holo-hover" disabled={confirming} onClick={onConfirm}>
          {confirming ? <><Loader2 className="size-4 animate-spin" /> Création…</> : <>Créer le projet</>}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs uppercase tracking-wide text-white/70">{label}</span><div className="mt-1">{children}</div></label>;
}
