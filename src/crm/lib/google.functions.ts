import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildAuthUrl,
  createOpportunitySheet,
  createOpportunityDoc,
  appendToDoc,
  appendSheetRow,
  sendGmail,
  createCalendarEvent,
  createTask,
  createDriveFolder,
  moveFileToFolder,
  listGmailWithContact,
  listUpcomingEvents,
  listDriveFolderFiles,
  deleteDriveFile,
  uploadFileToFolder,
  syncOpportunityInbound,
  createTasksList,
  listTasksInList,
  patchGoogleTask,
  deleteGoogleTask,
} from "./google.server";


export const getGoogleAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    return { url: buildAuthUrl(data.origin, context.userId) };
  });

export const isGoogleConnected = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ocktavus_google_tokens")
      .select("google_email, expires_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { connected: !!data, email: data?.google_email ?? null };
  });

export const disconnectGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("ocktavus_google_tokens").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const provisionOpportunityFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp, error } = await context.supabase
      .from("crm_opportunities")
      .select("*")
      .eq("id", data.opportunityId)
      .single();
    if (error || !opp) throw new Error("Opportunité introuvable");

    const rootName = `Nova CRM — ${opp.company ?? opp.name}`;
    const folder = await createDriveFolder(context.userId, rootName);

    const sheet = await createOpportunitySheet(context.userId, opp.name);
    const seed = `# ${opp.name}\n\nCompany: ${opp.company ?? "-"}\nContact: ${opp.contact_name ?? "-"} <${opp.contact_email ?? "-"}>\nStage: ${opp.stage}\nValue: ${opp.value_amount} ${opp.currency}\n\n${opp.description ?? ""}\n\n---\nActivity log:\n`;
    const doc = await createOpportunityDoc(context.userId, opp.name, seed);

    try { await moveFileToFolder(context.userId, sheet.id, folder.id); } catch (e) { console.warn("move sheet", e); }
    try { await moveFileToFolder(context.userId, doc.id, folder.id); } catch (e) { console.warn("move doc", e); }

    await appendSheetRow(context.userId, sheet.id, "Overview!A2:B2", ["Name", opp.name]);
    await appendSheetRow(context.userId, sheet.id, "Overview!A3:B3", ["Company", opp.company ?? ""]);
    await appendSheetRow(context.userId, sheet.id, "Overview!A4:B4", ["Stage", opp.stage]);
    await appendSheetRow(context.userId, sheet.id, "Overview!A5:B5", [
      "Value",
      `${opp.value_amount} ${opp.currency}`,
    ]);

    let tasksListId: string | null = null;
    try {
      const tl = await createTasksList(context.userId, `Nova CRM — ${opp.name}`);
      tasksListId = tl.id;
    } catch (e) { console.warn("create tasklist", e); }

    await context.supabase
      .from("crm_opportunities")
      .update({
        sheet_id: sheet.id,
        sheet_url: sheet.url,
        doc_id: doc.id,
        doc_url: doc.url,
        drive_folder_id: folder.id,
        drive_folder_url: folder.url,
        tasks_list_id: tasksListId,
      } as any)
      .eq("id", opp.id);

    return { sheet, doc, folder, tasksListId };
  });


const ActivitySchema = z.object({
  opportunityId: z.string().uuid(),
  type: z.enum(["email", "meeting", "task", "note"]),
  title: z.string().min(1),
  content: z.string().optional().default(""),
  scheduledAt: z.string().optional(),
  to: z.string().email().optional(),
  durationMinutes: z.number().int().positive().max(600).optional(),
});

