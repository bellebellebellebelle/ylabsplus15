import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables as _T } from "@/noject/types";
import { useState, useRef, useEffect } from "react";
import {
  getProject, updateProject, deleteProject,
  refreshProjectInsights, getSavedInsights,
  listProjectFiles, uploadProjectFile, deleteProjectFile, getFileUrl,
} from "@/noject/lib/projects.functions";
import {
  listTasks, createTask, updateTask, deleteTask,
  listEvents, scheduleEvent, deleteEvent,
} from "@/noject/lib/tasks.functions";
import { listExpenses, scanInvoice, createExpense, deleteExpense } from "@/noject/lib/expenses.functions";
import { listAudit } from "@/noject/lib/notifications.functions";
import { listCoachMessages, askCoach, computeHealthScore, getHealthScore, runMonteCarlo, getMonteCarlo } from "@/noject/lib/coaching.functions";
import { listMeetings, transcribeMeeting, deleteMeeting } from "@/noject/lib/meetings.functions";
import { startTimer, stopTimer, getRunningTimer, listTimeEntries } from "@/noject/lib/time-tracking.functions";
import { toast } from "sonner";
import {
  ExternalLink, FileText, CalendarDays, ListChecks, Sparkles, Trash2, Plus,
  Check, Loader2, LayoutDashboard, ChevronRight, ChevronDown, Folder, Upload,
  BarChart3, Activity, Fish, LineChart as LineIcon, GitBranch, Zap, Users,
  Pencil, Wallet, Receipt, Scan, History, Printer, ArrowLeft, Palette, Tag,
  Star, Flag, Bug, Lightbulb, Rocket, Target, Package, Wrench, ClipboardList,
  Bot, Mic, Play, Square, Timer, HeartPulse, Dices,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from "recharts";
import { DateTimePicker } from "@/noject/components/datetime-picker";
import {
  WbsView, CpmView, ParetoView, TimelineView, FishboneView, ControlChartView, OrgChartView,
} from "@/noject/components/project-views";
import { GanttCalendar } from "@/noject/components/gantt-calendar";

import { EditableTitle, EditableText, TASK_ICONS, TASK_COLORS, collapsed, OpenFileButton, fmtDuration } from "../shared";
import type { Project, Task } from "../shared";

// ============ Views ============

const VIEW_TABS = [
  { id: "gantt", label: "Gantt calendrier", icon: BarChart3 },
  { id: "wbs", label: "Organigramme tâches (WBS)", icon: GitBranch },
  { id: "cpm", label: "Chemin critique (CPM)", icon: Zap },
  { id: "org", label: "Organigramme", icon: Users },
  { id: "pareto", label: "Pareto", icon: BarChart3 },
  { id: "timeline", label: "Chronologie", icon: Activity },
  { id: "fishbone", label: "Ishikawa", icon: Fish },
  { id: "control", label: "Contrôle", icon: LineIcon },
] as const;

export function ViewsTab({ projectId, project }: { projectId: string; project: Project }) {
  const qc = useQueryClient();
  const listT = useServerFn(listTasks);
  const listE = useServerFn(listEvents);
  const updT = useServerFn(updateTask);
  const tasks = useQuery({ queryKey: ["tasks", projectId], queryFn: () => listT({ data: { projectId } }) });
  const events = useQuery({ queryKey: ["events", projectId], queryFn: () => listE({ data: { projectId } }) });
  const reschedule = useMutation({
    mutationFn: ({ id, start, end }: { id: string; start: string; end: string }) =>
      updT({ data: { id, patch: { start_date: start, due_date: end } } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks", projectId] }); toast.success("Planning mis à jour"); },
  });
  const [view, setView] = useState<(typeof VIEW_TABS)[number]["id"]>("gantt");
  const T = tasks.data ?? [];
  const E = events.data ?? [];
  const plan = (project.ai_plan ?? {}) as any;
  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto pb-1 print:hidden">
        {VIEW_TABS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`chip !text-xs !normal-case !tracking-normal whitespace-nowrap ${view === v.id ? "!bg-white/20 !border-white/40" : ""}`}>
            <v.icon className="size-3" /> {v.label}
          </button>
        ))}
      </div>
      {view === "gantt" && <GanttCalendar tasks={T as any} projectStart={project.start_date} projectEnd={project.end_date}
        onReschedule={(id, start, end) => reschedule.mutate({ id, start, end })} />}
      {view === "wbs" && <WbsView tasks={T} />}
      {view === "cpm" && <CpmView tasks={T} />}
      {view === "org" && <OrgChartView stakeholders={plan.stakeholders ?? []} projectName={project.name} />}
      {view === "pareto" && <ParetoView tasks={T} />}
      {view === "timeline" && <TimelineView tasks={T} events={E} />}
      {view === "fishbone" && <FishboneView risks={plan.risks ?? []} objective={project.objective ?? ""} />}
      {view === "control" && <ControlChartView tasks={T} />}
    </div>
  );
}

// ============ Calendar ============

