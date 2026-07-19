/**
 * Admin server functions for the Internal Linking Intelligence Engine.
 * All endpoints require an admin role (super_admin or admin), checked via
 * requireSupabaseAuth + has_role. AI calls go through the centralized AI
 * Router (OpenAI); no Lovable AI runtime is used.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: superRole } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId, _role: "super_admin",
  });
  const { data: adminRole } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId, _role: "admin",
  });
  if (!superRole && !adminRole) throw new Response("Forbidden", { status: 403 });
}

// --- Graph -----------------------------------------------------------------

export const rebuildLinkGraph = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { rebuildGraphNodes } = await import("./graph.server");
    return rebuildGraphNodes();
  });

export const computeLinkAuthority = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { computePageRank } = await import("./graph.server");
    await computePageRank();
    return { ok: true };
  });

export const listGraphNodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      type: z.string().optional(),
      orphansOnly: z.boolean().optional(),
      limit: z.number().min(1).max(500).default(100),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("link_graph_nodes")
      .select("id, content_type, content_id, url, title, topic_cluster, authority, pagerank, inbound_count, outbound_count, is_orphan")
      .order("authority", { ascending: false })
      .limit(data.limit);
    if (data.type) q = q.eq("content_type", data.type);
    if (data.orphansOnly) q = q.eq("is_orphan", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// --- Discovery + AI suggestions -------------------------------------------

export const discoverEdgesForNode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ nodeId: z.string().uuid(), max: z.number().min(1).max(50).default(20) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { persistDiscoveredEdges } = await import("./discovery.server");
    const count = await persistDiscoveredEdges(data.nodeId, data.max);
    return { edges: count };
  });

export const generateAiLinkSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ nodeId: z.string().uuid(), max: z.number().min(1).max(50).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { generateSuggestionsForNode } = await import("./ai-recommender.server");
    return generateSuggestionsForNode(data.nodeId, { max: data.max });
  });

export const generateAiLinkSuggestionsBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ nodeIds: z.array(z.string().uuid()).min(1).max(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { generateSuggestionsBatch } = await import("./ai-recommender.server");
    const total = await generateSuggestionsBatch(data.nodeIds);
    return { inserted: total };
  });

export const listLinkSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      status: z.enum(["pending", "approved", "rejected"]).default("pending"),
      fromNodeId: z.string().uuid().optional(),
      limit: z.number().min(1).max(200).default(50),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("link_suggestions")
      .select("*").eq("status", data.status)
      .order("relevance_score", { ascending: false })
      .limit(data.limit);
    if (data.fromNodeId) q = q.eq("from_node_id", data.fromNodeId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const reviewLinkSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      action: z.enum(["approve", "reject"]),
      reason: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nowIso = new Date().toISOString();
    if (data.action === "reject") {
      await (supabaseAdmin as any).from("link_suggestions").update({
        status: "rejected",
        rejection_reason: data.reason ?? null,
        reviewed_by: context.userId,
        reviewed_at: nowIso,
      }).eq("id", data.id);
      return { ok: true };
    }
    // Approve: promote to link_graph_edges + record anchor usage
    const { data: s } = await (supabaseAdmin as any).from("link_suggestions")
      .select("*").eq("id", data.id).maybeSingle();
    if (!s) throw new Error("Suggestion not found");
    await (supabaseAdmin as any).from("link_graph_edges").upsert({
      from_node_id: s.from_node_id,
      to_node_id: s.to_node_id,
      link_type: s.link_type,
      anchor_text: s.anchor_text,
      anchor_style: s.anchor_style,
      weight: s.relevance_score,
      similarity: s.relevance_score,
      discovered_by: "ai",
      status: "active",
    }, { onConflict: "from_node_id,to_node_id,link_type" });
    const { recordAnchorUsage } = await import("./anchor-engine.server");
    await recordAnchorUsage(s.to_node_id, s.anchor_text, s.anchor_style,
      s.to_content_type, s.to_content_id);
    await (supabaseAdmin as any).from("link_suggestions").update({
      status: "approved",
      reviewed_by: context.userId,
      reviewed_at: nowIso,
    }).eq("id", data.id);
    return { ok: true };
  });

// --- Editor Assistant (Content Hub extension) ------------------------------

/**
 * Returns contextual link recommendations for a piece of content while it is
 * being edited. Read-only: does not modify the article.
 */
