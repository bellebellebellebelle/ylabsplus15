import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listNotifications, markNotificationRead } from "@/noject/lib/notifications.functions";
import {
  LayoutDashboard, FolderKanban, CalendarDays, Settings2, LogOut,
  ChevronsLeft, ChevronsRight, Bell, Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/noject")({
  head: () => ({ meta: [
    { title: "Noject — Pilotage de projets IA" },
    { name: "description", content: "Cockpit de projets : tâches, agenda, budget, temps et coach IA." },
    { property: "og:title", content: "Noject — Pilotage de projets IA" },
    { property: "og:description", content: "Cockpit de projets : tâches, agenda, budget, temps et coach IA." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Layout,
});

const NAV = [
  { to: "/noject/dashboard", label: "Cockpit", icon: LayoutDashboard },
  { to: "/noject/portfolio", label: "Portefeuille", icon: Briefcase },
  { to: "/noject/projects", label: "Projets", icon: FolderKanban },
  { to: "/noject/calendar", label: "Agenda", icon: CalendarDays },
  { to: "/noject/settings", label: "Paramètres", icon: Settings2 },
];

function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const [checking, setChecking] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { nav({ to: "/auth" }); return; }
      setEmail(data.session.user.email ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) nav({ to: "/auth" });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  if (checking) return <div className="noject-theme min-h-screen grid place-items-center text-muted-foreground">Chargement…</div>;

  return (
    <div className="noject-theme min-h-screen flex">
      <aside
        className={`sticky top-0 h-screen flex flex-col transition-all duration-300 z-30 print:hidden ${collapsed ? "w-[56px]" : "w-[220px]"}`}
        style={{
          background: "linear-gradient(180deg, oklch(0.22 0.12 15 / 0.85), oklch(0.18 0.10 20 / 0.85))",
          borderRight: "1px solid oklch(1 0 0 / 0.10)",
          backdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "inset -1px 0 0 oklch(0.68 0.28 15 / 0.35), 4px 0 30px oklch(0.68 0.28 15 / 0.15)",
        }}
      >
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="size-8 shrink-0 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.28_15)] via-[oklch(0.30_0.20_340)] to-[oklch(0.30_0.15_265)] shadow-[0_0_25px_oklch(0.68_0.28_15/.7)]" />
          {!collapsed && <span className="font-display font-bold text-lg">Prism</span>}
          <button onClick={() => setCollapsed(c => !c)}
            className="ml-auto text-white/60 hover:text-white transition">
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </button>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
            return (
              <Link key={to} to={to}
                title={label}
                className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                style={active ? { boxShadow: "0 0 22px oklch(0.68 0.28 15 / 0.55), inset 0 0 0 1px oklch(0.68 0.28 15 / 0.5)" } : undefined}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-[#FF204E] to-[#00E5FF] shadow-[0_0_10px_#FF204E]" />}
                <Icon className={`size-4 shrink-0 ${active ? "drop-shadow-[0_0_6px_#FF204E]" : ""}`} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
          <NotifBell collapsed={collapsed} />
        </nav>
        <div className="px-2 py-3 space-y-1">
          {!collapsed && <div className="px-2 py-1 text-[10px] text-white/40 truncate">{email}</div>}
          <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}
            title="Déconnexion"
            className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 w-full">
            <LogOut className="size-4" /> {!collapsed && "Déconnexion"}
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="px-6 md:px-10 py-6 max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NotifBell({ collapsed }: { collapsed: boolean }) {
  const qc = useQueryClient();
  const list = useServerFn(listNotifications);
  const mark = useServerFn(markNotificationRead);
  const notifs = useQuery({ queryKey: ["notifications"], queryFn: () => list(), refetchInterval: 30000 });
  const [open, setOpen] = useState(false);
  const unread = (notifs.data ?? []).filter((n: any) => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        title="Notifications"
        className="group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm w-full text-white/60 hover:text-white hover:bg-white/5">
        <Bell className="size-4 shrink-0" />
        {!collapsed && <span>Alertes</span>}
        {unread > 0 && (
          <span className="absolute top-1 left-6 min-w-[16px] h-4 px-1 rounded-full bg-[#FF204E] text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_10px_#FF204E]">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute left-full ml-2 top-0 w-80 bento p-3 z-50 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm font-semibold flex-1">Notifications</div>
            {unread > 0 && <button className="text-[10px] underline text-white/70"
              onClick={() => mark({ data: { all: true } }).then(() => qc.invalidateQueries({ queryKey: ["notifications"] }))}>Tout marquer lu</button>}
          </div>
          {(notifs.data ?? []).length === 0 && <div className="text-xs text-white/50">Aucune notification.</div>}
          <ul className="space-y-1">
            {(notifs.data ?? []).map((n: any) => (
              <li key={n.id} className={`p-2 rounded-lg text-xs ${n.read ? "bg-white/5" : "bg-white/10 border border-white/15"}`}>
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${n.read ? "bg-white/30" : "bg-[#FF204E] shadow-[0_0_6px_#FF204E]"}`} />
                  <span className="font-semibold">{n.title}</span>
                  <span className="ml-auto text-[9px] text-white/40">{new Date(n.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {n.message && <div className="mt-0.5 text-white/80">{n.message}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
