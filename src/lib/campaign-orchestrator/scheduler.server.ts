// Schedule builder + publish dispatcher.
// Delegates actual publishing to social-automation adapters (LinkedIn/IG/FB/
// Telegram/WhatsApp/X/Threads/YouTube Community) and to the Engage email
// provider for email sends. Retry ladder: 1m → 5m → 30m → 3h → 24h.

import type { CampaignPlan, TaskKind } from "./types";

const RETRY_LADDER_MINUTES = [1, 5, 30, 180, 1440];

export interface ScheduleSlot {
  channel: string;
  taskKind: TaskKind;
  scheduledAt: string;   // ISO
  brief: string;
}

/** Build a concrete schedule from a plan. Avoids duplicate (channel, time). */
export function buildSchedule(plan: CampaignPlan, startAt: Date, endAt: Date): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const seen = new Set<string>();

  for (const entry of plan.contentCalendar ?? []) {
    const day = new Date(entry.date);
    if (Number.isNaN(day.getTime())) continue;
    if (day < startAt || day > endAt) continue;

    const channel = String(entry.channel || "web").toLowerCase();
    const times = plan.postingSchedule.find(s => s.channel.toLowerCase() === channel)?.times ?? ["10:00"];
    const time = times[slots.length % times.length];
    const [h, m] = time.split(":").map(n => parseInt(n, 10));
    const at = new Date(day);
    at.setHours(Number.isFinite(h) ? h : 10, Number.isFinite(m) ? m : 0, 0, 0);

    const key = `${channel}:${at.toISOString()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    slots.push({
      channel,
      taskKind: entry.taskKind as TaskKind,
      scheduledAt: at.toISOString(),
      brief: entry.brief,
    });
  }
  return slots.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

/** Compute the next retry timestamp after an attempt. */
export function nextRetryAt(attempts: number): Date {
  const mins = RETRY_LADDER_MINUTES[Math.min(attempts, RETRY_LADDER_MINUTES.length - 1)];
  return new Date(Date.now() + mins * 60_000);
}

/** Publish a single schedule row via the appropriate adapter. Returns
 *  a status descriptor; callers persist it. */
export async function publishScheduleEntry(entry: {
  id: string;
  channel: string;
  content: Record<string, unknown>;
}): Promise<{ ok: boolean; externalId?: string; externalUrl?: string; error?: string }> {
  const ch = entry.channel.toLowerCase();
  try {
    // Social channels routed through social-automation adapters.
    if (["linkedin","instagram","facebook","x","threads","telegram","whatsapp","youtube","youtube_community","pinterest"].includes(ch)) {
      const mod = await import("@/lib/social-automation/adapters.server");
      const adapters = mod as Record<string, unknown>;
      const key = ch === "youtube_community" ? "youtube" : ch;
      const adapter = (adapters[`${key}Adapter`] ?? adapters.default) as
        | { publish: (payload: Record<string, unknown>) => Promise<{ ok: boolean; externalId?: string; externalUrl?: string; error?: string }> }
        | undefined;
      if (!adapter?.publish) return { ok: false, error: `no_adapter:${ch}` };
      return await adapter.publish(entry.content);
    }
    // Email → Engage.
    if (ch === "email" || ch === "newsletter") {
      const { sendViaEngage } = await import("@/lib/engage/send.server");
      const result = await sendViaEngage({
        toEmail: String(entry.content.toEmail ?? ""),
        subject: String(entry.content.subject ?? ""),
        html: String(entry.content.html ?? ""),
        category: String(entry.content.category ?? "campaign"),
      } as Parameters<typeof sendViaEngage>[0]);
      return { ok: !!result?.sent, externalId: (result as { messageId?: string }).messageId, error: (result as { reason?: string }).reason };
    }
    // Web/blog/landing → served directly by app routes; nothing to push.
    if (ch === "web" || ch === "blog" || ch === "landing_page") {
      return { ok: true, externalUrl: String(entry.content.url ?? "") };
    }
    return { ok: false, error: `unsupported_channel:${ch}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
