// Mailgun email provider. Activated automatically once these secrets exist:
// MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM (optional), MAILGUN_REGION ("eu" | "us", optional),
// MAILGUN_WEBHOOK_SIGNING_KEY (for inbound emails).

export function mailgunConfigured() {
  return !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
}

function baseUrl() {
  return (process.env.MAILGUN_REGION ?? "").toLowerCase() === "eu"
    ? "https://api.eu.mailgun.net/v3"
    : "https://api.mailgun.net/v3";
}

export async function sendMailgunEmail(opts: { to: string; subject: string; text: string; oppId: string }) {
  const key = process.env.MAILGUN_API_KEY!;
  const domain = process.env.MAILGUN_DOMAIN!;
  const from = process.env.MAILGUN_FROM ?? `Nova CRM <crm@${domain}>`;
  const form = new FormData();
  form.set("from", from);
  form.set("to", opts.to);
  form.set("subject", opts.subject);
  form.set("text", opts.text);
  form.set("v:opportunity_id", opts.oppId);
  const res = await fetch(`${baseUrl()}/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`api:${key}`)}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Envoi email échoué (${res.status}) : ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { id?: string };
  return { id: j.id ?? null };
}

export async function verifyMailgunSignature(timestamp: string, token: string, signature: string) {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey || !timestamp || !token || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 900) return false;
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(signingKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(timestamp + token));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
