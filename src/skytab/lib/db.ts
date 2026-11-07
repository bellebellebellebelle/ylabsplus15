import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/skytab/types";

/** Client typé limité aux tables skytab_* de Skytab. */
export type SkytabClient = SupabaseClient<Database>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stab = (c: any): SkytabClient => c as SkytabClient;
