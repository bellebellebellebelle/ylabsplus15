import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ItemInput = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["event", "task"]),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  attendees: z.array(z.string()).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  status: z.string().optional(),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
  due_at: z.string().nullable().optional(),
  duration_min: z.number().nullable().optional(),
  all_day: z.boolean().optional(),
  board_column: z.string().optional(),
  position: z.number().optional(),
  google_task_list_id: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const listPlanningItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("pa_planning_items")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertPlanningItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ItemInput.parse(raw))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    const { data: row, error } = data.id
      ? await (context.supabase as any).from("pa_planning_items").update(payload).eq("id", data.id).select("*").single()
      : await (context.supabase as any).from("pa_planning_items").insert(payload).select("*").single();
    if (error) throw new Error(error.message);

    await (context.supabase as any).from("pa_activity_log").insert({
      user_id: context.userId,
      item_id: row.id,
      action: data.id ? "update" : "create",
      after: row as never,
    });

    // Trigger Google sync (fire and forget)
    try {
      const { syncItemToGoogle } = await import("./google.functions");
      await syncItemToGoogle({ data: { itemId: row.id } });
    } catch (e) { console.warn("google sync skipped", e); }

    return row;
  });

export const moveItemToColumn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    id: z.string().uuid(),
    board_column: z.string(),
    position: z.number().optional(),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    // map column -> date
    const now = new Date();
    let start_at: string | null = null;
    let due_at: string | null = null;
    const setDay = (offset: number) => {
      const d = new Date(now); d.setDate(d.getDate() + offset); d.setHours(9, 0, 0, 0);
      return d.toISOString();
    };
    switch (data.board_column) {
      case "today": start_at = setDay(0); due_at = setDay(0); break;
      case "tomorrow": start_at = setDay(1); due_at = setDay(1); break;
      case "week": start_at = setDay(3); due_at = setDay(3); break;
      case "later": start_at = setDay(14); due_at = setDay(14); break;
    }
    const patch: Record<string, unknown> = { board_column: data.board_column };
    if (data.position !== undefined) patch.position = data.position;
    if (start_at) { patch.start_at = start_at; patch.due_at = due_at; }
    if (data.board_column === "done") patch.status = "done";
    else patch.status = "planned";
    const { data: row, error } = await (context.supabase as any)
      .from("pa_planning_items").update(patch as never).eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);
    try {
      const { syncItemToGoogle } = await import("./google.functions");
      await syncItemToGoogle({ data: { itemId: row.id } });
    } catch (e) { console.warn("google sync skipped", e); }
    return row;
  });

export const deletePlanningItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    // First fetch to know google ids
    const { data: item } = await (context.supabase as any).from("pa_planning_items").select("*").eq("id", data.id).single();
    const { error } = await (context.supabase as any).from("pa_planning_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    try {
      const { deleteFromGoogle } = await import("./google.functions");
      if (item) await deleteFromGoogle({ data: { item: item as never } });
    } catch (e) { console.warn(e); }
    return { ok: true };
  });

export const getInstructions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any).from("pa_agent_instructions").select("*").eq("user_id", context.userId).maybeSingle();
    return data;
  });

export const saveInstructions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({
    working_hours: z.any().optional(),
    timezone: z.string().optional(),
    work_style: z.string().optional(),
    priorities: z.string().optional(),
    break_habits: z.string().optional(),
    communication_style: z.string().optional(),
    custom_rules: z.string().optional(),
    ai_model: z.string().optional(),
  }).parse(raw))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    const { data: row, error } = await (context.supabase as any)
      .from("pa_agent_instructions").upsert(payload, { onConflict: "user_id" }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getActivityLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("pa_activity_log").select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });
