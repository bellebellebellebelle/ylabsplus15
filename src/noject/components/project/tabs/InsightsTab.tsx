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

export function InsightsTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const getSaved = useServerFn(getSavedInsights);
  const refresh = useServerFn(refreshProjectInsights);
  const saved = useQuery({ queryKey: ["insights", projectId], queryFn: () => getSaved({ data: { id: projectId } }) });
  const mut = useMutation({
    mutationFn: () => refresh({ data: { id: projectId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["insights", projectId] }); toast.success("Insights enregistrés"); },
    onError: (e: any) => toast.error(e.message),
  });
  const data = (saved.data as any)?.ai_insights;
  const updatedAt = (saved.data as any)?.insights_updated_at;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => mut.mutate()} className="btn-holo" disabled={mut.isPending}>
          {mut.isPending ? <><Loader2 className="size-4 animate-spin" /> Analyse…</> : <><Sparkles className="size-4" /> {data ? "Régénérer" : "Générer"} les insights IA</>}
        </button>
        {updatedAt && <span className="text-xs text-white/60">Dernière analyse : {new Date(updatedAt).toLocaleString("fr-FR")}</span>}
      </div>
      {data && (
        <div className="space-y-4">
          <div className="bento-holo p-5">
            <div className="flex items-center gap-2">
              <span className={`chip ${data.health === "vert" ? "!bg-green-500/30" : data.health === "rouge" ? "!bg-red-500/30" : "!bg-yellow-500/30"}`}>Santé : {data.health}</span>
            </div>
            <p className="mt-3">{data.summary}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bento p-4">
              <h4 className="font-semibold mb-2">Alertes</h4>
              <ul className="text-sm space-y-1">{(data.alerts ?? []).map((a: string, i: number) => <li key={i}>⚠️ {a}</li>)}</ul>
            </div>
            <div className="bento p-4">
              <h4 className="font-semibold mb-2">Prochaines actions</h4>
              <ul className="text-sm space-y-1">{(data.nextActions ?? []).map((a: string, i: number) => <li key={i}>→ {a}</li>)}</ul>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(data.charts ?? []).map((c: any, i: number) => (
              <div key={i} className="bento p-4 h-72">
                <h4 className="font-semibold mb-2">{c.title}</h4>
                <ResponsiveContainer width="100%" height="90%">
                  {c.type === "pie" ? (
                    <PieChart>
                      <Tooltip />
                      <Pie data={c.data} dataKey="value" nameKey="label" outerRadius={80}>
                        {c.data.map((_: any, i: number) => <Cell key={i} fill={["#FF204E","#5D0E41","#00224D","#A0153E","#FF6B9B"][i % 5]} />)}
                      </Pie>
                    </PieChart>
                  ) : c.type === "line" ? (
                    <LineChart data={c.data}><XAxis dataKey="label" stroke="#fff8" /><YAxis stroke="#fff8" /><Tooltip /><Line dataKey="value" stroke="#FF204E" strokeWidth={2} /></LineChart>
                  ) : (
                    <BarChart data={c.data}><XAxis dataKey="label" stroke="#fff8" /><YAxis stroke="#fff8" /><Tooltip /><Bar dataKey="value" fill="#FF204E" radius={6} /></BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}
      {!data && !mut.isPending && <div className="bento p-6 text-center text-white/60">Aucune analyse pour l'instant.</div>}
    </div>
  );
}

// ============ Audit log ============

