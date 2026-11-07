// Server-only Google OAuth + Workspace API helpers.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/contacts.readonly",
].join(" ");

export function getRedirectUri(origin: string) {
  return `${origin}/api/public/crm-google/callback`; // legacy, unused
}

export function buildAuthUrl(origin: string, state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(origin),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(code: string, origin: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    id_token?: string;
  };
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Refresh failed: ${await res.text()}`);
  return (await res.json()) as { access_token: string; expires_in: number };
}

export async function getAccessTokenForUser(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("ocktavus_google_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) throw new Error("Google account not connected");
  const expiresAt = new Date(data.expires_at as string).getTime();
  if (expiresAt - Date.now() > 60_000) return data.access_token as string;
  if (!data.refresh_token) throw new Error("Google token expired; reconnect required");
  const refreshed = await refreshAccessToken(data.refresh_token as string);
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await supabaseAdmin
    .from("ocktavus_google_tokens")
    .update({ access_token: refreshed.access_token, expires_at: newExpiry })
    .eq("user_id", userId);
  return refreshed.access_token;
}

export async function gfetch(userId: string, url: string, init: RequestInit = {}, isJson = true) {
  const token = await getAccessTokenForUser(userId);
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
    Authorization: `Bearer ${token}`,
  };
  if (isJson && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Workspace helpers --------------------------------------------------

export async function createOpportunitySheet(userId: string, opportunityName: string) {
  const sheet = await gfetch(userId, "https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    body: JSON.stringify({
      properties: { title: `CRM — ${opportunityName}` },
      sheets: [
        { properties: { title: "Overview" } },
        { properties: { title: "Activities" } },
        { properties: { title: "Contacts" } },
      ],
    }),
  });
  await gfetch(
    userId,
    `https://sheets.googleapis.com/v4/spreadsheets/${sheet.spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: [
          { range: "Overview!A1:B1", values: [["Field", "Value"]] },
          { range: "Activities!A1:E1", values: [[ "Date", "Type", "Title", "Status", "Notes" ]] },
          { range: "Contacts!A1:D1", values: [["Name", "Email", "Phone", "Role"]] },
        ],
      }),
    },
  );
  return { id: sheet.spreadsheetId as string, url: sheet.spreadsheetUrl as string };
}

export async function createOpportunityDoc(userId: string, opportunityName: string, seed: string) {
  const doc = await gfetch(userId, "https://docs.googleapis.com/v1/documents", {
    method: "POST",
    body: JSON.stringify({ title: `CRM Notes — ${opportunityName}` }),
  });
  await gfetch(userId, `https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [{ insertText: { location: { index: 1 }, text: seed } }],
    }),
  });
  return {
    id: doc.documentId as string,
    url: `https://docs.google.com/document/d/${doc.documentId}/edit`,
  };
}

export async function appendToDoc(userId: string, documentId: string, text: string) {
  const doc = await gfetch(userId, `https://docs.googleapis.com/v1/documents/${documentId}`);
  const endIndex = doc.body?.content?.at(-1)?.endIndex ?? 1;
  await gfetch(userId, `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [{ insertText: { location: { index: Math.max(endIndex - 1, 1) }, text } }],
    }),
  });
}

export async function appendSheetRow(userId: string, spreadsheetId: string, range: string, values: string[]) {
  await gfetch(
    userId,
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    { method: "POST", body: JSON.stringify({ values: [values] }) },
  );
}

export async function sendGmail(userId: string, to: string, subject: string, body: string) {
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\r\n");
  const encoded = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const msg = await gfetch(userId, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    body: JSON.stringify({ raw: encoded }),
  });
  return { id: msg.id as string, threadId: msg.threadId as string, url: `https://mail.google.com/mail/u/0/#sent/${msg.id}` };
}

export async function createCalendarEvent(
  userId: string,
  summary: string,
  description: string,
  startISO: string,
  durationMinutes = 30,
  attendees: string[] = [],
) {
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const ev = await gfetch(userId, "https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: attendees.filter(Boolean).map((email) => ({ email })),
    }),
  });
  return { id: ev.id as string, url: ev.htmlLink as string };
}

