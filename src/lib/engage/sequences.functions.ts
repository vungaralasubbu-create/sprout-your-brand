/**
 * Sequence CRUD + enrollment + tick worker entry point.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { TRIGGER_EVENTS } from "./constants";

const stepSchema = z.object({
  delay_hours: z.number().min(0).max(24 * 365),
  template_key: z.string().min(1),
  channel: z.enum(["email", "push", "inapp"]).default("email"),
  condition: z.record(z.unknown()).optional(),
  variant: z.string().optional(),
});

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  brand_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  trigger_event: z.string().min(1),
  audience: z.string().default("students"),
  steps: z.array(stepSchema).min(1),
  is_active: z.boolean().optional().default(true),
});

export const listEngageSequences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ brand_id: z.string().uuid().optional().nullable() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("engage_sequences")
      .select("*")
      .order("is_system", { ascending: false })
      .order("name", { ascending: true });
    if (data.brand_id) query = query.or(`brand_id.eq.${data.brand_id},tenant_scope.eq.platform`);
    else query = query.eq("tenant_scope", "platform");
    const { data: rows, error } = await query;
    if (error) return { ok: false as const, error: error.message, sequences: [], triggers: TRIGGER_EVENTS };
    return { ok: true as const, sequences: rows ?? [], triggers: TRIGGER_EVENTS };
  });

export const upsertEngageSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const tenant_scope = data.brand_id ? `brand:${data.brand_id}` : "platform";
    if (data.id) {
      const { error } = await context.supabase
        .from("engage_sequences")
        .update({
          name: data.name,
          description: data.description ?? null,
          trigger_event: data.trigger_event,
          audience: data.audience,
          steps: data.steps as never,
          is_active: data.is_active ?? true,
        })
        .eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("engage_sequences")
      .insert({
        tenant_scope,
        brand_id: data.brand_id ?? null,
        name: data.name,
        description: data.description ?? null,
        trigger_event: data.trigger_event,
        audience: data.audience,
        steps: data.steps as never,
        is_active: data.is_active ?? true,
        created_by: context.userId,
      })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: row?.id };
  });

export const deleteEngageSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("engage_sequences").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Emit an event onto the engage_events bus. Used by triggers everywhere in the app. */
export const emitEngageEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      event: z.string().min(1),
      user_id: z.string().uuid().optional().nullable(),
      brand_id: z.string().uuid().optional().nullable(),
      payload: z.record(z.unknown()).optional().default({}),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("engage_events").insert({
      tenant_scope: data.brand_id ? `brand:${data.brand_id}` : "platform",
      brand_id: data.brand_id ?? null,
      user_id: data.user_id ?? context.userId,
      event: data.event,
      payload: data.payload as never,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
