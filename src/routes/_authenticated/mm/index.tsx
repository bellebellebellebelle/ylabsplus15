import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/mm/")({ beforeLoad: () => { throw redirect({ to: "/mm/cockpit" }); } });
