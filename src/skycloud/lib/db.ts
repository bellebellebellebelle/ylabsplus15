import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/skycloud/types";

/** Client typé limité aux tables skycloud_* de SkyCloud. */
export type SkyCloudClient = SupabaseClient<Database>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sc = (c: any): SkyCloudClient => c as SkyCloudClient;
