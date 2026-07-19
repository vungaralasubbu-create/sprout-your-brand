// Search Console indexing tracker. Records snapshots per page.
// Callers can plug in the Google Search Console URL Inspection API via the
// existing connector-gateway proxy; here we only store the results.
import { getAdmin } from "./service-client.server";

export type IndexSnapshot = {
  page_id: string;
  url: string;
  coverage_state?: string | null;
  last_crawl_at?: string | null;
  canonical_url?: string | null;
  google_canonical?: string | null;
  indexing_verdict?: string | null;
  robots_txt_state?: string | null;
  page_fetch_state?: string | null;
  raw?: unknown;
};

export async function recordIndexSnapshot(s: IndexSnapshot): Promise<void> {
  const admin = await getAdmin();
  await admin.from("pseo_indexing_status").insert({ ...s, checked_at: new Date().toISOString() });
  const derived =
    s.indexing_verdict === "PASS" ? "indexed" :
    s.coverage_state?.toLowerCase().includes("submitted and indexed") ? "indexed" :
    s.coverage_state?.toLowerCase().includes("discovered") ? "pending" :
    s.coverage_state?.toLowerCase().includes("crawled") ? "pending" :
    s.coverage_state?.toLowerCase().includes("excluded") ? "excluded" :
    s.coverage_state?.toLowerCase().includes("error") ? "failed" : "unknown";
  await admin.from("pseo_pages").update({
    index_status: derived,
    index_last_checked_at: new Date().toISOString(),
  }).eq("id", s.page_id);
}

export async function indexCoverageSummary(): Promise<Record<string, number>> {
  const admin = await getAdmin();
  const { data } = await admin.from("pseo_pages").select("index_status");
  const out: Record<string, number> = {};
  for (const r of data ?? []) {
    const k = (r.index_status as string | null) ?? "unknown";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}
