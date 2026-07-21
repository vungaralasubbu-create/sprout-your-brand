/**
 * Context pipeline — brand + knowledge + memory + campaign injection.
 *
 * Delegates to the Brand Context Engine, which is the single source of truth
 * for AI context (Brand Center + Knowledge Hub + AI Memory + caching).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAiContext } from "@/lib/marketing-os/brand-context-engine.server";

export async function buildEngineContext(
  supabase: SupabaseClient,
  userId: string,
  campaignId?: string | null,
  query?: string,
): Promise<{ brandSystemPrompt: string; campaignSummary: string; campaign?: unknown }> {
  const { systemPrompt } = await buildAiContext(supabase, userId, { query }).catch(() => ({
    systemPrompt: "",
  }));

  let campaignSummary = "";
  let campaign: unknown = undefined;
  if (campaignId) {
    const { data } = await supabase
      .from("mkt_campaigns")
      .select("name, objective, description, goals, target_audience, target_platforms")
      .eq("id", campaignId)
      .maybeSingle();
    if (data) {
      campaign = data;
      campaignSummary = [
        `Campaign: ${data.name ?? ""}`,
        data.objective ? `Objective: ${data.objective}` : "",
        data.description ? `Description: ${data.description}` : "",
      ].filter(Boolean).join("\n");
    }
  }
  return { brandSystemPrompt: systemPrompt, campaignSummary, campaign };
}
