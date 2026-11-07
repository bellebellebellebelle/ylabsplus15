import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "@/noject/lib/tasks.functions";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/noject/settings")({ component: Settings });

const MODELS = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash — rapide & économique (défaut)" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro — raisonnement avancé" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview) — nouvelle génération" },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash — efficacité maximale" },
  { id: "openai/gpt-5.5", label: "GPT-5.5 — état de l'art" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 mini — équilibré" },
  { id: "openai/gpt-5-nano", label: "GPT-5 nano — ultra rapide" },
];

function Settings() {
  const qc = useQueryClient();
  const get = useServerFn(getSettings);
  const update = useServerFn(updateSettings);
  const s = useQuery({ queryKey: ["settings"], queryFn: () => get({}) });
  const mut = useMutation({
    mutationFn: (ai_model: string) => update({ data: { ai_model } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Modèle mis à jour"); },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="chip"><Settings2 className="size-3" /> Paramètres</div>
        <h1 className="mt-2 font-display text-4xl font-bold">Paramètres</h1>
      </div>
      <div className="bento-holo p-6">
        <h2 className="font-display text-xl font-semibold">Modèle IA (Lovable AI)</h2>
        <p className="text-sm text-white/70">Choisissez le modèle utilisé pour la planification et les insights.</p>
        <div className="mt-4 space-y-2">
          {MODELS.map(m => (
            <label key={m.id} className={`flex items-center gap-3 rounded-xl p-3 border transition cursor-pointer ${s.data?.ai_model === m.id ? "bg-white/10 border-white/40 shadow-[0_0_25px_oklch(0.68_0.28_15/.4)]" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
              <input type="radio" name="model" checked={s.data?.ai_model === m.id} onChange={() => mut.mutate(m.id)} />
              <span className="text-sm">{m.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
