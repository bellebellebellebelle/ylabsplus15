/** Row of the isolated pa_planning_items table (PlanAgenda post-it). */
export type PlanningItem = {
  id: string;
  user_id: string;
  kind: "event" | "task";
  title: string;
  description: string | null;
  notes: string | null;
  location: string | null;
  attendees: string[] | null;
  tags: string[] | null;
  priority: string | null;
  color: string | null;
  icon: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  due_at: string | null;
  duration_min: number | null;
  all_day: boolean | null;
  board_column: string | null;
  position: number | null;
  google_event_id: string | null;
  google_task_id: string | null;
  google_calendar_id: string | null;
  google_task_list_id: string | null;
  google_synced_at: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

export const PLANNING_ITEMS_KEY = ["planning_items"] as const;
