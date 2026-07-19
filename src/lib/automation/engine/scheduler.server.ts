/**
 * Trigger scheduler — evaluates cron/one-shot/event triggers and enqueues jobs.
 * Uses a minimal 5-field cron matcher (min hour dom mon dow) with '*' and '*\/n' + ranges.
 */
import { enqueue } from "./queue.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Very small cron matcher — supports '*', 'a,b', 'a-b', '*\/n' per field. */
export function cronMatches(expr: string, now: Date): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const fields = [now.getUTCMinutes(), now.getUTCHours(), now.getUTCDate(), now.getUTCMonth() + 1, now.getUTCDay()];
  const bounds: Array<[number, number]> = [
    [0, 59],
    [0, 23],
    [1, 31],
    [1, 12],
    [0, 6],
  ];
  for (let i = 0; i < 5; i++) {
    if (!matchField(parts[i], fields[i], bounds[i][0], bounds[i][1])) return false;
  }
  return true;
}

function matchField(expr: string, value: number, min: number, max: number): boolean {
  if (expr === "*") return true;
  return expr.split(",").some((tok) => {
    const [rng, stepStr] = tok.split("/");
    const step = stepStr ? parseInt(stepStr, 10) : 1;
    let lo = min, hi = max;
    if (rng !== "*") {
      if (rng.includes("-")) {
        const [a, b] = rng.split("-").map((x) => parseInt(x, 10));
        lo = a; hi = b;
      } else {
        const n = parseInt(rng, 10);
        lo = n; hi = n;
      }
    }
    if (value < lo || value > hi) return false;
    return (value - lo) % step === 0;
  });
}

/** Dispatch every cron/one-shot trigger whose due time has arrived. */
export async function dispatchDueTriggers(limit = 200): Promise<number> {
  const sb = await admin();
  const now = new Date();

  const { data: triggers } = await sb
    .from("automation_triggers")
    .select("*")
    .eq("is_enabled", true)
    .in("kind", ["cron", "once"])
    .lte("next_run_at", now.toISOString())
    .order("next_run_at", { ascending: true })
    .limit(limit);

  let fired = 0;
  for (const t of triggers ?? []) {
    try {
      // For cron: also check the pattern matches the current minute (tick-safety).
      if (t.kind === "cron" && t.cron_expression && !cronMatches(t.cron_expression, now)) {
        // Just move the pointer forward.
        await sb
          .from("automation_triggers")
          .update({ next_run_at: new Date(now.getTime() + 60_000).toISOString() })
          .eq("id", t.id);
        continue;
      }
      await enqueue({
        handler: t.handler,
        payload: (t.payload_template as any) ?? {},
        ownerId: t.owner_id,
        priority: t.priority,
        idempotencyKey: `trigger:${t.id}:${now.toISOString().slice(0, 16)}`,
        correlationId: `trigger:${t.id}`,
      });
      fired++;
      // For one-shot triggers, disable after fire; for cron, advance next_run_at by 60s.
      if (t.kind === "once") {
        await sb.from("automation_triggers")
          .update({ is_enabled: false, last_run_at: now.toISOString(), last_status: "fired" })
          .eq("id", t.id);
      } else {
        await sb.from("automation_triggers")
          .update({ last_run_at: now.toISOString(), last_status: "fired", next_run_at: new Date(now.getTime() + 60_000).toISOString() })
          .eq("id", t.id);
      }
    } catch (err) {
      await sb.from("automation_triggers")
        .update({ last_status: `error:${String(err).slice(0, 200)}`, last_run_at: now.toISOString() })
        .eq("id", t.id);
    }
  }
  return fired;
}

/** Process event queue → match event triggers → enqueue jobs. */
export async function drainEventQueue(limit = 100): Promise<number> {
  const sb = await admin();
  const { data: events } = await sb
    .from("automation_events_queue")
    .select("*")
    .is("processed_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (!events?.length) return 0;

  let total = 0;
  for (const ev of events) {
    const { data: triggers } = await sb
      .from("automation_triggers")
      .select("*")
      .eq("is_enabled", true)
      .eq("kind", "event")
      .eq("event_name", ev.event_name);

    let created = 0;
    for (const t of triggers ?? []) {
      try {
        await enqueue({
          handler: t.handler,
          payload: { ...((t.payload_template as any) ?? {}), event: ev.payload, event_name: ev.event_name },
          ownerId: t.owner_id,
          priority: t.priority,
          correlationId: `event:${ev.id}`,
        });
        created++;
      } catch { /* keep processing others */ }
    }
    await sb
      .from("automation_events_queue")
      .update({ processed_at: new Date().toISOString(), jobs_created: created })
      .eq("id", ev.id);
    total += created;
  }
  return total;
}

/** Emit an event onto the queue (called from server functions/webhooks). */
export async function emitEvent(name: string, payload: Record<string, unknown>, source?: string): Promise<string> {
  const sb = await admin();
  const { data } = await sb
    .from("automation_events_queue")
    .insert({ event_name: name, payload: payload as any, source: source ?? null })
    .select("id")
    .maybeSingle();
  return data!.id;
}
