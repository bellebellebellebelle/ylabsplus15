import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/angelo/connexion-odoo")({
  beforeLoad: () => { throw redirect({ to: "/settings", search: { tab: "odoo" } }); },
});
