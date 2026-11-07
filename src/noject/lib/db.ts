import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/noject/types";

/** Noject tables (noject_*) are not in the shared generated types; this view types them. */
export type NojectClient = SupabaseClient<Database>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nj = (c: any): NojectClient => c as NojectClient;
