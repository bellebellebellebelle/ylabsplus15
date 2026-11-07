import { nj } from "./db";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startTimer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string(), taskId: z.string().nullable().optional(), note: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    // Close any running timer for this user
    await nj(context.supabase).from("noject_time_entries").update({
      ended_at: new Date().toISOString(),
    }).eq("user_id", context.userId).is("ended_at", null);
    const { data: e, error } = await nj(context.supabase).from("noject_time_entries").insert({
      user_id: context.userId,
      project_id: data.projectId,
      task_id: data.taskId ?? null,
      note: data.note ?? null,
    }).select().single();
    if (error) throw error;
    return e;
  });

export const stopTimer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    let q = nj(context.supabase).from("noject_time_entries").update({ ended_at: new Date().toISOString() });
    if (data.id) q = q.eq("id", data.id);
    else q = q.eq("user_id", context.userId).is("ended_at", null);
    const { data: rows } = await q.select();
    // Compute durations
    for (const r of rows ?? []) {
      if (!r.ended_at) continue;
      const dur = Math.round((new Date(r.ended_at as string).getTime() - new Date(r.started_at).getTime()) / 1000);
      await nj(context.supabase).from("noject_time_entries").update({ duration_seconds: dur }).eq("id", r.id);
      // Add to task actual_hours
      if (r.task_id) {
        const { data: t } = await nj(context.supabase).from("noject_tasks").select("actual_hours").eq("id", r.task_id).maybeSingle();
        await nj(context.supabase).from("noject_tasks").update({
          actual_hours: Number((t as any)?.actual_hours ?? 0) + dur / 3600,
        }).eq("id", r.task_id);
      }
    }
    return { ok: true };
  });

export const getRunningTimer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await nj(context.supabase).from("noject_time_entries")
      .select("*").eq("user_id", context.userId).is("ended_at", null)
      .order("started_at", { ascending: false }).limit(1).maybeSingle();
    return data;
  });

export const listTimeEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    let q = nj(context.supabase).from("noject_time_entries").select("*").eq("user_id", context.userId).not("ended_at", "is", null);
    if (data.projectId) q = q.eq("project_id", data.projectId);
    const { data: rows } = await q.order("started_at", { ascending: false }).limit(500);
    return rows ?? [];
  });

// Global report by project + by task
export const getTimeReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: entries }, { data: tasks }, { data: projects }] = await Promise.all([
      nj(context.supabase).from("noject_time_entries").select("*").eq("user_id", context.userId).not("ended_at", "is", null),
      nj(context.supabase).from("noject_tasks").select("id, title, project_id, estimated_hours, actual_hours"),
      nj(context.supabase).from("noject_projects").select("id, name"),
    ]);
    return { entries: entries ?? [], tasks: tasks ?? [], projects: projects ?? [] };
  });
