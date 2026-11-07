import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/angelo/")({ beforeLoad: () => { throw redirect({ to: "/angelo/tableau-de-bord" }); } });
