import { nj } from "./db";
// Helper server-only pour journaliser les modifications
export async function logAudit(
  userId: string,
  projectId: string | null,
  entityType: "project" | "task" | "event" | "file" | "expense",
  entityId: string | null,
  action: "create" | "update" | "delete",
  changes?: Record<string, any>,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    await nj(supabaseAdmin).from("noject_audit_logs").insert({
      user_id: userId,
      project_id: projectId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      changes: changes ?? null,
    });
  } catch { /* audit best-effort */ }
}
