import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

async function callAI(model: string, messages: unknown[], opts: Record<string, unknown> = {}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY manquante");
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { "Lovable-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, ...opts }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  return await res.json();
}

async function buildSystemContext(userId: string, supabase: any) {
  const { data: instr } = await supabase.from("pa_agent_instructions").select("*").eq("user_id", userId).maybeSingle();
  const { data: items } = await supabase.from("pa_planning_items").select("id,kind,title,start_at,end_at,due_at,board_column,status,priority").order("start_at", { ascending: true }).limit(80);
  return `Tu es l'assistant IA "Cockpit" du planning holographique de l'utilisateur. Tu réponds en français, concis et actionnable.
Instructions utilisateur:
- Fuseau: ${instr?.timezone ?? "Europe/Paris"}
- Heures travail: ${JSON.stringify(instr?.working_hours ?? {})}
- Style de travail: ${instr?.work_style ?? "—"}
- Priorités: ${instr?.priorities ?? "—"}
- Pauses: ${instr?.break_habits ?? "—"}
- Communication: ${instr?.communication_style ?? "—"}
- Règles perso: ${instr?.custom_rules ?? "—"}

Planning actuel (JSON, ${items?.length ?? 0} items):
${JSON.stringify(items ?? [])}

Quand tu proposes de créer/modifier/supprimer des rendez-vous ou tâches, réponds AUSSI avec un bloc \`\`\`json ...\`\`\` contenant un tableau "actions" avec des objets { "type": "create"|"update"|"delete", "kind": "event"|"task", "id"?: "uuid", "title"?: "...", "start_at"?: ISO, "end_at"?: ISO, "due_at"?: ISO, "duration_min"?: 60, "description"?: "...", "priority"?: "normal", "board_column"?: "today" }. Sans actions, ne mets pas de bloc JSON.`;
}

export const aiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    conversationId: z.string().uuid().nullable().optional(),
    message: z.string().min(1),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    let conversationId = data.conversationId;
    if (!conversationId) {
      const { data: conv } = await (context.supabase as any).from("pa_ai_conversations").insert({
        user_id: context.userId, title: data.message.slice(0, 60),
      }).select("id").single();
      conversationId = conv!.id;
    }

    // Save user message
    await (context.supabase as any).from("pa_ai_messages").insert({
      conversation_id: conversationId, user_id: context.userId, role: "user", content: data.message,
    });

    // Load history
    const { data: history } = await (context.supabase as any).from("pa_ai_messages")
      .select("role,content").eq("conversation_id", conversationId).order("created_at");

    const { data: instr } = await (context.supabase as any).from("pa_agent_instructions").select("ai_model").eq("user_id", context.userId).maybeSingle();
    const model = await (await import("@/lib/ai-models.server")).resolveAppAiModel(context.supabase, context.userId, "planning", instr?.ai_model || "google/gemini-2.5-flash");
    const systemPrompt = await buildSystemContext(context.userId, (context.supabase as any));

    const messages = [{ role: "system", content: systemPrompt }, ...(history ?? [])];
    const resp = await callAI(model, messages);
    const content = resp.choices?.[0]?.message?.content ?? "";

    // Parse actions
    let actions: any[] = [];
    const m = content.match(/```json\s*([\s\S]*?)```/);
    if (m) {
      try {
        const parsed = JSON.parse(m[1]);
        actions = Array.isArray(parsed.actions) ? parsed.actions : (Array.isArray(parsed) ? parsed : []);
      } catch { /* ignore */ }
    }

    // Apply actions
    const applied: any[] = [];
    for (const a of actions) {
      try {
        if (a.type === "delete" && a.id) {
          await (context.supabase as any).from("pa_planning_items").delete().eq("id", a.id);
          applied.push({ ...a, ok: true });
        } else if (a.type === "update" && a.id) {
          const { data: row } = await (context.supabase as any).from("pa_planning_items").update({
            title: a.title, start_at: a.start_at, end_at: a.end_at, due_at: a.due_at,
            description: a.description, priority: a.priority, board_column: a.board_column, kind: a.kind,
          }).eq("id", a.id).select("*").single();
          applied.push({ ...a, ok: true, row });
        } else if (a.type === "create") {
          const { data: row } = await (context.supabase as any).from("pa_planning_items").insert({
            user_id: context.userId,
            kind: a.kind ?? "task",
            title: a.title ?? "Sans titre",
            description: a.description,
            start_at: a.start_at, end_at: a.end_at, due_at: a.due_at,
            duration_min: a.duration_min, priority: a.priority ?? "normal",
            board_column: a.board_column ?? "inbox",
          }).select("*").single();
          applied.push({ ...a, ok: true, row });
          // sync google
          try {
            const { syncItemToGoogle } = await import("./google.functions");
            if (row) await syncItemToGoogle({ data: { itemId: row.id } });
          } catch { /* ignore */ }
        }
      } catch (e) {
        applied.push({ ...a, ok: false, error: (e as Error).message });
      }
    }

    // Save assistant message
    await (context.supabase as any).from("pa_ai_messages").insert({
      conversation_id: conversationId, user_id: context.userId, role: "assistant", content,
      metadata: { actions: applied },
    });

    return { conversationId, content, actions: applied };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any).from("pa_ai_conversations").select("*").order("updated_at", { ascending: false });
    return data ?? [];
  });