export const getEditorLinkAssist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      contentType: z.string(),
      contentId: z.string(),
      limit: z.number().min(1).max(30).default(15),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: node } = await (supabaseAdmin as any).from("link_graph_nodes")
      .select("id")
      .eq("content_type", data.contentType)
      .eq("content_id", data.contentId)
      .maybeSingle();
    if (!node) return { node: null, suggestions: [], anchors: [] };
    const { data: suggestions } = await (supabaseAdmin as any).from("link_suggestions")
      .select("*").eq("from_node_id", node.id).eq("status", "pending")
      .order("relevance_score", { ascending: false }).limit(data.limit);
    return { node, suggestions: suggestions ?? [] };
  });

// --- Health -----------------------------------------------------------------

export const scanLinkHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      limit: z.number().min(1).max(500).default(100),
      baseUrl: z.string().url().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { scanHealth, detectOrphans } = await import("./health-monitor.server");
    const scan = await scanHealth(data.limit, data.baseUrl ?? "");
    const orphans = await detectOrphans();
    return { ...scan, orphans };
  });

export const listHealthIssues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      type: z.string().optional(),
      unresolvedOnly: z.boolean().default(true),
      limit: z.number().min(1).max(500).default(100),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = (supabaseAdmin as any).from("link_health_issues")
      .select("*").order("detected_at", { ascending: false }).limit(data.limit);
    if (data.type) q = q.eq("issue_type", data.type);
    if (data.unresolvedOnly) q = q.is("resolved_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// --- Scoring + Analytics ---------------------------------------------------

export const computeLinkScores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().min(1).max(2000).default(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { computeAllScores } = await import("./scoring.server");
    const done = await computeAllScores(data.limit);
    return { scored: done };
  });

export const getLinkAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ days: z.number().min(1).max(365).default(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { topClickedLinks, leastUsedEdges, authorityDistribution } =
      await import("./analytics.server");
    const [top, least, dist] = await Promise.all([
      topClickedLinks(data.days),
      leastUsedEdges(),
      authorityDistribution(),
    ]);
    return { topClicked: top, leastUsed: least, authorityDistribution: dist };
  });

/** Public: record a click event for analytics. No admin required. */
export const trackLinkClick = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      toNodeId: z.string().uuid(),
      fromNodeId: z.string().uuid().optional(),
      anchorText: z.string().max(300).optional(),
      sessionId: z.string().max(120).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { trackClick } = await import("./analytics.server");
    await trackClick({
      toNodeId: data.toNodeId,
      fromNodeId: data.fromNodeId,
      anchorText: data.anchorText,
      sessionId: data.sessionId,
    });
    return { ok: true };
  });

// --- Settings --------------------------------------------------------------

export const getLinkSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any).from("link_intelligence_settings")
      .select("*").limit(1).maybeSingle();
    return data ?? null;
  });

export const updateLinkSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      max_links_per_page: z.number().min(1).max(200).optional(),
      min_links_per_page: z.number().min(0).max(50).optional(),
      anchor_diversity_min: z.number().min(0).max(1).optional(),
      suggestion_threshold: z.number().min(0).max(1).optional(),
      auto_approve_threshold: z.number().min(0).max(1).optional(),
      require_approval: z.boolean().optional(),
      excluded_types: z.array(z.string()).optional(),
      excluded_urls: z.array(z.string()).optional(),
      scoring_weights: z.record(z.string(), z.number()).optional(),
      ai_prompt_version: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await (supabaseAdmin as any).from("link_intelligence_settings")
      .select("id").limit(1).maybeSingle();
    const patch = { ...data, updated_at: new Date().toISOString(), updated_by: context.userId };
    if (existing) {
      await (supabaseAdmin as any).from("link_intelligence_settings")
        .update(patch).eq("id", existing.id);
    } else {
      await (supabaseAdmin as any).from("link_intelligence_settings").insert(patch);
    }
    return { ok: true };
  });
