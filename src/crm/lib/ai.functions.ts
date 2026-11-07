import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(model: string, messages: Array<{ role: string; content: string }>) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(`AI Gateway ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// Model chosen in Laboratoire → Paramètres → Modèles d'IA (app "crm").
async function getUserModel(supabase: any, userId: string) {
  const { resolveAppAiModel } = await import("@/lib/ai-models.server");
  return resolveAppAiModel(supabase, userId, "crm");
}

function safeJson(str: string): any {
  const cleaned = str.replace(/```json\n?|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  try { return JSON.parse(match ? match[0] : cleaned); } catch { return null; }
}

export const aiSummarizeOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase.from("crm_opportunities").select("*").eq("id", data.opportunityId).single();
    const { data: acts } = await context.supabase
      .from("crm_activities").select("type,title,content,status,created_at")
      .eq("opportunity_id", data.opportunityId).order("created_at", { ascending: false }).limit(20);

    const model = await getUserModel(context.supabase, context.userId);
    const content = await callAI(model, [
      { role: "system", content: "Tu es un analyste CRM. Fournis un résumé stratégique très concis (5-7 puces) avec: état, risques, prochaine action recommandée. Réponds en français." },
      { role: "user", content: `Opportunité: ${JSON.stringify(opp)}\n\nActivités récentes:\n${JSON.stringify(acts)}` },
    ]);
    await context.supabase.from("crm_opportunities").update({ ai_summary: content }).eq("id", data.opportunityId);
    return { summary: content };
  });

export const aiDraftEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid(), instructions: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase.from("crm_opportunities").select("*").eq("id", data.opportunityId).single();
    const model = await getUserModel(context.supabase, context.userId);
    const content = await callAI(model, [
      { role: "system", content: "Tu rédiges des emails commerciaux en français, personnalisés, professionnels, courts (150 mots max). Retourne uniquement l'email au format: SUBJECT: <sujet>\\n\\n<corps>" },
      { role: "user", content: `Contact: ${opp?.contact_name} (${opp?.contact_email})\nEntreprise: ${opp?.company}\nÉtape: ${opp?.stage}\nInstructions: ${data.instructions}` },
    ]);
    const [subjLine, ...rest] = content.split("\n");
    const subject = subjLine.replace(/^SUBJECT:\s*/i, "").trim();
    const body = rest.join("\n").trim();
    return { subject, body };
  });

export const aiNextBestActions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: opps } = await context.supabase
      .from("crm_opportunities")
      .select("id,name,stage,value_amount,contact_name,updated_at,health_score,closing_score,priority")
      .neq("stage", "won").neq("stage", "lost")
      .order("updated_at", { ascending: true }).limit(20);
    const model = await getUserModel(context.supabase, context.userId);
    const content = await callAI(model, [
      { role: "system", content: "Tu es un analyste CRM senior. Réponds en français. Retourne 3-6 recommandations d'action immédiate en JSON strict: {\"actions\":[{\"opportunityId\":\"...\",\"opportunityName\":\"...\",\"action\":\"...\",\"why\":\"...\",\"urgency\":\"high|medium|low\"}], \"summary\":\"synthèse 2 lignes\"}. Aucun texte hors JSON." },
      { role: "user", content: JSON.stringify(opps ?? []) },
    ]);
    const parsed = safeJson(content) ?? { actions: [], summary: "" };
    // Persist as saved_insights (kind=nba)
    await (context.supabase as any).from("crm_saved_insights").insert({
      user_id: context.userId, kind: "nba", payload: parsed, summary: parsed.summary ?? null,
    });
    return parsed;
  });

export const aiPipelineInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: opps } = await context.supabase
      .from("crm_opportunities")
      .select("id,name,stage,value_amount,updated_at,health_score,closing_score,priority");
    const model = await getUserModel(context.supabase, context.userId);
    const content = await callAI(model, [
      { role: "system", content: "Directeur commercial. Réponds en français. Analyse le pipeline. Retourne UNIQUEMENT JSON: {\"stalled\":[{\"id\":\"...\",\"name\":\"...\",\"reason\":\"...\"}], \"hot\":[{\"id\":\"...\",\"name\":\"...\",\"reason\":\"...\"}], \"summary\":\"3 lignes\"}." },
      { role: "user", content: JSON.stringify(opps ?? []) },
    ]);
    const parsed = safeJson(content) ?? { stalled: [], hot: [], summary: content };
    await (context.supabase as any).from("crm_saved_insights").insert({
      user_id: context.userId, kind: "pipeline", payload: parsed, summary: parsed.summary ?? null,
    });
    return parsed;
  });

export const getLatestInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("crm_saved_insights")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    const nba = data?.find((r: any) => r.kind === "nba") ?? null;
    const pipeline = data?.find((r: any) => r.kind === "pipeline") ?? null;
    return { nba, pipeline, history: data ?? [] };
  });

export const updateAiModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ model: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("profiles").update({ ai_model: data.model }).eq("id", context.userId);
    return { ok: true };
  });

