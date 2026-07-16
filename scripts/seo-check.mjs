#!/usr/bin/env node
/**
 * SEO CI check.
 *
 * Verifies:
 *  1. public/robots.txt exists and has required directives.
 *  2. src/routes/sitemap[.]xml.ts exists and looks valid.
 *  3. No public route has been accidentally set to noindex.
 *
 * Any route that intentionally uses noindex (gated flows, private
 * dashboards, not-found fallbacks) must be listed in ALLOWED_NOINDEX.
 * A new noindex added anywhere else will fail CI — force the author
 * to justify it by adding the path to the allowlist.
 */
import { readFileSync, existsSync } from "node:fs";
import { globSync } from "node:fs";
import { execSync } from "node:child_process";

const errors = [];
const warn = (m) => console.log(`  ⚠ ${m}`);
const fail = (m) => {
  errors.push(m);
  console.log(`  ✖ ${m}`);
};
const ok = (m) => console.log(`  ✓ ${m}`);

// ── 1. robots.txt ──────────────────────────────────────────────
console.log("\n[1/3] public/robots.txt");
const robotsPath = "public/robots.txt";
if (!existsSync(robotsPath)) {
  fail("public/robots.txt is missing");
} else {
  const robots = readFileSync(robotsPath, "utf8");
  const required = [
    { re: /^User-agent:\s*\*/m, msg: "User-agent: * block" },
    { re: /^Allow:\s*\//m, msg: "Allow: / directive" },
    { re: /^Sitemap:\s*https?:\/\/.+\/sitemap\.xml/m, msg: "Sitemap: URL" },
  ];
  for (const { re, msg } of required) {
    re.test(robots) ? ok(msg) : fail(`robots.txt missing ${msg}`);
  }
  // Guard against a site-wide block landing in production.
  if (/^Disallow:\s*\/\s*$/m.test(robots)) {
    fail("robots.txt contains site-wide `Disallow: /` — this blocks all crawlers");
  } else {
    ok("no site-wide Disallow: /");
  }
  for (const path of ["/admin", "/dashboard", "/api", "/auth", "/private"]) {
    new RegExp(`^Disallow:\\s*${path}(/|$)`, "m").test(robots)
      ? ok(`Disallow: ${path}`)
      : warn(`robots.txt has no explicit Disallow for ${path}`);
  }
}

// ── 2. sitemap route ───────────────────────────────────────────
console.log("\n[2/3] src/routes/sitemap[.]xml.ts");
const sitemapPath = "src/routes/sitemap[.]xml.ts";
if (!existsSync(sitemapPath)) {
  fail("sitemap route file is missing");
} else {
  const src = readFileSync(sitemapPath, "utf8");
  if (!/createFileRoute\(["']\/sitemap\.xml["']\)/.test(src)) {
    fail("sitemap route does not register /sitemap.xml");
  } else ok("registered at /sitemap.xml");
  if (!/BASE_URL\s*=\s*["']https?:\/\//.test(src)) {
    fail("BASE_URL is not an absolute https URL");
  } else ok("BASE_URL is absolute");
  if (!/<urlset[^>]*sitemaps\.org\/schemas\/sitemap\/0\.9/.test(src)) {
    fail("sitemap XML namespace missing");
  } else ok("urlset namespace present");
}

// ── 3. noindex audit on public routes ──────────────────────────
console.log("\n[3/3] noindex audit on public routes");

// Paths (relative to src/routes/) that are ALLOWED to render noindex.
// Everything else must be publicly indexable.
const ALLOWED_NOINDEX = new Set([
  // Gated flows / auth
  "auth.tsx",
  "partner.apply.tsx",
  "partner.signup.tsx",
  "launch-your-brand.start.tsx",
  "launch-your-brand.consultation.tsx",
  "programs.$category.$course.apply.tsx",
  "verify-certificate.$code.tsx",
  // Private workspaces & support (public URL, per-user content)
  "my.tsx",
  "workspace.tsx",
  "workspace.live.tsx",
  "workspace.voice.tsx",
  "partner-support.requests.tsx",
  "partner-support.requests.$ref.tsx",
  "student-support.requests.tsx",
  "student-support.requests.$ref.tsx",
  // Live classroom rooms (per-session, not indexable)
  "live.$classId.tsx",
  // Dynamic detail pages: noindex is a fallback only when the row is
  // missing. The script trusts the allowlist here; verify by hand
  // that the noindex branch is guarded by `if (!loaderData)` etc.
  "ai-agents.$id.tsx",
  "faqs.$slug.tsx",
  "learn.$slug.tsx",
  "learn.collections.$slug.tsx",
  "success-stories.$storySlug.tsx",
  "tools.$slug.tsx",
]);

let grepOut = "";
try {
  grepOut = execSync(
    `grep -rln --include='*.tsx' --include='*.ts' 'noindex' src/routes`,
    { encoding: "utf8" },
  );
} catch {
  // grep returns exit 1 when there are no matches — that's fine.
}

const offenders = [];
for (const file of grepOut.split("\n").filter(Boolean)) {
  const rel = file.replace(/^src\/routes\//, "");
  // Anything under an auth-gated layout is private by construction.
  if (rel.startsWith("_authenticated/")) continue;
  if (ALLOWED_NOINDEX.has(rel)) continue;
  offenders.push(rel);
}

if (offenders.length === 0) {
  ok("no unexpected noindex on public routes");
} else {
  for (const rel of offenders) {
    fail(
      `public route src/routes/${rel} sets noindex — remove it, or add the file to ALLOWED_NOINDEX in scripts/seo-check.mjs with justification`,
    );
  }
}

// ── result ─────────────────────────────────────────────────────
console.log("");
if (errors.length) {
  console.error(`SEO check failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log("SEO check passed.");
