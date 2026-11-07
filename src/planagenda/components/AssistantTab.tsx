import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { aiChat, listConversations, getMessages } from "@/planagenda/lib/ai.functions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, Send, Sparkles, Plus, Loader2, User } from "lucide-react";
import { toast } from "sonner";

export function AssistantTab() {
  const chat = useServerFn(aiChat);
  const listConv = useServerFn(listConversations);
  const getMsgs = useServerFn(getMessages);
  const qc = useQueryClient();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConv(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["ai_messages", conversationId],
    queryFn: () => conversationId ? getMsgs({ data: { conversationId } }) : Promise.resolve([]),
    enabled: !!conversationId,
  });

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    try {
      const r: any = await chat({ data: { conversationId, message: msg } });
      setConversationId(r.conversationId);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["ai_messages", r.conversationId] });
      qc.invalidateQueries({ queryKey: ["planning_items"] });
      if (r.actions?.length) toast.success(`${r.actions.filter((a: any) => a.ok).length} action(s) appliquée(s)`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setSending(false); }
  };

  const suggestions = [
    "Planifie une réunion de 2h avec Marc jeudi prochain à 14h",
    "Décale tous mes rendez-vous de demain d'une heure",
    "Ajoute 3 tâches: relire le rapport, appeler le client, préparer la démo",
    "Quel est mon emploi du temps de la semaine ?",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 h-[75vh]">
      <div className="pa-bento p-3 overflow-y-auto pa-scroll-slim">
        <button onClick={() => setConversationId(null)} className="w-full flex items-center gap-2 rounded-xl bg-primary/20 px-3 py-2 text-sm mb-3 pa-holo-glow">
          <Plus className="h-4 w-4" /> Nouvelle conversation
        </button>
        <div className="space-y-1">
          {(conversations as any[]).map((c) => (
            <button key={c.id} onClick={() => setConversationId(c.id)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm truncate ${conversationId === c.id ? "bg-primary/15" : "hover:bg-secondary/40"}`}>
              {c.title}
            </button>
          ))}
        </div>
      </div>

      <div className="pa-bento p-4 flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pa-scroll-slim space-y-4 pr-2">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="mx-auto rounded-2xl bg-primary/20 p-3 w-fit pa-holo-glow"><Bot className="h-6 w-6 text-primary" /></div>
              <h3 className="mt-3 text-lg pa-holo-text font-semibold">Assistant Cockpit</h3>
              <p className="text-sm text-muted-foreground mt-1">Décris en langage naturel ce que tu veux planifier.</p>
              <div className="mt-4 grid gap-2 max-w-lg mx-auto">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setInput(s)}
                    className="text-left text-sm rounded-xl border border-border/50 hover:border-primary/50 px-3 py-2 transition">
                    <Sparkles className="inline h-3 w-3 mr-1 text-primary" />{s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence>
            {(messages as any[]).map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`rounded-full p-1.5 flex-shrink-0 ${m.role === "user" ? "bg-primary/20" : "bg-holo-2/20"}`}>
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-2 max-w-[80%] ${m.role === "user" ? "bg-primary/15" : "pa-glass"}`}>
                  <div className="prose prose-sm prose-invert max-w-none text-sm">
                    <ReactMarkdown>{m.content.replace(/```json[\s\S]*?```/g, "")}</ReactMarkdown>
                  </div>
                  {m.metadata?.actions?.length ? (
                    <div className="mt-2 space-y-1">
                      {m.metadata.actions.map((a: any, i: number) => (
                        <div key={i} className="text-[10px] rounded-md bg-primary/10 px-2 py-1">
                          {a.ok ? "✅" : "❌"} {a.type} {a.kind}: {a.title || a.id}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ex: Planifie 3 sessions de deep work de 90 min cette semaine..."
            rows={2} className="resize-none" />
          <Button onClick={send} disabled={sending || !input.trim()} className="bg-primary text-primary-foreground pa-holo-glow">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
