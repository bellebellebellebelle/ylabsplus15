import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/noject/lib/projects.functions";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/_authenticated/noject/calendar")({ component: CalendarPage });

function CalendarPage() {
  const list = useServerFn(listProjects);
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => list({}) });
  return (
    <div className="space-y-6">
      <div>
        <div className="chip"><CalendarDays className="size-3" /> Agenda</div>
        <h1 className="mt-2 font-display text-4xl font-bold">Agenda global</h1>
        <p className="text-muted-foreground">Sélectionnez un projet pour planifier des activités dans l'agenda du projet.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(projects.data ?? []).map((p: any) => (
          <Link key={p.id} to="/noject/projects/$projectId" params={{ projectId: p.id }} className="bento p-4 hover:bg-white/10 transition">
            <div className="font-semibold">{p.name}</div>
            <div className="text-xs text-white/60">Du {p.start_date ?? "?"} au {p.end_date ?? "?"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
