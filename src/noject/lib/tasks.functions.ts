import { nj } from "./db";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAudit } from "./audit.server";

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: tasks, error } = await nj(context.supabase).from("noject_tasks")
      .select("*").eq("project_id", data.projectId).order("position");
    if (error) throw error;
    return tasks ?? [];
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string(),
    title: z.string().min(1),
    parentId: z.string().nullable().optional(),
    priority: z.enum(["basse","moyenne","haute","critique"]).default("moyenne"),
    start_date: z.string().nullable().optional(),
    due_date: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    estimated_hours: z.number().nullable().optional(),
    dependency_ids: z.array(z.string()).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: task, error } = await nj(context.supabase).from("noject_tasks").insert({
      project_id: data.projectId, user_id: context.userId,
      title: data.title, parent_task_id: data.parentId ?? null,
      priority: data.priority,
      start_date: data.start_date ?? null,
      due_date: data.due_date ?? null,
      notes: data.notes ?? null,
      description: data.description ?? null,
      color: data.color ?? null,
      icon: data.icon ?? null,
      tags: data.tags ?? [],
      estimated_hours: data.estimated_hours ?? null,
      dependency_ids: data.dependency_ids ?? [],
      status: "a_faire",
    }).select().single();
    if (error) throw error;
    await logAudit(context.userId, data.projectId, "task", task.id, "create", { title: data.title });

    return task;
  });

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string(),
    patch: z.record(z.any()),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const patch: any = { ...data.patch };
    if (patch.status === "termine" && !patch.completed_at) patch.completed_at = new Date().toISOString();
    if (patch.status && patch.status !== "termine") patch.completed_at = null;
    const { data: task, error } = await nj(context.supabase).from("noject_tasks").update(patch as any).eq("id", data.id).select().single();
    if (error) throw error;
    await logAudit(context.userId, task.project_id, "task", task.id, "update", patch);

    return task;
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: t } = await nj(context.supabase).from("noject_tasks").select("project_id").eq("id", data.id).maybeSingle();
    const { error } = await nj(context.supabase).from("noject_tasks").delete().eq("id", data.id);
    if (error) throw error;
    if (t) await logAudit(context.userId, t.project_id, "task", data.id, "delete");
    return { ok: true };
  });

// Calendar events
export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: events, error } = await nj(context.supabase).from("noject_calendar_events")
      .select("*").eq("project_id", data.projectId).order("start_at");
    if (error) throw error;
    return events ?? [];
  });

export const scheduleEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string(),
    title: z.string().min(1),
    description: z.string().optional(),
    start_at: z.string(),
    end_at: z.string(),
    location: z.string().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: ev, error } = await nj(context.supabase).from("noject_calendar_events").insert({
      project_id: data.projectId, user_id: context.userId,
      title: data.title, description: data.description ?? null,
      start_at: data.start_at, end_at: data.end_at, location: data.location ?? null,
    }).select().single();
    if (error) throw error;
    await logAudit(context.userId, data.projectId, "event", ev.id, "create", { title: data.title });
    return ev;
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: ev } = await nj(context.supabase).from("noject_calendar_events")
      .select("*").eq("id", data.id).maybeSingle();
    await nj(context.supabase).from("noject_calendar_events").delete().eq("id", data.id);
    if (ev) await logAudit(context.userId, ev.project_id, "event", data.id, "delete");
    return { ok: true };
  });

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await nj(context.supabase).from("noject_user_settings").select("*").eq("user_id", context.userId).maybeSingle();
    return data ?? { ai_model: "google/gemini-2.5-flash" };
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ ai_model: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await nj(context.supabase).from("noject_user_settings")
      .upsert({ user_id: context.userId, ai_model: data.ai_model });
    if (error) throw error;
    return { ok: true };
  });