export const createActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ActivitySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp, error: oe } = await context.supabase
      .from("crm_opportunities")
      .select("*")
      .eq("id", data.opportunityId)
      .single();
    if (oe || !opp) throw new Error("Opportunité introuvable");

    let external_id: string | null = null;
    let external_url: string | null = null;
    let status: "pending" | "done" = "pending";

    try {
      if (data.type === "email" && data.to) {
        const r = await sendGmail(context.userId, data.to, data.title, data.content);
        external_id = r.id;
        external_url = r.url;
        status = "done";
        // Mirror as outbound in email_threads
        try {
          await (context.supabase as any).from("sendy_email_threads").insert({
            user_id: context.userId,
            opportunity_id: data.opportunityId,
            gmail_message_id: r.id,
            gmail_thread_id: r.threadId,
            direction: "outbound",
            from_email: "me",
            to_email: data.to,
            subject: data.title,
            snippet: data.content.slice(0, 200),
            body: data.content,
            received_at: new Date().toISOString(),
          });
        } catch (e) { console.warn("email_threads insert", e); }
      } else if (data.type === "meeting" && data.scheduledAt) {
        const r = await createCalendarEvent(
          context.userId,
          data.title,
          data.content,
          data.scheduledAt,
          data.durationMinutes ?? 30,
          [opp.contact_email].filter(Boolean) as string[],
        );
        external_id = r.id;
        external_url = r.url;
      } else if (data.type === "task") {
        const r = await createTask(context.userId, data.title, data.content, data.scheduledAt, (opp as any).tasks_list_id ?? undefined);
        external_id = r.id;
        external_url = r.url;
      }


      if (opp.doc_id) {
        await appendToDoc(
          context.userId,
          opp.doc_id,
          `\n[${new Date().toISOString()}] ${data.type.toUpperCase()} — ${data.title}\n${data.content}\n`,
        );
      }
      if (opp.sheet_id) {
        await appendSheetRow(context.userId, opp.sheet_id, "Activities!A:E", [
          new Date().toISOString(),
          data.type,
          data.title,
          status,
          data.content,
        ]);
      }
    } catch (e) {
      console.error("Google action failed, storing activity anyway:", e);
    }

    const { data: inserted, error } = await context.supabase
      .from("crm_activities")
      .insert({
        user_id: context.userId,
        opportunity_id: data.opportunityId,
        type: data.type,
        title: data.title,
        content: data.content,
        scheduled_at: data.scheduledAt ?? null,
        status,
        external_id,
        external_url,
      })
      .select()
      .single();
    if (error) throw error;
    return inserted;
  });

export const listOpportunityGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().email(), max: z.number().int().min(1).max(50).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      const messages = await listGmailWithContact(context.userId, data.email, data.max ?? 20);
      return { messages, error: null as string | null };
    } catch (e: any) {
      return { messages: [], error: e.message as string };
    }
  });

export const listUserUpcomingEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const events = await listUpcomingEvents(context.userId, 8);
      return { events, error: null as string | null };
    } catch (e: any) {
      return { events: [], error: e.message as string };
    }
  });

// --- Documents ---------------------------------------------------------
export const listOpportunityDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase
      .from("crm_opportunities").select("drive_folder_id").eq("id", data.opportunityId).single();
    if (!opp?.drive_folder_id) return { files: [], error: "Aucun dossier Drive — provisionnez l'espace Workspace." };
    try {
      const files = await listDriveFolderFiles(context.userId, opp.drive_folder_id);
      return { files, error: null as string | null };
    } catch (e: any) {
      return { files: [], error: e.message as string };
    }
  });

export const uploadOpportunityDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    opportunityId: z.string().uuid(),
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    base64: z.string().min(1),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase
      .from("crm_opportunities").select("drive_folder_id").eq("id", data.opportunityId).single();
    if (!opp?.drive_folder_id) throw new Error("Aucun dossier Drive lié à cette opportunité.");
    const f = await uploadFileToFolder(context.userId, opp.drive_folder_id, data.fileName, data.mimeType, data.base64);
    return f;
  });

// --- Inbound email sync ------------------------------------------------
export const syncOpportunityEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase
      .from("crm_opportunities").select("contact_email").eq("id", data.opportunityId).single();
    if (!opp?.contact_email) return { imported: 0, error: "Aucun email de contact." };
    try {
      const r = await syncOpportunityInbound(context.userId, data.opportunityId, opp.contact_email);
      return { ...r, error: null as string | null };
    } catch (e: any) {
      return { imported: 0, error: e.message as string };
    }
  });

// --- Delete opportunity (+ drive folder) ------------------------------
export const deleteOpportunityDeep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase
      .from("crm_opportunities").select("*").eq("id", data.opportunityId).single();
    if (!opp) return { ok: true };
    if (opp.drive_folder_id) {
      try { await deleteDriveFile(context.userId, opp.drive_folder_id); } catch (e) { console.warn("drive delete", e); }
    }
    await context.supabase.from("crm_opportunities").delete().eq("id", data.opportunityId);
    return { ok: true };
  });

