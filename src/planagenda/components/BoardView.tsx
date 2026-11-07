import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, useDroppable, useDraggable } from "@dnd-kit/core";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { PostIt } from "./PostIt";
import { PostItDialog } from "./PostItDialog";
import { moveItemToColumn } from "@/planagenda/lib/planning.functions";
import { toast } from "sonner";
import { Plus, Archive, ChevronDown, ChevronRight } from "lucide-react";
import { dayDiffInTz, useTimezone } from "@/planagenda/lib/tz";

type Item = Record<string, unknown> & { id: string; status?: string; board_column?: string; start_at?: string | null; due_at?: string | null };

const COLUMNS: { id: string; label: string; hint: string }[] = [
  { id: "inbox", label: "📥 À trier", hint: "À planifier" },
  { id: "today", label: "🔥 Aujourd'hui", hint: "Focus du jour" },
  { id: "tomorrow", label: "⚡ Demain", hint: "Préparation" },
  { id: "week", label: "🗓️ Cette semaine", hint: "À venir" },
  { id: "later", label: "🌙 Plus tard", hint: "Backlog" },
];

function DroppableCol({ id, label, hint, children, onCreate }: { id: string; label: string; hint: string; children: React.ReactNode; onCreate?: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef}
      className={`pa-bento p-3 min-h-[50vh] transition-all ${isOver ? "ring-2 ring-primary pa-holo-glow" : ""}`}>
      <div className="mb-3 px-1">
        <h3 className="text-sm font-semibold">{label}</h3>
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      </div>
      <div className="space-y-3 pa-scroll-slim overflow-y-auto max-h-[65vh]">
        {children}
        {onCreate && (
          <button onClick={onCreate} className="w-full rounded-xl border border-dashed border-border/60 text-muted-foreground py-4 hover:border-primary/50 hover:text-primary transition flex items-center justify-center gap-1 text-xs">
            <Plus className="h-3 w-3" /> Ajouter
          </button>
        )}
      </div>
    </div>
  );
}

function DraggableItem({ item, onEdit }: { item: Item; onEdit: (i: Item) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? "opacity-40" : ""}>
      <PostIt item={item} onClick={() => onEdit(item)} />
    </div>
  );
}

/** Decide which board column an item belongs to, based on status + date (in user tz). */
function resolveColumn(item: Item, tz: string): string {
  if (item.status === "done" || item.board_column === "done") return "done";
  const date = item.start_at || item.due_at;
  if (!date) return item.board_column || "inbox";
  const diff = dayDiffInTz(date, tz);
  if (diff === null) return item.board_column || "inbox";
  if (diff < 0) return "today"; // overdue → today
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 7) return "week";
  return "later";
}

export function BoardView({ items, onCreate }: { items: Item[]; loading?: boolean; onCreate: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showDone, setShowDone] = useState(false);
  const tz = useTimezone();
  const move = useServerFn(moveItemToColumn);
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const map: Record<string, Item[]> = { inbox: [], today: [], tomorrow: [], week: [], later: [], done: [] };
    for (const i of items) {
      const col = resolveColumn(i, tz);
      (map[col] ??= []).push(i);
    }
    return map;
  }, [items, tz]);

  const doneItems = grouped.done;

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const id = e.active.id as string;
    const col = e.over.id as string;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const currentCol = resolveColumn(item, tz);
    if (currentCol === col) return;

    // optimistic with snapshot for rollback
    await qc.cancelQueries({ queryKey: ["planning_items"] });
    const snapshot = qc.getQueryData<Item[]>(["planning_items"]);
    qc.setQueryData(["planning_items"], (old: Item[] = []) =>
      old.map((i) => i.id === id ? { ...i, board_column: col, status: col === "done" ? "done" : "planned" } : i));

    try {
      await move({ data: { id, board_column: col } });
      if (col === "done") {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ["#00C68D", "#4DFFBE", "#F7F1DE"] });
        toast.success("Terminé — synchronisé avec Google Tasks");
      }
      qc.invalidateQueries({ queryKey: ["planning_items"] });
    } catch (err) {
      toast.error((err as Error).message);
      if (snapshot) qc.setQueryData(["planning_items"], snapshot);
      qc.invalidateQueries({ queryKey: ["planning_items"] });
    }
  };

  const active = items.find((i) => i.id === activeId);

  return (
    <>
      <DndContext sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
        onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {COLUMNS.map((c) => (
            <DroppableCol key={c.id} id={c.id} label={c.label} hint={c.hint} onCreate={grouped[c.id].length === 0 ? onCreate : undefined}>
              <AnimatePresence>
                {grouped[c.id].map((item) => (
                  <motion.div key={item.id}
                    layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <DraggableItem item={item} onEdit={setEditing} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </DroppableCol>
          ))}
        </div>

        {/* Done archive */}
        <div className="mt-6 pa-bento p-3">
          <button onClick={() => setShowDone((v) => !v)} className="w-full flex items-center justify-between px-1 py-2 text-sm">
            <span className="flex items-center gap-2 font-semibold">
              <Archive className="h-4 w-4 text-emerald-400" />
              Archive — Terminés ({doneItems.length})
            </span>
            {showDone ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <DoneDropZone />
          {showDone && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-3">
              {doneItems.length === 0 && <p className="text-xs text-muted-foreground col-span-full">Rien à archiver pour l'instant.</p>}
              {doneItems.map((it) => (
                <DraggableItem key={it.id} item={it} onEdit={setEditing} />
              ))}
            </div>
          )}
        </div>

        <DragOverlay>
          {active ? <div className="rotate-2 shadow-2xl scale-105"><PostIt item={active} /></div> : null}
        </DragOverlay>
      </DndContext>

      {editing && <PostItDialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)} item={editing} />}
    </>
  );
}

function DoneDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "done" });
  return (
    <div ref={setNodeRef} className={`mt-2 rounded-xl border border-dashed border-emerald-400/40 text-xs text-muted-foreground text-center py-2 transition ${isOver ? "bg-emerald-500/10 border-emerald-400 text-emerald-300" : ""}`}>
      Glisser une tâche ici pour la marquer comme terminée ✅
    </div>
  );
}
