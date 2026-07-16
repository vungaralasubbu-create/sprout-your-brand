import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TOPICAL_DOMAINS, TRACKED_ENTITIES, scoreDomainCoverage, entityState } from "./authority";
import { computeScores, type ScoreInput } from "./scoring";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

function wc(s: string) {
  return String(s ?? "").replace(/`{1,3}[\s\S]*?`{1,3}/g, " ").replace(/[#>*_\-\[\]()!]/g, " ").split(/\s+/).filter(Boolean).length;
}

export const getIntelSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data: items } = await s.from("content_items").select("id, title, slug, type, status, updated_at, body_markdown, seo_title, seo_description, featured_image, focus_topic, category_id, word_count");
    const published = (items ?? []).filter((i: any) => i.status === "published");

    const titles = new Set<string>(published.map((p: any) => String(p.title ?? "")));

    // Domain + entity coverage
    const domainRows = TOPICAL_DOMAINS.map((d) => ({
      slug: d.slug, name: d.name, category: d.category,
      ...scoreDomainCoverage(d, titles),
    }));
    const domainCoveragePct = Math.round(
      domainRows.reduce((a, b) => a + b.pct, 0) / (domainRows.length || 1),
    );

    const entityRows = TRACKED_ENTITIES.map((e) => ({ entity: e, state: entityState(e, titles) }));
    const entityCovered = entityRows.filter((e) => e.state === "covered").length;
    const entityCoveragePct = Math.round((entityCovered / entityRows.length) * 100);

    // Per-item quick scores
    const now = Date.now();
    let sumRead = 0, sumStruct = 0, sumSeo = 0, sumGeo = 0, sumLink = 0, sumAcc = 0, sumComp = 0, sumMedia = 0, sumFresh = 0;
    let brokenLinks = 0, orphaned = 0;
    for (const it of published) {
      const md = String(it.body_markdown ?? "");
      const words = it.word_count ?? wc(md);
      const headings = (md.match(/^#{1,3}\s.+$/gm) ?? []).length;
      const links = md.match(/\[([^\]]+)\]\(([^)]+)\)/g) ?? [];
      const internal = links.filter((l) => !/\]\(https?:/.test(l)).length;
      const images = (md.match(/!\[[^\]]*\]\(([^)]+)\)/g) ?? []).length;
      const missingAlt = (md.match(/!\[\s*\]\(/g) ?? []).length;
      const days = it.updated_at ? (now - new Date(it.updated_at).getTime()) / 86400000 : 999;
      const seoT = (it.seo_title ?? "").length;
      const seoD = (it.seo_description ?? "").length;

      sumRead += words > 500 && words < 3200 ? 100 : words < 500 ? (words / 500) * 100 : Math.max(50, 100 - (words - 3200) / 40);
      sumStruct += Math.min(100, headings * 15);
      sumSeo += (seoT >= 30 && seoT <= 70 ? 50 : 20) + (seoD >= 120 && seoD <= 160 ? 50 : 20);
      sumGeo += (headings >= 4 ? 30 : headings * 7) + (/faq|q:|question/i.test(md) ? 35 : 0) + (/summary|key takeaway|tl;dr/i.test(md) ? 35 : 0);
      sumLink += Math.min(100, internal * 25);
      sumAcc += images === 0 ? 80 : Math.max(0, 100 - (missingAlt / Math.max(1, images)) * 100);
      sumComp += (it.featured_image ? 25 : 0) + (it.focus_topic ? 25 : 0) + (it.category_id ? 20 : 0) + (words >= 500 ? 30 : (words / 500) * 30);
      sumMedia += images === 0 ? 30 : Math.min(100, images * 25);
      sumFresh += days < 90 ? 100 : days < 180 ? 75 : days < 365 ? 50 : 20;
      if (internal === 0) orphaned += 1;
      // heuristic broken-link count: markdown links pointing to obvious missing paths
      brokenLinks += (md.match(/\]\((\/[^)#?]+)\)/g) ?? []).filter((l) => /\/(TODO|undefined|null)\b/i.test(l)).length;
    }
    const n = Math.max(1, published.length);
    const avg = (t: number) => Math.round(t / n);

    const scores = computeScores({
      publishedCount: published.length,
      avgReadability: avg(sumRead),
      avgStructure: avg(sumStruct),
      avgSeo: avg(sumSeo),
      avgGeo: avg(sumGeo),
      avgLinking: avg(sumLink),
      avgAccessibility: avg(sumAcc),
      avgCompleteness: avg(sumComp),
      avgMedia: avg(sumMedia),
      avgFreshness: avg(sumFresh),
      domainCoveragePct,
      entityCoveragePct,
      orphanRatio: orphaned / n,
      brokenLinks,
    } satisfies ScoreInput);

    return {
      scores,
      domainRows,
      entityRows,
      totals: {
        published: published.length,
        orphaned,
        brokenLinks,
        entityCovered,
        entityTotal: entityRows.length,
        domainCoveragePct,
        entityCoveragePct,
      },
    };
  });
