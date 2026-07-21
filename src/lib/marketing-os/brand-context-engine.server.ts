/**
 * Brand Context Engine — single source of truth for AI context injection.
 *
 * Pipeline: Workspace → Brand → Knowledge → Memory → Prompt.
 *
 * Every AI feature (Marketing OS, Content Factory, Blog/Poster/Landing/Video/
 * Email generators, Workflow AI, AI Agents) should call `buildAiContext` and
 * prepend the returned `systemPrompt` to its own instructions before the AI
 * Router call. Never re-implement brand loading in individual modules.
 *
 * Reuses:
 *  - mkt_brand_kits (Brand Center — source of truth for identity/voice)
 *  - kn_documents / kn_products / kn_services / kn_faqs (Knowledge Hub)
 *  - mkt_campaigns (AI Memory — past campaign titles for continuity)
 *  - mc_workspace_members (workspace isolation)
 *
 * All queries respect Row Level Security — the passed supabase client must
 * be user-scoped (from requireSupabaseAuth). No cross-workspace leakage.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildBrandSystemPrompt } from "./brand-context.server";

export type AiContextOptions = {
  /** Free-text hint (user prompt / campaign brief) — used to rank knowledge. */
  query?: string;
  /** Include knowledge hub snippets. Default true. */
  includeKnowledge?: boolean;
  /** Include recent campaign memory. Default true. */
  includeMemory?: boolean;
  /** Approx max chars of the full context block. Default 6000. */
  maxChars?: number;
  /** Bypass cache. Default false. */
  fresh?: boolean;
};

export type AiContextDiagnostics = {
  workspaceLoaded: boolean;
  workspaceId: string | null;
  brandLoaded: boolean;
  knowledgeLoaded: boolean;
  memoryLoaded: boolean;
  contextChars: number;
  sources: string[];
  injectionMs: number;
  cache: "hit" | "miss" | "bypass";
  brandComplete: boolean;
  missing: string[];
};

export type AiContextResult = {
  systemPrompt: string;
  diagnostics: AiContextDiagnostics;
};

// ---------------- cache ----------------
type CacheEntry = { value: AiContextResult; expires: number };
const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60s — refreshes shortly after Brand Center edits

function cacheKey(userId: string, opts: AiContextOptions): string {
  const q = (opts.query ?? "").slice(0, 200).toLowerCase();
  return `${userId}:${opts.includeKnowledge !== false ? "k" : ""}${opts.includeMemory !== false ? "m" : ""}:${q}`;
}

/** Invalidate cache for a user (call after Brand Center / Knowledge updates). */
export function invalidateAiContext(userId?: string): void {
  if (!userId) {
    CACHE.clear();
    return;
  }
  for (const k of CACHE.keys()) if (k.startsWith(`${userId}:`)) CACHE.delete(k);
}

