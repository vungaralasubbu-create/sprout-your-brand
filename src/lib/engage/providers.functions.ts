/**
 * Provider CRUD + test-connection endpoints for the Admin and Brand Owner
 * Engage settings pages.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getProvider } from "./providers/registry.server";
import type { EngageProviderKind } from "./types";

const providerSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.string().min(1),
  channel: z.enum(["email", "push", "sms"]).default("email"),
  display_name: z.string().max(200).optional().nullable(),
  brand_id: z.string().uuid().optional().nullable(),
  config: z.record(z.unknown()).default({}),
  secret_ref: z.string().max(256).optional().nullable(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional().default(true),
});

export const listEngageProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ brand_id: z.string().uuid().optional().nullable() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("engage_providers")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (data.brand_id) query = query.eq("brand_id", data.brand_id);
    else query = query.eq("tenant_scope", "platform");
    const { data: rows, error } = await query;
    if (error) return { ok: false as const, error: error.message, providers: [] };
    return { ok: true as const, providers: rows ?? [] };
  });

export const saveEngageProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => providerSchema.parse(data))
  .handler(async ({ data, context }) => {
    const scope = data.brand_id ? `brand:${data.brand_id}` : "platform";
    const payload = {
      tenant_scope: scope,
      brand_id: data.brand_id ?? null,
      kind: data.kind,
      channel: data.channel,
      display_name: data.display_name ?? null,
      config: data.config as never,
      secret_ref: data.secret_ref ?? null,
      is_default: data.is_default ?? false,
      is_active: data.is_active ?? true,
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("engage_providers")
        .update(payload)
        .eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("engage_providers")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: row?.id };
  });

export const deleteEngageProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("engage_providers").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const testEngageProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("engage_providers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) return { ok: false as const, error: error?.message ?? "Provider not found" };

    const adapter = getProvider(row.kind as EngageProviderKind);
    if (!adapter) return { ok: false as const, error: `No adapter registered for "${row.kind}"` };

    const secret = row.secret_ref ? (process.env as Record<string, string | undefined>)[row.secret_ref] ?? null : null;
    const verify = await adapter.verify({
      kind: row.kind as EngageProviderKind,
      config: (row.config as Record<string, unknown>) ?? {},
      secret,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("engage_providers")
      .update({
        last_test_at: new Date().toISOString(),
        last_test_status: verify.ok ? "ok" : "failed",
        last_test_error: verify.ok ? null : verify.error ?? "Unknown error",
        verified_at: verify.ok ? new Date().toISOString() : row.verified_at,
      })
      .eq("id", data.id);

    return verify.ok
      ? { ok: true as const }
      : { ok: false as const, error: verify.error ?? "Verification failed" };
  });