export const aiScoreOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase.from("crm_opportunities").select("*").eq("id", data.opportunityId).single();
    const { data: acts } = await context.supabase
      .from("crm_activities").select("type,title,content,status,created_at")
      .eq("opportunity_id", data.opportunityId).order("created_at", { ascending: false }).limit(30);
    const { data: contacts } = await (context.supabase as any)
      .from("crm_contacts").select("name,role,is_decision_maker,influence").eq("opportunity_id", data.opportunityId);

    const model = await getUserModel(context.supabase, context.userId);
    const content = await callAI(model, [
      { role: "system", content:
`Tu es un directeur commercial senior. Réponds UNIQUEMENT en JSON strict, en français:
{
  "health_score": 0-100,
  "closing_score": 0-100,
  "priority": "high"|"medium"|"low",
  "risks": ["..."],
  "strengths": ["..."],
  "next_actions": [{"action":"...","why":"...","urgency":"high|medium|low","category":"action|risque|dépendance"}]
}` },
      { role: "user", content: `Opportunité: ${JSON.stringify(opp)}\nContacts: ${JSON.stringify(contacts ?? [])}\nActivités: ${JSON.stringify(acts ?? [])}` },
    ]);
    const parsed = safeJson(content) ?? {};
    const nextActions = Array.isArray(parsed.next_actions) ? parsed.next_actions.slice(0, 8) : [];
    const patch: any = {
      health_score: typeof parsed.health_score === "number" ? Math.max(0, Math.min(100, parsed.health_score)) : null,
      closing_score: typeof parsed.closing_score === "number" ? Math.max(0, Math.min(100, parsed.closing_score)) : null,
      priority: ["high", "medium", "low"].includes(parsed.priority) ? parsed.priority : null,
      risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 8) : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 8) : [],
      next_actions: nextActions,
      last_ai_analysis_at: new Date().toISOString(),
    };
    await context.supabase.from("crm_opportunities").update(patch).eq("id", data.opportunityId);

    // Sync checklist with next_actions (source=ai)
    await (context.supabase as any).from("crm_closing_checklists").delete()
      .eq("opportunity_id", data.opportunityId).eq("source", "ai");
    if (nextActions.length > 0) {
      const rows = nextActions.map((a: any, i: number) => ({
        user_id: context.userId,
        opportunity_id: data.opportunityId,
        title: a.action || "Action",
        description: a.why || null,
        category: a.category === "risque" ? "risk" : a.category === "dépendance" ? "dependency" : "action",
        priority: ["high", "medium", "low"].includes(a.urgency) ? a.urgency : "medium",
        status: "pending",
        source: "ai",
        order_index: i,
      }));
      await (context.supabase as any).from("crm_closing_checklists").insert(rows);
    }
    return patch;
  });

export const aiMeetingPrep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase.from("crm_opportunities").select("*").eq("id", data.opportunityId).single();
    const { data: acts } = await context.supabase
      .from("crm_activities").select("type,title,content,created_at")
      .eq("opportunity_id", data.opportunityId).order("created_at", { ascending: false }).limit(20);
    const model = await getUserModel(context.supabase, context.userId);
    const content = await callAI(model, [
      { role: "system", content: "Tu prépares un brief de rendez-vous commercial (10 lignes max) en français: contexte, objectifs, questions clés, arguments, objections probables et parades. Markdown compact." },
      { role: "user", content: `Opportunité: ${JSON.stringify(opp)}\nHistorique: ${JSON.stringify(acts)}` },
    ]);
    return { brief: content };
  });

export const aiObjectionHandling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid(), objection: z.string().min(3) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase.from("crm_opportunities").select("*").eq("id", data.opportunityId).single();
    const model = await getUserModel(context.supabase, context.userId);
    const content = await callAI(model, [
      { role: "system", content: "Tu es coach commercial. En français, fournis 3 réponses tactiques courtes à l'objection, adaptées au contexte. Format bullet." },
      { role: "user", content: `Contexte: ${JSON.stringify(opp)}\nObjection: ${data.objection}` },
    ]);
    return { response: content };
  });

// New: convert AI recommendation into an activity (email draft, follow-up, task)
export const aiGenerateFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid(), kind: z.enum(["email", "task", "relance"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase.from("crm_opportunities").select("*").eq("id", data.opportunityId).single();
    const model = await getUserModel(context.supabase, context.userId);
    const prompts: Record<string, string> = {
      email: "Rédige un email de suivi en français, format SUBJECT: <sujet>\\n\\n<corps>. 120 mots max.",
      relance: "Rédige un email de relance en français, ton respectueux + urgence subtile. Format SUBJECT: <sujet>\\n\\n<corps>. 100 mots max.",
      task: "Propose 3 tâches concrètes à effectuer pour avancer l'opportunité. En français, format bullet.",
    };
    const content = await callAI(model, [
      { role: "system", content: prompts[data.kind] },
      { role: "user", content: JSON.stringify(opp) },
    ]);
    if (data.kind === "task") return { kind: data.kind, text: content };
    const [subjLine, ...rest] = content.split("\n");
    return { kind: data.kind, subject: subjLine.replace(/^SUBJECT:\s*/i, "").trim(), body: rest.join("\n").trim() };
  });
