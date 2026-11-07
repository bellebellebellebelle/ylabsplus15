import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const REDIRECT_PATH = "/api/public/pa-google/callback";

function getRedirectUri(origin: string) {
  return `${origin}${REDIRECT_PATH}`;
}

export const getGoogleConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any).from("pa_google_connections").select("email,last_sync_at,scope,expires_at").eq("user_id", context.userId).maybeSingle();
    return data;
  });

export const startGoogleOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ origin: z.string().url() }).parse(raw))
  .handler(async ({ data, context }) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("GOOGLE_CLIENT_ID manquant");
    const state = Buffer.from(JSON.stringify({ uid: context.userId, ts: Date.now() })).toString("base64url");
    const scope = [
      "openid", "email", "profile",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/tasks",
    ].join(" ");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getRedirectUri(data.origin),
      response_type: "code",
      scope,
      access_type: "offline",
      include_granted_scopes: "true",
      prompt: "consent",
      state,
    });
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  });

export const disconnectGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await (context.supabase as any).from("pa_google_connections").delete().eq("user_id", context.userId);
    return { ok: true };
  });

// Ensure valid access token (refresh if needed) — admin path (must fetch refresh_token)
async function getValidToken(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: conn } = await (supabaseAdmin as any).from("pa_google_connections").select("*").eq("user_id", userId).maybeSingle();
  if (!conn) return null;
  const now = Date.now();
  const exp = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
  if (exp - now > 60_000) return conn;

  if (!conn.refresh_token) return conn;
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret,
      grant_type: "refresh_token", refresh_token: conn.refresh_token,
    }),
  });
  if (!res.ok) { console.error("google refresh failed", await res.text()); return conn; }
  const json = await res.json();
  const newExpires = new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString();
  const { data: updated } = await (supabaseAdmin as any).from("pa_google_connections").update({
    access_token: json.access_token, expires_at: newExpires,
  }).eq("user_id", userId).select("*").maybeSingle();
  return updated ?? conn;
}

async function gfetch(userId: string, url: string, init: RequestInit = {}) {
  const conn = await getValidToken(userId);
  if (!conn) throw new Error("Google non connecté");
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${conn.access_token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Google API ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : await res.json();
}

export const syncItemToGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ itemId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: item } = await (context.supabase as any).from("pa_planning_items").select("*").eq("id", data.itemId).maybeSingle();
    if (!item) return { skipped: true };
    const conn = await getValidToken(context.userId);
    if (!conn) return { skipped: "no_connection" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (item.kind === "event") {
      const start = item.start_at ?? item.due_at ?? new Date().toISOString();
      const end = item.end_at ?? new Date(new Date(start).getTime() + (item.duration_min ?? 60) * 60_000).toISOString();
      const body = {
        summary: item.title,
        description: [item.description, item.notes].filter(Boolean).join("\n\n") || undefined,
        location: item.location ?? undefined,
        start: item.all_day ? { date: start.slice(0, 10) } : { dateTime: start },
        end: item.all_day ? { date: end.slice(0, 10) } : { dateTime: end },
        attendees: (item.attendees ?? []).map((email: string) => ({ email })),
      };
      let result;
      if (item.google_event_id) {
        result = await gfetch(context.userId, `https://www.googleapis.com/calendar/v3/calendars/primary/events/${item.google_event_id}`,
          { method: "PATCH", body: JSON.stringify(body) });
      } else {
        result = await gfetch(context.userId, `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
          { method: "POST", body: JSON.stringify(body) });
      }
      await (supabaseAdmin as any).from("pa_planning_items").update({
        google_event_id: result.id, google_calendar_id: "primary", google_synced_at: new Date().toISOString(),
      }).eq("id", item.id);
    } else {
      const due = item.due_at ?? item.start_at;
      const listId = item.google_task_list_id || "@default";
      const isDone = item.status === "done" || item.board_column === "done";
      const body: Record<string, unknown> = {
        title: item.title,
        notes: [item.description, item.notes].filter(Boolean).join("\n\n") || undefined,
        due: due ? new Date(due).toISOString() : undefined,
        status: isDone ? "completed" : "needsAction",
      };
      if (isDone) body.completed = new Date().toISOString();
      let result;
      if (item.google_task_id) {
        result = await gfetch(context.userId, `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${item.google_task_id}`,
          { method: "PATCH", body: JSON.stringify(body) });
      } else {
        result = await gfetch(context.userId, `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`,
          { method: "POST", body: JSON.stringify(body) });
      }
      await (supabaseAdmin as any).from("pa_planning_items").update({
        google_task_id: result.id, google_task_list_id: listId, google_synced_at: new Date().toISOString(),
      }).eq("id", item.id);
    }
    return { ok: true };
  });

export const deleteFromGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ item: z.any() }).parse(raw))
  .handler(async ({ data, context }) => {
    const item = data.item;
    const conn = await getValidToken(context.userId);
    if (!conn) return { skipped: true };
    try {
      if (item.google_event_id) {
        await gfetch(context.userId, `https://www.googleapis.com/calendar/v3/calendars/primary/events/${item.google_event_id}`, { method: "DELETE" });
      }
      if (item.google_task_id) {
        const listId = item.google_task_list_id || "@default";
        await gfetch(context.userId, `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${item.google_task_id}`, { method: "DELETE" });
      }
    } catch (e) { console.warn("delete google failed", e); }
    return { ok: true };
  });

