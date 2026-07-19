/**
 * Broken link + orphan monitor. Read-only: records issues, never mutates content.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function probe(url: string): Promise<{ status: number; chain: string[] }> {
  const chain: string[] = [];
  let current = url;
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(current, { method: "HEAD", redirect: "manual" });
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get("location");
        if (!loc) return { status: r.status, chain };
        chain.push(loc);
        current = new URL(loc, current).toString();
        continue;
      }
      return { status: r.status, chain };
    } catch {
      return { status: 0, chain };
    }
  }
  return { status: 508, chain }; // loop
}

async function record(issue: Record<string, unknown>) {
  await supabaseAdmin.from("link_health_issues").insert(issue as any);
}

/** Scan a batch of nodes for URL health. */
export async function scanHealth(limit = 100, baseUrl = ""): Promise<{ scanned: number; issues: number }> {
  const { data: nodes } = await supabaseAdmin
    .from("link_graph_nodes").select("id, url, content_type")
    .order("last_crawled_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (!nodes?.length) return { scanned: 0, issues: 0 };

  let issues = 0;
  for (const n of nodes) {
    if (!baseUrl) break;
    const full = baseUrl.replace(/\/$/, "") + (n as any).url;
    const { status, chain } = await probe(full);
    let type: string | null = null;
    let severity = "medium";
    if (status === 0 || status >= 500) { type = "broken"; severity = "high"; }
    else if (status === 404) { type = "missing"; severity = "high"; }
    else if (status === 508) { type = "redirect_loop"; severity = "high"; }
    else if (chain.length >= 2) { type = "redirect_chain"; severity = "low"; }
    else if (status === 410) { type = "expired"; severity = "medium"; }

    await supabaseAdmin.from("link_graph_nodes").update({
      last_crawled_at: new Date().toISOString(),
    }).eq("id", (n as any).id);

    if (type) {
      await record({
        node_id: (n as any).id,
        url: full,
        issue_type: type,
        severity,
        status_code: status,
        redirect_chain: chain,
        recommendation: recommendationFor(type),
      });
      issues++;
    }
  }
  return { scanned: nodes.length, issues };
}

function recommendationFor(type: string): string {
  const map: Record<string, string> = {
    broken: "Update or remove the reference; add a 301 to the closest live equivalent.",
    missing: "Replace with the current canonical URL or restore the page.",
    redirect_loop: "Break the redirect loop; point to the final destination directly.",
    redirect_chain: "Shorten to a single 301; update source anchors to the final URL.",
    expired: "Refresh outdated content or replace with an active alternative.",
    soft_404: "Return a proper 404 or redirect to a relevant page.",
    orphan: "Add contextual inbound links from parent, sibling, and topic-cluster pages.",
  };
  return map[type] ?? "Review and update the internal reference.";
}

/** Detect orphans (0 inbound edges) and record recommendations. */
export async function detectOrphans(limit = 500): Promise<number> {
  const { data } = await supabaseAdmin
    .from("link_graph_nodes").select("id, url, content_type, topic_cluster")
    .eq("is_orphan", true).limit(limit);
  const rows = (data ?? []).map((n: any) => ({
    node_id: n.id,
    url: n.url,
    issue_type: "orphan",
    severity: "medium",
    recommendation: recommendationFor("orphan"),
    meta: { topic_cluster: n.topic_cluster },
  }));
  if (!rows.length) return 0;
  await supabaseAdmin.from("link_health_issues").insert(rows as any);
  return rows.length;
}
