import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/skydoc/types";

/** Client typé limité aux tables skydoc_* de Skydoc. */
export type SkydocClient = SupabaseClient<Database>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sd = (c: any): SkydocClient => c as SkydocClient;
