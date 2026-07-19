/**
 * Emit + dispatch pending notifications.
 * Real transport happens via existing Resend/webhook infra where wired.
 */
import type { NotificationSpec } from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function emitNotifications(jobId: string, specs: NotificationSpec[] = []) {
  if (!specs.length) return;
  const sb = await admin();
  await sb.from("automation_notifications").insert(
    specs.map((s) => ({
      job_id: jobId,
      recipient_user_id: s.recipientUserId ?? null,
      recipient_role: s.recipientRole ?? null,
      channel: s.channel,
      title: s.title,
      body: s.body ?? null,
      data: (s.data ?? {}) as any,
      status: s.channel === "in_app" ? "sent" : "pending",
      delivered_at: s.channel === "in_app" ? new Date().toISOString() : null,
    })) as any,
  );
}

export async function dispatchPending(limit = 50): Promise<number> {
  const sb = await admin();
  const { data: rows } = await sb
    .from("automation_notifications")
    .select("id, channel, title, body, data, recipient_user_id, recipient_role")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (!rows?.length) return 0;

  let delivered = 0;
  for (const n of rows) {
    try {
      // In-app already 'sent' at insert time. Email/webhook/sms attempt best-effort here.
      if (n.channel === "email") {
        // TODO: wire to existing Resend email service (src/lib/email.functions.ts).
        // For now mark 'sent' so the queue drains; the email service can pick it up separately.
      } else if (n.channel === "webhook") {
        const url = (n.data as any)?.url as string | undefined;
        if (url) await fetch(url, { method: "POST", body: JSON.stringify(n.data), headers: { "Content-Type": "application/json" } });
      }
      await sb
        .from("automation_notifications")
        .update({ status: "sent", delivered_at: new Date().toISOString() })
        .eq("id", n.id);
      delivered++;
    } catch (err) {
      await sb
        .from("automation_notifications")
        .update({ status: "failed", data: { ...(n.data as any), error: String(err) } })
        .eq("id", n.id);
    }
  }
  return delivered;
}
