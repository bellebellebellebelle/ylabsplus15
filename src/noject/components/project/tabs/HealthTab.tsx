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

export function HealthTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const getH = useServerFn(getHealthScore);
  const compH = useServerFn(computeHealthScore);
  const getMC = useServerFn(getMonteCarlo);
  const runMC = useServerFn(runMonteCarlo);
  const health = useQuery({ queryKey: ["health", projectId], queryFn: () => getH({ data: { projectId } }) });
  const mc = useQuery({ queryKey: ["mc", projectId], queryFn: () => getMC({ data: { projectId } }) });
  const compMut = useMutation({ mutationFn: () => compH({ data: { projectId } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["health", projectId] }); toast.success("Score de santé calculé"); }, onError: (e: any) => toast.error(e.message) });
  const mcMut = useMutation({ mutationFn: () => runMC({ data: { projectId, iterations: 2000 } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["mc", projectId] }); toast.success("Simulation Monte-Carlo terminée"); }, onError: (e: any) => toast.error(e.message) });

  const h = (health.data as any) ?? {};
  const hd = h.health_data ?? {};
  const m = mc.data as any;
  const scoreColor = (h.health_score ?? 0) > 70 ? "#10b981" : (h.health_score ?? 0) > 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bento-holo p-5">
          <div className="flex items-center gap-3 mb-3">
            <HeartPulse className="size-5" />
            <h3 className="font-display text-lg font-semibold flex-1">Score de santé prédictif</h3>
            <button onClick={() => compMut.mutate()} disabled={compMut.isPending} className="btn-holo">
              {compMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {h.health_score != null ? "Recalculer" : "Calculer"}
            </button>
          </div>
          {h.health_score != null ? (
            <>
              <div className="flex items-end gap-4">
                <div className="text-6xl font-bold font-display" style={{ color: scoreColor, textShadow: `0 0 20px ${scoreColor}` }}>{h.health_score}</div>
                <div className="pb-2 text-xs text-white/70">
                  Tendance : <b>{hd.trend ?? "—"}</b><br />
                  Retard estimé : <b>{hd.eta_delay_days ?? 0} j</b><br />
                  Risque budget : <b>{hd.budget_risk_pct ?? 0}%</b>
                </div>
              </div>
              <p className="mt-3 text-sm">{hd.summary ?? ""}</p>
              <div className="mt-3 space-y-1">
                {(hd.risks ?? []).map((r: any, i: number) => (
                  <div key={i} className="text-xs bento p-2 flex items-start gap-2">
                    <span className={`chip !text-[9px] ${r.severity === "high" ? "!bg-red-500/30" : r.severity === "med" ? "!bg-yellow-500/30" : "!bg-blue-500/30"}`}>{r.severity}</span>
                    <div><b>{r.label}</b><div className="text-white/70">{r.recommendation}</div></div>
                  </div>
                ))}
              </div>
              {h.health_updated_at && <div className="text-[10px] mt-2 text-white/50">MAJ : {new Date(h.health_updated_at).toLocaleString("fr-FR")}</div>}
            </>
          ) : (
            <div className="text-white/60 text-sm">Aucun score encore calculé.</div>
          )}
        </div>

        <div className="bento p-5">
          <div className="flex items-center gap-3 mb-3">
            <Dices className="size-5" />
            <h3 className="font-display text-lg font-semibold flex-1">Simulation Monte-Carlo</h3>
            <button onClick={() => mcMut.mutate()} disabled={mcMut.isPending} className="btn-holo">
              {mcMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Dices className="size-4" />}
              Simuler
            </button>
          </div>
          {m ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bento p-2"><div className="text-white/60">Médiane (P50)</div><div className="text-xl font-bold">{m.p50}j</div></div>
                <div className="bento p-2"><div className="text-white/60">80% (P80)</div><div className="text-xl font-bold">{m.p80}j</div></div>
                <div className="bento p-2"><div className="text-white/60">Pessimiste (P95)</div><div className="text-xl font-bold text-red-300">{m.p95}j</div></div>
              </div>
              <div className="mt-3 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={m.histogram}>
                    <XAxis dataKey="label" stroke="#fff8" fontSize={9} />
                    <YAxis stroke="#fff8" fontSize={9} />
                    <Tooltip contentStyle={{ background: "#00224D", border: "1px solid #FF204E" }} />
                    <Bar dataKey="value" fill="#00E5FF" radius={3} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] mt-1 text-white/50">{m.iterations} tirages · min {m.minDays}j · max {m.maxDays}j</div>
            </>
          ) : (
            <div className="text-white/60 text-sm">Lancez une simulation pour obtenir la distribution des dates de livraison possibles.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Meeting audio → transcript & tasks ============

