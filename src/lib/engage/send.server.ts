/**
 * Universal send pipeline. Called by transactional server functions,
 * campaign sends, and the sequence tick worker. Handles:
 *   - selecting the tenant's default provider (falling back to platform)
 *   - honouring the preference center (skips suppressed / unsubscribed users)
 *   - persisting an engage_messages row for analytics + retries
 *   - idempotency via `idempotency_key`
 */

import { getProvider } from "./providers/registry.server";
import { resolveTemplate, renderTemplate, type RenderContext, type StoredTemplateRow } from "./render.server";
import type { EngageChannel, EngageProviderKind, EngageMessageStatus } from "./types";

export interface SendOptions {
  templateKey: string;
  recipient: string;
  userId?: string | null;
  brandId?: string | null;
  channel?: EngageChannel;
  campaignId?: string | null;
  sequenceEnrollmentId?: string | null;
  variant?: string;
  idempotencyKey?: string;
  category?: string;
  context: RenderContext;
}

export interface SendPipelineResult {
  ok: boolean;
  message_id?: string;
  provider?: string;
  status: EngageMessageStatus;
  error_code?: string;
  error_message?: string;
  skipped_reason?: string;
}

export async function sendViaEngage(opts: SendOptions): Promise<SendPipelineResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const channel: EngageChannel = opts.channel ?? "email";

  // 1) Idempotency check.
  if (opts.idempotencyKey) {
    const { data: existing } = await supabaseAdmin
      .from("engage_messages")
      .select("id, status, provider, provider_message_id, error_code, error_message")
      .eq("idempotency_key", opts.idempotencyKey)
      .maybeSingle();
    if (existing) {
      return {
        ok: existing.status !== "failed",
        message_id: existing.id,
        provider: existing.provider ?? undefined,
        status: (existing.status as EngageMessageStatus) ?? "queued",
        error_code: existing.error_code ?? undefined,
        error_message: existing.error_message ?? undefined,
      };
    }
  }

  // 2) Preference-center check for non-transactional categories.
  if (opts.category && opts.category !== "transactional" && opts.category !== "system") {
    const { data: sub } = await supabaseAdmin
      .from("engage_subscriptions")
      .select("is_subscribed")
      .or(
        opts.userId
          ? `user_id.eq.${opts.userId}`
          : `email.eq.${opts.recipient}`,
      )
      .eq("category", opts.category)
      .eq("channel", channel)
      .maybeSingle();
    if (sub && sub.is_subscribed === false) {
      return {
        ok: false,
        status: "suppressed",
        skipped_reason: "unsubscribed",
      };
    }
  }

  // 3) Resolve template.
  const { data: storedRow } = await supabaseAdmin
    .from("engage_templates")
    .select("template_key, subject, preview_text, body_html, body_text, body_json, channel")
    .eq("template_key", opts.templateKey)
    .eq("channel", channel)
    .eq("is_active", true)
    .order("brand_id", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const template = await resolveTemplate(opts.templateKey, {
    brandId: opts.brandId,
    stored: storedRow as StoredTemplateRow | null,
  });

  if (!template) {
    const insertRes = await supabaseAdmin.from("engage_messages").insert({
      tenant_scope: opts.brandId ? `brand:${opts.brandId}` : "platform",
      brand_id: opts.brandId ?? null,
      user_id: opts.userId ?? null,
      recipient: opts.recipient,
      channel,
      template_key: opts.templateKey,
      campaign_id: opts.campaignId ?? null,
      sequence_enrollment_id: opts.sequenceEnrollmentId ?? null,
      status: "failed",
      variant: opts.variant ?? null,
      idempotency_key: opts.idempotencyKey ?? null,
      error_code: "template_not_found",
      error_message: `No template registered for key "${opts.templateKey}"`,
    }).select("id").maybeSingle();
    return {
      ok: false,
      message_id: insertRes.data?.id,
      status: "failed",
      error_code: "template_not_found",
      error_message: `Template ${opts.templateKey} not found`,
    };
  }

  // 4) Pick provider (brand default → platform default → lovable).
  const { data: providerRow } = await supabaseAdmin
    .from("engage_providers")
    .select("id, kind, config, secret_ref")
    .eq("channel", channel)
    .eq("is_active", true)
    .or(
      opts.brandId
        ? `brand_id.eq.${opts.brandId},tenant_scope.eq.platform`
        : "tenant_scope.eq.platform",
    )
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  const providerKind = (providerRow?.kind as EngageProviderKind) ?? "resend";
  const adapter = getProvider(providerKind);

  // 5) Sender identity.
  const { data: senderRow } = await supabaseAdmin
    .from("engage_senders")
    .select("from_name, from_email, reply_to")
    .or(
      opts.brandId
        ? `brand_id.eq.${opts.brandId},tenant_scope.eq.platform`
        : "tenant_scope.eq.platform",
    )
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 6) Render.
  const rendered = renderTemplate(template, opts.context);
  rendered.from_name = senderRow?.from_name ?? undefined;
  rendered.from_email = senderRow?.from_email ?? undefined;
  rendered.reply_to = senderRow?.reply_to ?? undefined;

  // 7) Persist queued row so the send always has an audit trail.
  const insert = await supabaseAdmin
    .from("engage_messages")
    .insert({
      tenant_scope: opts.brandId ? `brand:${opts.brandId}` : "platform",
      brand_id: opts.brandId ?? null,
      user_id: opts.userId ?? null,
      recipient: opts.recipient,
      channel,
      provider: providerKind,
      template_key: opts.templateKey,
      campaign_id: opts.campaignId ?? null,
      sequence_enrollment_id: opts.sequenceEnrollmentId ?? null,
      subject: rendered.subject ?? null,
      status: "queued",
      variant: opts.variant ?? null,
      idempotency_key: opts.idempotencyKey ?? null,
    })
    .select("id")
    .maybeSingle();

  const messageId = insert.data?.id;

  // 8) Send.
  if (!adapter) {
    await supabaseAdmin.from("engage_messages").update({
      status: "failed",
      error_code: "provider_missing",
      error_message: `No adapter registered for provider "${providerKind}"`,
    }).eq("id", messageId ?? "");
    return {
      ok: false,
      message_id: messageId,
      status: "failed",
      error_code: "provider_missing",
    };
  }

  let secret: string | null = null;
  if (providerRow?.secret_ref) {
    secret = (process.env as Record<string, string | undefined>)[providerRow.secret_ref] ?? null;
  }
  const config = (providerRow?.config as Record<string, unknown>) ?? {};

  const result = await adapter.send(
    { kind: providerKind, config, secret, from_email: rendered.from_email, from_name: rendered.from_name, reply_to: rendered.reply_to },
    rendered,
  );

  await supabaseAdmin
    .from("engage_messages")
    .update({
      status: result.status ?? (result.ok ? "sent" : "failed"),
      provider: providerKind,
      provider_message_id: result.provider_message_id ?? null,
      error_code: result.error_code ?? null,
      error_message: result.error_message ?? null,
      sent_at: result.ok && !result.queued ? new Date().toISOString() : null,
    })
    .eq("id", messageId ?? "");

  return {
    ok: result.ok,
    message_id: messageId,
    provider: providerKind,
    status: (result.status ?? (result.ok ? "sent" : "failed")) as EngageMessageStatus,
    error_code: result.error_code,
    error_message: result.error_message,
  };
}
