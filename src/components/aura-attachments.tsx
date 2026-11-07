import { useRef, useState } from "react";
import { Paperclip, X, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_ATTACHMENT_BYTES, validateAttachments, type AuraAttachment } from "@/lib/aura-attachments";

export function AuraAttachments({ files, onChange, busy = false, floating = false }: { files: AuraAttachment[]; onChange: (files: AuraAttachment[]) => void; busy?: boolean; floating?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [shown, setShown] = useState(false);
  const sx = useRef<number | null>(null);
  const visible = !floating || shown || files.length > 0 || reading;
  async function load(selected: FileList | null) {
    if (!selected) return;
    setReading(true); setError("");
    try {
      const incoming = await Promise.all(Array.from(selected).map(async file => {
        if (!file.size || file.size > MAX_ATTACHMENT_BYTES) throw new Error("8 Mo maximum par fichier.");
        const mime = file.name.toLowerCase().endsWith(".mp3") ? "audio/mpeg" : file.type;
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
          reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
          reader.readAsDataURL(file);
        });
        return { name: file.name, mime, data };
      }));
      onChange(validateAttachments([...files, ...incoming]));
    } catch (e) { setError(e instanceof Error ? e.message : "Lecture impossible."); }
    finally { setReading(false); if (input.current) input.current.value = ""; }
  }
  return <>{floating && !visible && <div className="aura-attach-swipe" aria-hidden="true"
    onPointerDown={e => { sx.current = e.clientX; }}
    onPointerMove={e => { if (sx.current != null && e.clientX - sx.current > 30) { sx.current = null; setShown(true); } }}
    onPointerUp={() => { sx.current = null; }} onPointerCancel={() => { sx.current = null; }} />}
  <div data-shown={visible} className={`aura-attachments ${floating ? "aura-attachments-floating" : ""}`}
    onPointerDown={e => { sx.current = e.clientX; }}
    onPointerMove={e => { if (floating && sx.current != null && sx.current - e.clientX > 30 && !files.length) { sx.current = null; setShown(false); } }}
    onPointerUp={() => { sx.current = null; }}>
    <input ref={input} type="file" accept="application/pdf,image/png,audio/mpeg,.mp3" multiple hidden onChange={e => void load(e.target.files)} />
    <Button type="button" variant="ghost" size="icon" title="Joindre un fichier PDF, PNG ou MP3" aria-label="Joindre un fichier" disabled={busy || reading} onClick={() => input.current?.click()}>{reading ? <LoaderCircle className="animate-spin" /> : <Paperclip />}</Button>
    {files.map((file, i) => <span className="aura-file" key={`${file.name}-${i}`}><span>{file.name}</span><Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`Retirer ${file.name}`} onClick={() => onChange(files.filter((_, index) => index !== i))}><X /></Button></span>)}
    {error && <span role="alert" className="text-destructive-foreground">{error}</span>}
  </div></>;
}