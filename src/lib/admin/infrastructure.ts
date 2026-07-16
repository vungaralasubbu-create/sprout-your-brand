// Infrastructure admin — client-side state + placeholder data providers.
// Real backend metrics stream in later; this scaffolds the enterprise dashboard shape.

export type FeatureFlag = {
  key: string;
  label: string;
  description: string;
  category: "product" | "beta" | "experimental";
  defaultOn: boolean;
};

export const FEATURE_FLAGS: FeatureFlag[] = [
  { key: "ai_tutor", label: "AI Tutor", description: "Conversational AI mentor across the site.", category: "product", defaultOn: true },
  { key: "knowledge_graph", label: "Knowledge Graph", description: "Interactive concept graph explorer.", category: "product", defaultOn: true },
  { key: "white_label", label: "White Label EdTech", description: "Brand OS + white-label LMS.", category: "product", defaultOn: true },
  { key: "partner_crm", label: "Partner CRM", description: "Partner workspace + lead pipeline.", category: "product", defaultOn: true },
  { key: "learning_workspace", label: "Learning Workspace", description: "Personal notebooks & flashcards.", category: "product", defaultOn: true },
  { key: "ai_content_factory", label: "AI Content Factory", description: "Admin AI writer & wizard.", category: "beta", defaultOn: true },
  { key: "content_intelligence", label: "Content Intelligence", description: "Editorial insights & decay reports.", category: "beta", defaultOn: true },
  { key: "career_finder", label: "AI Career Finder", description: "Career discovery quiz.", category: "beta", defaultOn: true },
  { key: "roadmap_generator", label: "Roadmap Generator", description: "AI-generated learning roadmaps.", category: "beta", defaultOn: true },
  { key: "voice_mentor", label: "Voice Mentor", description: "Voice chat with the AI mentor.", category: "experimental", defaultOn: false },
  { key: "live_cohorts", label: "Live Cohorts", description: "Scheduled cohort sessions module.", category: "experimental", defaultOn: false },
  { key: "certificate_nft", label: "Verifiable Certificates", description: "On-chain certificate anchoring.", category: "experimental", defaultOn: false },
];

const FLAG_KEY = "glintr:feature-flags:v1";

export function getFlags(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FLAG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const merged: Record<string, boolean> = {};
    for (const f of FEATURE_FLAGS) merged[f.key] = parsed[f.key] ?? f.defaultOn;
    return merged;
  } catch {
    return Object.fromEntries(FEATURE_FLAGS.map((f) => [f.key, f.defaultOn]));
  }
}

export function setFlag(key: string, on: boolean) {
  const current = getFlags();
  current[key] = on;
  window.localStorage.setItem(FLAG_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent("glintr:flags-changed"));
}

// ─────────────────────────────────────────────
// Placeholder telemetry — deterministic mock data so the dashboard renders
// consistently without a live metrics pipeline. Replace with real feeds
// (Grafana / Vercel / Supabase) as those integrations land.
// ─────────────────────────────────────────────

export const ENVIRONMENTS = [
  { key: "development", label: "Development", host: "localhost", tier: "dev", color: "oklch(0.78 0.14 220)" },
  { key: "testing", label: "Testing", host: "test.glintr.internal", tier: "test", color: "oklch(0.75 0.15 90)" },
  { key: "staging", label: "Staging", host: "staging.glintr.com", tier: "staging", color: "oklch(0.72 0.16 45)" },
  { key: "production", label: "Production", host: "glintr.com", tier: "prod", color: "oklch(0.68 0.19 145)" },
] as const;

export type EnvKey = (typeof ENVIRONMENTS)[number]["key"];

export const SYSTEM_HEALTH = {
  overall: "operational" as "operational" | "degraded" | "down",
  services: [
    { name: "Web Application", status: "operational", latency_ms: 82, uptime: 99.98 },
    { name: "API Gateway", status: "operational", latency_ms: 41, uptime: 99.99 },
    { name: "Database (Postgres)", status: "operational", latency_ms: 12, uptime: 99.97 },
    { name: "Object Storage", status: "operational", latency_ms: 55, uptime: 99.99 },
    { name: "Cache Layer", status: "pending", latency_ms: 0, uptime: 0, note: "Redis not yet provisioned" },
    { name: "Search Index", status: "pending", latency_ms: 0, uptime: 0, note: "OpenSearch not yet provisioned" },
    { name: "AI Gateway", status: "operational", latency_ms: 640, uptime: 99.92 },
    { name: "Background Workers", status: "operational", latency_ms: 0, uptime: 99.95 },
  ],
};

