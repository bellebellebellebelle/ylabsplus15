import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { getInstructions, saveInstructions } from "@/planagenda/lib/planning.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpenText, Save, Loader2, Globe2 } from "lucide-react";
import { COMMON_TIMEZONES } from "@/planagenda/lib/tz";

export function InstructionsTab() {
  const get = useServerFn(getInstructions);
  const save = useServerFn(saveInstructions);
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, unknown>>({
    timezone: "Indian/Reunion",
    working_hours: { start: "09:00", end: "18:00", days: [1, 2, 3, 4, 5] },
    work_style: "",
    priorities: "",
    break_habits: "",
    communication_style: "",
    custom_rules: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get().then((d) => {
      if (d) setForm((f) => ({ ...f, ...(d as Record<string, unknown>) }));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setSaving(true);
    try {
      await save({ data: { ...form } as never });
      toast.success("Instructions enregistrées — l'IA en tiendra compte");
      qc.invalidateQueries({ queryKey: ["instructions"] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="pa-bento p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const wh = (form.working_hours as { start?: string; end?: string; days?: number[] } | undefined) ?? {};

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="pa-bento p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold pa-holo-text">Fuseau horaire & journée type</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Le planning affiche toutes les dates dans ce fuseau. Si tu choisis <strong>Indian/Reunion</strong>, une tâche saisie « 21 juillet 10:00 » sera exactement à 10:00 heure de la Réunion.</p>

        <div className="space-y-4">
          <div>
            <Label>Fuseau horaire</Label>
            <Select value={(form.timezone as string) || "Indian/Reunion"} onValueChange={(v) => setForm({ ...form, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Début de journée</Label><Input type="time" value={wh.start ?? "09:00"} onChange={(e) => setForm({ ...form, working_hours: { ...wh, start: e.target.value } })} /></div>
            <div><Label>Fin de journée</Label><Input type="time" value={wh.end ?? "18:00"} onChange={(e) => setForm({ ...form, working_hours: { ...wh, end: e.target.value } })} /></div>
          </div>

          <div>
            <Label>Style de travail</Label>
            <Textarea rows={3} value={(form.work_style as string) ?? ""} onChange={(e) => setForm({ ...form, work_style: e.target.value })}
              placeholder="Ex: Deep work le matin, réunions l'après-midi. Je préfère bloquer 90 min sans interruption." />
          </div>

          <div>
            <Label>Priorités & valeurs</Label>
            <Textarea rows={3} value={(form.priorities as string) ?? ""} onChange={(e) => setForm({ ...form, priorities: e.target.value })}
              placeholder="Ex: Priorité aux clients, puis à la stratégie, puis à l'admin." />
          </div>
        </div>
      </div>

      <div className="pa-bento p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpenText className="h-5 w-5 text-holo-3" />
          <h3 className="text-lg font-semibold">Habitudes & règles</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Pauses & rythme</Label>
            <Textarea rows={3} value={(form.break_habits as string) ?? ""} onChange={(e) => setForm({ ...form, break_habits: e.target.value })}
              placeholder="Ex: Pause de 15 min toutes les 90 min. Déjeuner à 12h30." />
          </div>

          <div>
            <Label>Style de communication attendu</Label>
            <Textarea rows={3} value={(form.communication_style as string) ?? ""} onChange={(e) => setForm({ ...form, communication_style: e.target.value })}
              placeholder="Ex: Formel avec les clients, cool avec l'équipe. Toujours en français." />
          </div>

          <div>
            <Label>Règles personnelles pour l'agent</Label>
            <Textarea rows={5} value={(form.custom_rules as string) ?? ""} onChange={(e) => setForm({ ...form, custom_rules: e.target.value })}
              placeholder={"Ex:\n- Pas de réunions le vendredi après-midi\n- Regrouper les appels\n- Toujours ajouter 15 min de tampon entre 2 rendez-vous"} />
          </div>

          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground pa-holo-glow w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Enregistrer les instructions
          </Button>
        </div>
      </div>
    </div>
  );
}
