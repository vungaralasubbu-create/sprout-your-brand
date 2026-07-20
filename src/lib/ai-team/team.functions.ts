/**
 * AI Marketing Team — visualization + per-agent chat.
 *
 * Reuses:
 *  - ai_agents table (existing) with 12 seeded roles
 *  - ai_agent_runs table (existing) for observability
 *  - aiChat() central AI router (no direct provider calls)
 *  - createMarketingProject orchestrator (no duplicate generation)
 *
 * The user sees ONE AI. Internally, 12 specialist agents collaborate.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { aiChat } from "@/lib/ai/router.server";
import { createMarketingProject, PROJECT_STEPS } from "@/lib/marketing-os/projects.functions";

// Map orchestrator steps → collaborating agents (visualization only)
export const STEP_AGENT_MAP: Record<string, string[]> = {
  understand: ["ceo"],
  campaign: ["ceo", "marketing-strategist"],
  strategy: ["marketing-strategist"],
  content: ["content-writer", "seo-specialist"],
  posters: ["creative-director"],
  landing: ["content-writer", "creative-director", "seo-specialist"],
  forms: ["crm-specialist"],
  email: ["email-specialist"],
  calendar: ["marketing-strategist", "content-writer"],
  workflow: ["automation-engineer"],
  save: ["ceo", "design-qa"],
};

export const listAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ai_agents")
      .select("id,slug,name,description,tags,model_preference,temperature,is_active,updated_at")
      .order("updated_at", { ascending: false });
    return { agents: data ?? [] };
  });

export const getAgent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ slug: z.string().min(1).max(80) }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: agent } = await context.supabase
      .from("ai_agents")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!agent) return { agent: null, recentRuns: [], stats: null };
    const [runsRes, statsRes] = await Promise.all([
      context.supabase
        .from("ai_agent_runs")
        .select("id,status,model,duration_ms,total_tokens,retry_count,created_at,error_message")
        .eq("agent_slug", data.slug)
        .order("created_at", { ascending: false })
        .limit(20),
      context.supabase
        .from("ai_agent_runs")
        .select("status,duration_ms,total_tokens")
        .eq("agent_slug", data.slug)
        .limit(500),
    ]);
    const rows = (statsRes.data ?? []) as any[];
    const total = rows.length;
    const successes = rows.filter((r) => r.status === "success").length;
    const avgMs = total ? Math.round(rows.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / total) : 0;
    const totalTokens = rows.reduce((s, r) => s + (r.total_tokens ?? 0), 0);
    return {
      agent,
      recentRuns: runsRes.data ?? [],
      stats: {
        total,
        successRate: total ? Math.round((successes / total) * 100) : 100,
        avgDurationMs: avgMs,
        totalTokens,
      },
    };
  });

export const listAgentRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ slug: z.string().optional(), limit: z.number().int().min(1).max(200).default(80) }).parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("ai_agent_runs")
      .select("id,agent_slug,status,model,duration_ms,total_tokens,retry_count,error_message,created_at,cost_credits")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.slug) q = q.eq("agent_slug", data.slug);
    const { data: rows } = await q;
    return { runs: rows ?? [] };
  });

/**
 * Update agent settings (admin only via RLS).
 */
export const updateAgentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        slug: z.string().min(1),
        is_active: z.boolean().optional(),
        temperature: z.number().min(0).max(2).optional(),
        model_preference: z.string().max(120).optional(),
        system_prompt: z.string().max(8000).optional(),
        max_output_tokens: z.number().int().min(64).max(32000).optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const patch: any = {};
    if (data.is_active !== undefined) patch.is_active = data.is_active;
    if (data.temperature !== undefined) patch.temperature = data.temperature;
    if (data.model_preference) patch.model_preference = data.model_preference;
    if (data.system_prompt) patch.system_prompt = data.system_prompt;
    if (data.max_output_tokens) patch.max_output_tokens = data.max_output_tokens;
    const { error } = await context.supabase.from("ai_agents").update(patch).eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Talk directly to a specialist agent. Uses their persona + central router.
 * Logs into ai_agent_runs for observability.
 */
export const chatWithAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        slug: z.string().min(1),
        message: z.string().min(1).max(4000),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .max(30)
          .default([]),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: agent } = await context.supabase
      .from("ai_agents")
      .select("id,slug,name,system_prompt,model_preference,temperature,max_output_tokens,is_active")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!agent) throw new Error("Agent not found");
    if (!(agent as any).is_active) throw new Error("Agent disabled");

    const start = Date.now();
    let status = "success";
    let errorMsg: string | null = null;
    let reply = "";
    try {
      const out = await aiChat({
        system: (agent as any).system_prompt,
        messages: [...data.history, { role: "user", content: data.message }],
        temperature: (agent as any).temperature ?? undefined,
        maxTokens: (agent as any).max_output_tokens ?? undefined,
      });
      reply = typeof out === "string" ? out : JSON.stringify(out);
      if (!reply || reply.trim().length === 0) {
        status = "empty";
        reply = "I'm briefly unavailable. Please retry.";
      }
    } catch (e: any) {
      status = "error";
      errorMsg = e?.message ?? "Unknown error";
      reply = "I hit a temporary issue. Please retry in a moment.";
    }

    // Best-effort observability log
    await context.supabase.from("ai_agent_runs").insert({
      agent_id: (agent as any).id,
      agent_slug: (agent as any).slug,
      user_id: context.userId,
      model: (agent as any).model_preference ?? "unknown",
      status,
      duration_ms: Date.now() - start,
      error_message: errorMsg,
      metadata: { direct_chat: true },
    });

    return { reply, status };
  });

/**
 * Kick off the AI Team — hands off to the existing marketing project orchestrator.
 * The visualization treats each orchestrator step as agent work.
 */
export const runTeamProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ prompt: z.string().min(4).max(2000) }).parse(v))
  .handler(async ({ data }) => {
    const { project } = await createMarketingProject({ data: { prompt: data.prompt } });
    return { projectId: (project as any).id };
  });

export const teamStepAgents = () => ({ steps: PROJECT_STEPS, map: STEP_AGENT_MAP });
