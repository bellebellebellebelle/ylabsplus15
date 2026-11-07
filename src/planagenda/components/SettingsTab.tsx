import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGoogleConnection, startGoogleOAuth, disconnectGoogle, pullFromGoogle } from "@/planagenda/lib/google.functions";
import { getInstructions, saveInstructions, getActivityLog } from "@/planagenda/lib/planning.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Chrome, RefreshCw, Unlink, History, Cpu, Loader2 } from "lucide-react";

const MODELS = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (rapide, recommandé)" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (puissant)" },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (économique)" },
  { id: "openai/gpt-5-mini", label: "GPT-5 mini" },
  { id: "openai/gpt-5", label: "GPT-5" },
  { id: "openai/gpt-5-nano", label: "GPT-5 nano" },
];

export function SettingsTab() {
  const getConn = useServerFn(getGoogleConnection);
  const start = useServerFn(startGoogleOAuth);
  const disconnect = useServerFn(disconnectGoogle);
  const pull = useServerFn(pullFromGoogle);
  const getInstr = useServerFn(getInstructions);
  const saveInstr = useServerFn(saveInstructions);
  const getLog = useServerFn(getActivityLog);
  const qc = useQueryClient();
  const [model, setModel] = useState("google/gemini-2.5-flash");

  const { data: conn } = useQuery({ queryKey: ["google_conn"], queryFn: () => getConn() });
  const { data: log = [] } = useQuery({ queryKey: ["activity_log"], queryFn: () => getLog() });

  useEffect(() => { getInstr().then((d: any) => { if (d?.ai_model) setModel(d.ai_model); }); }, [getInstr]);

  const connectGoogle = async () => {
    try {
      const r: any = await start({ data: { origin: window.location.origin } });
      window.location.href = r.url;
    } catch (e) { toast.error((e as Error).message); }
  };

  const disc = async () => {
    if (!confirm("Déconnecter Google ?")) return;
    await disconnect(); qc.invalidateQueries({ queryKey: ["google_conn"] });
    toast.success("Google déconnecté");
  };

  const sync = async () => {
    toast.loading("Sync…", { id: "s" });
    try { const r: any = await pull(); toast.success(`${r.imported} importés`, { id: "s" }); qc.invalidateQueries({ queryKey: ["planning_items"] }); }
    catch (e) { toast.error((e as Error).message, { id: "s" }); }
  };

  const saveModel = async (v: string) => {
    setModel(v);
    await saveInstr({ data: { ai_model: v } });
    toast.success("Modèle IA mis à jour");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="pa-bento p-6">
        <div className="flex items-center gap-2 mb-4">
          <Chrome className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold pa-holo-text">Google Agenda & Tasks</h3>
        </div>
        {conn ? (
          <div className="space-y-3">
            <div className="pa-glass rounded-xl p-3 text-sm">
              <div>Connecté en tant que <strong>{(conn as any).email ?? "—"}</strong></div>
              <div className="text-xs text-muted-foreground mt-1">Dernière sync: {(conn as any).last_sync_at ? new Date((conn as any).last_sync_at).toLocaleString("fr-FR") : "jamais"}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={sync}><RefreshCw className="h-4 w-4 mr-1" />Synchroniser</Button>
              <Button variant="destructive" onClick={disc}><Unlink className="h-4 w-4 mr-1" />Déconnecter</Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-4">Connecte ton compte Google pour synchroniser rendez-vous et tâches en temps réel.</p>
            <Button onClick={connectGoogle} className="bg-primary text-primary-foreground pa-holo-glow">
              <Chrome className="h-4 w-4 mr-1" /> Connecter Google
            </Button>
          </div>
        )}
      </div>

      <div className="pa-bento p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="h-5 w-5 text-holo-3" />
          <h3 className="text-lg font-semibold">Modèle IA</h3>
        </div>
        <Label>Modèle utilisé par l'assistant, les suggestions et l'OCR</Label>
        <Select value={model} onValueChange={saveModel}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">Alimenté par Lovable AI Gateway.</p>
      </div>

      <div className="pa-bento p-6 lg:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-holo-2" />
          <h3 className="text-lg font-semibold">Historique des modifications</h3>
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto pa-scroll-slim">
          {(log as any[]).length === 0 && <p className="text-sm text-muted-foreground">Aucune modification encore.</p>}
          {(log as any[]).map((r) => (
            <div key={r.id} className="pa-glass rounded-lg px-3 py-2 text-xs flex items-center justify-between">
              <span><strong>{r.action}</strong> · {r.after?.title ?? r.before?.title ?? r.item_id}</span>
              <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString("fr-FR")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
