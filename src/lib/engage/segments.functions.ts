/**
 * Segment CRUD + preview.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  brand_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  audience: z.enum(["all", "students", "partners", "brand_owners", "instructors", "admins", "leads"]).default("students"),
  rules: z.record(z.unknown()).default({ all: [] }),
  is_active: z.boolean().optional().default(true),
});

export const listEngageSegments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ brand_id: z.string().uuid().optional().nullable() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("engage_segments")
      .select("*")
      .order("created_at", { ascending: false });
    if (data.brand_id) query = query.eq("brand_id", data.brand_id);
    else query = query.eq("tenant_scope", "platform");
    const { data: rows, error } = await query;
    if (error) return { ok: false as const, error: error.message, segments: [] };
    return { ok: true as const, segments: rows ?? [] };
  });

export const upsertEngageSegment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const tenant_scope = data.brand_id ? `brand:${data.brand_id}` : "platform";
    const payload = {
      tenant_scope,
      brand_id: data.brand_id ?? null,
      name: data.name,
      description: data.description ?? null,
      audience: data.audience,
      rules: data.rules as never,
      is_active: data.is_active ?? true,
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase.from("engage_segments").update(payload).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("engage_segments")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: row?.id };
  });

export const previewEngageSegment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("engage_segments")
      .select("audience, rules, brand_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return { ok: false as const, error: "Segment not found", total: 0 };
    const { evaluateSegment } = await import("./segments.server");
    const evaluated = await evaluateSegment(row.audience as "students", row.rules as never, row.brand_id);
    return { ok: true as const, total: evaluated.total, sample: evaluated.recipients.slice(0, 20) };
  });
