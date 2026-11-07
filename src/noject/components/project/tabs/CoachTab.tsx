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

export function CoachTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listCoachMessages);
  const ask = useServerFn(askCoach);
  const msgs = useQuery({ queryKey: ["coach", projectId], queryFn: () => list({ data: { projectId } }) });
  const [q, setQ] = useState("");
  const mut = useMutation({
    mutationFn: (question: string) => ask({ data: { projectId, question } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coach", projectId] }); setQ(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const suggestions = [
    "Quel est mon principal blocage aujourd'hui ?",
    "Que dois-je faire cette semaine ?",
    "Suis-je en dérive budgétaire ?",
    "Quelles tâches priorisent le chemin critique ?",
  ];
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_260px]">
      <div className="bento p-4 flex flex-col h-[600px]">
        <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><Bot className="size-4" /> Coach IA projet</h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {(msgs.data ?? []).map((m: any) => (
            <div key={m.id} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "bg-white/10 ml-8" : "bg-gradient-to-br from-[#FF204E]/20 to-[#00224D]/20 border border-[#FF204E]/30 mr-8"}`}>
              <div className="text-[10px] uppercase text-white/60 mb-1">{m.role === "user" ? "Vous" : "Coach IA"}</div>
              <div className="whitespace-pre-line">{m.content}</div>
            </div>
          ))}
          {mut.isPending && <div className="text-white/60 text-sm flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Analyse en cours…</div>}
          {(msgs.data ?? []).length === 0 && !mut.isPending && (
            <div className="text-center text-white/60 py-8 text-sm">Posez votre première question au coach.</div>
          )}
        </div>
        <form onSubmit={e => { e.preventDefault(); if (q.trim()) mut.mutate(q.trim()); }} className="mt-3 flex gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} className="input-field" placeholder="Ex: Qu'est-ce qui bloque le projet ?" />
          <button className="btn-holo" disabled={mut.isPending}><Sparkles className="size-4" /></button>
        </form>
      </div>
      <div className="bento p-4">
        <div className="text-xs uppercase text-white/70 mb-2">Suggestions</div>
        <div className="flex flex-col gap-2">
          {suggestions.map(s => (
            <button key={s} onClick={() => { setQ(s); mut.mutate(s); }} className="chip !text-left !text-xs !normal-case">{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ Health score + Monte-Carlo ============

