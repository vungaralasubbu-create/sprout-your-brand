/**
 * Context pipeline — brand + campaign + user injection.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildBrandSystemPrompt } from "@/lib/marketing-os/brand-context.server";

export async function buildEngineContext(
  supabase: SupabaseClient,
  userId: string,
  campaignId?: string | null,
): Promise<{ brandSystemPrompt: string; campaignSummary: string; campaign?: unknown }> {
  const brandSystemPrompt = await buildBrandSystemPrompt(supabase, userId).catch(() => "");

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
  return { brandSystemPrompt, campaignSummary, campaign };
}
