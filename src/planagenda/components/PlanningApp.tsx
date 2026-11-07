import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid, CalendarDays, Bot, Sparkles, ScanText, BookOpenText, Settings2,
  Plus, PanelLeftClose, PanelLeftOpen, LogOut, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/_authenticated/planning";
import { listPlanningItems } from "@/planagenda/lib/planning.functions";
import { pullFromGoogle } from "@/planagenda/lib/google.functions";
import { BoardView } from "./BoardView";
import { CalendarView } from "./CalendarView";
import { AssistantTab } from "./AssistantTab";
import { SuggestionsTab } from "./SuggestionsTab";
import { OcrTab } from "./OcrTab";
import { InstructionsTab } from "./InstructionsTab";
import { SettingsTab } from "./SettingsTab";
import { PostItDialog } from "./PostItDialog";

type TabId = "board" | "week" | "assistant" | "suggestions" | "ocr" | "instructions" | "settings";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "week", label: "Semaine", icon: CalendarDays },
  { id: "assistant", label: "Assistant IA", icon: Bot },
  { id: "suggestions", label: "Suggestions", icon: Sparkles },
  { id: "ocr", label: "OCR & Docs", icon: ScanText },
  { id: "instructions", label: "Instructions", icon: BookOpenText },
  { id: "settings", label: "Paramètres", icon: Settings2 },
];

export function PlanningApp() {
  const [tab, setTab] = useState<TabId>("board");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [creating, setCreating] = useState(false);
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const list = useServerFn(listPlanningItems);
  const pull = useServerFn(pullFromGoogle);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["planning_items"],
    queryFn: () => list(),
    staleTime: 60_000, // realtime channel invalidates on any change
  });

  // Realtime subscription
  useEffect(() => {
    // Debounced: a Google sync touching 50 rows triggers one refetch, not 50.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ch = supabase
      .channel(`planning_items_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pa_planning_items" }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => qc.invalidateQueries({ queryKey: ["planning_items"] }), 300);
      })
      .subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(ch); };
  }, [qc]);

  useEffect(() => {
    if (search.google === "connected") {
      toast.success("Google connecté ! Synchronisation initiale…");
      pull().then((r: any) => {
        toast.success(`${r.imported} nouveaux éléments importés`);
        qc.invalidateQueries({ queryKey: ["planning_items"] });
      }).catch((e: Error) => toast.error(e.message));
      navigate({ to: "/planning", search: {} });
    }
  }, [search.google, pull, qc, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const doSync = async () => {
    toast.loading("Sync Google…", { id: "sync" });
    try {
      const r: any = await pull();
      toast.success(`${r.imported} nouveaux, ${r.total} au total`, { id: "sync" });
      qc.invalidateQueries({ queryKey: ["planning_items"] });
    } catch (e) {
      toast.error((e as Error).message, { id: "sync" });
    }
  };

  return (
    <div className="min-h-screen flex text-foreground">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 68 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="pa-glass-strong sticky top-0 h-screen flex flex-col py-4 px-2 border-r border-border/50 z-20"
      >
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="rounded-xl bg-primary/20 p-1.5 pa-holo-glow flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          {sidebarOpen && <span className="font-semibold pa-holo-text whitespace-nowrap">Cockpit</span>}
        </div>

        <button
          onClick={() => setCreating(true)}
          className="mx-1 mb-4 flex items-center gap-2 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground px-3 py-2 text-sm font-medium pa-holo-glow transition"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          {sidebarOpen && <span>Nouveau post-it</span>}
        </button>

        <nav className="flex-1 space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  active ? "bg-primary/15 text-foreground pa-holo-glow" : "text-muted-foreground hover:bg-sidebar-accent"
                }`}
                title={t.label}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                {sidebarOpen && <span className="whitespace-nowrap">{t.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="space-y-1">
          <button onClick={doSync} className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent">
            <RefreshCw className="h-4 w-4 flex-shrink-0" />{sidebarOpen && <span>Sync Google</span>}
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4 flex-shrink-0" />{sidebarOpen && <span>Se déconnecter</span>}
          </button>
          <button onClick={() => setSidebarOpen((v) => !v)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent">
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            {sidebarOpen && <span>Réduire</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold pa-holo-text">
              {TABS.find((t) => t.id === tab)?.label}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {items.length} élément{items.length > 1 ? "s" : ""} · sync temps réel activée
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "board" && <BoardView items={items as any[]} loading={isLoading} onCreate={() => setCreating(true)} />}
            {tab === "week" && <CalendarView items={items as any[]} />}
            {tab === "assistant" && <AssistantTab />}
            {tab === "suggestions" && <SuggestionsTab items={items as any[]} />}
            {tab === "ocr" && <OcrTab />}
            {tab === "instructions" && <InstructionsTab />}
            {tab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {creating && <PostItDialog open={creating} onOpenChange={setCreating} />}
    </div>
  );
}