// --- Reset account ------------------------------------------------------
export const resetAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: opps } = await context.supabase
      .from("crm_opportunities").select("id, drive_folder_id").eq("user_id", context.userId);
    for (const o of opps ?? []) {
      if (o.drive_folder_id) {
        try { await deleteDriveFile(context.userId, o.drive_folder_id); } catch (e) { console.warn("drive delete", e); }
      }
    }
    // Cascades: opportunities -> activities/contacts/checklists/email_threads via FK
    await context.supabase.from("crm_opportunities").delete().eq("user_id", context.userId);
    await (context.supabase as any).from("crm_contacts").delete().eq("user_id", context.userId);
    await context.supabase.from("crm_activities").delete().eq("user_id", context.userId);
    await (context.supabase as any).from("crm_saved_insights").delete().eq("user_id", context.userId);
    await (context.supabase as any).from("crm_closing_checklists").delete().eq("user_id", context.userId);
    await (context.supabase as any).from("sendy_email_threads").delete().eq("user_id", context.userId);
    return { ok: true };
  });

// --- Native Google Tasks CRUD (per opportunity) ------------------------
export const listOpportunityTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase
      .from("crm_opportunities").select("tasks_list_id").eq("id", data.opportunityId).single();
    const listId = (opp as any)?.tasks_list_id;
    if (!listId) return { tasks: [], error: "Aucune liste Google Tasks — provisionnez l'espace Workspace." };
    try {
      const tasks = await listTasksInList(context.userId, listId);
      return { tasks, error: null as string | null };
    } catch (e: any) { return { tasks: [], error: e.message as string }; }
  });

export const createOpportunityTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    opportunityId: z.string().uuid(),
    title: z.string().min(1),
    notes: z.string().optional().default(""),
    due: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase
      .from("crm_opportunities").select("tasks_list_id").eq("id", data.opportunityId).single();
    const listId = (opp as any)?.tasks_list_id;
    if (!listId) throw new Error("Aucune liste Google Tasks.");
    const r = await createTask(context.userId, data.title, data.notes || "", data.due, listId);
    await (context.supabase as any).from("crm_audit_logs").insert({
      user_id: context.userId, opportunity_id: data.opportunityId,
      action: "task.create", entity: "google_task", entity_id: r.id, details: { title: data.title },
    });
    return r;
  });

export const updateOpportunityTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    opportunityId: z.string().uuid(),
    taskId: z.string().min(1),
    title: z.string().optional(),
    notes: z.string().optional(),
    due: z.string().optional().nullable(),
    status: z.enum(["needsAction", "completed"]).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase
      .from("crm_opportunities").select("tasks_list_id").eq("id", data.opportunityId).single();
    const listId = (opp as any)?.tasks_list_id;
    if (!listId) throw new Error("Aucune liste Google Tasks.");
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.due !== undefined) patch.due = data.due ? new Date(data.due).toISOString() : null;
    if (data.status) patch.status = data.status;
    const r = await patchGoogleTask(context.userId, listId, data.taskId, patch);
    await (context.supabase as any).from("crm_audit_logs").insert({
      user_id: context.userId, opportunity_id: data.opportunityId,
      action: "task.update", entity: "google_task", entity_id: data.taskId, details: patch,
    });
    return r;
  });

export const deleteOpportunityTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid(), taskId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opp } = await context.supabase
      .from("crm_opportunities").select("tasks_list_id").eq("id", data.opportunityId).single();
    const listId = (opp as any)?.tasks_list_id;
    if (!listId) throw new Error("Aucune liste Google Tasks.");
    await deleteGoogleTask(context.userId, listId, data.taskId);
    await (context.supabase as any).from("crm_audit_logs").insert({
      user_id: context.userId, opportunity_id: data.opportunityId,
      action: "task.delete", entity: "google_task", entity_id: data.taskId, details: {},
    });
    return { ok: true };
  });

