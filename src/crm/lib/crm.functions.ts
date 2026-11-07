import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendMailgunEmail, mailgunConfigured } from "./mailgun.server";

export const FILES_BUCKET = "opportunity-files";

async function audit(sb: any, userId: string, oppId: string | null, action: string, entity: string, entityId: string | null, details: Record<string, unknown> = {}) {
  try {
    await sb.from("crm_audit_logs").insert({ user_id: userId, opportunity_id: oppId, action, entity, entity_id: entityId, details });
  } catch (e) { console.warn("audit", e); }
}

// --- Email provider status ----------------------------------------------
export const getEmailProviderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ mailgun: mailgunConfigured() }));

// --- Activities (email / meeting / task / note) -------------------------
const ActivitySchema = z.object({
  opportunityId: z.string().uuid(),
  type: z.enum(["email", "meeting", "task", "note"]),
  title: z.string().min(1).max(300),
  content: z.string().max(20000).optional().default(""),
  scheduledAt: z.string().optional(),
  to: z.string().email().optional(),
  durationMinutes: z.number().int().positive().max(600).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  location: z.string().max(300).optional(),
});

export const createActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ActivitySchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { data: opp, error: oe } = await sb.from("crm_opportunities").select("id").eq("id", data.opportunityId).single();
    if (oe || !opp) throw new Error("Opportunité introuvable");

    let status = data.type === "note" ? "done" : "pending";
    let deliveryNote: string | null = null;

    if (data.type === "email") {
      if (!data.to) throw new Error("Destinataire requis");
      let emailStatus = "queued";
      let providerId: string | null = null;
      if (mailgunConfigured()) {
        const r = await sendMailgunEmail({ to: data.to, subject: data.title, text: data.content, oppId: data.opportunityId });
        emailStatus = "sent";
        providerId = r.id;
        status = "done";
      } else {
        deliveryNote = "Email enregistré — l'envoi réel sera actif dès que Mailgun sera configuré.";
      }
      await sb.from("sendy_email_threads").insert({
        user_id: context.userId,
        opportunity_id: data.opportunityId,
        direction: "outbound",
        from_email: "me",
        to_email: data.to,
        subject: data.title,
        snippet: data.content.slice(0, 200),
        body: data.content,
        received_at: new Date().toISOString(),
        status: emailStatus,
        provider: providerId ? "mailgun" : "native",
        provider_message_id: providerId,
      });
    }

    const { data: inserted, error } = await sb
      .from("crm_activities")
      .insert({
        user_id: context.userId,
        opportunity_id: data.opportunityId,
        type: data.type,
        title: data.title,
        content: data.content,
        scheduled_at: data.scheduledAt ?? null,
        status,
        priority: data.priority ?? "medium",
        duration_minutes: data.durationMinutes ?? null,
        location: data.location ?? null,
        completed_at: status === "done" ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw error;
    await audit(sb, context.userId, data.opportunityId, `${data.type}.create`, "activity", inserted.id, { title: data.title });
    return { ...inserted, deliveryNote };
  });

export const updateActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "done", "cancelled"]).optional(),
    title: z.string().min(1).max(300).optional(),
    content: z.string().max(20000).optional(),
    scheduledAt: z.string().nullable().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const patch: Record<string, unknown> = {};
    if (data.status) { patch.status = data.status; patch.completed_at = data.status === "done" ? new Date().toISOString() : null; }
    if (data.title !== undefined) patch.title = data.title;
    if (data.content !== undefined) patch.content = data.content;
    if (data.scheduledAt !== undefined) patch.scheduled_at = data.scheduledAt;
    if (data.priority) patch.priority = data.priority;
    const { data: row, error } = await sb.from("crm_activities").update(patch).eq("id", data.id).select().single();
    if (error) throw error;
    await audit(sb, context.userId, row.opportunity_id, `${row.type}.update`, "activity", row.id, patch);
    return row;
  });

export const deleteActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { data: row } = await sb.from("crm_activities").select("id,opportunity_id,type,title").eq("id", data.id).single();
    const { error } = await sb.from("crm_activities").delete().eq("id", data.id);
    if (error) throw error;
    if (row) await audit(sb, context.userId, row.opportunity_id, `${row.type}.delete`, "activity", row.id, { title: row.title });
    return { ok: true };
  });

