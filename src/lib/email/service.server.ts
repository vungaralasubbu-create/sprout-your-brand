/**
 * Glintr Centralized Email Service — Resend-only.
 *
 * All transactional and marketing emails across the platform MUST go through
 * `sendEmail()` here. Never call SMTP, Gmail, or other providers directly.
 *
 * Reads configuration from environment variables:
 *   EMAIL_PROVIDER   (must be "resend"; other values are rejected)
 *   RESEND_API_KEY   (required — used as Bearer token)
 *   FROM_EMAIL       (sender address)
 *   FROM_NAME        (sender display name)
 *   SUPPORT_EMAIL    (used for Reply-To)
 *   REPLY_TO         (optional override; falls back to SUPPORT_EMAIL)
 *
 * Features:
 *   - HTML + plain text bodies
 *   - CC / BCC recipients
 *   - Attachments (filename + base64 content)
 *   - Scheduled sends (Resend `scheduled_at` OR local queue + tick worker)
 *   - Templates (server-side `{{token}}` interpolation)
 *   - Automatic retries with exponential backoff (via email_logs.next_attempt_at)
 *   - Every send is logged to public.email_logs
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveEmailBrand, resolvePartnerLogos, wrapWithBrandedShell } from "./branding.server";

// ---------- Types ----------

export interface EmailAttachment {
  /** Displayed filename in the recipient's mail client. */
  filename: string;
  /** Base64-encoded content, OR a public URL Resend can fetch. */
  content?: string;
  path?: string;
  content_type?: string;
}

export interface EmailTemplate {
  /** Stable key stored in email_logs.template_key. */
  key: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface SendEmailInput {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
  /** ISO-8601 timestamp; if in the future, the email is queued and sent later. */
  scheduledFor?: string;
  template?: EmailTemplate;
  variables?: Record<string, unknown>;
  idempotencyKey?: string;
  category?: string;
  brandId?: string | null;
  userId?: string | null;
  maxAttempts?: number;
  /** Wrap the HTML in the branded header/footer shell (default: true). */
  applyBranding?: boolean;
  /** Preview text shown in inbox previews. */
  previewText?: string;
}

export interface SendEmailResult {
  ok: boolean;
  logId?: string;
  providerMessageId?: string;
  status: "sent" | "scheduled" | "queued" | "retry" | "failed";
  errorCode?: string;
  errorMessage?: string;
}

// ---------- Config ----------

function readConfig() {
  const provider = (process.env.EMAIL_PROVIDER ?? "resend").toLowerCase();
  if (provider !== "resend") {
    throw new Error(
      `EMAIL_PROVIDER=${provider} is not supported. Glintr only uses Resend.`,
    );
  }
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const fromName = process.env.FROM_NAME ?? "Glintr";
  const supportEmail = process.env.SUPPORT_EMAIL;
  const replyTo = process.env.REPLY_TO ?? supportEmail;
  return { provider, apiKey, fromEmail, fromName, supportEmail, replyTo };
}

// ---------- Template interpolation ----------

function interpolate(source: string, vars: Record<string, unknown>): string {
  return source.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const value = key.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
      return undefined;
    }, vars);
    return value == null ? "" : String(value);
  });
}

// ---------- Public API ----------

const toArray = (v: string | string[] | undefined): string[] | undefined =>
  v == null ? undefined : Array.isArray(v) ? v : [v];

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const cfg = readConfig();

  if (!cfg.apiKey) {
    return { ok: false, status: "failed", errorCode: "missing_api_key", errorMessage: "RESEND_API_KEY is not configured" };
  }
  if (!cfg.fromEmail) {
    return { ok: false, status: "failed", errorCode: "missing_from", errorMessage: "FROM_EMAIL is not configured" };
  }

  const vars = input.variables ?? {};
  const subject = interpolate(
    input.subject ?? input.template?.subject ?? "",
    vars,
  );
  const html = interpolate(input.html ?? input.template?.html ?? "", vars);
  const text = interpolate(input.text ?? input.template?.text ?? "", vars);

  const to = toArray(input.to) ?? [];
  const cc = toArray(input.cc);
  const bcc = toArray(input.bcc);
  const fromEmail = input.from ?? cfg.fromEmail;
  const fromName = input.fromName ?? cfg.fromName;
  const replyTo = input.replyTo ?? cfg.replyTo ?? cfg.supportEmail;

  // Idempotency: reuse existing log row if the key was already accepted.
  if (input.idempotencyKey) {
    const { data: existing } = await supabaseAdmin
      .from("email_logs")
      .select("id, status, provider_message_id, error_code, error_message")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing) {
      const status = existing.status as SendEmailResult["status"];
      return {
        ok: status !== "failed",
        logId: existing.id as string,
        providerMessageId: existing.provider_message_id ?? undefined,
        status,
        errorCode: existing.error_code ?? undefined,
        errorMessage: existing.error_message ?? undefined,
      };
    }
  }

  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : null;
  const isFutureScheduled = scheduledFor != null && scheduledFor.getTime() > Date.now() + 60_000;

  // Persist log row up front so every attempt is traceable.
  const { data: log, error: logErr } = await supabaseAdmin
    .from("email_logs")
    .insert({
      to_email: to[0] ?? "",
      cc: cc ?? null,
      bcc: bcc ?? null,
      from_email: fromEmail,
      from_name: fromName,
      reply_to: replyTo ?? null,
      subject,
      html: html || null,
      text: text || null,
      template_key: input.template?.key ?? null,
      variables: (input.variables ?? null) as never,
      attachments: (input.attachments ?? null) as never,
      tags: (input.tags ?? null) as never,
      headers: (input.headers ?? null) as never,
      status: isFutureScheduled ? "scheduled" : "queued",
      provider: "resend",
      max_attempts: input.maxAttempts ?? 5,
      scheduled_for: scheduledFor?.toISOString() ?? null,
      next_attempt_at: isFutureScheduled ? scheduledFor?.toISOString() : null,
      idempotency_key: input.idempotencyKey ?? null,
      brand_id: input.brandId ?? null,
      user_id: input.userId ?? null,
      category: input.category ?? "transactional",
    })
    .select("id")
    .maybeSingle();

  if (logErr) {
    return { ok: false, status: "failed", errorCode: "log_insert_failed", errorMessage: logErr.message };
  }

  const logId = log?.id as string | undefined;

  if (isFutureScheduled) {
    return { ok: true, logId, status: "scheduled" };
  }

  return await attemptSend(logId!, {
    to,
    cc,
    bcc,
    fromEmail,
    fromName,
    replyTo,
    subject,
    html,
    text,
    attachments: input.attachments,
    tags: input.tags,
    headers: input.headers,
    scheduledAt: scheduledFor?.toISOString(),
  }, cfg.apiKey);
}

