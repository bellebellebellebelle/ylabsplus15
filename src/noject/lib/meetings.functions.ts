import { nj } from "./db";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAI } from "./ai-gateway.server";
import { storeProjectFile } from "./files.server";
import { logAudit } from "./audit.server";

async function getUserModel(userId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await nj(supabaseAdmin).from("noject_user_settings").select("ai_model").eq("user_id", userId).maybeSingle();
  // For audio we always need a Gemini multimodal model
  const preferred = (data as any)?.ai_model;
  if (preferred?.startsWith("google/gemini")) return preferred;
  return "google/gemini-2.5-flash";
}

export const listMeetings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows } = await nj(context.supabase).from("noject_meeting_transcripts")
      .select("*").eq("project_id", data.projectId).order("created_at", { ascending: false });
    return rows ?? [];
  });

export const transcribeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string(),
    name: z.string(),
    mimeType: z.string(),
    base64: z.string(),
    createTasks: z.boolean().default(true),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const model = await getUserModel(context.userId);

    // Archive the audio natively in the project's "Réunions" folder
    let file_id: string | null = null;
    try {
      const f = await storeProjectFile(context.supabase, context.userId, {
        projectId: data.projectId, name: data.name, mimeType: data.mimeType,
        base64: data.base64, folder: "Réunions", source: "meeting",
      });
      file_id = f.id;
    } catch { /* ignore */ }

    const audioFormat = (data.mimeType.split("/")[1] || "mp3").split(";")[0];

    const raw = await callAI({
      model,
      responseFormat: "json_object",
      messages: [
        { role: "system", content:
          `Tu es un assistant qui produit un compte-rendu structuré à partir d'un enregistrement audio de réunion. Renvoie STRICTEMENT ce JSON: {"transcript": string, "summary": string, "decisions": string[], "next_tasks": [{"title": string, "assignee": string|null, "due": "YYYY-MM-DD"|null, "priority": "basse|moyenne|haute|critique"}]}. Toujours en français.` },
        { role: "user", content: [
          { type: "text", text: "Analyse cet enregistrement de réunion et rends le JSON demandé." },
          { type: "input_audio", input_audio: { data: data.base64, format: audioFormat } },
        ] },
      ],
    });

    let parsed: any;
    try { parsed = JSON.parse(raw); }
    catch { parsed = { transcript: raw, summary: "Analyse partielle.", decisions: [], next_tasks: [] }; }

    // Persist meeting
    const { data: meeting } = await nj(context.supabase).from("noject_meeting_transcripts").insert({
      user_id: context.userId,
      project_id: data.projectId,
      audio_name: data.name,
      transcript: parsed.transcript ?? null,
      summary: parsed.summary ?? null,
      extracted_tasks: parsed.next_tasks ?? [],
      file_id,
    }).select().single();

    // Auto-create tasks
    const createdTaskIds: string[] = [];
    if (data.createTasks && Array.isArray(parsed.next_tasks)) {
      for (const t of parsed.next_tasks) {
        const { data: newTask } = await nj(context.supabase).from("noject_tasks").insert({
          project_id: data.projectId, user_id: context.userId,
          title: t.title, status: "a_faire",
          priority: ["basse","moyenne","haute","critique"].includes(t.priority) ? t.priority : "moyenne",
          due_date: t.due ?? null,
          notes: t.assignee ? `Assigné à ${t.assignee}` : null,
          tags: ["réunion"],
          icon: "ClipboardList",
        }).select("id").single();
        if (newTask) createdTaskIds.push(newTask.id);
      }
    }
    await logAudit(context.userId, data.projectId, "file", meeting?.id ?? null, "create", { audio: data.name, tasksCreated: createdTaskIds.length });
    return { meeting, createdTasks: createdTaskIds.length };
  });

export const deleteMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    await nj(context.supabase).from("noject_meeting_transcripts").delete().eq("id", data.id);
    return { ok: true };
  });
