import { nj } from "./db";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAI } from "./ai-gateway.server";
import { storeProjectFile } from "./files.server";
import { logAudit } from "./audit.server";

export const listExpenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows } = await nj(context.supabase).from("noject_expenses")
      .select("*").eq("project_id", data.projectId).order("expense_date", { ascending: false });
    return rows ?? [];
  });

export const scanInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string(),
    name: z.string(),
    mimeType: z.string(),
    base64: z.string(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    // 1) AI vision-lite: send base64 image to gateway (Gemini supports multimodal via data URL in message)
    let ai: any = { amount: null, vendor: null, category: "Divers", date: null, description: data.name };
    try {
      const dataUrl = `data:${data.mimeType};base64,${data.base64}`;
      const key = process.env.LOVABLE_API_KEY!;
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Extrait les informations d'une facture. Retourne UNIQUEMENT du JSON strict: {\"amount\":number,\"currency\":\"EUR\",\"vendor\":string,\"category\":string,\"date\":\"YYYY-MM-DD\",\"description\":string}. Si un champ est absent mets null." },
            { role: "user", content: [
              { type: "text", text: "Analyse cette facture:" },
              { type: "image_url", image_url: { url: dataUrl } },
            ] as any },
          ],
        }),
      });
      const txt = await res.text();
      if (res.ok) {
        const parsed = JSON.parse(txt);
        const content = parsed.choices?.[0]?.message?.content;
        if (content) ai = { ...ai, ...JSON.parse(content) };
      }
    } catch { /* fallback to empty */ }

    // 2) Store the invoice natively in the project's "Factures" folder
    let file_id: string | null = null;
    try {
      const f = await storeProjectFile(context.supabase, context.userId, {
        projectId: data.projectId, name: data.name, mimeType: data.mimeType,
        base64: data.base64, folder: "Factures", source: "invoice",
      });
      file_id = f.id;
    } catch { /* keep null */ }

    const { data: row, error } = await nj(context.supabase).from("noject_expenses").insert({
      project_id: data.projectId,
      user_id: context.userId,
      amount: ai.amount ?? 0,
      currency: ai.currency ?? "EUR",
      vendor: ai.vendor ?? null,
      category: ai.category ?? "Divers",
      expense_date: ai.date ?? new Date().toISOString().slice(0, 10),
      description: ai.description ?? data.name,
      file_id,
      ai_extracted: ai,
    }).select().single();
    if (error) throw error;
    await logAudit(context.userId, data.projectId, "expense", row.id, "create", { source: "invoice_scan", ai });

    // Budget alert if over 80% of project budget
    const { data: project } = await nj(context.supabase).from("noject_projects").select("budget").eq("id", data.projectId).maybeSingle();
    const { data: sumRows } = await nj(context.supabase).from("noject_expenses").select("amount").eq("project_id", data.projectId);
    const total = (sumRows ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    if (project?.budget && total > project.budget * 0.8) {
      await nj(context.supabase).from("noject_notifications").insert({
        user_id: context.userId, project_id: data.projectId, type: "budget_alert",
        title: "Alerte budget", message: `Budget consommé à ${Math.round(total / project.budget * 100)}%`,
        meta: { total, budget: project.budget },
      });
    }
    return row;
  });

export const createExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string(),
    amount: z.number(),
    vendor: z.string().optional(),
    category: z.string().optional(),
    expense_date: z.string().optional(),
    description: z.string().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await nj(context.supabase).from("noject_expenses").insert({
      project_id: data.projectId, user_id: context.userId,
      amount: data.amount, vendor: data.vendor ?? null,
      category: data.category ?? "Divers",
      expense_date: data.expense_date ?? new Date().toISOString().slice(0, 10),
      description: data.description ?? null,
    }).select().single();
    if (error) throw error;
    await logAudit(context.userId, data.projectId, "expense", row.id, "create");
    return row;
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row } = await nj(context.supabase).from("noject_expenses").select("project_id").eq("id", data.id).maybeSingle();
    await nj(context.supabase).from("noject_expenses").delete().eq("id", data.id);
    if (row) await logAudit(context.userId, row.project_id, "expense", data.id, "delete");
    return { ok: true };
  });
