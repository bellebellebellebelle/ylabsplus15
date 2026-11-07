import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/angelo/types";

/** Client typé limité aux tables angelo_* de Angelo. */
export type AngeloClient = SupabaseClient<Database>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ang = (c: any): AngeloClient => c as AngeloClient;
