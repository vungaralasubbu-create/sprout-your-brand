// Sitemap & robots.txt validator.

type Sb = { from: (t: string) => any };

export async function validateSitemap(sb: Sb, sitemapUrl: string) {
  const started = Date.now();
  try {
    const res = await fetch(sitemapUrl, {
      headers: { "User-Agent": "GlintrTechSEO/1.0" },
    });
    const status = res.status;
    const text = await res.text();
    const size = new Blob([text]).size;

    const urls = [...text.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim());
    const set = new Set<string>();
    const dupes: string[] = [];
    const invalid: string[] = [];
    for (const u of urls) {
      if (set.has(u)) dupes.push(u);
      set.add(u);
      try {
        new URL(u);
      } catch {
        invalid.push(u);
      }
    }

    // Probe up to 20 URLs for broken entries.
    const sample = urls.slice(0, 20);
    let broken = 0;
    await Promise.all(
      sample.map(async (u) => {
        try {
          const r = await fetch(u, { method: "HEAD" });
          if (r.status >= 400) broken++;
        } catch {
          broken++;
        }
      }),
    );

    await sb.from("tsh_sitemap_status").insert({
      sitemap: sitemapUrl,
      status_code: status,
      url_count: urls.length,
      invalid_urls: invalid.length,
      duplicate_urls: dupes.length,
      broken_entries: broken,
      size_bytes: size,
      meta: { fetched_ms: Date.now() - started },
    });

    return {
      sitemap: sitemapUrl,
      status,
      url_count: urls.length,
      invalid: invalid.length,
      duplicates: dupes.length,
      broken,
      size_bytes: size,
    };
  } catch (err) {
    await sb.from("tsh_sitemap_status").insert({
      sitemap: sitemapUrl,
      status_code: 0,
      error: (err as Error).message.slice(0, 400),
    });
    return { sitemap: sitemapUrl, error: (err as Error).message };
  }
}

export async function validateRobots(baseUrl: string) {
  const url = new URL("/robots.txt", baseUrl).toString();
  const res = await fetch(url);
  const text = await res.text();
  const disallowAll = /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*(\n|$)/i.test(text);
  const sitemapRefs = [...text.matchAll(/Sitemap:\s*(\S+)/gi)].map((m) => m[1]);
  return {
    url,
    status: res.status,
    disallowAll,
    sitemapReferences: sitemapRefs,
    body: text.slice(0, 4000),
  };
}
