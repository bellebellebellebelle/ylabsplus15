import { nj } from "./db";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NojectClient as _NC } from "./db";

export const FILES_BUCKET = "noject-files";

/** Stores a base64 file in Cloud storage + registers it in project_files. Returns the row. */
export async function storeProjectFile(
  supabase: any,
  userId: string,
  input: { projectId: string; name: string; mimeType: string; base64: string; folder?: string; source?: string },
) {
  const bytes = Uint8Array.from(atob(input.base64), (c) => c.charCodeAt(0));
  const safe = input.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const path = `${userId}/${input.projectId}/${crypto.randomUUID()}-${safe}`;
  const { error: upErr } = await supabase.storage.from(FILES_BUCKET).upload(path, bytes, {
    contentType: input.mimeType, upsert: false,
  });
  if (upErr) throw new Error(`Stockage impossible : ${upErr.message}`);
  const { data, error } = await nj(supabase).from("noject_project_files").insert({
    project_id: input.projectId, user_id: userId,
    folder: input.folder ?? "", name: input.name,
    mime_type: input.mimeType, size_bytes: bytes.byteLength,
    storage_path: path, source: input.source ?? "upload",
  }).select().single();
  if (error) throw error;
  return data;
}