export async function createTask(userId: string, title: string, notes: string, dueISO?: string, tasksListId?: string) {
  const body: Record<string, unknown> = { title, notes };
  if (dueISO) body.due = new Date(dueISO).toISOString();
  const list = tasksListId ?? "@default";
  const task = await gfetch(userId, `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(list)}/tasks`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { id: task.id as string, url: "https://tasks.google.com/" };
}

// --- Google Tasks (native CRUD) ---------------------------------------
export async function createTasksList(userId: string, title: string) {
  const r = await gfetch(userId, "https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
    method: "POST", body: JSON.stringify({ title }),
  });
  return { id: r.id as string, title: r.title as string };
}
export async function listTasksInList(userId: string, tasksListId: string) {
  const r = await gfetch(
    userId,
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasksListId)}/tasks?showCompleted=true&showHidden=true&maxResults=100`,
  );
  return (r.items ?? []) as Array<{ id: string; title: string; notes?: string; due?: string; status?: string; updated?: string }>;
}
export async function patchGoogleTask(userId: string, tasksListId: string, taskId: string, patch: Record<string, unknown>) {
  return gfetch(
    userId,
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasksListId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: "PATCH", body: JSON.stringify(patch) },
  );
}
export async function deleteGoogleTask(userId: string, tasksListId: string, taskId: string) {
  const token = await getAccessTokenForUser(userId);
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasksListId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok && res.status !== 404) throw new Error(`Task delete ${res.status}: ${await res.text()}`);
}

// --- Drive folder ------------------------------------------------------
export async function createDriveFolder(userId: string, name: string, parentId?: string) {
  const body: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) body.parents = [parentId];
  const f = await gfetch(userId, "https://www.googleapis.com/drive/v3/files?fields=id,webViewLink", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { id: f.id as string, url: f.webViewLink as string };
}

export async function moveFileToFolder(userId: string, fileId: string, folderId: string) {
  const meta = await gfetch(userId, `https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`);
  const prev = (meta.parents ?? []).join(",");
  await gfetch(
    userId,
    `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=${prev}&fields=id,parents`,
    { method: "PATCH", body: JSON.stringify({}) },
  );
}

export async function listDriveFolderFiles(userId: string, folderId: string) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const list = await gfetch(
    userId,
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,iconLink,thumbnailLink,webViewLink,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=200`,
  );
  return (list.files ?? []) as Array<{
    id: string; name: string; mimeType: string; iconLink?: string;
    thumbnailLink?: string; webViewLink?: string; modifiedTime?: string; size?: string;
  }>;
}

export async function deleteDriveFile(userId: string, fileId: string) {
  const token = await getAccessTokenForUser(userId);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) throw new Error(`Delete failed ${res.status}: ${await res.text()}`);
}

export async function uploadFileToFolder(
  userId: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  base64: string,
) {
  const token = await getAccessTokenForUser(userId);
  const boundary = "-------lovable" + Math.random().toString(36).slice(2);
  const metadata = { name: fileName, parents: [folderId], mimeType };
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const enc = new TextEncoder();
  const pre = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`,
  );
  // send base64 as body to avoid huge memory for binary; simpler: send binary directly
  const bodyParts = [
    enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    binary,
    enc.encode(`\r\n--${boundary}--`),
  ];
  const total = bodyParts.reduce((n, p) => n + p.byteLength, 0);
  const body = new Uint8Array(total);
  let off = 0;
  for (const p of bodyParts) { body.set(p, off); off += p.byteLength; }
  void pre;
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink,modifiedTime,size",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!res.ok) throw new Error(`Upload failed ${res.status}: ${await res.text()}`);
  return res.json();
}

// --- Gmail read --------------------------------------------------------
function decodeBase64Url(str: string) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  try { return decodeURIComponent(escape(atob(s + pad))); } catch { return ""; }
}

function extractBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  const parts: any[] = payload.parts ?? [];
  const text = parts.find((p) => p.mimeType === "text/plain" && p.body?.data);
  if (text) return decodeBase64Url(text.body.data);
  const html = parts.find((p) => p.mimeType === "text/html" && p.body?.data);
  if (html) return decodeBase64Url(html.body.data).replace(/<[^>]+>/g, " ");
  for (const p of parts) {
    const nested = extractBody(p);
    if (nested) return nested;
  }
  return "";
}

export async function fetchGmailMessage(userId: string, messageId: string) {
  const m = await gfetch(
    userId,
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
  );
  const headers: Array<{ name: string; value: string }> = m.payload?.headers ?? [];
  const h = (k: string) => headers.find((x) => x.name.toLowerCase() === k.toLowerCase())?.value ?? "";
  return {
    id: m.id as string,
    threadId: m.threadId as string,
    snippet: m.snippet as string,
    from: h("From"),
    to: h("To"),
    subject: h("Subject"),
    date: h("Date"),
    labelIds: (m.labelIds ?? []) as string[],
    body: extractBody(m.payload),
    url: `https://mail.google.com/mail/u/0/#inbox/${m.threadId}`,
  };
}

