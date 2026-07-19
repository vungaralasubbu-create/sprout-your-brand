/**
 * Server function: record a behavior event to automation_events.
 * All event ingestion for signed-in users flows through here.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const eventSchema = z.object({
  event_name: z.string().min(1).max(120),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
  brand_id: z.string().uuid().optional().nullable(),
  session_id: z.string().max(120).optional().nullable(),
  device: z.string().max(120).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  utm: z.record(z.string(), z.unknown()).optional().default({}),
});

export const trackAutomationEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => eventSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("automation_events").insert({
      user_id: context.userId,
      brand_id: data.brand_id ?? null,
      event_name: data.event_name,
      properties: (data.properties ?? {}) as never,
      session_id: data.session_id ?? null,
      device: data.device ?? null,
      location: data.location ?? null,
      utm: (data.utm ?? {}) as never,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const listSchema = z.object({
  limit: z.number().min(1).max(500).optional().default(100),
  event_name: z.string().optional(),
});

export const listMyAutomationEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("automation_events")
      .select("*")
      .eq("user_id", context.userId)
      .order("occurred_at", { ascending: false })
      .limit(data.limit);
    if (data.event_name) q = q.eq("event_name", data.event_name);
    const { data: rows, error } = await q;
    if (error) return { ok: false as const, error: error.message, events: [] };
    return { ok: true as const, events: rows ?? [] };
  });
