import { nj } from "./db";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await nj(context.supabase).from("noject_notifications")
      .select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(50);
    return data ?? [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().optional(), all: z.boolean().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    let q = nj(context.supabase).from("noject_notifications").update({ read: true }).eq("user_id", context.userId);
    if (data.id) q = q.eq("id", data.id);
    await q;
    return { ok: true };
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows } = await nj(context.supabase).from("noject_audit_logs")
      .select("*").eq("project_id", data.projectId).eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(100);
    return rows ?? [];
  });

// Emit a manual notification (used e.g. when insights ready or big progress delta)
export const notifyUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    projectId: z.string().optional(),
    type: z.string(),
    title: z.string(),
    message: z.string().optional(),
    meta: z.record(z.any()).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await nj(context.supabase).from("noject_notifications").insert({
      user_id: context.userId,
      project_id: data.projectId ?? null,
      type: data.type,
      title: data.title,
      message: data.message ?? null,
      meta: data.meta ?? null,
    });
    return { ok: true };
  });
