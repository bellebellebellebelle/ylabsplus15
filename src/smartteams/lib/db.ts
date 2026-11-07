import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/smartteams/types";

/** Client typé limité aux tables st_* de SmartTeams. */
export type SmartTeamsClient = SupabaseClient<Database>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const st = (c: any): SmartTeamsClient => c as SmartTeamsClient;
