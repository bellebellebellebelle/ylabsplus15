import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/sendy/types";

/** Client typé limité aux tables sendy_* de Sendy. */
export type SendyClient = SupabaseClient<Database>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sy = (c: any): SendyClient => c as SendyClient;
