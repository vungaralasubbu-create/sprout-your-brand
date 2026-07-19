// Server functions that expose the Marketing Strategist agent to the app.
//
// Uses dedicated tables:
//   - ai_marketing_conversations
//   - ai_marketing_messages
// and the shared registry / observability tables:
//   - ai_agents (system prompt lives here — the Prompt Registry seat for
//     this agent; versioned via ai_agents.version)
//   - ai_agent_runs
//
// Automatic model selection: the agent has a base `model_preference` in
// the registry, but for each request we upgrade or downgrade based on the
// asset type before calling the runtime. This gives short/high-volume
// assets a fast model and long-form/strategic assets a stronger model,
// without changing the shared runtime.
//
// No UI is created here.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  loadAgent,
  runAgent,
  AgentPermissionError,
  AgentNotFoundError,
  type ChatMessage,
  type AgentDefinition,
} from "./agent-runtime.server";

const AGENT_SLUG = "marketing-strategist";
const HISTORY_WINDOW = 10;

const ASSET_TYPES = [
  "general",
  "blog",
  "seo_brief",
  "landing_page",
  "email_campaign",
  "linkedin_post",
  "instagram_caption",
  "twitter_post",
  "facebook_ad",
  "google_ad",
  "youtube_title",
  "meta_description",
  "ad_copy",
] as const;

type AssetType = (typeof ASSET_TYPES)[number];

// -----------------------------------------------------------------
// Automatic model selection.
//
// All ids are exact `vendor/model` strings from the `ai-models-chat`
// catalog. Never invent one here.
// -----------------------------------------------------------------
const STRONG_MODEL = "openai/gpt-5.4-mini";      // long-form / strategic
const FAST_MODEL = "google/gemini-3.5-flash";    // short / high-volume
const FAST_FALLBACK = "openai/gpt-5.4-nano";
const STRONG_FALLBACK = "google/gemini-3.5-flash";

function pickModelForAsset(assetType: AssetType): {
  model: string;
  fallback: string;
  temperature: number;
  maxTokens: number;
} {
  switch (assetType) {
    case "blog":
    case "landing_page":
    case "seo_brief":
    case "email_campaign":
      return { model: STRONG_MODEL, fallback: STRONG_FALLBACK, temperature: 0.7, maxTokens: 2400 };
    case "facebook_ad":
    case "google_ad":
    case "ad_copy":
      return { model: STRONG_MODEL, fallback: FAST_MODEL, temperature: 0.85, maxTokens: 1200 };
    case "linkedin_post":
    case "instagram_caption":
      return { model: FAST_MODEL, fallback: FAST_FALLBACK, temperature: 0.9, maxTokens: 800 };
    case "twitter_post":
    case "youtube_title":
    case "meta_description":
      return { model: FAST_MODEL, fallback: FAST_FALLBACK, temperature: 0.95, maxTokens: 500 };
    case "general":
    default:
      return { model: FAST_MODEL, fallback: STRONG_MODEL, temperature: 0.8, maxTokens: 1500 };
  }
}

function assetLabel(t: AssetType): string {
  const map: Record<AssetType, string> = {
    general: "General marketing",
    blog: "Blog post",
    seo_brief: "SEO brief",
    landing_page: "Landing page",
    email_campaign: "Email campaign",
    linkedin_post: "LinkedIn post",
    instagram_caption: "Instagram caption",
    twitter_post: "Twitter/X post",
    facebook_ad: "Facebook ad",
    google_ad: "Google ad",
    youtube_title: "YouTube title",
    meta_description: "Meta description",
    ad_copy: "Ad copy",
  };
  return map[t];
}

// -----------------------------------------------------------------
// Role resolution
// -----------------------------------------------------------------
// deno-lint-ignore no-explicit-any
async function resolveRole(sb: any, uid: string): Promise<string> {
  const { data } = await sb.from("user_roles").select("role").eq("user_id", uid);
  const roles: string[] = (data ?? []).map((r: { role: string }) => r.role);
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("wl_owner")) return "wl_owner";
  if (roles.includes("wl_admin")) return "wl_admin";
  if (roles.includes("partner")) return "partner";
  if (roles.includes("student")) return "student";
  return roles[0] ?? "student";
}

