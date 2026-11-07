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

export function MeetingTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listMeetings);
  const trans = useServerFn(transcribeMeeting);
  const del = useServerFn(deleteMeeting);
  const meetings = useQuery({ queryKey: ["meetings", projectId], queryFn: () => list({ data: { projectId } }) });
  const inputRef = useRef<HTMLInputElement>(null);

  const upMut = useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      let bin = ""; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
      const base64 = btoa(bin);
      return trans({ data: { projectId, name: file.name, mimeType: file.type || "audio/mpeg", base64, createTasks: true } });
    },
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ["meetings", projectId] });
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success(`Compte-rendu généré · ${r.createdTasks ?? 0} tâche(s) créée(s)`);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const rmMut = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings", projectId] }) });

  return (
    <div className="space-y-4">
      <div className="bento p-4 flex items-center gap-3 flex-wrap">
        <Mic className="size-5" />
        <div className="flex-1"><div className="font-semibold text-sm">Compte-rendu automatique</div><div className="text-xs text-white/70">Uploadez un enregistrement audio de réunion, l'IA transcrit, résume et crée automatiquement les tâches à faire.</div></div>
        <input ref={inputRef} type="file" hidden accept="audio/*" onChange={e => {
          const f = e.target.files?.[0]; if (!f) return;
          if (f.size > 20 * 1024 * 1024) { toast.error("Fichier > 20 Mo — trop lourd"); return; }
          upMut.mutate(f); e.target.value = "";
        }} />
        <button onClick={() => inputRef.current?.click()} disabled={upMut.isPending} className="btn-holo">
          {upMut.isPending ? <><Loader2 className="size-4 animate-spin" /> Analyse…</> : <><Upload className="size-4" /> Importer un audio</>}
        </button>
      </div>

      <div className="space-y-3">
        {(meetings.data ?? []).map((m: any) => (
          <details key={m.id} className="bento p-4">
            <summary className="cursor-pointer flex items-center gap-2">
              <Mic className="size-4" />
              <div className="flex-1"><div className="font-semibold">{m.audio_name}</div><div className="text-[10px] text-white/60">{new Date(m.created_at).toLocaleString("fr-FR")} · {(m.extracted_tasks ?? []).length} tâches extraites</div></div>
              {m.file_id && <span onClick={(e) => e.preventDefault()}><OpenFileButton fileId={m.file_id} /></span>}
              <button onClick={(e) => { e.preventDefault(); if (confirm("Supprimer ?")) rmMut.mutate(m.id); }} className="text-red-200"><Trash2 className="size-3" /></button>
            </summary>
            <div className="mt-3 space-y-3 text-sm">
              {m.summary && <div><div className="text-xs uppercase text-white/60 mb-1">Résumé</div><div className="whitespace-pre-line">{m.summary}</div></div>}
              {(m.extracted_tasks ?? []).length > 0 && (
                <div>
                  <div className="text-xs uppercase text-white/60 mb-1">Tâches extraites</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {m.extracted_tasks.map((t: any, i: number) => <li key={i}>{t.title} {t.due && <span className="text-white/50 text-xs">({t.due})</span>} {t.assignee && <span className="text-white/50 text-xs">— {t.assignee}</span>}</li>)}
                  </ul>
                </div>
              )}
              {m.transcript && <details><summary className="cursor-pointer text-xs text-white/60">Transcription complète</summary><div className="mt-2 text-xs whitespace-pre-line text-white/80 max-h-64 overflow-y-auto">{m.transcript}</div></details>}
            </div>
          </details>
        ))}
        {(meetings.data ?? []).length === 0 && <div className="bento p-6 text-center text-white/60">Aucune réunion analysée pour l'instant.</div>}
      </div>
    </div>
  );
}