// --- Target Day: today's agenda across all opps ------------------------
export const getTargetDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tz: z.string().min(1).default("Indian/Reunion") }).parse(d))
  .handler(async ({ data, context }) => {
    // Compute local day boundaries
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: data.tz, year: "numeric", month: "2-digit", day: "2-digit" });
    const ymd = fmt.format(now);
    const dtfParts = new Intl.DateTimeFormat("en-US", {
      timeZone: data.tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(now).reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value; return acc;
    }, {});
    const tzOffsetMin = (Date.UTC(
      Number(dtfParts.year), Number(dtfParts.month) - 1, Number(dtfParts.day),
      Number(dtfParts.hour), Number(dtfParts.minute), Number(dtfParts.second),
    ) - now.getTime()) / 60_000;
    const startUtc = new Date(new Date(`${ymd}T00:00:00Z`).getTime() - tzOffsetMin * 60_000);
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

    // Scheduled activities today (meetings, tasks, notes with scheduled_at)
    const { data: acts } = await context.supabase
      .from("crm_activities")
      .select("id,opportunity_id,type,title,content,scheduled_at,status,external_url,created_at")
      .gte("scheduled_at", startUtc.toISOString())
      .lt("scheduled_at", endUtc.toISOString())
      .order("scheduled_at", { ascending: true });

    // Pending checklist items with high priority
    const { data: checklist } = await (context.supabase as any)
      .from("crm_closing_checklists")
      .select("id,opportunity_id,title,priority,category,status")
      .eq("status", "pending")
      .in("priority", ["high", "medium"])
      .order("priority", { ascending: true })
      .limit(30);

    // Recent inbound emails not replied — from today's window
    const { data: inbound } = await (context.supabase as any)
      .from("sendy_email_threads")
      .select("id,opportunity_id,subject,from_email,received_at,snippet")
      .eq("direction", "inbound")
      .gte("received_at", startUtc.toISOString())
      .lt("received_at", endUtc.toISOString())
      .order("received_at", { ascending: false });

    // Opportunity name map
    const ids = Array.from(new Set([
      ...(acts ?? []).map((a: any) => a.opportunity_id),
      ...(checklist ?? []).map((c: any) => c.opportunity_id),
      ...(inbound ?? []).map((e: any) => e.opportunity_id),
    ].filter(Boolean)));
    const oppMap: Record<string, { name: string; company: string | null }> = {};
    if (ids.length) {
      const { data: opps } = await context.supabase
        .from("crm_opportunities").select("id,name,company").in("id", ids as string[]);
      for (const o of opps ?? []) oppMap[(o as any).id] = { name: (o as any).name, company: (o as any).company };
    }

    return {
      dayStart: startUtc.toISOString(),
      dayEnd: endUtc.toISOString(),
      tz: data.tz,
      activities: acts ?? [],
      checklist: checklist ?? [],
      inbound: inbound ?? [],
      opps: oppMap,
    };
  });

// --- Sync all opportunities' inbound emails (used by notif poller) -----
export const syncAllInbound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: opps } = await context.supabase
      .from("crm_opportunities")
      .select("id,contact_email")
      .not("contact_email", "is", null);
    let total = 0, notified = 0;
    for (const o of opps ?? []) {
      try {
        const r = await syncOpportunityInbound(context.userId, (o as any).id, (o as any).contact_email);
        total += r.imported;
        notified += r.newInbound ?? 0;
      } catch (e) { console.warn("syncAllInbound", e); }
    }
    return { total, notified };
  });

// --- Audit log ---------------------------------------------------------
export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await (context.supabase as any)
      .from("crm_audit_logs")
      .select("*")
      .eq("opportunity_id", data.opportunityId)
      .order("created_at", { ascending: false })
      .limit(100);
    return rows ?? [];
  });

// --- Bulk actions ------------------------------------------------------
export const bulkSyncInbound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ opportunityIds: z.array(z.string().uuid()).min(1).max(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: opps } = await context.supabase
      .from("crm_opportunities").select("id,contact_email").in("id", data.opportunityIds);
    let imported = 0, notified = 0;
    for (const o of opps ?? []) {
      const email = (o as any).contact_email;
      if (!email) continue;
      try {
        const r = await syncOpportunityInbound(context.userId, (o as any).id, email);
        imported += r.imported; notified += r.newInbound ?? 0;
      } catch (e) { console.warn("bulkSyncInbound", e); }
    }
    return { imported, notified };
  });
