import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/noject/types";
export type Project = Tables<"noject_projects">;
export type Task = Tables<"noject_tasks">;
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


export function EditableTitle({ project, projectId }: { project: Project; projectId: string }) {
  const qc = useQueryClient();
  const patch = useServerFn(updateProject);
  return (
    <EditableText
      value={project.name}
      onSave={(v) => patch({ data: { id: projectId, patch: { name: v } } }).then(() => qc.invalidateQueries({ queryKey: ["project", projectId] }))}
      className="font-display text-4xl font-bold" inline
    />
  );
}

export function EditableText({
  value, onSave, placeholder, className, inline, multiline,
}: { value: string; onSave: (v: string) => any; placeholder?: string; className?: string; inline?: boolean; multiline?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => { if (v !== value) onSave(v); setEditing(false); };
  if (!editing) {
    return (
      <div className={`group cursor-text ${className ?? ""}`} onClick={() => setEditing(true)}>
        {value || <span className="opacity-50">{placeholder}</span>}
        <Pencil className="ml-2 inline size-3 opacity-0 group-hover:opacity-70" />
      </div>
    );
  }
  if (multiline) {
    return (
      <textarea autoFocus value={v} onChange={e => setV(e.target.value)} onBlur={commit}
        rows={3} className={`input-field ${className ?? ""}`} />
    );
  }
  return (
    <input autoFocus value={v} onChange={e => setV(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      className={`bg-transparent border-b border-white/30 focus:border-[#FF204E] outline-none w-full ${inline ? "" : "input-field"} ${className ?? ""}`} />
  );
}

// ============ Overview ============

export const TASK_ICONS = {
  Flag, Star, Bug, Lightbulb, Rocket, Target, Package, Wrench, ClipboardList,
} as const;
export const TASK_COLORS = ["#FF204E", "#00E5FF", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f97316", "#6366f1"];

export function collapsed(_x: Record<string, boolean>, _id: string) { return false; }
export function OpenFileButton({ fileId }: { fileId: string }) {
  const getUrl = useServerFn(getFileUrl);
  return (
    <button title="Ouvrir le fichier" className="text-[#00E5FF]" onClick={async (e) => {
      e.stopPropagation();
      const win = window.open("", "_blank");
      try { const { url } = await getUrl({ data: { fileId } }); if (win) win.location.href = url; else window.location.href = url; }
      catch (err: any) { win?.close(); toast.error(err.message); }
    }}><ExternalLink className="size-3" /></button>
  );
}

export function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h${m.toString().padStart(2, "0")}`;
}
