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

export function BudgetTab({ projectId, project }: { projectId: string; project: Project }) {
  const qc = useQueryClient();
  const list = useServerFn(listExpenses);
  const scan = useServerFn(scanInvoice);
  const createE = useServerFn(createExpense);
  const removeE = useServerFn(deleteExpense);
  const expenses = useQuery({ queryKey: ["expenses", projectId], queryFn: () => list({ data: { projectId } }) });
  const inputRef = useRef<HTMLInputElement>(null);
  const [manual, setManual] = useState({ amount: "", vendor: "", category: "Divers", expense_date: new Date().toISOString().slice(0, 10), description: "" });

  const scanMut = useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      let bin = ""; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
      const base64 = btoa(bin);
      return scan({ data: { projectId, name: file.name, mimeType: file.type || "application/octet-stream", base64 } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses", projectId] }); qc.invalidateQueries({ queryKey: ["files", projectId] }); toast.success("Facture analysée par l'IA ✓"); },
    onError: (e: any) => toast.error(e.message),
  });
  const createMut = useMutation({
    mutationFn: () => createE({ data: { projectId, amount: parseFloat(manual.amount || "0"), vendor: manual.vendor, category: manual.category, expense_date: manual.expense_date, description: manual.description } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses", projectId] }); setManual({ amount: "", vendor: "", category: "Divers", expense_date: new Date().toISOString().slice(0, 10), description: "" }); toast.success("Dépense ajoutée"); },
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => removeE({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", projectId] }),
  });

  const rows = expenses.data ?? [];
  const total = rows.reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
  const byCat: Record<string, number> = {};
  for (const r of rows) byCat[r.category || "Divers"] = (byCat[r.category || "Divers"] ?? 0) + Number(r.amount ?? 0);
  const pieData = Object.entries(byCat).map(([label, value]) => ({ label, value }));
  const budget = project.budget ?? 0;
  const remaining = budget - total;
  const usePct = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bento-holo p-4">
          <div className="text-xs uppercase text-white/70">Budget total</div>
          <div className="text-2xl font-bold mt-1">{budget.toLocaleString("fr-FR")} €</div>
        </div>
        <div className="bento p-4">
          <div className="text-xs uppercase text-white/70">Dépensé</div>
          <div className="text-2xl font-bold mt-1">{total.toLocaleString("fr-FR")} €</div>
          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${usePct}%`, background: usePct > 90 ? "#ef4444" : usePct > 70 ? "#f59e0b" : "linear-gradient(90deg,#FF204E,#00E5FF)" }} />
          </div>
          <div className="text-[10px] mt-1 text-white/60">{usePct}% consommé</div>
        </div>
        <div className="bento p-4">
          <div className="text-xs uppercase text-white/70">Restant</div>
          <div className={`text-2xl font-bold mt-1 ${remaining < 0 ? "text-red-400" : ""}`}>{remaining.toLocaleString("fr-FR")} €</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bento p-4">
          <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><Scan className="size-4" /> Scanner une facture (IA)</h3>
          <input ref={inputRef} type="file" hidden accept="image/*,application/pdf" onChange={e => {
            const f = e.target.files?.[0]; if (!f) return;
            if (f.size > 20 * 1024 * 1024) { toast.error("Fichier > 20 Mo non supporté"); return; }
            scanMut.mutate(f); e.target.value = "";
          }} />
          <button onClick={() => inputRef.current?.click()} disabled={scanMut.isPending} className="btn-holo w-full">
            {scanMut.isPending ? <><Loader2 className="size-4 animate-spin" /> Analyse en cours…</> : <><Receipt className="size-4" /> Importer une facture</>}
          </button>
          <div className="text-[10px] mt-2 text-white/60">L'IA lit le montant, le vendeur, la date et la catégorie. Le fichier est archivé dans Fichiers → « Factures ».</div>
        </div>
        <form className="bento p-4 grid gap-2" onSubmit={e => { e.preventDefault(); if (manual.amount) createMut.mutate(); }}>
          <h3 className="font-display font-semibold mb-1">Ajout manuel</h3>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder="Montant €" type="number" step="0.01" value={manual.amount} onChange={e => setManual({ ...manual, amount: e.target.value })} required />
            <input className="input-field" type="date" value={manual.expense_date} onChange={e => setManual({ ...manual, expense_date: e.target.value })} />
          </div>
          <input className="input-field" placeholder="Fournisseur" value={manual.vendor} onChange={e => setManual({ ...manual, vendor: e.target.value })} />
          <select className="input-field" value={manual.category} onChange={e => setManual({ ...manual, category: e.target.value })}>
            {["Divers","Personnel","Matériel","Logiciel","Marketing","Voyage","Sous-traitance","Formation"].map(c => <option key={c}>{c}</option>)}
          </select>
          <input className="input-field" placeholder="Description" value={manual.description} onChange={e => setManual({ ...manual, description: e.target.value })} />
          <button className="btn-ghost"><Plus className="size-3" /> Ajouter</button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bento p-4 h-64 md:col-span-1">
          <h4 className="font-semibold mb-2 text-sm">Répartition par catégorie</h4>
          {pieData.length === 0 ? <div className="text-white/50 text-xs">Aucune dépense.</div> : (
            <ResponsiveContainer width="100%" height="88%">
              <PieChart>
                <Tooltip />
                <Pie data={pieData} dataKey="value" nameKey="label" outerRadius={72} label={(e) => e.label}>
                  {pieData.map((_, i) => <Cell key={i} fill={["#FF204E","#00E5FF","#f59e0b","#10b981","#8b5cf6","#ec4899","#f97316"][i % 7]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bento p-4 md:col-span-2 overflow-x-auto">
          <h4 className="font-semibold mb-2 text-sm">Détail des dépenses</h4>
          <table className="w-full text-sm">
            <thead className="text-xs text-white/60">
              <tr><th className="text-left py-1">Date</th><th className="text-left">Fournisseur</th><th className="text-left">Catégorie</th><th className="text-right">Montant</th><th></th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="py-1">{r.expense_date}</td>
                  <td>{r.vendor ?? "—"}</td>
                  <td><span className="chip !text-[10px]">{r.category}</span></td>
                  <td className="text-right font-semibold">{Number(r.amount).toFixed(2)} {r.currency}</td>
                  <td>{r.file_id && <OpenFileButton fileId={r.file_id} />}</td>
                  <td><button onClick={() => { if (confirm("Supprimer ?")) removeMut.mutate(r.id); }} className="text-red-200"><Trash2 className="size-3" /></button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-white/50">Aucune dépense enregistrée.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ Files (native Cloud storage, virtual folders) ============

