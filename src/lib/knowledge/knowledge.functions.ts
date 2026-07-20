import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ws(ctx: any) {
  const { data } = await ctx.supabase
    .from("mc_workspace_members").select("workspace_id,role")
    .eq("user_id", ctx.userId).limit(1).maybeSingle();
  return data ?? null;
}

export const getOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await ws(context); if (!m) return { workspace: null };
    const sb = context.supabase;
    const [docs, srcs, prods, faqs, brand] = await Promise.all([
      sb.from("kn_documents").select("id,title,category,updated_at,tags").eq("workspace_id", m.workspace_id).order("updated_at",{ascending:false}).limit(10),
      sb.from("kn_sources").select("id,name,kind,status,last_synced_at").eq("workspace_id", m.workspace_id).order("updated_at",{ascending:false}).limit(10),
      sb.from("kn_products").select("id,name").eq("workspace_id", m.workspace_id).limit(6),
      sb.from("kn_faqs").select("id,question").eq("workspace_id", m.workspace_id).limit(6),
      sb.from("kn_brand").select("*").eq("workspace_id", m.workspace_id).maybeSingle(),
    ]);
    const counts = await Promise.all([
      sb.from("kn_documents").select("id",{count:"exact",head:true}).eq("workspace_id", m.workspace_id),
      sb.from("kn_sources").select("id",{count:"exact",head:true}).eq("workspace_id", m.workspace_id),
      sb.from("kn_products").select("id",{count:"exact",head:true}).eq("workspace_id", m.workspace_id),
      sb.from("kn_faqs").select("id",{count:"exact",head:true}).eq("workspace_id", m.workspace_id),
    ]);
    return {
      workspace: { id: m.workspace_id, role: m.role },
      recentDocs: docs.data ?? [], recentSources: srcs.data ?? [],
      products: prods.data ?? [], faqs: faqs.data ?? [], brand: brand.data ?? null,
      counts: { documents: counts[0].count ?? 0, sources: counts[1].count ?? 0, products: counts[2].count ?? 0, faqs: counts[3].count ?? 0 },
    };
  });

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ category: z.string().optional(), q: z.string().max(200).optional() }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) return { documents: [] };
    let q = context.supabase.from("kn_documents").select("id,title,summary,category,updated_at,tags,file_url,external_url,version").eq("workspace_id", m.workspace_id).order("updated_at",{ascending:false}).limit(100);
    if (data.category) q = q.eq("category", data.category as any);
    if (data.q) q = q.textSearch("content_tsv", data.q, { type: "websearch" });
    const { data: rows } = await q;
    return { documents: rows ?? [] };
  });

export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    title: z.string().min(1).max(300),
    content: z.string().max(500000).default(""),
    summary: z.string().max(2000).optional(),
    category: z.enum(["documents","websites","brand","products","services","sales","marketing","support","competitors","personas","faqs","team","media","other"]).default("documents"),
    tags: z.array(z.string()).default([]),
    external_url: z.string().url().optional().nullable(),
    file_url: z.string().url().optional().nullable(),
    source_id: z.string().uuid().optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) throw new Error("No workspace");
    const { data: row, error } = await context.supabase.from("kn_documents").insert({
      workspace_id: m.workspace_id, title: data.title, content: data.content, summary: data.summary,
      category: data.category, tags: data.tags, external_url: data.external_url, file_url: data.file_url,
      source_id: data.source_id, created_by: context.userId,
    }).select("id,title,category,updated_at").maybeSingle();
    if (error) throw new Error(error.message);
    return { document: row };
  });

export const importWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ url: z.string().url() }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) throw new Error("No workspace");
    const host = new URL(data.url).hostname;
    const { data: src, error } = await context.supabase.from("kn_sources").insert({
      workspace_id: m.workspace_id, kind: "website", name: host, url: data.url, status: "pending",
      auto_sync: true, sync_frequency: "weekly", created_by: context.userId,
    }).select().maybeSingle();
    if (error) throw new Error(error.message);
    return { source: src };
  });

export const listSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await ws(context); if (!m) return { sources: [] };
    const { data } = await context.supabase.from("kn_sources").select("*").eq("workspace_id", m.workspace_id).order("updated_at",{ascending:false});
    return { sources: data ?? [] };
  });

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await ws(context); if (!m) return { products: [] };
    const { data } = await context.supabase.from("kn_products").select("*").eq("workspace_id", m.workspace_id).order("updated_at",{ascending:false});
    return { products: data ?? [] };
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(200),
    description: z.string().max(4000).optional(),
    price: z.string().max(100).optional(),
    target_audience: z.string().max(1000).optional(),
    benefits: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    competitors: z.array(z.string()).default([]),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) throw new Error("No workspace");
    const payload = { ...data, workspace_id: m.workspace_id };
    if (data.id) {
      const { error } = await context.supabase.from("kn_products").update(payload).eq("id", data.id).eq("workspace_id", m.workspace_id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("kn_products").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const listFaqs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await ws(context); if (!m) return { faqs: [] };
    const { data } = await context.supabase.from("kn_faqs").select("*").eq("workspace_id", m.workspace_id).order("sort_order",{ascending:true});
    return { faqs: data ?? [] };
  });

export const upsertFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({
    id: z.string().uuid().optional(),
    question: z.string().min(1).max(500),
    answer: z.string().min(1).max(4000),
    category: z.string().max(80).optional(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) throw new Error("No workspace");
    if (data.id) {
      await context.supabase.from("kn_faqs").update({ ...data }).eq("id", data.id).eq("workspace_id", m.workspace_id);
    } else {
      await context.supabase.from("kn_faqs").insert({ ...data, workspace_id: m.workspace_id });
    }
    return { ok: true };
  });

export const searchKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ query: z.string().min(1).max(500) }).parse(v))
  .handler(async ({ data, context }) => {
    const m = await ws(context); if (!m) return { results: [] };
    const start = Date.now();
    const { data: rows } = await context.supabase
      .from("kn_documents")
      .select("id,title,summary,category,updated_at")
      .eq("workspace_id", m.workspace_id)
      .textSearch("content_tsv", data.query, { type: "websearch" })
      .limit(10);
    await context.supabase.from("kn_search_logs").insert({
      workspace_id: m.workspace_id, user_id: context.userId,
      query: data.query, results_count: (rows ?? []).length, duration_ms: Date.now() - start,
    });
    return { results: rows ?? [] };
  });

export const searchHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await ws(context); if (!m) return { logs: [] };
    const { data } = await context.supabase.from("kn_search_logs").select("*").eq("workspace_id", m.workspace_id).order("created_at",{ascending:false}).limit(100);
    return { logs: data ?? [] };
  });
