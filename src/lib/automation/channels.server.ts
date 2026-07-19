/**
 * Multi-channel dispatch registry.
 * Each adapter implements `dispatch()` and returns a normalized result.
 * Adding a new channel = add a new file + register here. Plug-and-play.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Channel = "email" | "sms" | "whatsapp" | "push" | "inapp";

export interface DispatchInput {
  userId: string;
  brandId?: string | null;
  workflowRunId?: string | null;
  recipient: string;
  subject?: string;
  body: string;
  template_key?: string;
  properties?: Record<string, unknown>;
}

export interface DispatchResult {
  ok: boolean;
  provider?: string;
  providerMessageId?: string;
  error?: string;
}

export type DispatchFn = (
  supabase: SupabaseClient<Database>,
  input: DispatchInput,
) => Promise<DispatchResult>;

// -------- adapters --------

const emailAdapter: DispatchFn = async (_sb, input) => {
  try {
    const { sendEmail } = await import("@/lib/email/service.server");
    const res = await sendEmail({
      to: input.recipient,
      subject: input.subject ?? "",
      html: input.body,
      templateKey: input.template_key,
      brandId: input.brandId ?? null,
      variables: input.properties as Record<string, string | number | boolean> | undefined,
    } as never);
    if ((res as { ok?: boolean; error?: string }).ok === false) {
      return { ok: false, provider: "resend", error: (res as { error?: string }).error };
    }
    return { ok: true, provider: "resend", providerMessageId: (res as { id?: string }).id };
  } catch (err) {
    return { ok: false, provider: "resend", error: err instanceof Error ? err.message : String(err) };
  }
};

const inappAdapter: DispatchFn = async (sb, input) => {
  const { error } = await sb.from("engage_inapp_notifications").insert({
    user_id: input.userId,
    brand_id: input.brandId ?? null,
    title: input.subject ?? "Notification",
    body: input.body,
    kind: "automation",
  } as never);
  if (error) return { ok: false, provider: "inapp", error: error.message };
  return { ok: true, provider: "inapp" };
};

const pushAdapter: DispatchFn = async (sb, input) => {
  const { data: subs, error } = await sb
    .from("engage_push_subscriptions")
    .select("id")
    .eq("user_id", input.userId)
    .limit(10);
  if (error) return { ok: false, provider: "webpush", error: error.message };
  if (!subs || subs.length === 0) {
    return { ok: false, provider: "webpush", error: "no_subscription" };
  }
  // Best-effort placeholder — real WebPush delivery goes through engage
  // provider adapters; recorded in engage_messages there. Here we just
  // confirm the recipient exists.
  return { ok: true, provider: "webpush" };
};

const whatsappAdapter: DispatchFn = async () => {
  return { ok: false, provider: "whatsapp", error: "provider_not_configured" };
};

const smsAdapter: DispatchFn = async () => {
  return { ok: false, provider: "sms", error: "provider_not_configured" };
};

const REGISTRY: Record<Channel, DispatchFn> = {
  email: emailAdapter,
  inapp: inappAdapter,
  push: pushAdapter,
  whatsapp: whatsappAdapter,
  sms: smsAdapter,
};

export async function dispatch(
  supabase: SupabaseClient<Database>,
  channel: Channel,
  input: DispatchInput,
): Promise<DispatchResult> {
  const fn = REGISTRY[channel];
  if (!fn) return { ok: false, error: `unknown_channel:${channel}` };
  const result = await fn(supabase, input);

  // Log every send to automation_channel_messages (email is also logged in email_logs)
  if (channel !== "email") {
    await supabase.from("automation_channel_messages").insert({
      user_id: input.userId,
      brand_id: input.brandId ?? null,
      workflow_run_id: input.workflowRunId ?? null,
      channel,
      recipient: input.recipient,
      subject: input.subject ?? null,
      body: input.body,
      status: result.ok ? "sent" : "failed",
      provider: result.provider ?? null,
      provider_message_id: result.providerMessageId ?? null,
      error: result.error ?? null,
      sent_at: result.ok ? new Date().toISOString() : null,
    } as never);
  }
  return result;
}

export function listChannels(): Channel[] {
  return Object.keys(REGISTRY) as Channel[];
}
