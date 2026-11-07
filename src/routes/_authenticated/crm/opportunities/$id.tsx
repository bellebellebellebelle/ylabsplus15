import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useTimezone, formatInTz } from "@/crm/lib/format";
import { createActivity, deleteOpportunityDeep, listAuditLogs, getEmailProviderStatus } from "@/crm/lib/crm.functions";
import { ChatterPanel, ExchangesPanel, FilesPanel, TasksPanel, AgendaPanel, PriorityPicker } from "@/crm/components/native-panels";

import {
  aiSummarizeOpportunity,
  aiDraftEmail,
  aiScoreOpportunity,
  aiMeetingPrep,
  aiObjectionHandling,
  aiGenerateFollowUp,
} from "@/crm/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Sheet,
  FileText,
  Mail,
  CalendarPlus,
  ListTodo,
  StickyNote,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Wand2,
  Users,
  ShieldAlert,
  TrendingUp,
  MessageCircle,
  FolderOpen,
  Brain,
  Trash2,
  Star,
  Upload,
  Inbox,
  CheckSquare,
  RefreshCw,
  Zap,
  History,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export const Route = createFileRoute("/_authenticated/crm/opportunities/$id")({
  component: OppDetail,
});

function OppDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createAct = useServerFn(createActivity);
  const summarize = useServerFn(aiSummarizeOpportunity);
  const draftEmail = useServerFn(aiDraftEmail);
  const scoreOpp = useServerFn(aiScoreOpportunity);
  const meetingPrep = useServerFn(aiMeetingPrep);
  const objection = useServerFn(aiObjectionHandling);
  const deleteOpp = useServerFn(deleteOpportunityDeep);
  const genFollowUp = useServerFn(aiGenerateFollowUp);
  const listAudit = useServerFn(listAuditLogs);
  const providerFn = useServerFn(getEmailProviderStatus);
  const providerQ = useQuery({ queryKey: ["email-provider"], queryFn: () => providerFn() });
  const tz = useTimezone();

  const oppQ = useQuery({
    queryKey: ["opp", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_opportunities").select("*").eq("id", id).single();
      if (error) throw error;
      return data as any;
    },
  });

  const actsQ = useQuery({
    queryKey: ["opp-acts", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("opportunity_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const contactsQ = useQuery({
    queryKey: ["opp-contacts", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("crm_contacts")
        .select("*")
        .eq("opportunity_id", id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`opp-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_activities", filter: `opportunity_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["opp-acts", id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_opportunities", filter: `id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["opp", id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_contacts", filter: `opportunity_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["opp-contacts", id] });
      })
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [id, qc]);

  const summarizeMut = useMutation({
    mutationFn: () => summarize({ data: { opportunityId: id } }),
    onSuccess: () => { toast.success("Résumé IA généré"); qc.invalidateQueries({ queryKey: ["opp", id] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const scoreMut = useMutation({
    mutationFn: () => scoreOpp({ data: { opportunityId: id } }),
    onSuccess: () => { toast.success("Copilote IA mis à jour"); qc.invalidateQueries({ queryKey: ["opp", id] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteOpp({ data: { opportunityId: id } }),
    onSuccess: () => { toast.success("Opportunité supprimée"); navigate({ to: "/crm/opportunities" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStage = useMutation({
    mutationFn: async (stage: string) => {
      const { error } = await supabase.from("crm_opportunities").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opp", id] }),
  });

  if (oppQ.isLoading) return <div className="text-white/80">Chargement…</div>;
  const opp = oppQ.data;
  if (!opp) return <div>Introuvable</div>;

  return (
    <div className="space-y-6">
      <Link to="/crm/opportunities" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Toutes les opportunités
      </Link>

      <div className="glass halo rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-widest text-white/70">{opp.company ?? "—"}</p>
              {opp.priority && <PriorityChip priority={opp.priority} />}
            </div>
            <h1 className="font-display text-4xl font-bold text-white">{opp.name}</h1>
            <p className="mt-1 text-white/80">{opp.contact_name} · {opp.contact_email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={opp.stage} onValueChange={(v) => updateStage.mutate(v)}>
              <SelectTrigger className="w-40 border-white/30 bg-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["discovery", "qualification", "proposal", "negotiation", "won", "lost"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-full bg-white/20 px-4 py-2 font-display text-lg text-white">
              {Number(opp.value_amount || 0).toLocaleString("fr-FR")} €
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => scoreMut.mutate()} disabled={scoreMut.isPending} className="rounded-full bg-white/20 text-white">
            <Brain className="mr-2 h-4 w-4" />{scoreMut.isPending ? "Analyse…" : "Analyse IA complète"}
          </Button>
          <Button onClick={() => summarizeMut.mutate()} disabled={summarizeMut.isPending} variant="outline" className="rounded-full border-white/40 bg-white/10 text-white">
            <Sparkles className="mr-2 h-4 w-4" />{summarizeMut.isPending ? "IA…" : "Résumé stratégique"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="rounded-full border-red-300/40 bg-red-500/20 text-white hover:bg-red-500/30">
                <Trash2 className="mr-2 h-4 w-4" />Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-white/20 bg-[#2a0f08] text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette opportunité ?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/70">
                  Ses activités, échanges, contacts et fichiers seront également supprimés. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/10 text-white">Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMut.mutate()} className="bg-red-500 hover:bg-red-600">Supprimer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Copilot Panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ScoreCard label="Santé" score={opp.health_score} icon={<TrendingUp className="h-4 w-4" />} tint="from-emerald-400/40" />
        <ScoreCard label="Probabilité de closing" score={opp.closing_score ?? opp.probability} icon={<Star className="h-4 w-4" />} tint="from-yellow-300/40" />
        <div className="glass rounded-3xl p-6">
          <p className="text-xs uppercase tracking-widest text-white/70">Dernière analyse</p>
          <p className="mt-2 text-white">
            {opp.last_ai_analysis_at ? new Date(opp.last_ai_analysis_at).toLocaleString("fr-FR") : "Jamais"}
          </p>
          <p className="mt-3 text-xs text-white/60">
            Lancez « Analyse IA complète » pour rafraîchir les scores, risques et actions.
          </p>
        </div>
      </div>

      {opp.ai_summary && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-6">
          <h3 className="mb-2 font-display text-lg text-white"><span className="holo-text">Résumé stratégique</span></h3>
          <div className="whitespace-pre-wrap text-sm text-white/90">{opp.ai_summary}</div>
        </motion.div>
      )}

      {(Array.isArray(opp.risks) && opp.risks.length > 0) || (Array.isArray(opp.strengths) && opp.strengths.length > 0) ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ListPanel title="Risques" icon={<ShieldAlert className="h-4 w-4 text-red-200" />} items={opp.risks ?? []} accent="border-red-300/40" />
          <ListPanel title="Forces" icon={<TrendingUp className="h-4 w-4 text-emerald-200" />} items={opp.strengths ?? []} accent="border-emerald-300/40" />
        </div>
      ) : null}

      {Array.isArray(opp.next_actions) && opp.next_actions.length > 0 && (
        <div className="glass rounded-3xl p-6">
          <h3 className="mb-3 font-display text-lg text-white">Prochaines actions recommandées</h3>
          <ul className="space-y-2">
            {opp.next_actions.map((a: any, i: number) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${a.urgency === "high" ? "bg-red-300" : a.urgency === "medium" ? "bg-yellow-200" : "bg-emerald-200"}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{a.action}</p>
                  <p className="text-xs text-white/70">{a.why}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Tabs defaultValue="chatter">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-white/10 p-1.5">
          <TabsTrigger value="chatter" className="data-[state=active]:bg-white data-[state=active]:text-[#FF5722]"><Zap className="mr-2 h-4 w-4" />Fil d'activité</TabsTrigger>
          <TabsTrigger value="note" className="data-[state=active]:bg-white data-[state=active]:text-[#FF5722]"><StickyNote className="mr-2 h-4 w-4" />Note</TabsTrigger>
          <TabsTrigger value="exchanges" className="data-[state=active]:bg-white data-[state=active]:text-[#FF5722]"><Mail className="mr-2 h-4 w-4" />Échanges</TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:text-[#FF5722]"><ListTodo className="mr-2 h-4 w-4" />Tâches & Jalons</TabsTrigger>
          <TabsTrigger value="agenda" className="data-[state=active]:bg-white data-[state=active]:text-[#FF5722]"><CalendarPlus className="mr-2 h-4 w-4" />Agenda</TabsTrigger>
          <TabsTrigger value="files" className="data-[state=active]:bg-white data-[state=active]:text-[#FF5722]"><FolderOpen className="mr-2 h-4 w-4" />Fichiers</TabsTrigger>
          <TabsTrigger value="checklist" className="data-[state=active]:bg-white data-[state=active]:text-[#FF5722]"><CheckSquare className="mr-2 h-4 w-4" />Checklist</TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-white data-[state=active]:text-[#FF5722]"><Users className="mr-2 h-4 w-4" />Contacts</TabsTrigger>
          <TabsTrigger value="copilot" className="data-[state=active]:bg-white data-[state=active]:text-[#FF5722]"><Brain className="mr-2 h-4 w-4" />Copilote</TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-white data-[state=active]:text-[#FF5722]"><History className="mr-2 h-4 w-4" />Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="chatter">
          <ChatterPanel oppId={id} activities={actsQ.data ?? []} tz={tz} />
        </TabsContent>
        <TabsContent value="note">
          <NoteComposer oppId={id} createAct={createAct} qc={qc} />
        </TabsContent>
        <TabsContent value="exchanges">
          <ExchangesPanel oppId={id} tz={tz} mailgun={!!providerQ.data?.mailgun} composer={<EmailComposer oppId={id} defaultTo={opp.contact_email ?? ""} createAct={createAct} draftEmail={draftEmail} genFollowUp={genFollowUp} qc={qc} />} />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksPanel oppId={id} activities={actsQ.data ?? []} tz={tz} composer={<TaskComposer oppId={id} createAct={createAct} qc={qc} />} />
        </TabsContent>
        <TabsContent value="agenda">
          <AgendaPanel oppId={id} activities={actsQ.data ?? []} tz={tz} composer={<MeetingComposer oppId={id} createAct={createAct} qc={qc} />} />
        </TabsContent>
        <TabsContent value="files">
          <FilesPanel oppId={id} />
        </TabsContent>
        <TabsContent value="checklist">
          <ChecklistPanel oppId={id} />
        </TabsContent>
        <TabsContent value="contacts">
          <ContactsPanel oppId={id} contacts={contactsQ.data ?? []} qc={qc} />
        </TabsContent>
        <TabsContent value="copilot">
          <CopilotPanel oppId={id} meetingPrep={meetingPrep} objection={objection} tz={tz} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditPanel oppId={id} listAudit={listAudit} tz={tz} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PriorityChip({ priority }: { priority: string }) {
  const c =
    priority === "high"
      ? "bg-red-400/30 text-red-100 border-red-300/40"
      : priority === "medium"
        ? "bg-yellow-300/20 text-yellow-100 border-yellow-200/40"
        : "bg-emerald-300/20 text-emerald-100 border-emerald-200/40";
  return <span className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wider ${c}`}>priorité {priority}</span>;
}

function ScoreCard({ label, score, icon, tint }: { label: string; score?: number | null; icon: React.ReactNode; tint: string }) {
  const v = typeof score === "number" ? Math.max(0, Math.min(100, score)) : null;
  return (
    <div className={`glass halo relative overflow-hidden rounded-3xl p-6`}>
      <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl`} />
      <div className="flex items-center justify-between text-white/80">
        <span className="text-xs uppercase tracking-widest">{label}</span>
        <span className="opacity-80">{icon}</span>
      </div>
      <p className="mt-3 font-display text-4xl font-bold text-white">{v ?? "—"}{v !== null && <span className="text-lg">/100</span>}</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${v ?? 0}%` }} />
      </div>
    </div>
  );
}

function ListPanel({ title, icon, items, accent }: { title: string; icon: React.ReactNode; items: string[]; accent: string }) {
  return (
    <div className={`glass rounded-3xl border-l-2 ${accent} p-5`}>
      <h3 className="mb-2 flex items-center gap-2 font-display text-lg text-white">{icon}{title}</h3>
      <ul className="space-y-1 text-sm text-white/90">
        {items.map((r, i) => <li key={i} className="rounded-lg bg-white/10 p-2">{typeof r === "string" ? r : JSON.stringify(r)}</li>)}
      </ul>
    </div>
  );
}

function ContactsPanel({ oppId, contacts, qc }: any) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "", is_decision_maker: false });
  const addMut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("crm_contacts").insert({ ...form, opportunity_id: oppId, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact ajouté");
      setForm({ name: "", email: "", phone: "", role: "", is_decision_maker: false });
      qc.invalidateQueries({ queryKey: ["opp-contacts", oppId] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: async (cid: string) => {
      const { error } = await (supabase as any).from("crm_contacts").delete().eq("id", cid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opp-contacts", oppId] }),
  });
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="glass rounded-3xl p-5 space-y-3">
        <h3 className="font-display text-lg text-white">Ajouter un contact</h3>
        <Input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-white/30 bg-white/10 text-white" />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border-white/30 bg-white/10 text-white" />
        <Input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border-white/30 bg-white/10 text-white" />
        <Input placeholder="Rôle (CFO, buyer, sponsor…)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border-white/30 bg-white/10 text-white" />
        <label className="flex items-center gap-2 text-sm text-white/90">
          <input type="checkbox" checked={form.is_decision_maker} onChange={(e) => setForm({ ...form, is_decision_maker: e.target.checked })} /> Décideur
        </label>
        <Button onClick={() => addMut.mutate()} disabled={!form.name || addMut.isPending} className="w-full rounded-full bg-white text-[#FF5722]">Ajouter</Button>
      </div>
      <div className="glass rounded-3xl p-5">
        <h3 className="mb-3 font-display text-lg text-white">Contacts ({contacts.length})</h3>
        <ul className="space-y-2">
          {contacts.map((c: any) => (
            <li key={c.id} className="flex items-start justify-between gap-2 rounded-2xl bg-white/10 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">
                  {c.name} {c.is_decision_maker && <span className="ml-1 rounded-full bg-yellow-300/30 px-2 py-0.5 text-xs text-yellow-100">Décideur</span>}
                </p>
                <p className="truncate text-xs text-white/70">{c.role} · {c.email} · {c.phone}</p>
              </div>
              <button onClick={() => delMut.mutate(c.id)} className="text-white/60 hover:text-white"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
          {contacts.length === 0 && <li className="text-sm text-white/60">Aucun contact ajouté.</li>}
        </ul>
      </div>
    </div>
  );
}

function CopilotPanel({ oppId, meetingPrep, objection, tz }: any) {
  const [brief, setBrief] = useState("");
  const [obj, setObj] = useState("");
  const [objResp, setObjResp] = useState("");
  const inboundQ = useQuery({
    queryKey: ["opp-inbound-copilot", oppId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("sendy_email_threads").select("id,subject,body,snippet,from_email,received_at")
        .eq("opportunity_id", oppId).eq("direction", "inbound")
        .order("received_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });
  const briefMut = useMutation({
    mutationFn: () => meetingPrep({ data: { opportunityId: oppId } }),
    onSuccess: (r: any) => setBrief(r.brief),
    onError: (e: any) => toast.error(e.message),
  });
  const objMut = useMutation({
    mutationFn: () => objection({ data: { opportunityId: oppId, objection: obj } }),
    onSuccess: (r: any) => setObjResp(r.response),
    onError: (e: any) => toast.error(e.message),
  });
  const inbound = inboundQ.data ?? [];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="glass rounded-3xl p-5 space-y-3">
        <h3 className="font-display text-lg text-white">Brief de rendez-vous</h3>
        <Button onClick={() => briefMut.mutate()} disabled={briefMut.isPending} className="rounded-full bg-white/20 text-white">
          <Sparkles className="mr-2 h-4 w-4" />{briefMut.isPending ? "Préparation…" : "Générer le brief"}
        </Button>
        {brief && <div className="whitespace-pre-wrap rounded-2xl bg-white/10 p-3 text-sm text-white/90">{brief}</div>}
      </div>
      <div className="glass rounded-3xl p-5 space-y-3">
        <h3 className="font-display text-lg text-white">Traitement d'objection</h3>
        {inbound.length > 0 && (
          <div>
            <Label className="text-white/80 text-xs">Sélectionner un email d'objection reçu</Label>
            <Select onValueChange={(v) => {
              const e = inbound.find((x: any) => x.id === v);
              if (e) setObj(`Sujet: ${e.subject}\nDe: ${e.from_email}\n\n${e.body || e.snippet || ""}`);
            }}>
              <SelectTrigger className="mt-1 border-white/30 bg-white/10 text-white"><SelectValue placeholder="Choisir un email…" /></SelectTrigger>
              <SelectContent>
                {inbound.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{(e.subject || "(sans sujet)").slice(0, 60)} — {formatInTz(e.received_at, tz)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Textarea rows={6} placeholder="Ex: c'est trop cher, on n'a pas le budget cette année…" value={obj} onChange={(e) => setObj(e.target.value)} className="border-white/30 bg-white/10 text-white" />
        <Button onClick={() => objMut.mutate()} disabled={!obj || objMut.isPending} className="rounded-full bg-white/20 text-white">
          <MessageCircle className="mr-2 h-4 w-4" />{objMut.isPending ? "Analyse…" : "Analyser & proposer des réponses"}
        </Button>
        {objResp && <div className="whitespace-pre-wrap rounded-2xl bg-white/10 p-3 text-sm text-white/90">{objResp}</div>}
      </div>
    </div>
  );
}


function EmailComposer({ oppId, defaultTo, createAct, draftEmail, genFollowUp, qc }: any) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [instr, setInstr] = useState("");

  const draftMut = useMutation({
    mutationFn: () => draftEmail({ data: { opportunityId: oppId, instructions: instr } }),
    onSuccess: (r: any) => { setSubject(r.subject); setBody(r.body); toast.success("Brouillon IA prêt"); },
  });

  const sendMut = useMutation({
    mutationFn: () => createAct({ data: { opportunityId: oppId, type: "email", title: subject, content: body, to } }),
    onSuccess: (r: any) => { toast.success(r?.deliveryNote ?? "Email envoyé"); setSubject(""); setBody(""); qc.invalidateQueries({ queryKey: ["opp-acts", oppId] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="glass rounded-3xl p-6 space-y-3">
      <div className="flex gap-2">
        <Input placeholder="Instructions IA (ex: relance après démo)" value={instr} onChange={(e) => setInstr(e.target.value)} className="border-white/30 bg-white/10 text-white" />
        <Button onClick={() => draftMut.mutate()} disabled={!instr || draftMut.isPending} className="rounded-full bg-white/20 text-white">
          <Sparkles className="mr-2 h-4 w-4" />Rédiger
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["email", "relance"] as const).map((k) => (
          <Button key={k} size="sm" variant="outline" onClick={async () => {
            try {
              const r: any = await genFollowUp({ data: { opportunityId: oppId, kind: k } });
              if (r.subject) { setSubject(r.subject); setBody(r.body); toast.success(`Brouillon ${k} prêt`); }
            } catch (e: any) { toast.error(e.message); }
          }} className="rounded-full border-white/40 bg-white/10 text-white">
            <Zap className="mr-2 h-3 w-3" />{k === "email" ? "Suivi IA" : "Relance IA"}
          </Button>
        ))}
      </div>
      <Input placeholder="Destinataire" value={to} onChange={(e) => setTo(e.target.value)} className="border-white/30 bg-white/10 text-white" />
      <Input placeholder="Sujet" value={subject} onChange={(e) => setSubject(e.target.value)} className="border-white/30 bg-white/10 text-white" />
      <Textarea placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="border-white/30 bg-white/10 text-white" />
      <Button onClick={() => sendMut.mutate()} disabled={!to || !subject || sendMut.isPending} className="w-full rounded-full bg-white text-[#FF5722]">Envoyer</Button>
    </div>
  );
}

function MeetingComposer({ oppId, createAct, qc }: any) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const m = useMutation({
    mutationFn: () => createAct({ data: { opportunityId: oppId, type: "meeting", title, content: notes, scheduledAt: new Date(when).toISOString(), durationMinutes: duration, location: location || undefined } }),
    onSuccess: () => { toast.success("Rendez-vous planifié"); setTitle(""); setWhen(""); setNotes(""); qc.invalidateQueries({ queryKey: ["opp-acts", oppId] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="glass rounded-3xl p-6 space-y-3">
      <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} className="border-white/30 bg-white/10 text-white" />
      <div className="grid grid-cols-2 gap-3">
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="border-white/30 bg-white/10 text-white" />
        <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="border-white/30 bg-white/10 text-white" placeholder="Durée (min)" />
      </div>
      <Input placeholder="Lieu ou lien visio" value={location} onChange={(e) => setLocation(e.target.value)} className="border-white/30 bg-white/10 text-white" />
      <Textarea placeholder="Notes / agenda" value={notes} onChange={(e) => setNotes(e.target.value)} className="border-white/30 bg-white/10 text-white" />
      <Button onClick={() => m.mutate()} disabled={!title || !when || m.isPending} className="w-full rounded-full bg-white text-[#FF5722]">Planifier le rendez-vous</Button>
    </div>
  );
}

function TaskComposer({ oppId, createAct, qc }: any) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("medium");
  const m = useMutation({
    mutationFn: () => createAct({ data: { opportunityId: oppId, type: "task", title, content: notes, priority, scheduledAt: due ? new Date(due).toISOString() : undefined } }),
    onSuccess: () => { toast.success("Tâche créée"); setTitle(""); setDue(""); setNotes(""); qc.invalidateQueries({ queryKey: ["opp-acts", oppId] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="glass rounded-3xl p-6 space-y-3">
      <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} className="border-white/30 bg-white/10 text-white" />
      <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="border-white/30 bg-white/10 text-white" />
      <PriorityPicker value={priority} onChange={setPriority} />
      <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="border-white/30 bg-white/10 text-white" />
      <Button onClick={() => m.mutate()} disabled={!title || m.isPending} className="w-full rounded-full bg-white text-[#FF5722]">Créer la tâche</Button>
    </div>
  );
}

function NoteComposer({ oppId, createAct, qc }: any) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const m = useMutation({
    mutationFn: () => createAct({ data: { opportunityId: oppId, type: "note", title, content } }),
    onSuccess: () => { toast.success("Note enregistrée"); setTitle(""); setContent(""); qc.invalidateQueries({ queryKey: ["opp-acts", oppId] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="glass rounded-3xl p-6 space-y-3">
      <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} className="border-white/30 bg-white/10 text-white" />
      <Textarea placeholder="Contenu" value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="border-white/30 bg-white/10 text-white" />
      <Button onClick={() => m.mutate()} disabled={!title || m.isPending} className="w-full rounded-full bg-white text-[#FF5722]">Enregistrer la note</Button>
    </div>
  );
}

// --- Checklist tab ------------------------------------------------------
function ChecklistPanel({ oppId }: { oppId: string }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("action");
  const [priority, setPriority] = useState("medium");

  const listQ = useQuery({
    queryKey: ["opp-checklist", oppId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("crm_closing_checklists")
        .select("*")
        .eq("opportunity_id", oppId)
        .order("order_index", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`chk-${oppId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_closing_checklists", filter: `opportunity_id=eq.${oppId}` }, () => {
        qc.invalidateQueries({ queryKey: ["opp-checklist", oppId] });
      })
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [oppId, qc]);

  const addMut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("crm_closing_checklists").insert({
        user_id: user!.id, opportunity_id: oppId, title, category, priority, source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => { setTitle(""); toast.success("Étape ajoutée"); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: async (item: any) => {
      const status = item.status === "done" ? "pending" : "done";
      await (supabase as any).from("crm_closing_checklists").update({ status }).eq("id", item.id);
    },
  });
  const delMut = useMutation({
    mutationFn: async (idv: string) => { await (supabase as any).from("crm_closing_checklists").delete().eq("id", idv); },
  });

  const items = listQ.data ?? [];
  const grouped: Record<string, any[]> = { action: [], risk: [], dependency: [] };
  for (const it of items) (grouped[it.category] ?? grouped.action).push(it);
  const catLabel: Record<string, string> = { action: "Actions", risk: "Risques", dependency: "Dépendances" };

  return (
    <div className="space-y-4">
      <div className="glass rounded-3xl p-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_140px_auto]">
          <Input placeholder="Nouvelle étape de closing…" value={title} onChange={(e) => setTitle(e.target.value)} className="border-white/30 bg-white/10 text-white" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="border-white/30 bg-white/10 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="action">Action</SelectItem>
              <SelectItem value="risk">Risque</SelectItem>
              <SelectItem value="dependency">Dépendance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="border-white/30 bg-white/10 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Priorité haute</SelectItem>
              <SelectItem value="medium">Priorité moyenne</SelectItem>
              <SelectItem value="low">Priorité basse</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => addMut.mutate()} disabled={!title || addMut.isPending} className="rounded-full bg-white text-[#FF5722]">Ajouter</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(["action", "risk", "dependency"] as const).map((cat) => (
          <div key={cat} className="glass rounded-3xl p-4">
            <h4 className="mb-2 font-display text-white">{catLabel[cat]} ({grouped[cat].length})</h4>
            <ul className="space-y-2">
              {grouped[cat].map((it: any) => (
                <li key={it.id} className="flex items-start gap-2 rounded-2xl bg-white/10 p-2">
                  <Checkbox checked={it.status === "done"} onCheckedChange={() => toggleMut.mutate(it)} className="mt-1 border-white/50" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm text-white ${it.status === "done" ? "line-through opacity-60" : ""}`}>{it.title}</p>
                    {it.description && <p className="text-xs text-white/60">{it.description}</p>}
                    <p className="text-[10px] uppercase tracking-widest text-white/50">{it.priority} · {it.source === "ai" ? "IA" : "manuel"}</p>
                  </div>
                  <button onClick={() => delMut.mutate(it.id)} className="text-white/50 hover:text-white"><Trash2 className="h-3 w-3" /></button>
                </li>
              ))}
              {grouped[cat].length === 0 && <li className="text-xs text-white/50">—</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}


// --- Audit log panel ---------------------------------------------------
function AuditPanel({ oppId, listAudit, tz }: any) {
  const q = useQuery({
    queryKey: ["opp-audit", oppId],
    queryFn: () => listAudit({ data: { opportunityId: oppId } }),
    refetchInterval: 30_000,
  });
  const rows = q.data ?? [];
  return (
    <div className="glass rounded-3xl p-4">
      <ul className="space-y-2">
        {rows.map((r: any) => (
          <li key={r.id} className="rounded-2xl bg-white/10 p-3 text-sm text-white/90">
            <p className="font-medium">{r.action}</p>
            <p className="text-xs text-white/60">{formatInTz(r.created_at, tz)} · {r.entity ?? ""} {r.entity_id ?? ""}</p>
            {r.details && Object.keys(r.details).length > 0 && (
              <pre className="mt-1 max-h-24 overflow-auto rounded bg-black/30 p-2 text-[10px] text-white/70">{JSON.stringify(r.details, null, 2)}</pre>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="text-xs text-white/60">Aucune action enregistrée.</li>}
      </ul>
    </div>
  );
}
