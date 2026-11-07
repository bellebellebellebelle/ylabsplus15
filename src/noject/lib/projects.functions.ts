import { nj } from "./db";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAI } from "./ai-gateway.server";
import { storeProjectFile, FILES_BUCKET } from "./files.server";

const CreateInput = z.object({
  description: z.string().min(5),
  useAI: z.boolean().default(true),
});

async function getUserModel(userId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await nj(supabaseAdmin).from("noject_user_settings").select("ai_model").eq("user_id", userId).maybeSingle();
  const { resolveAppAiModel } = await import("@/lib/ai-models.server");
  return resolveAppAiModel(supabaseAdmin, userId, "noject", data?.ai_model || "google/gemini-2.5-flash");
}

const PLAN_SCHEMA_PROMPT = `Tu es un chef de projet expert. À partir de la description utilisateur, produis un plan STRICTEMENT en JSON, sans markdown, avec cette forme:
{
 "name": string,
 "objective": string,
 "description": string,
 "start_date": "YYYY-MM-DD",
 "end_date": "YYYY-MM-DD",
 "budget": number|null,
 "phases": [{"name": "lancement"|"planification"|"execution"|"cloture", "objectives": string[], "deliverables": string[], "duration_days": number}],
 "risks": [{"name": string, "impact": "faible"|"moyen"|"eleve", "mitigation": string}],
 "kpis": [{"name": string, "target": string}],
 "stakeholders": [{"role": string, "responsibility": string}],
 "tasks": [{"title": string, "phase": "lancement"|"planification"|"execution"|"cloture", "priority": "basse"|"moyenne"|"haute"|"critique", "start_offset_days": number, "duration_days": number, "estimated_hours": number, "subtasks": string[]}]
}
CRUCIAL pour les tâches: "start_offset_days" est le nombre de jours depuis start_date, "duration_days" est la durée réelle de la tâche (utilise au moins 2 jours, souvent 5 à 15 jours pour des tâches sérieuses). Fais un plan riche, professionnel, en français.`;

export const proposeProjectPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateInput.parse(i))
  .handler(async ({ data, context }) => {
    const model = await getUserModel(context.userId);
    const raw = await callAI({
      model,
      messages: [
        { role: "system", content: PLAN_SCHEMA_PROMPT },
        { role: "user", content: data.description },
      ],
      responseFormat: "json_object",
    });
    let plan: any;
    try { plan = JSON.parse(raw); }
    catch { throw new Error("La réponse IA n'est pas du JSON valide"); }
    return plan;
  });

const CommitInput = z.object({
  plan: z.any(),
});

export const createProjectFromPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CommitInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const plan = data.plan ?? {};
    const insertPayload: any = {
      user_id: context.userId,
      name: plan.name || "Nouveau projet",
      description: plan.description || null,
      objective: plan.objective || null,
      start_date: plan.start_date || null,
      end_date: plan.end_date || null,
      budget: plan.budget ?? null,
      ai_plan: plan,
      phase: "lancement",
      status: "actif",
      progress: 0,
    };

    const { data: project, error } = await nj(supabaseAdmin).from("noject_projects").insert(insertPayload).select().single();
    if (error) throw error;

    // Create tasks and subtasks
    const tasks = plan.tasks ?? [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const projStart = insertPayload.start_date ? new Date(insertPayload.start_date) : null;
      const startOffset = typeof t.start_offset_days === "number" ? t.start_offset_days : (t.due_offset_days ?? 0) - (t.duration_days ?? 3);
      const duration = Math.max(1, Number(t.duration_days ?? 3));
      const start_date = projStart ? new Date(projStart.getTime() + Math.max(0, startOffset) * 86400000).toISOString().slice(0, 10) : null;
      const due = projStart ? new Date(projStart.getTime() + (Math.max(0, startOffset) + duration - 1) * 86400000).toISOString().slice(0, 10) : null;
      const { data: taskRow } = await nj(supabaseAdmin).from("noject_tasks").insert({
        project_id: project.id, user_id: context.userId,
        title: t.title, priority: t.priority || "moyenne",
        status: "a_faire", start_date, due_date: due,
        estimated_hours: t.estimated_hours ?? null,
        position: i,
      }).select().single();
      // Subtasks
      if (Array.isArray(t.subtasks)) {
        for (let j = 0; j < t.subtasks.length; j++) {
          await nj(supabaseAdmin).from("noject_tasks").insert({
            project_id: project.id, user_id: context.userId,
            parent_task_id: taskRow!.id, title: t.subtasks[j],
            status: "a_faire", priority: "moyenne", position: j,
          });
        }
      }
    }

    return { project };
  });

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await nj(context.supabase).from("noject_projects")
      .select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p, error } = await nj(context.supabase).from("noject_projects").select("*").eq("id", data.id).maybeSingle();
    if (error) throw error;
    return p;
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string(),
    patch: z.record(z.any()),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p, error } = await nj(context.supabase).from("noject_projects").update(data.patch as any).eq("id", data.id).select().single();
    if (error) throw error;
    return p;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await nj(context.supabase).from("noject_projects").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// AI-generated dashboard KPI computed from project data
