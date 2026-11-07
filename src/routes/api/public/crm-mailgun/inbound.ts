import { createFileRoute } from "@tanstack/react-router";
import { verifyMailgunSignature } from "@/crm/lib/mailgun.server";

// Mailgun inbound route target. Configure in Mailgun: forward("https://<app>/api/public/crm-mailgun/inbound")
export const Route = createFileRoute("/api/public/crm-mailgun/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const ok = await verifyMailgunSignature(
          String(form.get("timestamp") ?? ""),
          String(form.get("token") ?? ""),
          String(form.get("signature") ?? ""),
        );
        if (!ok) return new Response("invalid signature", { status: 401 });

        const sender = String(form.get("sender") ?? form.get("from") ?? "").toLowerCase();
        const match = sender.match(/[\w.+-]+@[\w.-]+/);
        if (!match) return new Response("ok");
        const email = match[0];

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: opps } = await supabaseAdmin
          .from("crm_opportunities").select("id,user_id,name").ilike("contact_email", email);
        const subject = String(form.get("subject") ?? "");
        const body = String(form.get("stripped-text") ?? form.get("body-plain") ?? "");
        const messageId = String(form.get("Message-Id") ?? "");
        for (const o of opps ?? []) {
          await (supabaseAdmin as any).from("sendy_email_threads").insert({
            user_id: o.user_id, opportunity_id: o.id, direction: "inbound",
            from_email: email, to_email: String(form.get("recipient") ?? ""),
            subject, snippet: body.slice(0, 200), body,
            received_at: new Date().toISOString(), status: "received",
            provider: "mailgun", provider_message_id: messageId || null,
          });
          await (supabaseAdmin as any).from("crm_notifications").insert({
            user_id: o.user_id, opportunity_id: o.id, type: "email_inbound",
            title: `Nouvel email de ${email}`, body: subject, href: `/crm/opportunities/${o.id}`,
          });
        }
        return new Response("ok");
      },
    },
  },
});