export const DEPLOYMENTS = [
  { id: "dep_8b1", version: "v1.42.0", env: "production", status: "success", at: "2026-07-16T08:12:00Z", author: "release-bot", changes: 47 },
  { id: "dep_8a2", version: "v1.41.3", env: "production", status: "success", at: "2026-07-15T19:04:00Z", author: "release-bot", changes: 12 },
  { id: "dep_8a1", version: "v1.41.2", env: "staging", status: "success", at: "2026-07-15T13:22:00Z", author: "release-bot", changes: 8 },
  { id: "dep_7c9", version: "v1.41.0", env: "production", status: "success", at: "2026-07-14T09:41:00Z", author: "release-bot", changes: 63 },
  { id: "dep_7c8", version: "v1.40.9", env: "production", status: "rolled_back", at: "2026-07-13T22:10:00Z", author: "release-bot", changes: 21 },
];

export const JOB_QUEUES = [
  { name: "emails", label: "Emails", queued: 12, running: 3, completed: 18420, failed: 4, avg_ms: 320 },
  { name: "notifications", label: "Notifications", queued: 45, running: 6, completed: 92104, failed: 12, avg_ms: 90 },
  { name: "certificates", label: "Certificate Generation", queued: 2, running: 1, completed: 3241, failed: 0, avg_ms: 4200 },
  { name: "media", label: "Media Processing", queued: 0, running: 0, completed: 1875, failed: 3, avg_ms: 12800 },
  { name: "search-indexing", label: "Search Indexing", queued: 0, running: 0, completed: 0, failed: 0, avg_ms: 0 },
  { name: "analytics", label: "Analytics Rollups", queued: 1, running: 0, completed: 8402, failed: 0, avg_ms: 5100 },
  { name: "ai-tasks", label: "AI Tasks", queued: 8, running: 2, completed: 24519, failed: 27, avg_ms: 3400 },
  { name: "reports", label: "Scheduled Reports", queued: 0, running: 0, completed: 512, failed: 1, avg_ms: 8900 },
];

export const CACHE_LAYERS = [
  { name: "Application Cache", provider: "Redis (planned)", hit_rate: 0, size_mb: 0, keys: 0, status: "pending" },
  { name: "Session Cache", provider: "Redis (planned)", hit_rate: 0, size_mb: 0, keys: 0, status: "pending" },
  { name: "Search Cache", provider: "Redis (planned)", hit_rate: 0, size_mb: 0, keys: 0, status: "pending" },
  { name: "API Cache", provider: "Cloudflare Edge", hit_rate: 78.4, size_mb: 512, keys: 12820, status: "active" },
];

export const SEARCH_INDEXES = [
  { name: "programs", label: "Programs", docs: 26, last_indexed: "2026-07-16T06:00:00Z", status: "pending", provider: "OpenSearch (planned)" },
  { name: "learn", label: "Learn Guides", docs: 42, last_indexed: "2026-07-16T06:00:00Z", status: "pending", provider: "OpenSearch (planned)" },
  { name: "glossary", label: "Glossary", docs: 47, last_indexed: "2026-07-16T06:00:00Z", status: "pending", provider: "OpenSearch (planned)" },
  { name: "blogs", label: "Blogs", docs: 18, last_indexed: "2026-07-16T06:00:00Z", status: "pending", provider: "OpenSearch (planned)" },
  { name: "roadmaps", label: "Roadmaps", docs: 12, last_indexed: "2026-07-16T06:00:00Z", status: "pending", provider: "OpenSearch (planned)" },
  { name: "users", label: "Users (admin)", docs: 0, last_indexed: "-", status: "pending", provider: "OpenSearch (planned)" },
  { name: "crm", label: "CRM Leads", docs: 0, last_indexed: "-", status: "pending", provider: "OpenSearch (planned)" },
  { name: "admin-content", label: "Admin Content", docs: 0, last_indexed: "-", status: "pending", provider: "OpenSearch (planned)" },
];

export const STORAGE_BUCKETS = [
  { bucket: "media-images", type: "Images", used_gb: 4.8, files: 1842 },
  { bucket: "media-videos", type: "Videos", used_gb: 62.1, files: 214 },
  { bucket: "documents", type: "PDFs", used_gb: 1.9, files: 512 },
  { bucket: "certificates", type: "Certificates", used_gb: 0.4, files: 3241 },
  { bucket: "brand-assets", type: "Brand Media", used_gb: 3.2, files: 894 },
  { bucket: "backups", type: "Backups", used_gb: 148.6, files: 42 },
];