interface AttemptPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
  scheduledAt?: string;
}

async function attemptSend(logId: string, p: AttemptPayload, apiKey: string): Promise<SendEmailResult> {
  const body: Record<string, unknown> = {
    from: p.fromName ? `${p.fromName} <${p.fromEmail}>` : p.fromEmail,
    to: p.to,
    subject: p.subject,
  };
  if (p.html) body.html = p.html;
  if (p.text) body.text = p.text;
  if (p.cc?.length) body.cc = p.cc;
  if (p.bcc?.length) body.bcc = p.bcc;
  if (p.replyTo) body.reply_to = p.replyTo;
  if (p.headers) body.headers = p.headers;
  if (p.tags?.length) body.tags = p.tags;
  if (p.scheduledAt) body.scheduled_at = p.scheduledAt;
  if (p.attachments?.length) {
    body.attachments = p.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      path: a.path,
      content_type: a.content_type,
    }));
  }

  let providerMessageId: string | undefined;
  let ok = false;
  let errorCode: string | undefined;
  let errorMessage: string | undefined;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      errorCode = `http_${res.status}`;
      errorMessage = txt.slice(0, 800);
    } else {
      const json = (await res.json().catch(() => ({}))) as { id?: string };
      providerMessageId = json.id;
      ok = true;
    }
  } catch (err) {
    errorCode = "network_error";
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  // Update log row.
  const { data: current } = await supabaseAdmin
    .from("email_logs")
    .select("attempts, max_attempts")
    .eq("id", logId)
    .maybeSingle();
  const attempts = ((current?.attempts as number | undefined) ?? 0) + 1;
  const maxAttempts = (current?.max_attempts as number | undefined) ?? 5;

  let status: SendEmailResult["status"];
  let nextAttemptAt: string | null = null;
  if (ok) {
    status = "sent";
  } else if (attempts < maxAttempts) {
    status = "retry";
    // Exponential backoff: 1, 4, 9, 16, 25 min.
    const delayMin = attempts * attempts;
    nextAttemptAt = new Date(Date.now() + delayMin * 60_000).toISOString();
  } else {
    status = "failed";
  }

  await supabaseAdmin
    .from("email_logs")
    .update({
      status,
      attempts,
      provider_message_id: providerMessageId ?? null,
      error_code: errorCode ?? null,
      error_message: errorMessage ?? null,
      next_attempt_at: nextAttemptAt,
      sent_at: ok ? new Date().toISOString() : null,
    })
    .eq("id", logId);

  return {
    ok,
    logId,
    providerMessageId,
    status,
    errorCode,
    errorMessage,
  };
}

/**
 * Called by the cron tick worker. Picks up scheduled + retry rows that are
 * due and attempts to send each one. Returns a summary for observability.
 */
export async function processEmailQueue(limit = 25): Promise<{ processed: number; sent: number; failed: number; retried: number }> {
  const cfg = readConfig();
  if (!cfg.apiKey) return { processed: 0, sent: 0, failed: 0, retried: 0 };

  const nowIso = new Date().toISOString();
  const { data: rows } = await supabaseAdmin
    .from("email_logs")
    .select("*")
    .in("status", ["scheduled", "retry"])
    .lte("next_attempt_at", nowIso)
    .order("next_attempt_at", { ascending: true })
    .limit(limit);

  let sent = 0, failed = 0, retried = 0;
  for (const row of rows ?? []) {
    const r = row as Record<string, unknown>;
    const result = await attemptSend(r.id as string, {
      to: [r.to_email as string],
      cc: (r.cc as string[] | null) ?? undefined,
      bcc: (r.bcc as string[] | null) ?? undefined,
      fromEmail: r.from_email as string,
      fromName: (r.from_name as string | null) ?? undefined,
      replyTo: (r.reply_to as string | null) ?? undefined,
      subject: r.subject as string,
      html: (r.html as string | null) ?? "",
      text: (r.text as string | null) ?? "",
      attachments: (r.attachments as EmailAttachment[] | null) ?? undefined,
      tags: (r.tags as Array<{ name: string; value: string }> | null) ?? undefined,
      headers: (r.headers as Record<string, string> | null) ?? undefined,
    }, cfg.apiKey);
    if (result.status === "sent") sent++;
    else if (result.status === "retry") retried++;
    else if (result.status === "failed") failed++;
  }
  return { processed: rows?.length ?? 0, sent, failed, retried };
}
