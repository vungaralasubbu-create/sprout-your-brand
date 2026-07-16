#!/usr/bin/env node
/**
 * Submits the production sitemap to Google Search Console and reports
 * the current sitemap health. Exits non-zero on any submission or
 * indexing error so CI surfaces the failure.
 *
 * Required environment variables (set as GitHub Actions secrets):
 *   GSC_SITE_URL             e.g. "sc-domain:glintr.com"
 *   SITEMAP_URL              e.g. "https://glintr.com/sitemap.xml"
 *   GCP_SA_KEY_JSON          Full JSON of a Google Cloud service account
 *                            key. The service account's client_email must
 *                            be added as a user (Full/Owner) on the GSC
 *                            property at
 *                            search.google.com/search-console/users
 *
 * No npm dependencies — signs the JWT with node:crypto.
 */
import { createSign } from "node:crypto";

const {
  GSC_SITE_URL,
  SITEMAP_URL,
  GCP_SA_KEY_JSON,
} = process.env;

for (const [k, v] of Object.entries({ GSC_SITE_URL, SITEMAP_URL, GCP_SA_KEY_JSON })) {
  if (!v) {
    console.error(`Missing required env var: ${k}`);
    process.exit(2);
  }
}

const sa = JSON.parse(GCP_SA_KEY_JSON);
const SCOPE = "https://www.googleapis.com/auth/webmasters";

// ── mint an access token from the service account ─────────────
function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const sig = b64url(signer.sign(sa.private_key));
  const jwt = `${header}.${claims}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed [${res.status}]: ${await res.text()}`);
  }
  return (await res.json()).access_token;
}

const token = await getAccessToken();
const auth = { Authorization: `Bearer ${token}` };
const siteEnc = encodeURIComponent(GSC_SITE_URL);
const smEnc = encodeURIComponent(SITEMAP_URL);
const base = `https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps/${smEnc}`;

// ── 1. Submit ─────────────────────────────────────────────────
console.log(`Submitting ${SITEMAP_URL} to ${GSC_SITE_URL} …`);
const submit = await fetch(base, { method: "PUT", headers: auth });
if (!submit.ok) {
  const body = await submit.text();
  console.error(`Submission failed [${submit.status}]: ${body}`);
  process.exit(1);
}
console.log(`  ✓ submitted (HTTP ${submit.status})`);

// ── 2. Report status ──────────────────────────────────────────
const statusRes = await fetch(base, { headers: auth });
if (!statusRes.ok) {
  console.error(`Status fetch failed [${statusRes.status}]: ${await statusRes.text()}`);
  process.exit(1);
}
const status = await statusRes.json();
console.log("Sitemap status:");
console.log(JSON.stringify(status, null, 2));

const errors = Number(status.errors ?? 0);
const warnings = Number(status.warnings ?? 0);
if (errors > 0) {
  console.error(`✖ Google reports ${errors} error(s) in the sitemap.`);
  process.exit(1);
}
if (warnings > 0) {
  console.warn(`⚠ Google reports ${warnings} warning(s) in the sitemap.`);
}

// ── 3. Report per-URL indexing coverage from the sitemapsIndex contents ──
if (Array.isArray(status.contents)) {
  console.log("\nPer-content-type coverage:");
  for (const c of status.contents) {
    console.log(
      `  ${c.type}: submitted=${c.submitted ?? "?"}  indexed=${c.indexed ?? "?"}`,
    );
  }
}

console.log("\nGSC sitemap submission OK.");
