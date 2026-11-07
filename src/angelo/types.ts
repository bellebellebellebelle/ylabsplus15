import type { Database as Shared } from "@/integrations/supabase/types";

type Pub = Shared["public"];
type Own<T> = { [K in keyof T as K extends `angelo_${string}` ? K : never]: T[K] };

/** Angelo : uniquement ses propres tables (angelo_*). */
export type Database = {
  public: Omit<Pub, "Tables"> & { Tables: Own<Pub["Tables"]> };
};
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
