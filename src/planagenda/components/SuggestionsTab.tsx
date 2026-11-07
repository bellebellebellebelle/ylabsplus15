import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { suggestSchedule, detectConflicts } from "@/planagenda/lib/ai.functions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertTriangle, Coffee, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export function SuggestionsTab({ items }: { items: any[] }) {
  const suggest = useServerFn(suggestSchedule);
  const conflicts = useServerFn(detectConflicts);
  const qc = useQueryClient();
  const [tasks, setTasks] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  const { data: conflictList = [] } = useQuery({
    queryKey: ["conflicts"], queryFn: () => conflicts(),
  });

  // Compute load per day
  const days: Record<string, number> = {};
  items.forEach((i) => {
    const d = i.start_at || i.due_at; if (!d) return;
    const key = new Date(d).toDateString();
    days[key] = (days[key] || 0) + (i.duration_min || 60);
  });
  const overloaded = Object.entries(days).filter(([, m]) => m > 480);
  const underused = Object.entries(days).filter(([, m]) => m < 60 && m > 0);

  const doSuggest = async () => {
    if (!tasks.trim()) return;
    setLoading(true);
    try {
      const r: any = await suggest({ data: { tasks } });
      setReply(r.content);
      toast.success(`${r.created.length} tâches planifiées`);
      qc.invalidateQueries({ queryKey: ["planning_items"] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <motion.div layout className="pa-bento p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold pa-holo-text text-lg">Planifier une liste de tâches</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">L'IA répartit intelligemment tes tâches en tenant compte de tes heures de travail et de tes priorités.</p>
        <Textarea rows={6} value={tasks} onChange={(e) => setTasks(e.target.value)}
          placeholder={"Ex:\n- Préparer la démo produit (2h)\n- Répondre aux emails clients (30 min)\n- Deep work sur le rapport Q4 (3h)\n- Appeler le fournisseur"} />
        <Button onClick={doSuggest} disabled={loading || !tasks.trim()} className="mt-3 bg-primary text-primary-foreground pa-holo-glow">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Planifier avec l'IA
        </Button>
        {reply && (
          <div className="mt-4 pa-glass rounded-xl p-3 text-sm prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{reply.replace(/```json[\s\S]*?```/g, "")}</ReactMarkdown>
          </div>
        )}
      </motion.div>

      <div className="space-y-4">
        <div className="pa-bento p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <h3 className="font-semibold text-lg">Conflits détectés</h3>
          </div>
          {(conflictList as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun conflit ✨</p>
          ) : (
            <div className="space-y-2">
              {(conflictList as any[]).map((c, i) => (
                <div key={i} className="pa-glass rounded-lg p-2 text-xs">
                  <div className="font-medium text-orange-300">Chevauchement</div>
                  <div>{c.a.title} ↔ {c.b.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pa-bento p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-red-400" />
            <h3 className="font-semibold text-lg">Journées surchargées</h3>
          </div>
          {overloaded.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bien équilibré 🙌</p>
          ) : overloaded.map(([day, min]) => (
            <div key={day} className="text-xs mb-1">
              <span className="text-red-300">{new Date(day).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}</span>
              <span className="text-muted-foreground"> — {Math.round(min / 60)}h prévues</span>
            </div>
          ))}
        </div>

        <div className="pa-bento p-5">
          <div className="flex items-center gap-2 mb-3">
            <Coffee className="h-5 w-5 text-holo-3" />
            <h3 className="font-semibold text-lg">Suggestions de pause</h3>
          </div>
          {overloaded.length > 0 ? (
            <p className="text-sm">Envisage d'insérer une pause de <strong>15–20 min</strong> toutes les <strong>90 min</strong> les {overloaded.length} journée(s) surchargée(s).</p>
          ) : (
            <p className="text-sm text-muted-foreground">Ton rythme est équilibré, continue !</p>
          )}
        </div>

        <div className="pa-bento p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-5 w-5 text-holo-2" />
            <h3 className="font-semibold text-lg">Créneaux libres</h3>
          </div>
          {underused.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tes journées sont bien remplies.</p>
          ) : underused.map(([day]) => (
            <div key={day} className="text-xs">{new Date(day).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })} — journée légère</div>
          ))}
        </div>
      </div>
    </div>
  );
}