// ---------------- helpers ----------------
async function resolveWorkspaceId(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("mc_workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return (data as any)?.workspace_id ?? null;
}

function rank<T extends { text: string }>(items: T[], query: string, limit: number): T[] {
  if (!query.trim()) return items.slice(0, limit);
  const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const scored = items.map((it) => {
    const hay = it.text.toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 1;
    return { it, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.it);
}

async function loadKnowledgeBlock(
  supabase: SupabaseClient<any, any, any>,
  workspaceId: string,
  query: string,
): Promise<{ block: string; loaded: boolean }> {
  try {
    const [prods, svcs, faqs, docs] = await Promise.all([
      supabase.from("kn_products").select("name,description").eq("workspace_id", workspaceId).limit(20),
      supabase.from("kn_services").select("name,description").eq("workspace_id", workspaceId).limit(20),
      supabase.from("kn_faqs").select("question,answer").eq("workspace_id", workspaceId).limit(30),
      supabase.from("kn_documents").select("title,summary,category").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(30),
    ]);

    const productItems = ((prods.data as any[]) ?? []).map((p) => ({
      text: `${p.name}${p.description ? ` — ${p.description}` : ""}`,
    }));
    const serviceItems = ((svcs.data as any[]) ?? []).map((s) => ({
      text: `${s.name}${s.description ? ` — ${s.description}` : ""}`,
    }));
    const faqItems = ((faqs.data as any[]) ?? []).map((f) => ({
      text: `Q: ${f.question}${f.answer ? ` A: ${f.answer}` : ""}`,
    }));
    const docItems = ((docs.data as any[]) ?? []).map((d) => ({
      text: `${d.title}${d.category ? ` (${d.category})` : ""}${d.summary ? ` — ${d.summary}` : ""}`,
    }));

    const sections: string[] = [];
    const topProducts = rank(productItems, query, 6);
    const topServices = rank(serviceItems, query, 6);
    const topFaqs = rank(faqItems, query, 5);
    const topDocs = rank(docItems, query, 6);

    if (topProducts.length) sections.push(`Products:\n${topProducts.map((p) => `- ${p.text}`).join("\n")}`);
    if (topServices.length) sections.push(`Services:\n${topServices.map((s) => `- ${s.text}`).join("\n")}`);
    if (topFaqs.length) sections.push(`FAQs:\n${topFaqs.map((f) => `- ${f.text}`).join("\n")}`);
    if (topDocs.length) sections.push(`Knowledge documents:\n${topDocs.map((d) => `- ${d.text}`).join("\n")}`);

    if (!sections.length) return { block: "", loaded: false };
    return {
      block: `KNOWLEDGE CONTEXT (use these facts; do not invent product/service names):\n${sections.join("\n\n")}`,
      loaded: true,
    };
  } catch {
    return { block: "", loaded: false };
  }
}

async function loadMemoryBlock(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
): Promise<{ block: string; loaded: boolean }> {
  try {
    const { data } = await supabase
      .from("mkt_campaigns")
      .select("name,objective,status")
      .eq("created_by", userId)
      .order("updated_at", { ascending: false })
      .limit(8);
    const rows = (data as any[]) ?? [];
    if (!rows.length) return { block: "", loaded: false };
    const lines = rows
      .map((r) => `- ${r.name}${r.objective ? ` [${r.objective}]` : ""}${r.status ? ` (${r.status})` : ""}`)
      .join("\n");
    return {
      block: `AI MEMORY (recent campaigns — reuse tone/angle, avoid repeating exact titles):\n${lines}`,
      loaded: true,
    };
  } catch {
    return { block: "", loaded: false };
  }
}

function detectMissing(brandBlock: string): { complete: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!brandBlock) return { complete: false, missing: ["brand_profile"] };
  if (!/• Brand:/.test(brandBlock)) missing.push("brand_name");
  if (!/• Tone of voice:/.test(brandBlock)) missing.push("tone_of_voice");
  if (!/• Colors:/.test(brandBlock)) missing.push("colors");
  if (!/• Website:/.test(brandBlock)) missing.push("website");
  return { complete: missing.length === 0, missing };
}

// ---------------- public API ----------------
/**
 * Build a unified system prompt that automatically includes brand identity,
 * relevant knowledge, and recent AI memory. Cached per user/query for 60s.
 * Never throws — returns an empty prompt with diagnostics on any failure so
 * generation continues gracefully.
 */
export async function buildAiContext(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  opts: AiContextOptions = {},
): Promise<AiContextResult> {
  const t0 = Date.now();
  const key = cacheKey(userId, opts);
  if (!opts.fresh) {
    const hit = CACHE.get(key);
    if (hit && hit.expires > Date.now()) {
      return {
        systemPrompt: hit.value.systemPrompt,
        diagnostics: { ...hit.value.diagnostics, cache: "hit", injectionMs: Date.now() - t0 },
      };
    }
  }

  const maxChars = opts.maxChars ?? 6000;
  const includeKnowledge = opts.includeKnowledge !== false;
  const includeMemory = opts.includeMemory !== false;
  const query = opts.query ?? "";

  const [workspaceId, brandBlock] = await Promise.all([
    resolveWorkspaceId(supabase, userId).catch(() => null),
    buildBrandSystemPrompt(supabase, userId).catch(() => ""),
  ]);

  const [knowledge, memory] = await Promise.all([
    includeKnowledge && workspaceId
      ? loadKnowledgeBlock(supabase, workspaceId, query)
      : Promise.resolve({ block: "", loaded: false }),
    includeMemory
      ? loadMemoryBlock(supabase, userId)
      : Promise.resolve({ block: "", loaded: false }),
  ]);

  const sources: string[] = [];
  const parts: string[] = [];
  if (brandBlock) {
    parts.push(brandBlock);
    sources.push("brand");
  }
  if (knowledge.block) {
    parts.push(knowledge.block);
    sources.push("knowledge");
  }
  if (memory.block) {
    parts.push(memory.block);
    sources.push("memory");
  }

  let systemPrompt = parts.join("\n\n---\n\n");
  if (systemPrompt.length > maxChars) {
    // Preserve brand block in full, truncate the rest.
    const overflow = systemPrompt.length - maxChars;
    if (knowledge.block && knowledge.block.length > overflow + 200) {
      const trimmed = knowledge.block.slice(0, knowledge.block.length - overflow - 20) + "\n…(truncated)";
      systemPrompt = [brandBlock, trimmed, memory.block].filter(Boolean).join("\n\n---\n\n");
    } else {
      systemPrompt = systemPrompt.slice(0, maxChars) + "\n…(truncated)";
    }
  }

  const { complete, missing } = detectMissing(brandBlock);
  const diagnostics: AiContextDiagnostics = {
    workspaceLoaded: !!workspaceId,
    workspaceId,
    brandLoaded: !!brandBlock,
    knowledgeLoaded: knowledge.loaded,
    memoryLoaded: memory.loaded,
    contextChars: systemPrompt.length,
    sources,
    injectionMs: Date.now() - t0,
    cache: opts.fresh ? "bypass" : "miss",
    brandComplete: complete,
    missing,
  };

  const result: AiContextResult = { systemPrompt, diagnostics };
  CACHE.set(key, { value: result, expires: Date.now() + CACHE_TTL_MS });
  return result;
}

/**
 * Convenience: prepend the unified context to an existing system prompt.
 * Use this when a caller already has a task-specific system message.
 */
export function withAiContext(existingSystem: string | undefined, contextPrompt: string): string {
  if (!contextPrompt) return existingSystem ?? "";
  if (!existingSystem) return contextPrompt;
  return `${contextPrompt}\n\n---\n\n${existingSystem}`;
}
