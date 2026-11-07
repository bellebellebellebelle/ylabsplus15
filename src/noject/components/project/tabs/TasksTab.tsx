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

export function TasksTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listTasks);
  const create = useServerFn(createTask);
  const update = useServerFn(updateTask);
  const remove = useServerFn(deleteTask);

  const tasks = useQuery({ queryKey: ["tasks", projectId], queryFn: () => list({ data: { projectId } }) });
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [parentFor, setParentFor] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    qc.invalidateQueries({ queryKey: ["project", projectId] });
  };
  const createMut = useMutation({ mutationFn: (payload: any) => create({ data: payload }), onSuccess: () => { invalidate(); setTitle(""); setSubTitle(""); setParentFor(null); } });
  const updateMut = useMutation({
    mutationFn: (payload: any) => update({ data: payload }),
    onMutate: async (payload: { id: string; patch: Partial<Task> }) => {
      await qc.cancelQueries({ queryKey: ["tasks", projectId] });
      const prev = qc.getQueryData<Task[]>(["tasks", projectId]);
      qc.setQueryData<Task[]>(["tasks", projectId], (old) => old?.map((t) => (t.id === payload.id ? { ...t, ...payload.patch } : t)));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["tasks", projectId], ctx.prev); toast.error("Modification annulée"); },
    onSettled: invalidate,
  });
  const removeMut = useMutation({ mutationFn: (id: string) => remove({ data: { id } }), onSuccess: invalidate });

  const all = tasks.data ?? [];
  const roots = all.filter((t: any) => !t.parent_task_id);
  const children = (id: string) => all.filter((t: any) => t.parent_task_id === id);
  const otherRoots = (id: string) => roots.filter((t: any) => t.id !== id);

  const toggleStatus = (t: any) => updateMut.mutate({ id: t.id, patch: { status: t.status === "termine" ? "a_faire" : "termine" } });

  return (
    <div className="space-y-4">
      <form className="bento p-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (title.trim()) createMut.mutate({ projectId, title }); }}>
        <input className="input-field" placeholder="Ajouter une tâche…" value={title} onChange={e => setTitle(e.target.value)} />
        <button className="btn-holo"><Plus className="size-4" /> Ajouter</button>
      </form>

      <div className="space-y-2">
        {roots.map((t: any) => {
          const kids = children(t.id);
          const open = expanded[t.id];
          const isEditing = editing === t.id;
          const Icon = t.icon && (TASK_ICONS as any)[t.icon] ? (TASK_ICONS as any)[t.icon] : null;
          const barColor = t.color || "#FF204E";
          return (
            <div key={t.id} className="bento p-3" style={{ borderLeft: `3px solid ${barColor}` }}>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => toggleStatus(t)}
                  className={`size-5 rounded-md border transition ${t.status === "termine" ? "border-transparent" : "border-white/30 hover:border-white/60"} grid place-items-center`}
                  style={t.status === "termine" ? { background: barColor } : undefined}>
                  {t.status === "termine" && <Check className="size-3" />}
                </button>
                {Icon && <Icon className="size-4" style={{ color: barColor }} />}
                <div className={`flex-1 min-w-0 ${t.status === "termine" ? "line-through text-white/50" : ""}`}>
                  <EditableText value={t.title} onSave={v => updateMut.mutate({ id: t.id, patch: { title: v } })} />
                </div>
                {(t.tags ?? []).slice(0, 3).map((tag: string) => (
                  <span key={tag} className="chip !text-[9px]">{tag}</span>
                ))}
                <select value={t.priority} onChange={e => updateMut.mutate({ id: t.id, patch: { priority: e.target.value as Task["priority"] } })}
                  className="bg-white/10 border border-white/15 rounded-md px-2 py-1 text-xs">
                  {["basse","moyenne","haute","critique"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={() => setEditing(isEditing ? null : t.id)} className="text-xs underline">Détails</button>
                {kids.length > 0 && (
                  <button onClick={() => setExpanded(x => ({ ...x, [t.id]: !x[t.id] }))} className="text-white/70">
                    {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                )}
                <button onClick={() => setParentFor(parentFor === t.id ? null : t.id)} className="text-xs underline">+ Sous-tâche</button>
                <button onClick={() => { if (confirm("Supprimer cette tâche ?")) removeMut.mutate(t.id); }} className="text-red-200"><Trash2 className="size-3" /></button>
              </div>

              {isEditing && (
                <div className="mt-3 space-y-3 pl-8">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="text-xs">Début
                      <input type="date" defaultValue={t.start_date ?? ""} onBlur={e => updateMut.mutate({ id: t.id, patch: { start_date: e.target.value || null } })} className="input-field mt-1" />
                    </label>
                    <label className="text-xs">Fin
                      <input type="date" defaultValue={t.due_date ?? ""} onBlur={e => updateMut.mutate({ id: t.id, patch: { due_date: e.target.value || null } })} className="input-field mt-1" />
                    </label>
                    <label className="text-xs">Effort (h)
                      <input type="number" step="0.5" defaultValue={t.estimated_hours ?? ""} onBlur={e => updateMut.mutate({ id: t.id, patch: { estimated_hours: e.target.value ? parseFloat(e.target.value) : null } })} className="input-field mt-1" />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs mb-1 flex items-center gap-1"><Palette className="size-3" /> Couleur</div>
                      <div className="flex flex-wrap gap-1">
                        {TASK_COLORS.map(c => (
                          <button key={c} onClick={() => updateMut.mutate({ id: t.id, patch: { color: c } })}
                            className={`size-6 rounded-full transition ${t.color === c ? "ring-2 ring-white" : ""}`}
                            style={{ background: c }} title={c} />
                        ))}
                        <button onClick={() => updateMut.mutate({ id: t.id, patch: { color: null } })} className="text-[10px] underline text-white/60 self-center ml-1">reset</button>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-1 flex items-center gap-1"><Star className="size-3" /> Icône</div>
                      <div className="flex flex-wrap gap-1">
                        {(Object.entries(TASK_ICONS) as [string, any][]).map(([name, IconC]) => (
                          <button key={name} onClick={() => updateMut.mutate({ id: t.id, patch: { icon: name } })}
                            className={`p-1.5 rounded-md border ${t.icon === name ? "border-white bg-white/10" : "border-white/15 hover:border-white/40"}`}>
                            <IconC className="size-3.5" />
                          </button>
                        ))}
                        <button onClick={() => updateMut.mutate({ id: t.id, patch: { icon: null } })} className="text-[10px] underline text-white/60 self-center ml-1">reset</button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs mb-1 flex items-center gap-1"><Tag className="size-3" /> Étiquettes (séparées par virgule)</div>
                    <input type="text" defaultValue={(t.tags ?? []).join(", ")} onBlur={e => updateMut.mutate({ id: t.id, patch: { tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } })}
                      className="input-field" placeholder="urgent, backend, client" />
                  </div>
                  <div>
                    <div className="text-xs mb-1">Dépendances (tâches prérequises)</div>
                    <div className="flex flex-wrap gap-1">
                      {otherRoots(t.id).map((o: any) => {
                        const active = (t.dependency_ids ?? []).includes(o.id);
                        return (
                          <button key={o.id}
                            onClick={() => {
                              const next = active
                                ? (t.dependency_ids ?? []).filter((x: string) => x !== o.id)
                                : [...(t.dependency_ids ?? []), o.id];
                              updateMut.mutate({ id: t.id, patch: { dependency_ids: next } });
                            }}
                            className={`chip !text-[10px] ${active ? "!bg-[#FF204E]/30 !border-[#FF204E]" : ""}`}>
                            {o.title}
                          </button>
                        );
                      })}
                      {otherRoots(t.id).length === 0 && <span className="text-[10px] text-white/50">Aucune autre tâche.</span>}
                    </div>
                  </div>
                  <textarea placeholder="Description détaillée…" defaultValue={t.description ?? ""} onBlur={e => updateMut.mutate({ id: t.id, patch: { description: e.target.value || null } })} className="input-field w-full" rows={2} />
                  <textarea placeholder="Notes…" defaultValue={t.notes ?? ""} onBlur={e => updateMut.mutate({ id: t.id, patch: { notes: e.target.value || null } })} className="input-field w-full" rows={2} />
                </div>
              )}

              {(t.start_date || t.due_date) && !isEditing && <div className="pl-8 mt-1 text-[11px] text-white/60">📅 {t.start_date ?? "?"} → {t.due_date ?? "?"} {t.estimated_hours ? `· ${t.estimated_hours}h` : ""}</div>}

              {parentFor === t.id && (
                <form className="mt-2 flex gap-2 pl-8" onSubmit={e => { e.preventDefault(); if (subTitle.trim()) createMut.mutate({ projectId, title: subTitle, parentId: t.id }); }}>
                  <input className="input-field" placeholder="Sous-tâche…" value={subTitle} onChange={e => setSubTitle(e.target.value)} />
                  <button className="btn-ghost">Ajouter</button>
                </form>
              )}
              {(open || (kids.length > 0 && !collapsed(expanded, t.id))) && kids.length > 0 && (
                <div className="mt-2 space-y-1 pl-8">
                  {kids.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <button onClick={() => toggleStatus(c)}
                        className={`size-4 rounded border transition ${c.status === "termine" ? "border-transparent" : "border-white/30 hover:border-white/60"} grid place-items-center`}
                        style={c.status === "termine" ? { background: c.color || "#FF204E" } : undefined}>
                        {c.status === "termine" && <Check className="size-2.5" />}
                      </button>
                      <div className={`flex-1 ${c.status === "termine" ? "line-through text-white/50" : ""}`}>
                        <EditableText value={c.title} onSave={v => updateMut.mutate({ id: c.id, patch: { title: v } })} />
                      </div>
                      <button onClick={() => { if (confirm("Supprimer ?")) removeMut.mutate(c.id); }} className="text-red-200"><Trash2 className="size-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {roots.length === 0 && <div className="bento p-6 text-center text-white/60">Aucune tâche.</div>}
      </div>
    </div>
  );
}
