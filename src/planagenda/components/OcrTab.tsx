import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { analyzeOcr } from "@/planagenda/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, ScanText } from "lucide-react";
import { toast } from "sonner";

export function OcrTab() {
  const analyze = useServerFn(analyzeOcr);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setLoading(true);
      try {
        const r = await analyze({ data: { imageDataUrl: dataUrl } });
        setResult(r);
        toast.success(`${(r as any).created.length} élément(s) créé(s)`);
        qc.invalidateQueries({ queryKey: ["planning_items"] });
      } catch (e) { toast.error((e as Error).message); }
      finally { setLoading(false); }
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <motion.div layout className="pa-bento p-6 text-center">
        <div className="mx-auto rounded-2xl bg-primary/20 p-3 w-fit pa-holo-glow mb-4"><ScanText className="h-6 w-6 text-primary" /></div>
        <h3 className="text-lg font-semibold pa-holo-text mb-1">OCR intelligent</h3>
        <p className="text-sm text-muted-foreground mb-4">Photographie un document, une invitation, une facture… L'IA en extrait les rendez-vous et tâches.</p>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <div className="flex gap-2 justify-center">
          <Button onClick={() => { if (fileRef.current) { fileRef.current.removeAttribute("capture"); fileRef.current.click(); } }} variant="outline">
            <Upload className="h-4 w-4 mr-1" /> Importer
          </Button>
          <Button onClick={() => { if (fileRef.current) { fileRef.current.setAttribute("capture", "environment"); fileRef.current.click(); } }} className="bg-primary text-primary-foreground pa-holo-glow">
            <Camera className="h-4 w-4 mr-1" /> Prendre une photo
          </Button>
        </div>

        {preview && (
          <div className="mt-4 rounded-xl overflow-hidden border border-border/50">
            <img src={preview} alt="Aperçu" className="max-h-80 mx-auto" />
          </div>
        )}
      </motion.div>

      <div className="pa-bento p-6">
        <h3 className="text-lg font-semibold mb-3">Résultat</h3>
        {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…</div>}
        {!loading && !result && <p className="text-sm text-muted-foreground">Charge un document pour voir le résultat.</p>}
        {result && (
          <div>
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{(result as any).content.replace(/```json[\s\S]*?```/g, "")}</ReactMarkdown>
            </div>
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">Éléments créés</h4>
              {(result as any).created.map((c: any) => (
                <div key={c.id} className="pa-glass rounded-lg p-2 text-xs">
                  <span className="font-medium">{c.kind === "event" ? "📅" : "✅"} {c.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