export const listGoogleTaskLists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const conn = await getValidToken(context.userId);
    if (!conn) return [];
    const res = await gfetch(context.userId, `https://tasks.googleapis.com/tasks/v1/users/@me/lists`);
    return (res?.items ?? []).map((l: { id: string; title: string }) => ({ id: l.id, title: l.title }));
  });

export const createGoogleTaskList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ title: z.string().min(1) }).parse(raw))
  .handler(async ({ data, context }) => {
    const conn = await getValidToken(context.userId);
    if (!conn) throw new Error("Google non connecté");
    const res = await gfetch(context.userId, `https://tasks.googleapis.com/tasks/v1/users/@me/lists`, {
      method: "POST", body: JSON.stringify({ title: data.title }),
    });
    return { id: res.id, title: res.title };
  });


export const pullFromGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const conn = await getValidToken(context.userId);
    if (!conn) throw new Error("Google non connecté");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch calendar events (next 60 days)
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 60 * 86400_000).toISOString();
    const evUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`;
    const eventsResp = await gfetch(context.userId, evUrl);
    const events = eventsResp?.items ?? [];
    let imported = 0;
    for (const ev of events) {
      const start = ev.start?.dateTime ?? (ev.start?.date ? new Date(ev.start.date).toISOString() : null);
      const end = ev.end?.dateTime ?? (ev.end?.date ? new Date(ev.end.date).toISOString() : null);
      const { data: existing } = await (supabaseAdmin as any).from("pa_planning_items").select("id").eq("user_id", context.userId).eq("google_event_id", ev.id).maybeSingle();
      const patch = {
        user_id: context.userId, kind: "event" as const, title: ev.summary ?? "(Sans titre)",
        description: ev.description ?? null, location: ev.location ?? null,
        start_at: start, end_at: end, all_day: !!ev.start?.date,
        google_event_id: ev.id, google_calendar_id: "primary",
        google_synced_at: new Date().toISOString(),
        board_column: computeColumn(start),
      };
      if (existing) await (supabaseAdmin as any).from("pa_planning_items").update(patch).eq("id", existing.id);
      else { await (supabaseAdmin as any).from("pa_planning_items").insert(patch); imported++; }
    }

    // Fetch tasks from every task list
    let totalTasks = 0;
    const listsResp = await gfetch(context.userId, `https://tasks.googleapis.com/tasks/v1/users/@me/lists`);
    const lists = listsResp?.items ?? [{ id: "@default", title: "Mes tâches" }];
    for (const list of lists) {
      const tasksResp = await gfetch(context.userId, `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?showCompleted=true&maxResults=100`);
      const tasks = tasksResp?.items ?? [];
      totalTasks += tasks.length;
      for (const t of tasks) {
        const due = t.due ?? null;
        const isDone = t.status === "completed";
        const { data: existing } = await (supabaseAdmin as any).from("pa_planning_items").select("id").eq("user_id", context.userId).eq("google_task_id", t.id).maybeSingle();
        const patch = {
          user_id: context.userId, kind: "task" as const, title: t.title ?? "(Sans titre)",
          description: t.notes ?? null, due_at: due, start_at: due,
          status: isDone ? "done" : "planned",
          google_task_id: t.id, google_task_list_id: list.id,
          google_synced_at: new Date().toISOString(),
          board_column: isDone ? "done" : computeColumn(due),
        };
        if (existing) await (supabaseAdmin as any).from("pa_planning_items").update(patch).eq("id", existing.id);
        else { await (supabaseAdmin as any).from("pa_planning_items").insert(patch); imported++; }
      }
    }

    await (supabaseAdmin as any).from("pa_google_connections").update({ last_sync_at: new Date().toISOString() }).eq("user_id", context.userId);
    return { imported, total: events.length + totalTasks };
  });

function computeColumn(dateStr: string | null): string {
  if (!dateStr) return "inbox";
  const d = new Date(dateStr); const now = new Date();
  const day = 86400_000;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((target - startOfDay) / day);
  if (diff <= 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 7) return "week";
  return "later";
}
