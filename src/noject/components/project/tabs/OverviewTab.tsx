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

export function Overview({ p, projectId }: { p: Project; projectId: string }) {
  const qc = useQueryClient();
  const patch = useServerFn(updateProject);
  const save = (patchObj: any) => patch({ data: { id: projectId, patch: patchObj } }).then(() => qc.invalidateQueries({ queryKey: ["project", projectId] }));
  const plan = (p.ai_plan ?? {}) as any;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bento-holo p-5 md:col-span-2">
        <h3 className="font-display text-lg font-semibold">Description</h3>
        <EditableText value={p.description ?? ""} placeholder="Décrivez le projet…" multiline
          className="text-sm text-white/85 mt-2 whitespace-pre-line" onSave={(v) => save({ description: v })} />
      </div>
      <div className="bento p-5 space-y-2">
        <div className="text-xs uppercase text-white/70">Dates & Budget</div>
        <label className="block text-sm">Début
          <input type="date" defaultValue={p.start_date ?? ""} onBlur={e => save({ start_date: e.target.value || null })} className="input-field mt-1" />
        </label>
        <label className="block text-sm">Fin
          <input type="date" defaultValue={p.end_date ?? ""} onBlur={e => save({ end_date: e.target.value || null })} className="input-field mt-1" />
        </label>
        <label className="block text-sm">Budget (€)
          <input type="number" defaultValue={p.budget ?? ""} onBlur={e => save({ budget: e.target.value ? parseFloat(e.target.value) : null })} className="input-field mt-1" />
        </label>
      </div>
      <div className="bento p-5">
        <div className="text-xs uppercase text-white/70">Phases</div>
        <ul className="mt-2 space-y-1 text-sm">
          {(plan.phases ?? []).map((ph: any, i: number) => <li key={i}>• <b>{ph.name}</b> ({ph.duration_days}j)</li>)}
        </ul>
      </div>
      <div className="bento p-5">
        <div className="text-xs uppercase text-white/70">Risques</div>
        <ul className="mt-2 space-y-1 text-sm">
          {(plan.risks ?? []).map((r: any, i: number) => <li key={i}>• {r.name} <span className="text-white/50">[{r.impact}]</span></li>)}
          {(!plan.risks || plan.risks.length === 0) && <li className="text-white/50">—</li>}
        </ul>
      </div>
      <div className="bento p-5">
        <div className="text-xs uppercase text-white/70">KPI cibles</div>
        <ul className="mt-2 space-y-1 text-sm">
          {(plan.kpis ?? []).map((k: any, i: number) => <li key={i}>• {k.name} : <b>{k.target}</b></li>)}
          {(!plan.kpis || plan.kpis.length === 0) && <li className="text-white/50">—</li>}
        </ul>
      </div>
    </div>
  );
}

// ============ Tasks (with customization) ============

