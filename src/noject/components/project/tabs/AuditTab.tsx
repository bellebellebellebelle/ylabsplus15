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

export function AuditTab({ projectId }: { projectId: string }) {
  const list = useServerFn(listAudit);
  const logs = useQuery({ queryKey: ["audit", projectId], queryFn: () => list({ data: { projectId } }) });
  const rows = logs.data ?? [];
  return (
    <div className="bento p-4">
      <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><History className="size-4" /> Historique des modifications</h3>
      {rows.length === 0 ? <div className="text-white/60 text-sm">Aucune activité enregistrée pour l'instant.</div> : (
        <ul className="space-y-1">
          {rows.map((r: any) => (
            <li key={r.id} className="text-sm py-2 border-b border-white/5 flex items-start gap-3">
              <span className={`chip !text-[9px] ${r.action === "delete" ? "!bg-red-500/20" : r.action === "create" ? "!bg-green-500/20" : "!bg-blue-500/20"}`}>{r.action}</span>
              <span className="chip !text-[9px]">{r.entity_type}</span>
              <div className="flex-1 min-w-0">
                {r.changes && <div className="text-xs text-white/70 truncate">{JSON.stringify(r.changes).slice(0, 200)}</div>}
              </div>
              <span className="text-[10px] text-white/50 whitespace-nowrap">{new Date(r.created_at).toLocaleString("fr-FR")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============ Time tracking ============

