import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PlanningApp } from "@/planagenda/components/PlanningApp";

// Imported PlanAgenda app: look scoped under .pa-theme (also on <body> so dialogs match).
function PlanAgendaPage() {
  useEffect(() => {
    document.body.classList.add("pa-theme");
    return () => document.body.classList.remove("pa-theme");
  }, []);
  return (
    <div className="pa-theme">
      <PlanningApp />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/planning")({
  head: () => ({
    meta: [
      { title: "Cockpit — Planning" },
      { name: "description", content: "Planning holographique : post-its, calendrier et assistant IA." },
      { property: "og:title", content: "Cockpit — Planning" },
      { property: "og:description", content: "Planning holographique : post-its, calendrier et assistant IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { google?: string } =>
    typeof s.google === "string" ? { google: s.google } : {},
  component: PlanAgendaPage,
});
