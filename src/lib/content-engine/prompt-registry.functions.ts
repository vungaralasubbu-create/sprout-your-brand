/**
 * AI Content Engine — Prompt Registry service.
 *
 * Manages versioned prompt templates in `ce_prompt_registry` /
 * `ce_prompt_versions`. All calls go through `requireSupabaseAuth`; admin
 * rights are enforced by RLS for writes.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_PROMPTS } from "./default-prompts";
import { ASSET_TYPES, ASSET_TYPE_SPECS, type AssetType } from "./types";

/** Ensure default prompts exist. Idempotent — runs cheap upserts. */
export const ensureDefaultPrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const results: Array<{ key: string; created: boolean }> = [];
    for (const type of ASSET_TYPES) {
      const p = DEFAULT_PROMPTS[type];
      // Upsert registry entry
      const { data: reg } = await supabaseAdmin
        .from("ce_prompt_registry")
        .upsert(
          { key: p.key, category: p.category, description: p.description, created_by: context.userId },
          { onConflict: "key" },
        )
        .select("id, active_version_id")
        .single();
      if (!reg) continue;
      // Only add version 1 if none exists.
      const { count } = await supabaseAdmin
        .from("ce_prompt_versions")
        .select("id", { count: "exact", head: true })
        .eq("registry_id", reg.id);
      if (!count) {
        const { data: ver } = await supabaseAdmin
          .from("ce_prompt_versions")
          .insert({
            registry_id: reg.id,
            version: 1,
            template: p.template,
            variables: p.variables,
            model_preference: p.modelPreference,
            notes: "Seeded default",
            created_by: context.userId,
          })
          .select("id")
          .single();
        if (ver && !reg.active_version_id) {
          await supabaseAdmin
            .from("ce_prompt_registry")
            .update({ active_version_id: ver.id })
            .eq("id", reg.id);
        }
        results.push({ key: p.key, created: true });
      } else {
        results.push({ key: p.key, created: false });
      }
    }
    return { ok: true, results };
  });

export const listPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ce_prompt_registry")
      .select("id, key, category, description, active_version_id, updated_at")
      .order("key");
    if (error) throw error;
    return { prompts: data ?? [] };
  });

export const getPromptWithVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ key: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: reg, error } = await context.supabase
      .from("ce_prompt_registry")
      .select("id, key, category, description, active_version_id")
      .eq("key", data.key)
      .maybeSingle();
    if (error) throw error;
    if (!reg) return { prompt: null, versions: [] };
    const { data: versions } = await context.supabase
      .from("ce_prompt_versions")
      .select("id, version, template, variables, model_preference, notes, created_at, created_by")
      .eq("registry_id", reg.id)
      .order("version", { ascending: false });
    return { prompt: reg, versions: versions ?? [] };
  });

const NewVersionInput = z.object({
  key: z.string(),
  template: z.string().min(10),
  variables: z.array(z.string()).default([]),
  modelPreference: z.object({ quality: z.enum(["fast", "balanced", "premium"]).optional() }).default({}),
  notes: z.string().optional(),
  activate: z.boolean().default(true),
});

export const createPromptVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => NewVersionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: reg } = await context.supabase
      .from("ce_prompt_registry")
      .select("id")
      .eq("key", data.key)
      .maybeSingle();
    if (!reg) throw new Error(`Prompt registry entry not found for key ${data.key}`);
    const { data: latest } = await context.supabase
      .from("ce_prompt_versions")
      .select("version")
      .eq("registry_id", reg.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (latest?.version ?? 0) + 1;
    const { data: created, error } = await context.supabase
      .from("ce_prompt_versions")
      .insert({
        registry_id: reg.id,
        version: nextVersion,
        template: data.template,
        variables: data.variables,
        model_preference: data.modelPreference,
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select("id, version")
      .single();
    if (error) throw error;
    if (data.activate) {
      await context.supabase
        .from("ce_prompt_registry")
        .update({ active_version_id: created.id })
        .eq("id", reg.id);
    }
    return { ok: true, version: created };
  });

export const activatePromptVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ key: z.string(), versionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ce_prompt_registry")
      .update({ active_version_id: data.versionId })
      .eq("key", data.key);
    if (error) throw error;
    return { ok: true };
  });

/**
 * Resolve the active prompt for an asset type. Auto-seeds default when
 * missing so first-time users don't need to run ensureDefaultPrompts.
 * Server-only helper (not a createServerFn to avoid re-entry).
 */
export async function resolveActivePrompt(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  assetType: AssetType,
) {
  const key = ASSET_TYPE_SPECS[assetType].promptKey;
  const fallback = DEFAULT_PROMPTS[assetType];

  const { data: reg } = await supabase
    .from("ce_prompt_registry")
    .select("id, active_version_id")
    .eq("key", key)
    .maybeSingle();

  if (reg?.active_version_id) {
    const { data: ver } = await supabase
      .from("ce_prompt_versions")
      .select("id, template, variables, model_preference")
      .eq("id", reg.active_version_id)
      .maybeSingle();
    if (ver) {
      return {
        promptVersionId: ver.id as string,
        template: ver.template as string,
        variables: (ver.variables as string[]) ?? [],
        modelPreference: (ver.model_preference as { quality?: "fast" | "balanced" | "premium" }) ?? {},
      };
    }
  }
  // Fallback: return the in-memory default (unregistered, no version id).
  return {
    promptVersionId: null,
    template: fallback.template,
    variables: fallback.variables,
    modelPreference: fallback.modelPreference,
  };
}
