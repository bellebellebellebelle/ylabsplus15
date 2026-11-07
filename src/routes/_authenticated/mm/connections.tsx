import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/mm/connections")({
  beforeLoad: () => { throw redirect({ to: "/settings", search: { tab: "google" } }); },
});
