<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep state-driven full-screen assistant visuals in `AuraMotion`, independent of recording and Odoo logic, so visual changes cannot alter voice actions.
- Aura drives the IDEALAB lab by returning a lab page path that the app navigates to directly (no iframes; double-click/double-tap on Aura opens /dashboard); app actions run server-side through the registry in src/lib/assistant-apps.server.ts, so new apps only add registry actions.
- Lab apps share Aura's single Odoo connection row (column `db`, aliased to `db_name` in lab code) so users enter Odoo credentials once.
- Lab styles are scoped under `.lab-theme` so they never restyle Aura's screen.
- Lab pages link back to the Aura home screen for voice, so all voice actions use one registry.
- Task panel geometry is managed by native pointer events and a validated localStorage preference, avoiding additional UI dependencies.
- Assistant text/actions return before a separate authenticated speech request, so voice synthesis never delays task feedback.
- MyMackenzy pages live under `/mm/*` (`_authenticated/mm` layout) with `.mm-theme`-scoped styles, so they coexist with the lab's /dashboard and /settings without restyling other apps.
- Smart Teams uses `/smartteams`, isolated `st_` tables and `.st-theme` styles, preserving existing apps and their records; its Odoo actions reuse the shared connection.
- Smart Teams AI helpers stream through SDK providers, preserve imported model choices and output budgets, and stop sequential task execution after an error to avoid repeated blocked requests.
- The imported TEP app lives in src/tep, routes under `/tep/*` (`src/routes/tep` layout), `tep_` tables and `.tep-theme` styles (also set on <body> for dialogs), so it never collides with other apps; its Google OAuth callback is /api/public/tep-google/callback.
- Smart Teams agents act in lab apps through the same server action registry as Aura (per-agent `lab_apps` allow-list), so adding a registry action makes it available to both.
- MyMackenzy automations use lab apps by listing registry app keys in an agent's `services`; cron runs call the shared action registry through a user-scoped admin client (`scopedClient`), and Google is only required when a Google service is listed.
- Per-app AI model choice lives in `user_app_models` and is read server-side via `resolveAppAiModel` (src/lib/ai-models.server.ts) with a fallback, so apps never break when no choice is saved.
- Imported Nova CRM lives in src/crm with routes under /_authenticated/crm (URL /crm/*), .crm-theme styles and /api/public/crm-google|crm-mailgun callbacks, so it never collides with lab /dashboard or /settings; it keeps its original table names.
- Imported Noject lives in src/noject with routes under /_authenticated/noject (URL /noject/*), `noject_` tables typed by src/noject/types.ts via `nj()`, and `.noject-theme` styles, so it never collides with other apps.
- Imported PlanAgenda lives in src/planagenda with route /planning (`_authenticated/planning.tsx`), `pa_` tables (typed locally in src/planagenda/types), `.pa-theme` scoped styles with `pa-` prefixed classes, and /api/public/pa-google/callback, so it never collides with other apps or the shared google_connections table.
- Every app owns tables with its own unique prefix (skydoc_, skytab_, skycloud_, skytask_, calendsky_, sendy_, crm_, angelo_, ocktavus_, mm_, st_, tep_, noject_, pa_); only the Laboratory keeps unprefixed shared tables (profiles, settings, AI models, Odoo/Google connections, lab_activity, ideas), so no app can collide with another's schema.
- Every app owns a unique URL prefix (/angelo, /mm, /tep, /sendy, /smartteams, /skytask, /crm, /noject…); only the Laboratory/Aura core stays at the root, so app URLs never collide.
