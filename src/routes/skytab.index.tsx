import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/skytab/")({
  beforeLoad: () => { throw redirect({ to: "/skytab/dashboard" }); },
});
