import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertPlanningItem, deletePlanningItem } from "@/planagenda/lib/planning.functions";
import { listGoogleTaskLists, createGoogleTaskList } from "@/planagenda/lib/google.functions";
import { toast } from "sonner";
import { Trash2, CalendarClock, CheckCircle2, Sparkles, Plus } from "lucide-react";
import { useTimezone, utcToZonedInput, zonedInputToUtcISO } from "@/planagenda/lib/tz";

const COLORS = ["holo", "mint", "peach", "pink", "lilac", "sky", "lemon"];
const ICONS = ["sparkles", "calendar", "check", "star", "flag", "heart", "target", "bolt"];

type Item = Record<string, unknown> & { id?: string };

export function PostItDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (v: boolean) => void; item?: Item }) {
  const tz = useTimezone();
  const upsert = useServerFn(upsertPlanningItem);
  const remove = useServerFn(deletePlanningItem);
  const listLists = useServerFn(listGoogleTaskLists);
  const createList = useServerFn(createGoogleTaskList);
  const qc = useQueryClient();

  const { data: taskLists = [] } = useQuery({
    queryKey: ["google_task_lists"],
    queryFn: () => listLists() as Promise<Array<{ id: string; title: string }>>,
    staleTime: 5 * 60_000,
  });

  const [form, setForm] = useState<Record<string, unknown>>({});
  const [newListName, setNewListName] = useState("");
  const [showNewList, setShowNewList] = useState(false);

  useEffect(() => {
    setForm({
      id: item?.id,
      kind: (item?.kind as string) ?? "event",
      title: (item?.title as string) ?? "",
      description: (item?.description as string) ?? "",
      notes: (item?.notes as string) ?? "",
      location: (item?.location as string) ?? "",
      priority: (item?.priority as string) ?? "normal",
      color: (item?.color as string) ?? "holo",
      icon: (item?.icon as string) ?? "sparkles",
      start_at: utcToZonedInput(item?.start_at as string | undefined, tz),
      end_at: utcToZonedInput(item?.end_at as string | undefined, tz),
      due_at: utcToZonedInput(item?.due_at as string | undefined, tz),
      duration_min: (item?.duration_min as number) ?? 60,
      board_column: (item?.board_column as string) ?? "inbox",
      google_task_list_id: (item?.google_task_list_id as string) ?? "@default",
      tags: ((item?.tags as string[]) ?? []).join(", "),
      attendees: ((item?.attendees as string[]) ?? []).join(", "),
    });
  }, [item, open, tz]);

  const createNewList = async () => {
    const title = newListName.trim();
    if (!title) return;
    try {
      const res = await createList({ data: { title } }) as { id: string; title: string };
      toast.success(`Liste "${res.title}" créée dans Google Tasks`);
      qc.invalidateQueries({ queryKey: ["google_task_lists"] });
      setForm({ ...form, google_task_list_id: res.id });
      setNewListName("");
      setShowNewList(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  const save = async () => {
    if (!(form.title as string)?.trim()) { toast.error("Titre requis"); return; }
    try {
      const payload: Record<string, unknown> = {
        ...form,
        title: (form.title as string).trim(),
        start_at: zonedInputToUtcISO(form.start_at as string, tz),
        end_at: zonedInputToUtcISO(form.end_at as string, tz),
        due_at: zonedInputToUtcISO(form.due_at as string, tz),
        duration_min: Number(form.duration_min) || null,
        tags: form.tags ? String(form.tags).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        attendees: form.attendees ? String(form.attendees).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      };
      if (!payload.id) delete payload.id;
      if (payload.kind !== "task") delete payload.google_task_list_id;
      await upsert({ data: payload as never });
      toast.success(item?.id ? "Mis à jour" : "Créé et synchronisé avec Google");
      if (!item?.id) confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: ["#00C68D", "#F7F1DE", "#4DFFBE"] });
      qc.invalidateQueries({ queryKey: ["planning_items"] });
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  const doDelete = async () => {
    if (!item?.id) return;
    if (!confirm("Supprimer ce post-it ?")) return;
    try {
      await remove({ data: { id: item.id as string } });
      toast.success("Supprimé (aussi dans Google)");
      qc.invalidateQueries({ queryKey: ["planning_items"] });
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl pa-glass-strong">
        <DialogHeader>
          <DialogTitle className="pa-holo-text text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {item?.id ? "Modifier le post-it" : "Nouveau post-it"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 max-h-[70vh] overflow-y-auto pa-scroll-slim pr-1">
          <div className="grid grid-cols-2 gap-2">
            {(["event", "task"] as const).map((k) => (
              <button key={k}
                type="button"
                onClick={() => setForm({ ...form, kind: k })}
                className={`rounded-xl px-4 py-3 border transition flex items-center justify-center gap-2 ${
                  form.kind === k ? "bg-primary/20 border-primary pa-holo-glow" : "border-border/50 hover:border-primary/40"
                }`}>
                {k === "event" ? <CalendarClock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                <span className="font-medium">{k === "event" ? "Rendez-vous" : "Tâche"}</span>
                <span className="text-[10px] text-muted-foreground">→ {k === "event" ? "Google Agenda" : "Google Tasks"}</span>
              </button>
            ))}
          </div>

          <div>
            <Label>Titre *</Label>
            <Input value={(form.title as string) ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Réunion produit avec Marc" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={(form.description as string) ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contexte, objectifs…" />
          </div>

          <div>
            <Label>Notes internes</Label>
            <Textarea rows={2} value={(form.notes as string) ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Rappels personnels" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {form.kind === "event" ? (
              <>
                <div><Label>Début ({tz})</Label><Input type="datetime-local" value={(form.start_at as string) ?? ""} onChange={(e) => setForm({ ...form, start_at: e.target.value })} /></div>
                <div><Label>Fin ({tz})</Label><Input type="datetime-local" value={(form.end_at as string) ?? ""} onChange={(e) => setForm({ ...form, end_at: e.target.value })} /></div>
              </>
            ) : (
              <>
                <div><Label>Échéance ({tz})</Label><Input type="datetime-local" value={(form.due_at as string) ?? ""} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></div>
                <div><Label>Durée estimée (min)</Label><Input type="number" value={(form.duration_min as number) ?? ""} onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })} /></div>
              </>
            )}
          </div>

          {form.kind === "task" && (
            <div>
              <Label>Liste de tâches Google</Label>
              <div className="flex gap-2 items-center">
                <Select value={(form.google_task_list_id as string) ?? "@default"} onValueChange={(v) => setForm({ ...form, google_task_list_id: v })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Choisir une liste" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="@default">📌 Liste par défaut</SelectItem>
                    {taskLists.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewList((v) => !v)}>
                  <Plus className="h-4 w-4 mr-1" /> Nouvelle
                </Button>
              </div>
              {showNewList && (
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Nom de la nouvelle liste" value={newListName} onChange={(e) => setNewListName(e.target.value)} />
                  <Button type="button" onClick={createNewList} className="bg-primary text-primary-foreground">Créer</Button>
                </div>
              )}
            </div>
          )}

          {form.kind === "event" && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Lieu</Label><Input value={(form.location as string) ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bureau, Zoom…" /></div>
              <div><Label>Participants (emails, séparés par virgule)</Label><Input value={(form.attendees as string) ?? ""} onChange={(e) => setForm({ ...form, attendees: e.target.value })} /></div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Priorité</Label>
              <Select value={(form.priority as string) ?? "normal"} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Colonne</Label>
              <Select value={(form.board_column as string) ?? "inbox"} onValueChange={(v) => setForm({ ...form, board_column: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbox">À trier</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="tomorrow">Demain</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="later">Plus tard</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Tags (virgules)</Label><Input value={(form.tags as string) ?? ""} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="perso, urgent" /></div>
          </div>

          <div>
            <Label>Couleur du post-it</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`h-8 w-8 rounded-lg bg-gradient-to-br ${
                    c === "holo" ? "from-[#F7F1DE] to-[#EFE6C7]" :
                    c === "mint" ? "from-[#00C68D] to-[#4DFFBE]" :
                    c === "peach" ? "from-[#FFD9BA] to-[#FFB78E]" :
                    c === "pink" ? "from-[#FFC5E6] to-[#FF9DD1]" :
                    c === "lilac" ? "from-[#D8C7FF] to-[#B49CFF]" :
                    c === "sky" ? "from-[#BEE7FF] to-[#7DC8FF]" :
                    "from-[#FFF3A6] to-[#FFE270]"
                  } transition ${form.color === c ? "ring-2 ring-primary scale-110" : ""}`} />
              ))}
            </div>
          </div>

          <div>
            <Label>Icône</Label>
            <Select value={(form.icon as string) ?? "sparkles"} onValueChange={(v) => setForm({ ...form, icon: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {item?.id && (
            <Button variant="destructive" onClick={doDelete} className="mr-auto"><Trash2 className="h-4 w-4 mr-1" />Supprimer</Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={save} className="bg-primary text-primary-foreground pa-holo-glow">
            {item?.id ? "Enregistrer" : "Créer & synchroniser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
