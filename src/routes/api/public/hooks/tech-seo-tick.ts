// Scheduled hook for the Technical SEO & Site Health Center.
// Called by pg_cron via net.http_post. Authenticated via the Supabase
// publishable/anon key on the `apikey` header.

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { auditBatch } from "@/lib/tech-seo/auditor.server";
import { validateSitemap, validateRobots } from "@/lib/tech-seo/sitemap-validator.server";

export const Route = createFileRoute("/api/public/hooks/tech-seo-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!apikey || apikey !== expected) {
          return new Response(
            JSON.stringify({ error: "unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        const url = process.env.SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const sb = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        }) as any;

        // Read settings + top pages
        const { data: settings } = await sb
          .from("tsh_settings")
          .select("*")
          .limit(1)
          .maybeSingle();
        const base = (settings?.base_url ?? "https://glintr.com").replace(/\/$/, "");
        const maxPages = Math.min(Number(settings?.max_pages_per_run ?? 200), 500);

        const { data: pages } = await sb
          .from("tsh_pages")
          .select("url, last_crawled_at")
          .order("last_crawled_at", { ascending: true, nullsFirst: true })
          .limit(maxPages);

        let urls = (pages ?? []).map((p: any) => p.url as string);
        if (!urls.length) {
          urls = [`${base}/`, `${base}/programs`, `${base}/blog`];
        }

        const { data: run } = await sb
          .from("tsh_audit_runs")
          .insert({
            kind: "scheduled",
            status: "running",
            started_at: new Date().toISOString(),
            config: { maxPages },
          })
          .select("id")
          .maybeSingle();

        const runId = run?.id as string | undefined;
        const summary = runId
          ? await auditBatch(sb, runId, urls, 4)
          : { pagesScanned: 0, issuesFound: 0 };

        if (runId) {
          await sb
            .from("tsh_audit_runs")
            .update({
              status: "completed",
              finished_at: new Date().toISOString(),
              pages_scanned: summary.pagesScanned,
              issues_found: summary.issuesFound,
            })
            .eq("id", runId);
        }

        // Sitemap + robots (best effort)
        await Promise.all([
          validateSitemap(sb, `${base}/sitemap.xml`).catch(() => null),
          validateRobots(base).catch(() => null),
        ]);

        return Response.json({
          ok: true,
          runId,
          summary,
        });
      },
    },
  },
});