export async function listGmailWithContact(userId: string, email: string, max = 20) {
  const q = encodeURIComponent(`from:${email} OR to:${email}`);
  let ids: string[] = [];
  let pageToken: string | undefined;
  while (ids.length < max) {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${Math.min(50, max - ids.length)}&q=${q}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const list = await gfetch(userId, url);
    ids.push(...((list.messages ?? []).map((m: any) => m.id as string)));
    pageToken = list.nextPageToken;
    if (!pageToken) break;
  }
  const details = await Promise.all(
    ids.slice(0, max).map((id) => fetchGmailMessage(userId, id).catch(() => null)),
  );
  return details.filter(Boolean) as Awaited<ReturnType<typeof fetchGmailMessage>>[];
}

// Sync inbound emails from contact into email_threads
export async function syncOpportunityInbound(userId: string, opportunityId: string, contactEmail: string) {
  if (!contactEmail) return { imported: 0, newInbound: 0 };
  const messages = await listGmailWithContact(userId, contactEmail, 25);
  let imported = 0;
  let newInbound = 0;
  for (const m of messages) {
    const isSent = m.labelIds.includes("SENT");
    const fromMatches = m.from.toLowerCase().includes(contactEmail.toLowerCase());
    if (!fromMatches && !isSent) continue;
    const direction = fromMatches ? "inbound" : "outbound";
    const receivedAt = m.date ? new Date(m.date).toISOString() : new Date().toISOString();
    // Was this already stored?
    const { data: existed } = await supabaseAdmin
      .from("sendy_email_threads" as any)
      .select("id")
      .eq("user_id", userId)
      .eq("gmail_message_id", m.id)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("sendy_email_threads" as any).upsert(
      {
        user_id: userId,
        opportunity_id: opportunityId,
        gmail_message_id: m.id,
        gmail_thread_id: m.threadId,
        direction,
        from_email: m.from,
        to_email: m.to,
        subject: m.subject,
        snippet: m.snippet,
        body: m.body?.slice(0, 20000) ?? "",
        received_at: receivedAt,
      },
      { onConflict: "user_id,gmail_message_id" },
    );
    if (!error) {
      imported++;
      if (!existed && direction === "inbound") {
        newInbound++;
        await supabaseAdmin.from("crm_notifications" as any).insert({
          user_id: userId,
          opportunity_id: opportunityId,
          type: "email_inbound",
          title: `Nouvelle réponse : ${m.subject || "(sans sujet)"}`,
          body: (m.snippet || "").slice(0, 200),
          href: `/crm/opportunities/${opportunityId}`,
        });
      }
    }
  }
  return { imported, newInbound, total: messages.length };
}


// --- Calendar list -----------------------------------------------------
export async function listUpcomingEvents(userId: string, max = 10) {
  const timeMin = new Date().toISOString();
  const list = await gfetch(
    userId,
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${max}&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}`,
  );
  return (list.items ?? []).map((e: any) => ({
    id: e.id,
    summary: e.summary,
    start: e.start?.dateTime ?? e.start?.date,
    end: e.end?.dateTime ?? e.end?.date,
    url: e.htmlLink,
    attendees: (e.attendees ?? []).map((a: any) => a.email),
  }));
}
