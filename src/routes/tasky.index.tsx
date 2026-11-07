import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tasky/")({
  beforeLoad: () => { throw redirect({ to: "/skytask" }); },
});
