import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "skylab-assets";
type Item = { name: string; size: number };

/** Pièces jointes (PDF, images…) rangées dans le bucket dédié, sous {userId}/{scope}/. */
export function LabFiles({ scope = "lab" }: { scope?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [prefix, setPrefix] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && setPrefix(`${data.user.id}/${scope}`));
  }, [scope]);

  async function load() {
    if (!prefix) return;
    const { data } = await supabase.storage.from(BUCKET).list(prefix, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    setItems((data ?? []).filter((f) => f.id).map((f) => ({ name: f.name, size: Number(f.metadata?.size ?? 0) })));
  }
  useEffect(() => { if (open) load(); }, [open, prefix]);

  async function upload(files: FileList | null) {
    if (!files || !prefix) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      const safe = f.name.replace(/[^\w.\-]+/g, "_");
      const { error } = await supabase.storage.from(BUCKET).upload(`${prefix}/${Date.now()}_${safe}`, f, { contentType: f.type || undefined });
      if (error) alert(`Échec de l'envoi de ${f.name} : ${error.message}`);
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    load();
  }
  async function openFile(name: string) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(`${prefix}/${name}`, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }
  async function remove(name: string) {
    if (!confirm("Supprimer ce fichier ?")) return;
    await supabase.storage.from(BUCKET).remove([`${prefix}/${name}`]);
    load();
  }
  const label = (n: string) => n.replace(/^\d+_/, "");

  return (
    <div className="fixed bottom-4 left-4 z-50 text-sm">
      {open && (
        <div className="mb-2 w-72 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <strong>Fichiers joints</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
          </div>
          <input ref={input} type="file" multiple accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.txt,.csv" className="hidden" onChange={(e) => upload(e.target.files)} />
          <button type="button" disabled={busy || !prefix} onClick={() => input.current?.click()} className="mb-2 w-full rounded-md bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-50">
            {busy ? "Envoi…" : "Téléverser un fichier"}
          </button>
          <ul className="max-h-60 space-y-1 overflow-y-auto">
            {items.length === 0 && <li className="text-muted-foreground">Aucun fichier.</li>}
            {items.map((f) => (
              <li key={f.name} className="flex items-center gap-2">
                <button type="button" onClick={() => openFile(f.name)} className="flex-1 truncate text-left hover:underline" title={label(f.name)}>{label(f.name)}</button>
                <span className="text-xs text-muted-foreground">{Math.ceil(f.size / 1024)} Ko</span>
                <button type="button" onClick={() => remove(f.name)} aria-label="Supprimer" className="text-muted-foreground hover:text-destructive">🗑</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-full border border-border bg-card px-4 py-2 text-card-foreground shadow-md">
        📎 Fichiers
      </button>
    </div>
  );
}
