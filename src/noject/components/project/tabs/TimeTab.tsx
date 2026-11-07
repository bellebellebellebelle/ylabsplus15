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

export function TimeTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const listT = useServerFn(listTasks);
  const listE = useServerFn(listTimeEntries);
  const running = useServerFn(getRunningTimer);
  const start = useServerFn(startTimer);
  const stop = useServerFn(stopTimer);
  const tasks = useQuery({ queryKey: ["tasks", projectId], queryFn: () => listT({ data: { projectId } }) });
  const entries = useQuery({ queryKey: ["time-entries", projectId], queryFn: () => listE({ data: { projectId } }) });
  const runningQ = useQuery({ queryKey: ["timer-running"], queryFn: () => running(), refetchInterval: 5000 });
  const [selTask, setSelTask] = useState<string>("");

  const startMut = useMutation({
    mutationFn: (taskId: string | null) => start({ data: { projectId, taskId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timer-running"] }); toast.success("Chrono lancé"); },
  });
  const stopMut = useMutation({
    mutationFn: () => stop({ data: {} }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timer-running"] });
      qc.invalidateQueries({ queryKey: ["time-entries", projectId] });
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Chrono arrêté");
    },
  });

  const running_ = runningQ.data as any;
  const rows = entries.data ?? [];
  const totalSec = rows.reduce((s: number, r: any) => s + (r.duration_seconds ?? 0), 0);

  const perTask = new Map<string, number>();
  for (const r of rows) if (r.task_id) perTask.set(r.task_id, (perTask.get(r.task_id) ?? 0) + (r.duration_seconds ?? 0));

  const T = (tasks.data ?? []).filter((t: any) => !t.parent_task_id);
  const compareData = T.map((t: any) => ({
    label: t.title.slice(0, 20),
    estimé: Number(t.estimated_hours ?? 0),
    réel: (perTask.get(t.id) ?? 0) / 3600,
  }));

  return (
    <div className="space-y-4">
      <div className="bento-holo p-4 flex flex-wrap items-center gap-3">
        <Timer className="size-6" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Chronomètre</div>
          <div className="text-xs text-white/70">
            {running_ ? `En cours depuis ${new Date(running_.started_at).toLocaleTimeString("fr-FR")}` : "Aucun chrono actif"}
          </div>
        </div>
        {!running_ ? (
          <>
            <select value={selTask} onChange={e => setSelTask(e.target.value)} className="input-field !w-auto">
              <option value="">— sans tâche —</option>
              {T.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <button onClick={() => startMut.mutate(selTask || null)} className="btn-holo"><Play className="size-4" /> Démarrer</button>
          </>
        ) : (
          <button onClick={() => stopMut.mutate()} className="btn-holo" style={{ background: "linear-gradient(135deg,#ef4444,#7f1d1d)" }}><Square className="size-4" /> Arrêter</button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bento p-4"><div className="text-xs uppercase text-white/70">Temps total</div><div className="text-2xl font-bold mt-1">{fmtDuration(totalSec)}</div></div>
        <div className="bento p-4"><div className="text-xs uppercase text-white/70">Entrées</div><div className="text-2xl font-bold mt-1">{rows.length}</div></div>
        <div className="bento p-4"><div className="text-xs uppercase text-white/70">Moy. / tâche</div><div className="text-2xl font-bold mt-1">{perTask.size ? fmtDuration(totalSec / perTask.size) : "—"}</div></div>
      </div>

      <div className="bento p-4 h-80">
        <h3 className="font-semibold text-sm mb-2">Estimé vs Réel (heures)</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={compareData}>
            <XAxis dataKey="label" stroke="#fff8" fontSize={10} />
            <YAxis stroke="#fff8" fontSize={10} />
            <Tooltip contentStyle={{ background: "#00224D", border: "1px solid #FF204E" }} />
            <Bar dataKey="estimé" fill="#00E5FF" radius={4} />
            <Bar dataKey="réel" fill="#FF204E" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bento p-4">
        <h3 className="font-semibold text-sm mb-2">Historique</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-white/60"><tr><th className="text-left py-1">Début</th><th className="text-left">Tâche</th><th className="text-right">Durée</th></tr></thead>
          <tbody>
            {rows.slice(0, 20).map((r: any) => {
              const tk = T.find((x: any) => x.id === r.task_id);
              return (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="py-1">{new Date(r.started_at).toLocaleString("fr-FR")}</td>
                  <td>{tk?.title ?? "—"}</td>
                  <td className="text-right font-semibold">{fmtDuration(r.duration_seconds ?? 0)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-white/50">Aucune entrée.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Coach IA ============

