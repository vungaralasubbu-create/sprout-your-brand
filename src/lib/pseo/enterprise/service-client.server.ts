// Shared server-side Supabase admin loader for enterprise pSEO helpers.
// This file is `.server.ts` so it is stripped from client bundles.
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;
export async function getAdmin(): Promise<SupabaseClient> {
  if (cached) return cached;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  cached = supabaseAdmin;
  return cached;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 180);
}

export function fillPattern(pattern: string, vars: Record<string, string>): string {
  return pattern.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, k) => {
    const v = vars[k];
    return v ? slugify(String(v)) : "";
  }).replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

export function fillHumanPattern(pattern: string, vars: Record<string, string>): string {
  return pattern.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, k) => vars[k] ?? "");
}
