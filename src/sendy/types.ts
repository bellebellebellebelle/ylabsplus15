import type { Database as Shared } from "@/integrations/supabase/types";

type Pub = Shared["public"];
type Own<T> = { [K in keyof T as K extends `sendy_${string}` ? K : never]: T[K] };

/** Sendy : uniquement ses propres tables (sendy_*). */
export type Database = {
  public: Omit<Pub, "Tables"> & { Tables: Own<Pub["Tables"]> };
};
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
