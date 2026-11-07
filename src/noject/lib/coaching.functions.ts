import { nj } from "./db";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAI } from "./ai-gateway.server";

async function getUserModel(userId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await nj(supabaseAdmin).from("noject_user_settings").select("ai_model").eq("user_id", userId).maybeSingle();
  const { resolveAppAiModel } = await import("@/lib/ai-models.server");
  return resolveAppAiModel(supabaseAdmin, userId, "noject", (data as any)?.ai_model || "google/gemini-2.5-flash");
}

async function loadProjectContext(userId: string, projectId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: project }, { data: tasks }, { data: events }, { data: expenses }, { data: timeEntries }] = await Promise.all([
    nj(supabaseAdmin).from("noject_projects").select("*").eq("id", projectId).eq("user_id", userId).maybeSingle(),
    nj(supabaseAdmin).from("noject_tasks").select("*").eq("project_id", projectId),
    nj(supabaseAdmin).from("noject_calendar_events").select("*").eq("project_id", projectId),
    nj(supabaseAdmin).from("noject_expenses").select("*").eq("project_id", projectId),
    nj(supabaseAdmin).from("noject_time_entries").select("*").eq("project_id", projectId),
  ]);
  return { project, tasks: tasks ?? [], events: events ?? [], expenses: expenses ?? [], timeEntries: timeEntries ?? [] };
}

function summarize(ctx: any) {
  const p = ctx.project ?? {};
  const totalBudget = Number(p.budget ?? 0);
  const spent = ctx.expenses.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
  const today = new Date();
  const late = ctx.tasks.filter((t: any) => t.status !== "termine" && t.due_date && new Date(t.due_date) < today);
  const done = ctx.tasks.filter((t: any) => t.status === "termine").length;
  const total = ctx.tasks.length;
  const nextEvents = ctx.events
    .filter((e: any) => new Date(e.start_at) >= today)
    .sort((a: any, b: any) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    .slice(0, 3);
  const totalHoursTracked = ctx.timeEntries.reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0) / 3600;
  return {
    name: p.name, phase: p.phase, progress: p.progress,
    dates: { start: p.start_date, end: p.end_date },
    budget: { total: totalBudget, spent, remaining: totalBudget - spent, pct: totalBudget ? Math.round((spent / totalBudget) * 100) : 0 },
    tasks: { total, done, late: late.length, lateTitles: late.slice(0, 8).map((t: any) => `${t.title} (${t.due_date})`) },
    upcomingEvents: nextEvents.map((e: any) => `${e.title} - ${e.start_at}`),
    hoursTracked: totalHoursTracked.toFixed(1),
  };
}

// ==================== COACH IA ====================

export const listCoachMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows } = await nj(context.supabase).from("noject_coaching_sessions")
      .select("*").eq("project_id", data.projectId).order("created_at").limit(80);
    return rows ?? [];
  });

export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string(), question: z.string().min(1) }).parse(i))
  .handler(async ({ data, context }) => {
    const model = await getUserModel(context.userId);
    const ctx = await loadProjectContext(context.userId, data.projectId);
    const sum = summarize(ctx);

    // load recent history
    const { data: history } = await nj(context.supabase).from("noject_coaching_sessions")
      .select("role, content").eq("project_id", data.projectId).order("created_at", { ascending: true }).limit(20);

    const messages: any[] = [
      { role: "system", content:
        `Tu es un coach expert en gestion de projet. Tu réponds en français, brièvement (max 6 puces), avec des recommandations concrètes basées uniquement sur les données du projet fournies. Identifie les blocages, priorités, risques budgétaires ou de délai, et propose l'action suivante à mener.\nDONNÉES PROJET: ${JSON.stringify(sum)}` },
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.question },
    ];

    const answer = await callAI({ model, messages });

    await nj(context.supabase).from("noject_coaching_sessions").insert([
      { user_id: context.userId, project_id: data.projectId, role: "user", content: data.question },
      { user_id: context.userId, project_id: data.projectId, role: "assistant", content: answer },
    ]);

    return { answer };
  });

// ==================== HEALTH SCORE ====================

export const computeHealthScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const model = await getUserModel(context.userId);
    const ctx = await loadProjectContext(context.userId, data.projectId);
    const sum = summarize(ctx);

    const raw = await callAI({
      model,
      messages: [
        { role: "system", content:
          `Tu es un analyste de risque projet. Renvoie STRICTEMENT du JSON: {"score": 0-100, "trend": "up|flat|down", "risks": [{"label": string, "severity": "low|med|high", "recommendation": string}], "eta_delay_days": number, "budget_risk_pct": number, "confidence": 0-100, "summary": string}. Note: score haut = très bonne santé.` },
        { role: "user", content: JSON.stringify(sum) },
      ],
      responseFormat: "json_object",
    });
    let health: any;
    try { health = JSON.parse(raw); } catch { health = { score: 50, trend: "flat", risks: [], summary: raw }; }
    const now = new Date().toISOString();
    await nj(context.supabase).from("noject_projects").update({
      health_score: health.score ?? null,
      health_data: health,
      health_updated_at: now,
    }).eq("id", data.projectId);
    return health;
  });