export const CDN_METRICS = {
  static_hit_ratio: 96.4,
  image_hit_ratio: 91.2,
  video_hit_ratio: 83.7,
  document_hit_ratio: 88.1,
  bandwidth_tb: 4.82,
  edge_regions: 285,
};

export const DB_METRICS = {
  pool_used: 24,
  pool_max: 100,
  qps: 412,
  slow_queries: 3,
  storage_gb: 18.4,
  index_count: 187,
  replication: "Single primary (read replica planned)",
};

export const MONITORING = {
  cpu_pct: 34,
  memory_pct: 58,
  disk_pct: 22,
  p50_ms: 74,
  p95_ms: 240,
  error_rate: 0.24,
  rpm: 1840,
  active_users: 372,
};

export const ERRORS = [
  { id: "err_01", severity: "critical", source: "server-fn", message: "Payment webhook signature mismatch (Razorpay)", count: 3, first_seen: "2026-07-16T07:12:00Z" },
  { id: "err_02", severity: "warning", source: "frontend", message: "Chunk load failed after deploy (retry succeeded)", count: 47, first_seen: "2026-07-16T08:14:00Z" },
  { id: "err_03", severity: "warning", source: "server-fn", message: "AI Gateway rate limit — Gemini flash", count: 12, first_seen: "2026-07-16T06:41:00Z" },
  { id: "err_04", severity: "api", source: "api", message: "GET /api/v1/certificates/verify — 404 (invalid code)", count: 82, first_seen: "2026-07-16T03:00:00Z" },
  { id: "err_05", severity: "warning", source: "frontend", message: "Image decode failed on Safari 15", count: 6, first_seen: "2026-07-15T22:04:00Z" },
];

export const BACKUPS = {
  last_backup: "2026-07-16T02:00:00Z",
  next_scheduled: "2026-07-17T02:00:00Z",
  size_gb: 18.6,
  retention: "Daily x30 · Weekly x12 · Monthly x24 · Yearly x7",
  restore_history: [
    { at: "2026-05-14T11:20:00Z", target: "staging", initiated_by: "ops@glintr.com", status: "success", duration_min: 8 },
    { at: "2026-03-02T09:00:00Z", target: "staging", initiated_by: "ops@glintr.com", status: "success", duration_min: 11 },
  ],
};

export const SECURITY_METRICS = {
  active_sessions: 421,
  failed_logins_24h: 38,
  rate_limit_events_24h: 194,
  api_key_calls_24h: 12842,
  alerts: [
    { level: "info", message: "TLS certificate renewed for glintr.com", at: "2026-07-14T00:12:00Z" },
    { level: "warning", message: "3 failed admin logins from single IP — throttled", at: "2026-07-15T18:41:00Z" },
  ],
};

export const API_VERSIONS = [
  { version: "v1", status: "stable", requests_24h: 184320, p95_ms: 210, error_rate: 0.18, rate_limit: "1000 rpm/user" },
  { version: "internal", status: "internal", requests_24h: 942104, p95_ms: 92, error_rate: 0.04, rate_limit: "unlimited" },
  { version: "v2", status: "planned", requests_24h: 0, p95_ms: 0, error_rate: 0, rate_limit: "-" },
];

export const SYSTEM_PROVIDERS = [
  { key: "email", label: "Email Provider", value: "Resend", masked: false },
  { key: "storage", label: "Storage Provider", value: "Supabase Storage + Cloudflare R2 (planned)", masked: false },
  { key: "search", label: "Search Provider", value: "OpenSearch (planned)", masked: false },
  { key: "ai", label: "AI Provider", value: "Lovable AI Gateway (Gemini · GPT-5)", masked: false },
  { key: "notifications", label: "Notification Provider", value: "In-app + Resend + SMS (planned)", masked: false },
  { key: "payment", label: "Payment Provider", value: "Razorpay · Stripe (planned)", masked: false },
  { key: "cdn", label: "CDN", value: "Cloudflare", masked: false },
  { key: "monitoring", label: "Monitoring", value: "Cloudflare Analytics + Lovable Logs", masked: false },
];

export function fmtRelative(iso: string): string {
  if (!iso || iso === "-") return "-";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
