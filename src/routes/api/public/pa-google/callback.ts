import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pa-google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        if (err) return htmlResp(`Erreur Google: ${err}`, false);
        if (!code || !state) return htmlResp("Paramètres manquants", false);

        let uid: string;
        try {
          const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
          uid = parsed.uid;
          if (!uid) throw new Error();
        } catch { return htmlResp("État invalide", false); }

        const origin = `${url.protocol}//${url.host}`;
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            redirect_uri: `${origin}/api/public/pa-google/callback`,
            grant_type: "authorization_code",
          }),
        });
        if (!tokenRes.ok) return htmlResp(`Échange token: ${await tokenRes.text()}`, false);
        const tokens = await tokenRes.json();

        // Get email
        let email: string | null = null;
        try {
          const ures = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (ures.ok) { const j = await ures.json(); email = j.email; }
        } catch { /* ignore */ }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const expires_at = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();
        await (supabaseAdmin as any).from("pa_google_connections").upsert({
          user_id: uid,
          email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          expires_at,
          scope: tokens.scope ?? null,
        }, { onConflict: "user_id" });

        throw redirect({ to: "/planning", search: { google: "connected" } as never });
      },
    },
  },
});

function htmlResp(msg: string, ok: boolean) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Google</title></head>
    <body style="font-family:system-ui;background:#321E48;color:#F7F1DE;display:grid;place-items:center;height:100vh;margin:0">
    <div style="padding:2rem;border-radius:1rem;background:rgba(255,255,255,.06);backdrop-filter:blur(20px);max-width:24rem;text-align:center">
    <h1 style="margin:0 0 .5rem">${ok ? "✅ Connecté" : "❌ Erreur"}</h1>
    <p>${msg}</p><a href="/planning" style="color:#4DFFBE">Retour au planning</a></div></body></html>`,
    { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}
