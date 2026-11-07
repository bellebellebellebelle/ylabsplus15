import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  StickyNote, CalendarPlus, ListTodo, Mail, Circle, CheckCircle2, Trash2, Upload, Download,
  FileText, ArrowDownLeft, ArrowUpRight, Clock, MapPin, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatInTz } from "@/crm/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateActivity, deleteActivity, FILES_BUCKET } from "@/crm/lib/crm.functions";

const field = "border-white/30 bg-white/10 text-white placeholder:text-white/50";
const TYPE_META: Record<string, { label: string; icon: any; dot: string }> = {
  note: { label: "Note", icon: StickyNote, dot: "bg-yellow-200" },
  meeting: { label: "Rendez-vous", icon: CalendarPlus, dot: "bg-sky-300" },
  task: { label: "Tâche", icon: ListTodo, dot: "bg-emerald-300" },
  email: { label: "Email", icon: Mail, dot: "bg-pink-300" },
};

function useActivityActions(oppId: string) {
  const qc = useQueryClient();
  const upd = useServerFn(updateActivity);
  const del = useServerFn(deleteActivity);
  const refresh = () => qc.invalidateQueries({ queryKey: ["opp-acts", oppId] });
  const toggle = useMutation({
    mutationFn: (a: any) => upd({ data: { id: a.id, status: a.status === "done" ? "pending" : "done" } }),
    onSuccess: refresh,
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Supprimé"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });
  return { toggle, remove };
}

function isOverdue(a: any) {
  return a.status === "pending" && a.scheduled_at && new Date(a.scheduled_at) < new Date();
}

function ActivityRow({ a, tz, oppId }: { a: any; tz: string; oppId: string }) {
  const { toggle, remove } = useActivityActions(oppId);
  const meta = TYPE_META[a.type] ?? TYPE_META.note;
  const Icon = meta.icon;
  const done = a.status === "done";
  const canToggle = a.type === "task" || a.type === "meeting";
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative">
      <span className={`absolute -left-[27px] top-3 h-3 w-3 rounded-full ${meta.dot} shadow-[0_0_10px_rgba(255,255,255,0.6)]`} />
      <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
        {canToggle ? (
          <button aria-label="Basculer le statut" onClick={() => toggle.mutate(a)} className="mt-0.5 text-white/80 hover:text-white">
            {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </button>
        ) : (
          <Icon className="mt-0.5 h-4 w-4 text-white/80" />
        )}
        <div className="min-w-0 flex-1">
          <p className={`font-medium text-white ${done && canToggle ? "line-through opacity-60" : ""}`}>{a.title}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-white/60">
            <span>{meta.label}</span>
            <span>· créé {formatInTz(a.created_at, tz)}</span>
            {a.scheduled_at && (
              <span className={isOverdue(a) ? "text-red-200" : ""}>
                <Clock className="mr-0.5 inline h-3 w-3" />{formatInTz(a.scheduled_at, tz)}
                {a.duration_minutes ? ` · ${a.duration_minutes} min` : ""}
              </span>
            )}
            {a.location && <span><MapPin className="mr-0.5 inline h-3 w-3" />{a.location}</span>}
            {a.priority === "high" && <span className="rounded-full bg-red-400/30 px-1.5 text-red-100">priorité haute</span>}
          </p>
          {a.content && <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{a.content}</p>}
        </div>
        <button aria-label="Supprimer" onClick={() => remove.mutate(a.id)} className="text-white/50 hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </motion.li>
  );
}

/** Odoo-style chatter: every note, meeting, task and email of the prospect in one live feed. */
export function ChatterPanel({ oppId, activities, tz }: { oppId: string; activities: any[]; tz: string }) {
  const [filter, setFilter] = useState<string>("all");
  const pending = activities.filter((a) => a.status === "pending" && (a.type === "task" || a.type === "meeting"));
  const list = filter === "all" ? activities : activities.filter((a) => a.type === filter);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="glass rounded-3xl p-4 lg:col-span-2">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {[["all", "Tout"], ["note", "Notes"], ["meeting", "Rendez-vous"], ["task", "Tâches"], ["email", "Emails"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 text-xs ${filter === k ? "bg-white text-primary" : "bg-white/10 text-white"}`}>{l}</button>
          ))}
        </div>
        <ol className="relative space-y-3 border-l border-white/20 pl-5">
          <AnimatePresence initial={false}>
            {list.map((a) => <ActivityRow key={a.id} a={a} tz={tz} oppId={oppId} />)}
          </AnimatePresence>
          {list.length === 0 && <li className="text-sm text-white/60">Aucune activité. Créez une note, un rendez-vous ou une tâche : elle apparaîtra ici instantanément.</li>}
        </ol>
      </div>
      <div className="glass rounded-3xl p-4">
        <h3 className="mb-3 font-display text-lg text-white">Activités planifiées ({pending.length})</h3>
        <ul className="space-y-2">
          {pending.slice().sort((x, y) => String(x.scheduled_at ?? "9").localeCompare(String(y.scheduled_at ?? "9"))).map((a) => (
            <li key={a.id} className={`rounded-xl p-2 text-sm ${isOverdue(a) ? "bg-red-500/20" : "bg-white/10"}`}>
              <p className="truncate text-white">{a.title}</p>
              <p className="text-xs text-white/60">
                {isOverdue(a) && <AlertTriangle className="mr-1 inline h-3 w-3 text-red-200" />}
                {TYPE_META[a.type]?.label} {a.scheduled_at ? `· ${formatInTz(a.scheduled_at, tz)}` : ""}
              </p>
            </li>
          ))}
          {pending.length === 0 && <li className="text-xs text-white/60">Rien de planifié.</li>}
        </ul>
      </div>
    </div>
  );
}

export function TasksPanel({ oppId, activities, tz, composer }: { oppId: string; activities: any[]; tz: string; composer: React.ReactNode }) {
  const tasks = activities.filter((a) => a.type === "task");
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");
  const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div>{composer}</div>
      <div className="glass rounded-3xl p-4 lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg text-white">Tâches & jalons</h3>
          <span className="text-xs text-white/70">{done.length}/{tasks.length} · {pct}%</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-white transition-all" style={{ width: `${pct}%` }} /></div>
        <ol className="relative space-y-3 border-l border-white/20 pl-5">
          {[...open, ...done].map((a) => <ActivityRow key={a.id} a={a} tz={tz} oppId={oppId} />)}
          {tasks.length === 0 && <li className="text-sm text-white/60">Aucune tâche.</li>}
        </ol>
      </div>
    </div>
  );
}

export function AgendaPanel({ oppId, activities, tz, composer }: { oppId: string; activities: any[]; tz: string; composer: React.ReactNode }) {
  const meetings = activities.filter((a) => a.type === "meeting");
  const now = Date.now();
  const upcoming = meetings.filter((m) => m.scheduled_at && new Date(m.scheduled_at).getTime() >= now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const past = meetings.filter((m) => !upcoming.includes(m));
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div>{composer}</div>
      <div className="glass rounded-3xl p-4 lg:col-span-2 space-y-4">
        <div>
          <h3 className="mb-2 font-display text-lg text-white">À venir ({upcoming.length})</h3>
          <ol className="relative space-y-3 border-l border-white/20 pl-5">
            {upcoming.map((a) => <ActivityRow key={a.id} a={a} tz={tz} oppId={oppId} />)}
            {upcoming.length === 0 && <li className="text-sm text-white/60">Aucun rendez-vous à venir.</li>}
          </ol>
        </div>
        {past.length > 0 && (
          <div>
            <h3 className="mb-2 font-display text-sm uppercase tracking-widest text-white/60">Passés</h3>
            <ol className="relative space-y-3 border-l border-white/20 pl-5 opacity-80">
              {past.map((a) => <ActivityRow key={a.id} a={a} tz={tz} oppId={oppId} />)}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

/** Exchange hub: outbound + inbound emails stored natively; Mailgun delivers when configured. */
export function ExchangesPanel({ oppId, tz, composer, mailgun }: { oppId: string; tz: string; composer: React.ReactNode; mailgun: boolean }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [dir, setDir] = useState("all");
  const q = useQuery({
    queryKey: ["opp-emails", oppId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("sendy_email_threads").select("*")
        .eq("opportunity_id", oppId).order("received_at", { ascending: false });
      return data ?? [];
    },
  });
  useEffect(() => {
    const ch = supabase.channel(`emails-${oppId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sendy_email_threads", filter: `opportunity_id=eq.${oppId}` },
        () => qc.invalidateQueries({ queryKey: ["opp-emails", oppId] }))
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [oppId, qc]);
  const all = q.data ?? [];
  const emails = dir === "all" ? all : all.filter((e: any) => e.direction === dir);
  return (
    <div className="space-y-4">
      {!mailgun && (
        <div className="glass rounded-2xl p-3 text-xs text-white/80">
          Les emails sont enregistrés dans la fiche. L'envoi réel s'activera dès que vos identifiants Mailgun seront ajoutés.
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">{composer}</div>
        <div className="glass rounded-3xl p-4">
          <div className="mb-3 flex gap-1.5">
            {[["all", "Tous"], ["inbound", "Reçus"], ["outbound", "Envoyés"]].map(([k, l]) => (
              <button key={k} onClick={() => setDir(k)} className={`rounded-full px-3 py-1 text-xs ${dir === k ? "bg-white text-primary" : "bg-white/10 text-white"}`}>{l}</button>
            ))}
          </div>
          <ul className="max-h-[520px] space-y-2 overflow-auto">
            {emails.map((e: any) => (
              <li key={e.id}>
                <button onClick={() => setSelected(e)} className={`w-full rounded-2xl p-2 text-left text-sm hover:bg-white/15 ${selected?.id === e.id ? "bg-white/20" : "bg-white/10"}`}>
                  <p className="flex items-center gap-2 truncate font-medium text-white">
                    {e.direction === "inbound" ? <ArrowDownLeft className="h-3 w-3 text-emerald-200" /> : <ArrowUpRight className="h-3 w-3 text-sky-200" />}
                    {e.subject || "(sans sujet)"}
                  </p>
                  <p className="truncate text-xs text-white/60">
                    {e.direction === "inbound" ? e.from_email : e.to_email} · {formatInTz(e.received_at, tz)}
                    {e.status && e.direction === "outbound" ? ` · ${e.status === "sent" ? "envoyé" : "en attente"}` : ""}
                  </p>
                </button>
              </li>
            ))}
            {emails.length === 0 && <li className="text-xs text-white/60">Aucun échange.</li>}
          </ul>
        </div>
        <div className="glass rounded-3xl p-5">
          {selected ? (
            <>
              <p className="text-xs uppercase tracking-widest text-white/60">{selected.direction === "inbound" ? `Reçu de ${selected.from_email}` : `Envoyé à ${selected.to_email}`}</p>
              <h4 className="mt-1 font-display text-lg text-white">{selected.subject || "(sans sujet)"}</h4>
              <p className="mb-3 text-xs text-white/60">{formatInTz(selected.received_at, tz)}</p>
              <div className="max-h-[440px] overflow-auto whitespace-pre-wrap rounded-2xl bg-white/10 p-3 text-sm text-white/90">{selected.body || selected.snippet}</div>
            </>
          ) : <div className="grid h-[300px] place-items-center text-white/60">Sélectionnez un email.</div>}
        </div>
      </div>
    </div>
  );
}

function fmtSize(n?: number) {
  if (!n) return "";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}

/** Native file vault in private storage: {userId}/{oppId}/{file}. */
export function FilesPanel({ oppId }: { oppId: string }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ name: string; url: string; type: string } | null>(null);
  const [drag, setDrag] = useState(false);

  const prefixQ = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
    staleTime: Infinity,
  });
  const prefix = prefixQ.data ? `${prefixQ.data}/${oppId}` : null;

  const filesQ = useQuery({
    queryKey: ["opp-files", oppId, prefix],
    enabled: !!prefix,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(FILES_BUCKET).list(prefix!, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return (data ?? []).filter((f) => f.id);
    },
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const f of files) {
        if (f.size > 50 * 1024 * 1024) throw new Error(`${f.name} dépasse 50 Mo`);
        const safe = f.name.replace(/[^\w.\-]+/g, "_");
        const { error } = await supabase.storage.from(FILES_BUCKET).upload(`${prefix}/${Date.now()}_${safe}`, f, { contentType: f.type || undefined });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Fichier(s) ajouté(s)"); qc.invalidateQueries({ queryKey: ["opp-files", oppId] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.storage.from(FILES_BUCKET).remove([`${prefix}/${name}`]);
      if (error) throw error;
    },
    onSuccess: () => { setPreview(null); qc.invalidateQueries({ queryKey: ["opp-files", oppId] }); },
    onError: (e: any) => toast.error(e.message),
  });

  async function signed(name: string, download = false) {
    const { data, error } = await supabase.storage.from(FILES_BUCKET).createSignedUrl(`${prefix}/${name}`, 600, download ? { download: displayName(name) } : undefined);
    if (error) throw error;
    return data.signedUrl;
  }
  const displayName = (n: string) => n.replace(/^\d+_/, "");

  const files = filesQ.data ?? [];
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div
        className={`glass rounded-3xl p-4 transition ${drag ? "ring-2 ring-white" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const fs = Array.from(e.dataTransfer.files); if (fs.length && prefix) upload.mutate(fs); }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-white">Coffre ({files.length})</h3>
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={!prefix || upload.isPending} className="rounded-full bg-white text-primary">
            <Upload className="mr-2 h-3 w-3" />{upload.isPending ? "Envoi…" : "Ajouter"}
          </Button>
          <input ref={inputRef} type="file" multiple hidden onChange={(e) => { const fs = Array.from(e.target.files ?? []); if (fs.length) upload.mutate(fs); e.target.value = ""; }} />
        </div>
        <p className="mb-3 text-xs text-white/60">Glissez-déposez vos fichiers ici (50 Mo max).</p>
        <ul className="max-h-[480px] space-y-2 overflow-auto">
          {files.map((f: any) => (
            <li key={f.id} className="flex items-center gap-2 rounded-2xl bg-white/10 p-2">
              <button className="min-w-0 flex-1 text-left" onClick={async () => {
                try { setPreview({ name: f.name, url: await signed(f.name), type: f.metadata?.mimetype ?? "" }); } catch (e: any) { toast.error(e.message); }
              }}>
                <p className="flex items-center gap-1 truncate text-sm font-medium text-white"><FileText className="h-3 w-3 shrink-0" />{displayName(f.name)}</p>
                <p className="text-xs text-white/60">{fmtSize(f.metadata?.size)}</p>
              </button>
              <button aria-label="Télécharger" className="text-white/70 hover:text-white" onClick={async () => { try { window.open(await signed(f.name, true), "_blank"); } catch (e: any) { toast.error(e.message); } }}><Download className="h-3.5 w-3.5" /></button>
              <button aria-label="Supprimer" className="text-white/50 hover:text-white" onClick={() => remove.mutate(f.name)}><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
          {files.length === 0 && !filesQ.isLoading && <li className="text-xs text-white/60">Aucun fichier.</li>}
        </ul>
      </div>
      <div className="glass rounded-3xl p-2 lg:col-span-2">
        {preview ? (
          preview.type.startsWith("image/") ? (
            <img src={preview.url} alt={displayName(preview.name)} className="mx-auto max-h-[520px] rounded-2xl object-contain" />
          ) : (
            <iframe key={preview.url} src={preview.url} title={displayName(preview.name)} className="h-[520px] w-full rounded-2xl bg-white" />
          )
        ) : <div className="grid h-[520px] place-items-center text-white/60">Sélectionnez un fichier pour l'afficher.</div>}
      </div>
    </div>
  );
}

export function PriorityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={field}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="high">Priorité haute</SelectItem>
        <SelectItem value="medium">Priorité moyenne</SelectItem>
        <SelectItem value="low">Priorité basse</SelectItem>
      </SelectContent>
    </Select>
  );
}

export { Input as NativeInput, Textarea as NativeTextarea };
