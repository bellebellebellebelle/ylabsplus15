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

export function FilesTab({ projectId }: { projectId: string; project: Project }) {
  const qc = useQueryClient();
  const list = useServerFn(listProjectFiles);
  const upload = useServerFn(uploadProjectFile);
  const remove = useServerFn(deleteProjectFile);
  const [folder, setFolder] = useState<string>("");
  const [newFolder, setNewFolder] = useState("");
  const [extraFolders, setExtraFolders] = useState<string[]>([]);

  const files = useQuery({ queryKey: ["files", projectId], queryFn: () => list({ data: { projectId } }) });
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      let bin = ""; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return upload({ data: { projectId, name: file.name, mimeType: file.type || "application/octet-stream", base64: btoa(bin), folder } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["files", projectId] }); toast.success("Fichier importé"); },
    onError: (e: any) => toast.error(e.message),
  });
  const removeMut = useMutation({
    mutationFn: (fileId: string) => remove({ data: { fileId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["files", projectId] }); toast.success("Supprimé"); },
  });

  const rows: any[] = files.data ?? [];
  const allFolders = Array.from(new Set([...rows.map(r => r.folder).filter(Boolean), ...extraFolders])).sort();
  const subFolders = folder === "" ? allFolders : [];
  const here = rows.filter(r => (r.folder ?? "") === folder);

  return (
    <div className="space-y-4">
      <div className="bento p-4 flex items-center gap-3 flex-wrap">
        <input ref={inputRef} type="file" hidden onChange={e => {
          const f = e.target.files?.[0]; if (!f) return;
          if (f.size > 20 * 1024 * 1024) { toast.error("Fichier > 20 Mo non supporté"); return; }
          uploadMut.mutate(f); e.target.value = "";
        }} />
        <button className="btn-holo" onClick={() => inputRef.current?.click()} disabled={uploadMut.isPending}>
          {uploadMut.isPending ? <><Loader2 className="size-4 animate-spin" /> Import…</> : <><Upload className="size-4" /> Importer</>}
        </button>
        {folder === "" && (
          <form className="flex gap-1" onSubmit={e => { e.preventDefault(); const n = newFolder.trim(); if (n) { setExtraFolders(f => [...f, n]); setFolder(n); setNewFolder(""); } }}>
            <input className="input-field !py-1 !w-40" placeholder="Nouveau dossier" value={newFolder} onChange={e => setNewFolder(e.target.value)} />
            <button className="btn-ghost"><Plus className="size-3" /></button>
          </form>
        )}
        <div className="ml-auto flex items-center gap-1 text-xs text-white/70">
          <button onClick={() => setFolder("")} className="hover:text-white flex items-center gap-1"><Folder className="size-3" /> Racine</button>
          {folder && <span className="flex items-center gap-1"><ChevronRight className="size-3" />{folder}</span>}
          {folder && <button onClick={() => setFolder("")} className="btn-ghost ml-2 !py-0.5 !px-2"><ArrowLeft className="size-3" /></button>}
        </div>
      </div>

      {subFolders.length > 0 && (
        <div>
          <div className="text-xs uppercase text-white/60 mb-2">Dossiers</div>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {subFolders.map(f => (
              <button key={f} onClick={() => setFolder(f)} className="bento p-3 flex items-center gap-3 hover:bg-white/10 transition text-left">
                <Folder className="size-6 text-[#FF204E]" />
                <div className="flex-1 min-w-0"><div className="font-medium truncate">{f}</div><div className="text-[10px] text-white/60">{rows.filter(r => r.folder === f).length} fichier(s)</div></div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        {subFolders.length > 0 && <div className="text-xs uppercase text-white/60 mb-2">Fichiers</div>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {here.map(f => (
            <div key={f.id} className="bento p-3 flex items-center gap-3">
              <FileText className="size-6" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{f.name}</div>
                <div className="text-[10px] text-white/60">{new Date(f.created_at).toLocaleString("fr-FR")} · {(Number(f.size_bytes) / 1024).toFixed(0)} Ko</div>
              </div>
              <OpenFileButton fileId={f.id} />
              <button onClick={() => { if (confirm(`Supprimer ${f.name} ?`)) removeMut.mutate(f.id); }} className="text-red-200"><Trash2 className="size-3" /></button>
            </div>
          ))}
          {here.length === 0 && <div className="bento p-6 text-center text-white/60 sm:col-span-2 lg:col-span-3">{files.isLoading ? "Chargement…" : "Aucun fichier ici."}</div>}
        </div>
      </div>
    </div>
  );
}

// ============ Insights ============