export const getHealthScore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p } = await nj(context.supabase).from("noject_projects")
      .select("health_score, health_data, health_updated_at").eq("id", data.projectId).maybeSingle();
    return p ?? { health_score: null, health_data: null, health_updated_at: null };
  });

// ==================== MONTE-CARLO ====================

export const runMonteCarlo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string(), iterations: z.number().min(100).max(20000).default(2000) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: tasks } = await nj(context.supabase).from("noject_tasks")
      .select("id, title, start_date, due_date, estimated_hours, dependency_ids, parent_task_id, status")
      .eq("project_id", data.projectId);
    const list = (tasks ?? []).filter((t: any) => !t.parent_task_id);
    if (list.length === 0) throw new Error("Aucune tâche pour simuler.");

    // Compute base duration per task (days). Prefer start/due span, fallback to estimated hours/8, else 3d.
    const base = new Map<string, number>();
    for (const t of list) {
      let d = 3;
      if (t.start_date && t.due_date) {
        d = Math.max(1, Math.round((new Date(t.due_date).getTime() - new Date(t.start_date).getTime()) / 86400000) + 1);
      } else if (t.estimated_hours) {
        d = Math.max(1, Math.ceil(Number(t.estimated_hours) / 8));
      }
      base.set(t.id, d);
    }

    // Topo sort by dependencies
    const order: string[] = [];
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visited.has(id)) return;
      const t = list.find((x: any) => x.id === id);
      if (!t) return;
      visited.add(id);
      for (const d of (t.dependency_ids ?? [])) visit(d);
      order.push(id);
    };
    for (const t of list) visit(t.id);

    // Sample duration ~ triangular(min=0.75*base, mode=base, max=1.75*base)
    const sampleDur = (b: number) => {
      const min = b * 0.75, mode = b, max = b * 1.75;
      const u = Math.random();
      const c = (mode - min) / (max - min);
      return u < c
        ? min + Math.sqrt(u * (max - min) * (mode - min))
        : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    };

    const results: number[] = [];
    const iters = data.iterations;
    for (let i = 0; i < iters; i++) {
      const finish = new Map<string, number>();
      for (const id of order) {
        const t = list.find((x: any) => x.id === id)!;
        const deps: string[] = t.dependency_ids ?? [];
        const startAfter = deps.length ? Math.max(...deps.map(d => finish.get(d) ?? 0)) : 0;
        finish.set(id, startAfter + sampleDur(base.get(id)!));
      }
      const projectEnd = Math.max(...finish.values());
      results.push(projectEnd);
    }
    results.sort((a, b) => a - b);
    const p = (q: number) => results[Math.min(results.length - 1, Math.floor(results.length * q))];
    const mean = results.reduce((s, v) => s + v, 0) / results.length;

    // Histogram (20 bins)
    const minV = results[0], maxV = results[results.length - 1];
    const bins = 20;
    const step = (maxV - minV) / bins || 1;
    const hist = Array.from({ length: bins }, (_, i) => ({ label: `${(minV + i * step).toFixed(0)}j`, value: 0 }));
    for (const v of results) {
      const idx = Math.min(bins - 1, Math.floor((v - minV) / step));
      hist[idx].value++;
    }

    const summary = {
      iterations: iters,
      minDays: Math.round(minV),
      maxDays: Math.round(maxV),
      meanDays: Math.round(mean),
      p50: Math.round(p(0.5)),
      p80: Math.round(p(0.8)),
      p95: Math.round(p(0.95)),
      histogram: hist,
      computed_at: new Date().toISOString(),
    };
    await nj(context.supabase).from("noject_projects").update({ monte_carlo: summary }).eq("id", data.projectId);
    return summary;
  });

export const getMonteCarlo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p } = await nj(context.supabase).from("noject_projects").select("monte_carlo").eq("id", data.projectId).maybeSingle();
    return (p as any)?.monte_carlo ?? null;
  });

// ==================== PORTFOLIO (multi-project consolidated dashboard) ====================

export const getPortfolio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: projects }, { data: tasks }, { data: expenses }, { data: time }] = await Promise.all([
      nj(context.supabase).from("noject_projects").select("*"),
      nj(context.supabase).from("noject_tasks").select("*"),
      nj(context.supabase).from("noject_expenses").select("*"),
      nj(context.supabase).from("noject_time_entries").select("*"),
    ]);
    return {
      projects: projects ?? [],
      tasks: tasks ?? [],
      expenses: expenses ?? [],
      timeEntries: time ?? [],
    };
  });
