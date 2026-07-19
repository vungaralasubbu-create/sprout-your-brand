/**
 * Internal Linking Engine — server functions.
 *
 * The graph itself lives in `public.internal_links` and is recomputed
 * deterministically by the `rebuild_internal_links()` SQL function.
 *
 * Public reads use a server-publishable Supabase client so links can be
 * fetched from SSR loaders on public routes (course pages, blog posts,
 * career paths, etc.) without a user session.
 *
 * Privileged operations (rebuild, orphan report) go through
 * `requireSupabaseAuth` and re-check the caller's role server-side.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InternalLinkEntity =
  | "course"
  | "blog"
  | "career_path"
  | "skill"
  | "certification"
  | "job"
  | "faq";

export interface InternalLinkItem {
  to_type: InternalLinkEntity;
  to_id: string;
  relation: string;
  score: number;
  reason: string | null;
  title: string | null;
  slug: string | null;
  /** Resolved public URL for the target entity (best-effort). */
  href: string;
}

// Route each entity type to its canonical public URL. Kept in one place so
// consumers never hand-assemble `/programs/${slug}`-style strings.
export function hrefFor(type: InternalLinkEntity, slug: string | null, id: string): string {
  switch (type) {
    case "course":        return slug ? `/programs/${slug}` : `/programs`;
    case "blog":          return slug ? `/blog/${slug}` : `/blog`;
    case "career_path":   return slug ? `/careers/${slug}` : `/careers`;
    case "skill":         return slug ? `/skills/${slug}` : `/skills`;
    case "job":           return slug ? `/jobs/${slug}` : `/jobs`;
    case "faq":           return slug ? `/help/${slug}` : `/help`;
    case "certification": return `/programs?certification=${id}`;
  }
}

function publicClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

const entitySchema = z.enum([
  "course", "blog", "career_path", "skill", "certification", "job", "faq",
]);

const getLinksInput = z.object({
  fromType: entitySchema,
  fromId: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(8),
  relation: z.string().min(1).max(64).optional(),
});

/**
 * Fetch outbound internal links for one entity. Returns links sorted by
 * relevance score. Every item includes a resolved `href` so the caller can
 * render `<Link>`s without another round trip.
 */
export const getInternalLinks = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => getLinksInput.parse(d))
  .handler(async ({ data }): Promise<InternalLinkItem[]> => {
    const sb = publicClient();
    const { data: rows, error } = await sb.rpc("get_internal_links", {
      p_from_type: data.fromType,
      p_from_id: data.fromId,
      p_limit: data.limit,
      p_relation: data.relation ?? null,
    });
    if (error) return [];
    const items = (rows ?? []) as Array<{
      to_type: InternalLinkEntity;
      to_id: string;
      relation: string;
      score: number;
      reason: string | null;
      title: string | null;
      slug: string | null;
    }>;
    return items.map((r) => ({
      ...r,
      href: hrefFor(r.to_type, r.slug, r.to_id),
    }));
  });

/**
 * Fetch inbound + outbound links, grouped by relation, for a Related-Content
 * block on any entity page. Convenience wrapper over `getInternalLinks`.
 */
export const getRelatedLinks = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({
      fromType: entitySchema,
      fromId: z.string().uuid(),
      perRelation: z.number().int().min(1).max(20).default(6),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<Record<string, InternalLinkItem[]>> => {
    const sb = publicClient();
    const { data: rows, error } = await sb.rpc("get_internal_links", {
      p_from_type: data.fromType,
      p_from_id: data.fromId,
      p_limit: 200,
      p_relation: null,
    });
    if (error) return {};
    const grouped: Record<string, InternalLinkItem[]> = {};
    for (const raw of (rows ?? []) as Array<{
      to_type: InternalLinkEntity;
      to_id: string;
      relation: string;
      score: number;
      reason: string | null;
      title: string | null;
      slug: string | null;
    }>) {
      const item: InternalLinkItem = {
        ...raw,
        href: hrefFor(raw.to_type, raw.slug, raw.to_id),
      };
      const bucket = (grouped[raw.relation] ??= []);
      if (bucket.length < data.perRelation) bucket.push(item);
    }
    return grouped;
  });

/**
 * Rebuild the full graph. Staff-only.
 */
export const rebuildInternalLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
    ]);
    if (!isAdmin && !isSuper) throw new Error("Forbidden");
    const { data, error } = await context.supabase.rpc("rebuild_internal_links");
    if (error) throw error;
    return { relations: (data ?? []) as Array<{ relation: string; inserted: number }> };
  });

/**
 * List orphan pages — entities with zero inbound and zero outbound links.
 * Used by editors to close site-architecture gaps.
 */
export const listInternalLinkOrphans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ limit: z.number().int().min(1).max(500).default(100) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
    ]);
    if (!isAdmin && !isSuper) throw new Error("Forbidden");
    const { data: rows } = await context.supabase
      .from("internal_link_orphans")
      .select("entity_type, id, title, slug")
      .limit(data.limit);
    return (rows ?? []) as Array<{
      entity_type: InternalLinkEntity;
      id: string;
      title: string | null;
      slug: string | null;
    }>;
  });
