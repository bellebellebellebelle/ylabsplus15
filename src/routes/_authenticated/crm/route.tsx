import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Briefcase, CalendarCheck, Settings2, Sparkles, LogOut, BookOpen, Target, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/crm")({
  component: AuthenticatedLayout,
});

const items = [
  { title: "Cockpit", url: "/crm/dashboard", icon: LayoutDashboard },
  { title: "Target Day", url: "/crm/target-day", icon: Target },
  { title: "Opportunités", url: "/crm/opportunities", icon: Briefcase },
  { title: "Activités", url: "/crm/activities", icon: CalendarCheck },
  { title: "Paramètres", url: "/crm/settings", icon: Settings2 },
  { title: "Laboratoire", url: "/dashboard", icon: LayoutDashboard },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-black/20 backdrop-blur-2xl">
      <SidebarContent>
        <div className="flex items-center gap-2 p-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-[#FF5722]">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && <span className="font-display text-sm font-bold text-white">Nova CRM</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={active ? "bg-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" : "text-white/80 hover:bg-white/10 hover:text-white"}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Se déconnecter</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

function NotificationBell() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("crm_notifications").select("*").order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
    refetchInterval: 60_000,
  });
  useEffect(() => {
    const ch = supabase
      .channel("notif")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_notifications" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [qc]);
  const items = q.data ?? [];
  const unread = items.filter((n: any) => !n.read).length;

  async function markAllRead() {
    await (supabase as any).from("crm_notifications").update({ read: true }).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 border-white/20 bg-[#2a0f08] text-white">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-sm">Notifications</p>
          {unread > 0 && <button onClick={markAllRead} className="text-xs text-white/60 hover:text-white">Tout marquer lu</button>}
        </div>
        <ul className="max-h-80 space-y-1 overflow-auto">
          {items.map((n: any) => (
            <li key={n.id}>
              <Link
                to={n.href || "/crm/dashboard"}
                className={`block rounded-xl p-2 text-sm ${n.read ? "bg-white/5" : "bg-white/15"} hover:bg-white/20`}
                onClick={async () => { if (!n.read) await (supabase as any).from("crm_notifications").update({ read: true }).eq("id", n.id); }}
              >
                <p className="truncate font-medium">{n.title}</p>
                {n.body && <p className="truncate text-xs text-white/70">{n.body}</p>}
                <p className="text-[10px] text-white/50">{new Date(n.created_at).toLocaleString("fr-FR")}</p>
              </Link>
            </li>
          ))}
          {items.length === 0 && <li className="text-xs text-white/60">Aucune notification.</li>}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function AuthenticatedLayout() {
  // Imported CRM: scoped under .crm-theme (also on <body> so popovers match).
  useEffect(() => {
    document.body.classList.add("crm-theme");
    return () => document.body.classList.remove("crm-theme");
  }, []);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="crm-theme flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b border-white/10 px-4 backdrop-blur-md">
            <SidebarTrigger className="text-white" />
            <div className="ml-auto flex items-center gap-3">
              <NotificationBell />
              <span className="animate-live inline-block h-2 w-2 rounded-full bg-white" />
              <span className="text-xs text-white/80">Sync temps réel</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
