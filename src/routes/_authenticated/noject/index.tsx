import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/noject/")({
  beforeLoad: () => { throw redirect({ to: "/noject/dashboard" }); },
});