export const generateProjectInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p } = await nj(context.supabase).from("noject_projects").select("*").eq("id", data.id).maybeSingle();
    const { data: tasks } = await nj(context.supabase).from("noject_tasks").select("*").eq("project_id", data.id);
    if (!p) throw new Error("Projet introuvable");
    const model = await getUserModel(context.userId);
    const raw = await callAI({
      model,
      messages: [
        { role: "system", content: `Tu es un analyste projet. Renvoie un JSON strict: {"health":"vert|jaune|rouge","summary":string,"alerts":string[],"nextActions":string[],"charts":[{"title":string,"type":"bar|line|pie","data":[{"label":string,"value":number}]}]}. Toujours en français.` },
        { role: "user", content: JSON.stringify({ project: p, tasks }).slice(0, 8000) },
      ],
      responseFormat: "json_object",
    });
    try { return JSON.parse(raw); } catch { return { health: "jaune", summary: raw, alerts: [], nextActions: [], charts: [] }; }
  });

// --- Files (native Cloud storage) ---
export const listProjectFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await nj(context.supabase).from("noject_project_files")
      .select("*").eq("project_id", data.projectId).order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const uploadProjectFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string(),
    name: z.string(),
    mimeType: z.string(),
    base64: z.string(),
    folder: z.string().default(""),
  }).parse(i))
  .handler(async ({ data, context }) => {
    return storeProjectFile(context.supabase, context.userId, { ...data, source: "upload" });
  });

export const getFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ fileId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: f } = await nj(context.supabase).from("noject_project_files").select("storage_path").eq("id", data.fileId).maybeSingle();
    if (!f) throw new Error("Fichier introuvable");
    const { data: signed, error } = await context.supabase.storage.from(FILES_BUCKET).createSignedUrl(f.storage_path, 600);
    if (error) throw error;
    return { url: signed.signedUrl };
  });

export const deleteProjectFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ fileId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: f } = await nj(context.supabase).from("noject_project_files").select("storage_path").eq("id", data.fileId).maybeSingle();
    if (f) await context.supabase.storage.from(FILES_BUCKET).remove([f.storage_path]);
    await nj(context.supabase).from("noject_project_files").delete().eq("id", data.fileId);
    return { ok: true };
  });

// --- Insights persistance ---
export const getSavedInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p } = await nj(context.supabase).from("noject_projects")
      .select("ai_insights, insights_updated_at").eq("id", data.id).maybeSingle();
    return p ?? { ai_insights: null, insights_updated_at: null };
  });

// Overrides previous generateProjectInsights? We keep old, and add one that persists.
export const refreshProjectInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const insights = await generateProjectInsights({ data: { id: data.id } });
    await nj(context.supabase).from("noject_projects")
      .update({ ai_insights: insights, insights_updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return insights;
  });
