import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { EditableTitle, EditableText } from "@/noject/components/project/shared";
import { Overview } from "@/noject/components/project/tabs/OverviewTab";
import { TasksTab } from "@/noject/components/project/tabs/TasksTab";
import { ViewsTab } from "@/noject/components/project/tabs/ViewsTab";
import { CalendarTab } from "@/noject/components/project/tabs/CalendarTab";
import { BudgetTab } from "@/noject/components/project/tabs/BudgetTab";
import { FilesTab } from "@/noject/components/project/tabs/FilesTab";
import { InsightsTab } from "@/noject/components/project/tabs/InsightsTab";
import { AuditTab } from "@/noject/components/project/tabs/AuditTab";
import { TimeTab } from "@/noject/components/project/tabs/TimeTab";
import { CoachTab } from "@/noject/components/project/tabs/CoachTab";
import { HealthTab } from "@/noject/components/project/tabs/HealthTab";
import { MeetingTab } from "@/noject/components/project/tabs/MeetingTab";

export const Route = createFileRoute("/_authenticated/noject/projects/$projectId")({ component: ProjectDetail });

const TABS = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "tasks", label: "Tâches", icon: ListChecks },
  { id: "views", label: "Vues avancées", icon: BarChart3 },
  { id: "calendar", label: "Agenda", icon: CalendarDays },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "time", label: "Temps", icon: Timer },
  { id: "coach", label: "Coach IA", icon: Bot },
  { id: "health", label: "Santé & Simulation", icon: HeartPulse },
  { id: "meeting", label: "Réunions", icon: Mic },
  { id: "files", label: "Fichiers", icon: Folder },
  { id: "insights", label: "Insights IA", icon: Sparkles },
  { id: "audit", label: "Historique", icon: History },
] as const;

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const qc = useQueryClient();
  const fetch = useServerFn(getProject);
  const patch = useServerFn(updateProject);
  const del = useServerFn(deleteProject);
  const project = useQuery({ queryKey: ["project", projectId], queryFn: () => fetch({ data: { id: projectId } }) });

  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const p = project.data;

  const updatePhase = useMutation({
    mutationFn: (phase: string) => patch({ data: { id: projectId, patch: { phase } } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project", projectId] }); toast.success("Phase mise à jour"); },
  });

  if (project.isLoading) return <div className="text-muted-foreground">Chargement…</div>;
  if (!p) return <div>Projet introuvable</div>;

  const phases = ["lancement","planification","execution","cloture"];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link to="/noject/projects" className="text-xs underline text-muted-foreground">← Projets</Link>
          <EditableTitle project={p} projectId={projectId} />
          <EditableText
            value={p.objective ?? ""} placeholder="Objectif du projet…" multiline
            className="text-muted-foreground max-w-2xl mt-1"
            onSave={(v) => patch({ data: { id: projectId, patch: { objective: v } } }).then(() => qc.invalidateQueries({ queryKey: ["project", projectId] }))}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-ghost" title="Exporter en PDF"><Printer className="size-3" /> PDF</button>
          <button className="btn-ghost text-red-200" onClick={async () => {
            if (!confirm("Supprimer ce projet ?")) return;
            await del({ data: { id: projectId } });
            toast.success("Supprimé"); window.location.href = "/projects";
          }}><Trash2 className="size-3" /></button>
        </div>
      </div>

      <div className="bento p-4 flex flex-wrap gap-2 items-center print:hidden">
        <span className="text-xs uppercase text-white/70 mr-2">Cycle de vie :</span>
        {phases.map(ph => (
          <button key={ph} onClick={() => updatePhase.mutate(ph)}
            className={`chip ${p.phase === ph ? "!bg-white/20 !border-white/40 shadow-[0_0_20px_oklch(0.68_0.28_15/.4)]" : ""}`}>{ph}</button>
        ))}
        <div className="ml-auto flex-1 max-w-xs">
          <div className="flex items-center justify-between text-xs text-white/70 mb-1">
            <span>Avancement automatique</span>
            <span className="font-semibold">{p.progress ?? 0}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF204E] to-[#00224D] transition-all" style={{ width: `${p.progress ?? 0}%` }} />
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 print:hidden">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`chip !text-sm !normal-case !tracking-normal whitespace-nowrap ${tab === t.id ? "!bg-white/20 !border-white/40" : ""}`}>
            <t.icon className="size-3" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview p={p} projectId={projectId} />}
      {tab === "tasks" && <TasksTab projectId={projectId} />}
      {tab === "views" && <ViewsTab projectId={projectId} project={p} />}
      {tab === "calendar" && <CalendarTab projectId={projectId} />}
      {tab === "budget" && <BudgetTab projectId={projectId} project={p} />}
      {tab === "time" && <TimeTab projectId={projectId} />}
      {tab === "coach" && <CoachTab projectId={projectId} />}
      {tab === "health" && <HealthTab projectId={projectId} />}
      {tab === "meeting" && <MeetingTab projectId={projectId} />}
      {tab === "files" && <FilesTab projectId={projectId} project={p} />}
      {tab === "insights" && <InsightsTab projectId={projectId} />}
      {tab === "audit" && <AuditTab projectId={projectId} />}
    </div>
  );
}

// ============ Editable primitives ============