export const getMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ conversationId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: rows } = await (context.supabase as any).from("pa_ai_messages").select("*")
      .eq("conversation_id", data.conversationId).order("created_at");
    return rows ?? [];
  });

export const suggestSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ tasks: z.string().min(1) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: instr } = await (context.supabase as any).from("pa_agent_instructions").select("*").eq("user_id", context.userId).maybeSingle();
    const model = await (await import("@/lib/ai-models.server")).resolveAppAiModel(context.supabase, context.userId, "planning", instr?.ai_model || "google/gemini-2.5-flash");
    const systemPrompt = await buildSystemContext(context.userId, (context.supabase as any));
    const prompt = `Voici une liste de tâches à planifier: \n${data.tasks}\n\nRépartis-les intelligemment dans les prochains jours en tenant compte des heures de travail, des priorités et des conflits. Crée-les via un bloc JSON d'actions.`;
    const resp = await callAI(model, [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);
    const content = resp.choices?.[0]?.message?.content ?? "";
    let actions: any[] = [];
    const m = content.match(/```json\s*([\s\S]*?)```/);
    if (m) try { const p = JSON.parse(m[1]); actions = Array.isArray(p.actions) ? p.actions : []; } catch { /* */ }
    const applied: any[] = [];
    for (const a of actions.filter(x => x.type === "create")) {
      try {
        const { data: row } = await (context.supabase as any).from("pa_planning_items").insert({
          user_id: context.userId, kind: a.kind ?? "task", title: a.title ?? "Sans titre",
          description: a.description, start_at: a.start_at, end_at: a.end_at, due_at: a.due_at,
          duration_min: a.duration_min, priority: a.priority ?? "normal",
          board_column: a.board_column ?? "week",
        }).select("*").single();
        applied.push(row);
      } catch { /* ignore */ }
    }
    return { content, created: applied };
  });

export const detectConflicts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: items } = await (context.supabase as any).from("pa_planning_items").select("id,title,start_at,end_at,kind")
      .eq("kind", "event").not("start_at", "is", null).order("start_at");
    const conflicts: any[] = [];
    const list = items ?? [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (!a.start_at || !b.start_at) continue;
        const aStart = new Date(a.start_at).getTime();
        const aEnd = a.end_at ? new Date(a.end_at).getTime() : aStart + 3600_000;
        const bStart = new Date(b.start_at).getTime();
        if (bStart >= aEnd) break;
        conflicts.push({ a, b });
      }
    }
    return conflicts;
  });

export const analyzeOcr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ imageDataUrl: z.string() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: instr } = await (context.supabase as any).from("pa_agent_instructions").select("ai_model").eq("user_id", context.userId).maybeSingle();
    const model = await (await import("@/lib/ai-models.server")).resolveAppAiModel(context.supabase, context.userId, "planning", instr?.ai_model || "google/gemini-2.5-flash");
    const resp = await callAI(model, [
      {
        role: "system",
        content: "Tu es un OCR intelligent. Analyse l'image, extrais tous les rendez-vous et tâches. Réponds en français avec un résumé, puis un bloc ```json {\"actions\":[{\"type\":\"create\",\"kind\":\"event|task\",\"title\":..,\"start_at\":ISO,\"end_at\":ISO,\"due_at\":ISO,\"location\":..,\"description\":..}]}```",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extrais les rendez-vous et tâches de ce document." },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ] as any,
      },
    ]);
    const content = resp.choices?.[0]?.message?.content ?? "";
    let actions: any[] = [];
    const m = content.match(/```json\s*([\s\S]*?)```/);
    if (m) try { const p = JSON.parse(m[1]); actions = Array.isArray(p.actions) ? p.actions : []; } catch { /* */ }
    const created: any[] = [];
    for (const a of actions.filter(x => x.type === "create")) {
      try {
        const { data: row } = await (context.supabase as any).from("pa_planning_items").insert({
          user_id: context.userId, kind: a.kind ?? "event", title: a.title ?? "Sans titre",
          description: a.description, location: a.location,
          start_at: a.start_at, end_at: a.end_at, due_at: a.due_at,
          priority: "normal", board_column: "inbox",
        }).select("*").single();
        if (row) created.push(row);
      } catch { /* */ }
    }
    return { content, created };
  });