// --- Upcoming agenda (dashboard) -----------------------------------------
export const listUpcomingMeetings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("crm_activities")
      .select("id,title,scheduled_at,duration_minutes,opportunity_id,location")
      .eq("type", "meeting")
      .neq("status", "cancelled")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(8);
    return { events: data ?? [] };
  });

// --- Delete opportunity + files ------------------------------------------
async function removeFolder(sb: any, prefix: string) {
  const { data: files } = await sb.storage.from(FILES_BUCKET).list(prefix, { limit: 1000 });
  const paths = (files ?? []).filter((f: any) => f.id).map((f: any) => `${prefix}/${f.name}`);
  if (paths.length) await sb.storage.from(FILES_BUCKET).remove(paths);
}

export const deleteOpportunityDeep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    try { await removeFolder(sb, `${context.userId}/${data.opportunityId}`); } catch (e) { console.warn("files delete", e); }
    const { error } = await sb.from("crm_opportunities").delete().eq("id", data.opportunityId);
    if (error) throw error;
    return { ok: true };
  });

export const resetAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const { data: opps } = await sb.from("crm_opportunities").select("id").eq("user_id", context.userId);
    for (const o of opps ?? []) {
      try { await removeFolder(sb, `${context.userId}/${o.id}`); } catch (e) { console.warn("files delete", e); }
    }
    for (const t of ["crm_activities", "crm_contacts", "crm_closing_checklists", "crm_saved_insights", "crm_notifications"]) {
      await sb.from(t).delete().eq("user_id", context.userId);
    }
    await sb.from("crm_opportunities").delete().eq("user_id", context.userId);
    return { ok: true };
  });

// --- Audit log ------------------------------------------------------------
export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await (context.supabase as any)
      .from("crm_audit_logs").select("*").eq("opportunity_id", data.opportunityId)
      .order("created_at", { ascending: false }).limit(100);
    return rows ?? [];
  });

// --- Target Day -------------------------------------------------------------
export const getTargetDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tz: z.string().min(1).default("Indian/Reunion") }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const now = new Date();
    const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: data.tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: data.tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(now).reduce<Record<string, string>>((acc, x) => { if (x.type !== "literal") acc[x.type] = x.value; return acc; }, {});
    const offsetMin = (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - now.getTime()) / 60_000;
    const startUtc = new Date(new Date(`${ymd}T00:00:00Z`).getTime() - offsetMin * 60_000);
    const endUtc = new Date(startUtc.getTime() + 86_400_000);

    const { data: acts } = await sb.from("crm_activities")
      .select("id,opportunity_id,type,title,content,scheduled_at,status,created_at")
      .gte("scheduled_at", startUtc.toISOString()).lt("scheduled_at", endUtc.toISOString())
      .order("scheduled_at", { ascending: true });
    const { data: overdue } = await sb.from("crm_activities")
      .select("id,opportunity_id,type,title,content,scheduled_at,status,created_at")
      .eq("status", "pending").in("type", ["task", "meeting"])
      .lt("scheduled_at", startUtc.toISOString())
      .order("scheduled_at", { ascending: true }).limit(30);
    const { data: checklist } = await sb.from("crm_closing_checklists")
      .select("id,opportunity_id,title,priority,category,status")
      .eq("status", "pending").in("priority", ["high", "medium"]).limit(30);
    const { data: inbound } = await sb.from("sendy_email_threads")
      .select("id,opportunity_id,subject,from_email,received_at,snippet")
      .eq("direction", "inbound")
      .gte("received_at", startUtc.toISOString()).lt("received_at", endUtc.toISOString())
      .order("received_at", { ascending: false });

    const ids = Array.from(new Set([...(acts ?? []), ...(overdue ?? []), ...(checklist ?? []), ...(inbound ?? [])]
      .map((x: any) => x.opportunity_id).filter(Boolean)));
    const opps: Record<string, { name: string; company: string | null }> = {};
    if (ids.length) {
      const { data: rows } = await sb.from("crm_opportunities").select("id,name,company").in("id", ids);
      for (const o of rows ?? []) opps[o.id] = { name: o.name, company: o.company };
    }
    return {
      dayStart: startUtc.toISOString(), dayEnd: endUtc.toISOString(), tz: data.tz,
      activities: acts ?? [], overdue: overdue ?? [], checklist: checklist ?? [], inbound: inbound ?? [], opps,
    };
  });
