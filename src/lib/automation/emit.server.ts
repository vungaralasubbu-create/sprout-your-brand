/**
 * Automation cross-module event emitter.
 * Any module can call this to broadcast an event. The scheduler tick
 * dispatches workflows whose `trigger.event` matches.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type AutomationEventName =
  | "campaign.created" | "campaign.updated" | "campaign.completed"
  | "marketing.plan.generated"
  | "content.generated" | "content.approved" | "content.published"
  | "image.generated" | "video.generated"
  | "lead.created" | "admission.created"
  | "course.purchased" | "payment.successful"
  | "certificate.generated";

export async function emitAutomationEvent(
  supabase: SupabaseClient,
  userId: string,
  event: { name: AutomationEventName | string; payload?: Record<string, unknown> },
): Promise<void> {
  await supabase.from("automation_events_queue").insert({
    event_name: event.name,
    payload: (event.payload ?? {}) as never,
    source: `user:${userId}`,
  }).select().maybeSingle();
}