// -----------------------------------------------------------------
// Start conversation
// -----------------------------------------------------------------
const StartInput = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  assetType: z.enum(ASSET_TYPES).default("general"),
  brandVoice: z.string().trim().max(240).optional(),
  targetAudience: z.string().trim().max(240).optional(),
  productOrTopic: z.string().trim().max(240).optional(),
});

export const startMarketingConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => StartInput.parse(raw))
  .handler(async ({ data, context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;

    const { data: row, error } = await sb
      .from("ai_marketing_conversations")
      .insert({
        owner_user_id: uid,
        title: data.title ?? `${assetLabel(data.assetType)} session`,
        asset_type: data.assetType,
        brand_voice: data.brandVoice ?? null,
        target_audience: data.targetAudience ?? null,
        product_or_topic: data.productOrTopic ?? null,
      })
      .select(
        "id, title, asset_type, brand_voice, target_audience, product_or_topic, message_count, last_activity_at, created_at",
      )
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

// -----------------------------------------------------------------
// Send message
// -----------------------------------------------------------------
const SendInput = z.object({
  conversationId: z.string().uuid(),
  message: z.string().trim().min(1).max(8000),
  // Optional per-message override of the asset type (e.g. same session
  // producing a blog and then meta descriptions from it). Falls back to
  // the conversation's asset_type.
  assetTypeOverride: z.enum(ASSET_TYPES).optional(),
});

export const sendMarketingMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SendInput.parse(raw))
  .handler(async ({ data, context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;
    const role = await resolveRole(sb, uid);

    // 1. Ownership check.
    const { data: convo, error: convErr } = await sb
      .from("ai_marketing_conversations")
      .select(
        "id, owner_user_id, asset_type, brand_voice, target_audience, product_or_topic, message_count",
      )
      .eq("id", data.conversationId)
      .maybeSingle();
    if (convErr) throw new Error(convErr.message);
    if (!convo) throw new Error("Conversation not found.");
    if (convo.owner_user_id !== uid) throw new Error("Not authorized.");

    const activeAssetType: AssetType =
      (data.assetTypeOverride ?? convo.asset_type) as AssetType;

    // 2. Load the agent from the Prompt Registry (ai_agents).
    let agent: AgentDefinition;
    try {
      agent = await loadAgent(sb, AGENT_SLUG);
    } catch (err) {
      if (err instanceof AgentNotFoundError) {
        throw new Error("Marketing Strategist agent is not currently available.");
      }
      throw err;
    }

    // 3. Automatic model routing — clone the agent definition with the
    //    model/fallback/temperature/token cap best suited to this asset.
    const route = pickModelForAsset(activeAssetType);
    const routedAgent: AgentDefinition = {
      ...agent,
      model_preference: route.model,
      fallback_model: route.fallback,
      temperature: route.temperature,
      max_output_tokens: route.maxTokens,
    };

    // 4. Persist user's message.
    const { data: userMsg, error: userErr } = await sb
      .from("ai_marketing_messages")
      .insert({
        conversation_id: data.conversationId,
        owner_user_id: uid,
        role: "user",
        content: data.message,
        status: "completed",
        metadata: { asset_type: activeAssetType },
      })
      .select("id, created_at")
      .single();
    if (userErr) throw new Error(userErr.message);

    // 5. Short-term memory.
    const { data: recent } = await sb
      .from("ai_marketing_messages")
      .select("role, content")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_WINDOW);

    const history: ChatMessage[] = ((recent ?? []) as { role: string; content: string }[])
      .slice()
      .reverse()
      .filter((m) => m.role === "user" || m.role === "strategist")
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

    // 6. Context summary — asset type, brand voice, audience, product.
    const parts: string[] = [`Active asset: ${assetLabel(activeAssetType)}.`];
    if (convo.brand_voice) parts.push(`Brand voice: ${convo.brand_voice}.`);
    if (convo.target_audience) parts.push(`Target audience: ${convo.target_audience}.`);
    if (convo.product_or_topic) parts.push(`Product/topic: ${convo.product_or_topic}.`);
    const contextSummary = parts.join(" ");

    // 7. Placeholder strategist message.
    const { data: placeholder, error: phErr } = await sb
      .from("ai_marketing_messages")
      .insert({
        conversation_id: data.conversationId,
        owner_user_id: uid,
        role: "strategist",
        content: "",
        status: "generating",
        metadata: {
          asset_type: activeAssetType,
          model: route.model,
          fallback: route.fallback,
        },
      })
      .select("id")
      .single();
    if (phErr) throw new Error(phErr.message);

    // 8. Run the agent.
    try {
      const result = await runAgent(sb, {
        agent: routedAgent,
        userId: uid,
        userRole: role,
        messages: history,
        conversationId: data.conversationId,
        messageId: placeholder.id,
        contextSummary,
        // TODO(requires-rag): inject partner brand voice guides, past
        // high-performing assets, and Glintr program details from the
        // Knowledge Base once RAG retrieval lands.
        knowledge: undefined,
        // TODO(requires-ai-memory): inject long-term marketing memory
        // (winning subject lines, banned phrases, tone rules, past
        // campaigns) once the AI Memory read API is live.
        longTermMemory: undefined,
      });

      // 9. Fill in the reply.
      const { error: updErr } = await sb
        .from("ai_marketing_messages")
        .update({
          content: result.content,
          status: "completed",
          metadata: {
            asset_type: activeAssetType,
            model: result.model,
            fallback_used: result.fallbackUsed,
            duration_ms: result.durationMs,
          },
        })
        .eq("id", placeholder.id);
      if (updErr) throw new Error(updErr.message);

      // 10. Bump activity.
      await sb
        .from("ai_marketing_conversations")
        .update({
          last_activity_at: new Date().toISOString(),
          message_count: (convo.message_count ?? 0) + 2,
        })
        .eq("id", data.conversationId);

      return {
        userMessage: { id: userMsg.id, created_at: userMsg.created_at },
        strategistMessage: {
          id: placeholder.id,
          content: result.content,
          model: result.model,
          fallbackUsed: result.fallbackUsed,
          durationMs: result.durationMs,
          assetType: activeAssetType,
        },
      };
    } catch (err) {
      await sb
        .from("ai_marketing_messages")
        .update({
          status: "failed",
          error_reason:
            err instanceof Error
              ? err.message.slice(0, 500)
              : String(err).slice(0, 500),
        })
        .eq("id", placeholder.id);

      if (err instanceof AgentPermissionError) {
        throw new Error("You are not permitted to use the Marketing Strategist.");
      }
      throw err;
    }
  });

// -----------------------------------------------------------------
// List / get
// -----------------------------------------------------------------
export const listMarketingConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const { data, error } = await sb
      .from("ai_marketing_conversations")
      .select(
        "id, title, asset_type, brand_voice, target_audience, product_or_topic, message_count, last_activity_at, created_at, archived_at",
      )
      .eq("owner_user_id", context.userId)
      .is("archived_at", null)
      .order("last_activity_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const GetInput = z.object({ conversationId: z.string().uuid() });

export const getMarketingConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => GetInput.parse(raw))
  .handler(async ({ data, context }) => {
    // deno-lint-ignore no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;

    const { data: convo, error: convErr } = await sb
      .from("ai_marketing_conversations")
      .select(
        "id, title, asset_type, brand_voice, target_audience, product_or_topic, message_count, last_activity_at, created_at",
      )
      .eq("id", data.conversationId)
      .eq("owner_user_id", uid)
      .maybeSingle();
    if (convErr) throw new Error(convErr.message);
    if (!convo) throw new Error("Conversation not found.");

    const { data: msgs, error: msgErr } = await sb
      .from("ai_marketing_messages")
      .select("id, role, content, status, metadata, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (msgErr) throw new Error(msgErr.message);

    return { conversation: convo, messages: msgs ?? [] };
  });
