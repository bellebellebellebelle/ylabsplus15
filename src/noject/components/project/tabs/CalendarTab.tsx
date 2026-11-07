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

export function CalendarTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listEvents);
  const schedule = useServerFn(scheduleEvent);
  const remove = useServerFn(deleteEvent);
  const events = useQuery({ queryKey: ["events", projectId], queryFn: () => list({ data: { projectId } }) });
  const [form, setForm] = useState({ title: "", start_at: "", end_at: "", description: "", location: "" });
  const mut = useMutation({
    mutationFn: () => schedule({ data: { projectId, ...form } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", projectId] });
      setForm({ title: "", start_at: "", end_at: "", description: "", location: "" });
      toast.success("Événement enregistré ✓");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const rem = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events", projectId] }); toast.success("Rendez-vous supprimé"); },
  });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form className="bento p-4 space-y-3" onSubmit={e => { e.preventDefault(); if (!form.start_at || !form.end_at) { toast.error("Choisissez début et fin"); return; } mut.mutate(); }}>
        <h3 className="font-display text-lg font-semibold">Planifier une activité</h3>
        <input className="input-field" placeholder="Titre" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <div>
          <label className="text-xs text-white/70">Début</label>
          <DateTimePicker value={form.start_at} onChange={v => setForm(f => ({ ...f, start_at: v, end_at: f.end_at || new Date(new Date(v).getTime() + 3600000).toISOString() }))} placeholder="Choisir date & heure de début" />
        </div>
        <div>
          <label className="text-xs text-white/70">Fin</label>
          <DateTimePicker value={form.end_at} onChange={v => setForm(f => ({ ...f, end_at: v }))} placeholder="Choisir date & heure de fin" minDate={form.start_at ? new Date(form.start_at) : undefined} />
        </div>
        <input className="input-field" placeholder="Lieu (optionnel)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        <textarea className="input-field resize-none" rows={2} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <button className="btn-holo w-full" disabled={mut.isPending}>{mut.isPending ? "…" : "Planifier l'activité"}</button>
      </form>
      <div className="space-y-2">
        {(events.data ?? []).map((e: any) => (
          <div key={e.id} className="bento p-3">
            <div className="flex items-center gap-2">
              <div className="font-medium flex-1">{e.title}</div>
              <button onClick={() => { if (confirm("Supprimer ce rendez-vous ?")) rem.mutate(e.id); }} className="text-red-200 hover:text-red-100"><Trash2 className="size-3" /></button>
            </div>
            <div className="text-xs text-white/70 mt-1">{new Date(e.start_at).toLocaleString("fr-FR")} → {new Date(e.end_at).toLocaleString("fr-FR")}</div>
            {e.location && <div className="text-xs">📍 {e.location}</div>}
          </div>
        ))}
        {(!events.data || events.data.length === 0) && <div className="bento p-6 text-center text-white/60">Aucun événement.</div>}
      </div>
    </div>
  );
}

// ============ Budget ============

