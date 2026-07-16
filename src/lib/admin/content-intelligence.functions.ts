import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

// ============= SHARED HELPERS =============

function wordCount(s: string) {
  return String(s ?? "").replace(/`{1,3}[\s\S]*?`{1,3}/g, " ").replace(/[#>*_\-\[\]()!]/g, " ").split(/\s+/).filter(Boolean).length;
}

function scoreOne(it: any) {
  const md = String(it.body_markdown ?? "");
  const wc = it.word_count ?? wordCount(md);
  const headings = (md.match(/^#{1,3}\s.+$/gm) ?? []).length;
  const links = md.match(/\[([^\]]+)\]\(([^)]+)\)/g) ?? [];
  const internalLinks = links.filter((l) => !/\]\(https?:/.test(l)).length;
  const externalLinks = links.length - internalLinks;
  const images = (md.match(/!\[([^\]]*)\]\(([^)]+)\)/g) ?? []).length;
  const missingAlt = (md.match(/!\[\s*\]\(/g) ?? []).length;
  const seoT = (it.seo_title ?? "").length;
  const seoD = (it.seo_description ?? "").length;
  const daysSinceUpdate = it.updated_at ? Math.max(0, (Date.now() - new Date(it.updated_at).getTime()) / (1000 * 60 * 60 * 24)) : 999;

  const readability = wc > 500 && wc < 3200 ? 100 : wc < 500 ? Math.round((wc / 500) * 100) : Math.max(50, 100 - Math.round((wc - 3200) / 40));
  const structure = Math.min(100, headings * 15);
  const seo = (seoT >= 30 && seoT <= 70 ? 50 : 20) + (seoD >= 120 && seoD <= 160 ? 50 : 20);
  const geo = (headings >= 4 ? 30 : headings * 7) + (/faq|q:|question/i.test(md) ? 35 : 0) + (/summary|key takeaway|tl;dr/i.test(md) ? 35 : 0);
  const linking = Math.min(100, internalLinks * 25);
  const accessibility = images === 0 ? 80 : Math.max(0, 100 - (missingAlt / Math.max(1, images)) * 100);
  const completeness = (it.featured_image ? 25 : 0) + (it.focus_topic ? 25 : 0) + (it.category_id ? 20 : 0) + (wc >= 500 ? 30 : Math.round((wc / 500) * 30));
  const media = images === 0 ? 30 : Math.min(100, images * 25);
  const freshness = daysSinceUpdate < 90 ? 100 : daysSinceUpdate < 180 ? 75 : daysSinceUpdate < 365 ? 50 : 20;

  const dims = { readability, structure, seo, geo, linking, accessibility, completeness, media, freshness };
  const overall = Math.round(Object.values(dims).reduce((a, b) => a + b, 0) / Object.keys(dims).length);
  return { ...dims, overall, wc, headings, internalLinks, externalLinks, images, missingAlt };
}

// ============= DASHBOARD =============

export const getIntelligenceDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const [{ data: allItems }, { data: cats }, { data: tags }] = await Promise.all([
      s.from("content_items").select("id, title, slug, type, status, updated_at, created_at, seo_title, seo_description, featured_image, focus_topic, category_id, body_markdown, word_count, reading_time_min"),
      s.from("content_categories").select("id, name, slug"),
      s.from("content_tags").select("id, name"),
    ]);

    const items = allItems ?? [];
    const published = items.filter((i: any) => i.status === "published");
    const scores = published.map((i: any) => scoreOne(i));
    const avg = (k: keyof ReturnType<typeof scoreOne>) => scores.length ? Math.round(scores.reduce((a, b) => a + (b[k] as number), 0) / scores.length) : 0;

    // Coverage counts by type
    const typeCounts: Record<string, number> = {};
    for (const it of items) typeCounts[it.type] = (typeCounts[it.type] ?? 0) + 1;

    // Freshness — items unreviewed > 180 days
    const now = Date.now();
    const stale = published.filter((i: any) => (now - new Date(i.updated_at).getTime()) > 180 * 86400000);

    // Duplicates — same slug or near-duplicate title
    const titleMap: Record<string, number> = {};
    for (const it of items) {
      const key = String(it.title ?? "").toLowerCase().trim();
      if (!key) continue;
      titleMap[key] = (titleMap[key] ?? 0) + 1;
    }
    const dupeTitles = Object.entries(titleMap).filter(([, n]) => n > 1).length;

    // Missing metadata
    const missingMeta = published.filter((i: any) => !i.seo_title || !i.seo_description || !i.featured_image).length;

    // Broken internal links — links pointing to slugs that don't exist
    const publishedSlugs = new Set(published.map((i: any) => `/${i.slug}`).concat(published.map((i: any) => i.slug)));
    let brokenLinks = 0;
    for (const it of published) {
      const md = String(it.body_markdown ?? "");
      const internals = (md.match(/\]\((\/[^)\s]+)\)/g) ?? []).map((l) => l.slice(2, -1));
      for (const href of internals) {
        // Ignore hash anchors, external, and admin
        if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) continue;
        // Heuristic — if href includes a slug segment that matches nothing, count
        const cleaned = href.split("#")[0].split("?")[0];
        if (!cleaned || cleaned === "/") continue;
        // Consider "known" if any segment matches a slug, or it starts with a known top-level route
        const knownRoot = /^\/(programs|learn|glossary|blog|tools|earn|partner|brand|about|contact|success-stories|find-your-program|knowledge-graph|book-consultation|lms|marketing-support)(\/|$)/.test(cleaned);
        if (knownRoot) continue;
        const segments = cleaned.split("/").filter(Boolean);
        const anyMatch = segments.some((seg) => publishedSlugs.has(seg));
        if (!anyMatch) brokenLinks++;
      }
    }

    return {
      total: items.length,
      published: published.length,
      draft: items.filter((i: any) => i.status === "draft").length,
      inReview: items.filter((i: any) => i.status === "in_review").length,
      scheduled: items.filter((i: any) => i.status === "scheduled").length,
      health: {
        overall: avg("overall"),
        readability: avg("readability"),
        structure: avg("structure"),
        seo: avg("seo"),
        geo: avg("geo"),
        linking: avg("linking"),
        accessibility: avg("accessibility"),
        completeness: avg("completeness"),
        media: avg("media"),
        freshness: avg("freshness"),
      },
      typeCoverage: typeCounts,
      staleCount: stale.length,
      dupeTitles,
      missingMeta,
      brokenLinks,
      totalCategories: cats?.length ?? 0,
      totalTags: tags?.length ?? 0,
    };
  });

// ============= TOPIC CLUSTERS (Topic Map) =============

const TOPIC_CLUSTERS = [
  { key: "ai", label: "Artificial Intelligence", keywords: ["ai","artificial intelligence","chatgpt","claude","gemini","llm","prompt","openai","anthropic","gpt","genai","generative","copilot"] },
  { key: "ml", label: "Machine Learning", keywords: ["machine learning","ml","neural","deep learning","model","training","dataset","tensorflow","pytorch","scikit"] },
  { key: "prompt", label: "Prompt Engineering", keywords: ["prompt","prompt engineering","system prompt","few-shot","chain of thought","rag"] },
  { key: "software", label: "Software Development", keywords: ["software","react","angular","vue","javascript","typescript","node","python","java","frontend","backend","full stack","devops","git"] },
  { key: "cloud", label: "Cloud", keywords: ["cloud","aws","azure","gcp","kubernetes","docker","serverless","lambda","container"] },
  { key: "cyber", label: "Cyber Security", keywords: ["cyber","security","penetration","ethical hacking","siem","soc","firewall","malware"] },
  { key: "data", label: "Data Science", keywords: ["data science","data analytics","statistics","pandas","numpy","visualization","tableau","power bi","sql"] },
  { key: "vlsi", label: "VLSI", keywords: ["vlsi","verilog","system verilog","chip","semiconductor","asic","fpga"] },
  { key: "embedded", label: "Embedded Systems", keywords: ["embedded","firmware","microcontroller","arm","rtos","stm32","arduino"] },
  { key: "iot", label: "IoT", keywords: ["iot","internet of things","sensors","raspberry pi","mqtt","edge"] },
  { key: "robotics", label: "Robotics", keywords: ["robotics","ros","robot","actuator","manipulator","slam"] },
  { key: "mechanical", label: "Mechanical Engineering", keywords: ["mechanical","cad","catia","solidworks","ansys","thermodynamics"] },
  { key: "marketing", label: "Digital Marketing", keywords: ["marketing","seo","sem","social media","content marketing","branding","ads","analytics"] },
  { key: "finance", label: "Finance", keywords: ["finance","financial","valuation","modeling","accounting","cfa","banking"] },
  { key: "ib", label: "Investment Banking", keywords: ["investment banking","m&a","dcf","lbo","equity research","ipo"] },
  { key: "hr", label: "Human Resources", keywords: ["human resources","hr","talent","recruitment","payroll","onboarding"] },
  { key: "medical", label: "Medical Coding", keywords: ["medical coding","icd","cpt","hcpcs","medical billing","clinical documentation"] },
  { key: "genetic", label: "Genetic Engineering", keywords: ["genetic","genomics","dna","crispr","biotech","bioinformatics"] },
];

function bucketOf(text: string) {
  const t = text.toLowerCase();
  const hits: string[] = [];
  for (const c of TOPIC_CLUSTERS) {
    if (c.keywords.some((k) => t.includes(k))) hits.push(c.key);
  }
  return hits;
}

export const getTopicMap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data } = await s.from("content_items")
      .select("id, title, type, status, focus_topic, body_markdown")
      .eq("status", "published");

    const clusters = TOPIC_CLUSTERS.map((c) => ({ ...c, count: 0, related: new Set<string>() }));
    const byId: Record<string, typeof clusters[0]> = Object.fromEntries(clusters.map((c) => [c.key, c]));

    for (const it of data ?? []) {
      const text = [it.title, it.focus_topic, "", String(it.body_markdown ?? "").slice(0, 800)].join(" ");
      const buckets = bucketOf(text);
      for (const b of buckets) byId[b].count++;
      // Co-occurrence
      for (const a of buckets) for (const b of buckets) if (a !== b) byId[a].related.add(b);
    }

    const nodes = clusters.map((c) => ({
      key: c.key,
      label: c.label,
      count: c.count,
      isolated: c.count > 0 && c.related.size === 0,
      empty: c.count === 0,
      relatedCount: c.related.size,
      related: Array.from(c.related),
    }));

    return { clusters: nodes, total: (data ?? []).length };
  });

// ============= CONTENT GAP ANALYSIS =============

export const getContentGaps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const [{ data: items }, { data: courses }] = await Promise.all([
      s.from("content_items").select("id, title, slug, type, focus_topic").eq("status", "published"),
      s.from("courses").select("id, name, slug, category_id").eq("published", true).limit(200),
    ]);

    const existingTitles = new Set((items ?? []).map((i: any) => String(i.title ?? "").toLowerCase()));
    const existingByType: Record<string, Set<string>> = {};
    for (const i of items ?? []) {
      const key = String(i.focus_topic ?? i.title ?? "").toLowerCase();
      if (!existingByType[i.type]) existingByType[i.type] = new Set();
      existingByType[i.type].add(key);
    }

    const gaps: { area: string; topic: string; type: string; priority: "high" | "medium" | "low"; reason: string }[] = [];

    // Missing beginner guides for each program
    for (const c of courses ?? []) {
      const cName = String(c.name ?? "");
      const key = `${cName.toLowerCase()} beginner guide`;
      if (!existingByType["learn_guide"]?.has(cName.toLowerCase()) && !existingTitles.has(key)) {
        gaps.push({ area: "Beginner Guides", topic: `${cName} for Beginners`, type: "learn_guide", priority: "high", reason: "Program exists but no beginner guide covers it." });
      }
    }

    // Missing interview guides for engineering / IT programs
    for (const c of (courses ?? []).slice(0, 40)) {
      const cName = String(c.name ?? "");
      if (!existingByType["interview_guide"] || ![...existingByType["interview_guide"]].some((t) => t.includes(cName.toLowerCase()))) {
        gaps.push({ area: "Interview Guides", topic: `${cName} Interview Questions`, type: "interview_guide", priority: "medium", reason: "No interview preparation content yet." });
      }
    }

    // Missing FAQ pages
    for (const c of (courses ?? []).slice(0, 30)) {
      const cName = String(c.name ?? "");
      if (!existingByType["faq"] || ![...existingByType["faq"]].some((t) => t.includes(cName.toLowerCase()))) {
        gaps.push({ area: "FAQ Pages", topic: `${cName} FAQ`, type: "faq", priority: "low", reason: "Learners often ask questions that could be centralised into an FAQ." });
      }
    }

    // Missing roadmaps
    const roadmapSeeds = ["AI Engineer","Frontend Developer","Backend Developer","Full Stack Developer","Cloud Engineer","Cyber Security Analyst","VLSI Engineer","Embedded Engineer","Marketing Specialist","Financial Analyst","Data Analyst","DevOps Engineer"];
    for (const seed of roadmapSeeds) {
      if (!existingByType["roadmap"] || ![...existingByType["roadmap"]].some((t) => t.includes(seed.toLowerCase()))) {
        gaps.push({ area: "Career Roadmaps", topic: `${seed} Roadmap`, type: "roadmap", priority: "high", reason: "Popular career track without a dedicated roadmap yet." });
      }
    }

    // Missing comparison pages
    const compSeeds = [
      ["ChatGPT","Claude"],["Claude","Gemini"],["ChatGPT","Gemini"],
      ["AI","Machine Learning"],["Machine Learning","Deep Learning"],
      ["React","Angular"],["React","Vue"],["Docker","Kubernetes"],
      ["VLSI","Embedded Systems"],["SEO","SEM"],["Medical Coding","Medical Billing"],
      ["Data Science","Data Analytics"],["Frontend","Backend"],
    ];
    for (const [a, b] of compSeeds) {
      const key = `${a.toLowerCase()} vs ${b.toLowerCase()}`;
      const existsRev = `${b.toLowerCase()} vs ${a.toLowerCase()}`;
      if (![...(existingByType["comparison"] ?? [])].some((t) => t.includes(key) || t.includes(existsRev))) {
        gaps.push({ area: "Comparison Pages", topic: `${a} vs ${b}`, type: "comparison", priority: "medium", reason: "High-intent search term without a comparison page." });
      }
    }

    return { gaps: gaps.slice(0, 100), total: gaps.length };
  });

// ============= RELATED CONTENT ENGINE =============

export const getRelatedSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ itemId: z.string().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data: items } = await s.from("content_items")
      .select("id, title, slug, type, focus_topic, body_markdown")
      .eq("status", "published");

    const rows = items ?? [];
    const suggestions: { source_id: string; source_title: string; target_id: string; target_title: string; target_type: string; reason: string; confidence: number }[] = [];

    const tokenize = (s: string) => new Set(String(s ?? "").toLowerCase().match(/[a-z]{4,}/g) ?? []);

    const targetRows = data.itemId ? rows.filter((r: any) => r.id === data.itemId) : rows.slice(0, 50);

    for (const a of targetRows) {
      const aTokens = tokenize(`${a.title} ${a.focus_topic ?? ""} ${""}`);
      const aBody = String(a.body_markdown ?? "").toLowerCase();
      for (const b of rows) {
        if (a.id === b.id) continue;
        const bTokens = tokenize(`${b.title} ${b.focus_topic ?? ""} ${""}`);
        let overlap = 0;
        for (const t of aTokens) if (bTokens.has(t)) overlap++;
        if (overlap < 3) continue;
        // Already links?
        if (aBody.includes(`/${b.slug}`) || aBody.includes(b.slug)) continue;
        const confidence = Math.min(100, overlap * 15);
        suggestions.push({
          source_id: a.id, source_title: a.title,
          target_id: b.id, target_title: b.title, target_type: b.type,
          reason: `${overlap} shared keywords`,
          confidence,
        });
      }
    }

    suggestions.sort((x, y) => y.confidence - x.confidence);
    return { suggestions: suggestions.slice(0, 80) };
  });

// ============= FRESHNESS =============

export const getFreshnessQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data } = await s.from("content_items")
      .select("id, title, slug, type, status, created_at, updated_at, word_count")
      .eq("status", "published");

    const now = Date.now();
    const rows = (data ?? []).map((r: any) => {
      const ageDays = Math.floor((now - new Date(r.updated_at).getTime()) / 86400000);
      const bucket = ageDays > 365 ? "critical" : ageDays > 180 ? "review" : ageDays > 90 ? "watch" : "fresh";
      return { ...r, ageDays, bucket };
    });

    return {
      rows,
      buckets: {
        critical: rows.filter((r) => r.bucket === "critical").length,
        review: rows.filter((r) => r.bucket === "review").length,
        watch: rows.filter((r) => r.bucket === "watch").length,
        fresh: rows.filter((r) => r.bucket === "fresh").length,
      },
    };
  });

// ============= QUALITY SCORES =============

export const getQualityRanking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data } = await s.from("content_items")
      .select("id, title, slug, type, status, updated_at, seo_title, seo_description, featured_image, focus_topic, category_id, body_markdown, word_count, reading_time_min")
      .eq("status", "published");

    const rows = (data ?? []).map((r: any) => ({ ...r, score: scoreOne(r) }));
    rows.sort((a: any, b: any) => a.score.overall - b.score.overall);
    return { rows };
  });

// ============= ENTITY COVERAGE =============

const ENTITIES = [
  "Artificial Intelligence","Machine Learning","LLM","Prompt Engineering","API","Cloud Computing",
  "Docker","Kubernetes","React","Angular","Vue","Node","Python","JavaScript","TypeScript",
  "VLSI","Verilog","Firmware","Embedded Systems","IoT","Robotics","SEO","SEM","Financial Modeling",
  "Investment Banking","Medical Coding","ICD-10","CPT","CRISPR","Genomics","DevOps","AWS","Azure","GCP",
  "TensorFlow","PyTorch","SQL","NoSQL","Data Science","Deep Learning","Neural Networks","ChatGPT","Claude","Gemini",
];

export const getEntityCoverage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data } = await s.from("content_items").select("id, title, focus_topic, body_markdown").eq("status", "published");
    const rows = data ?? [];
    const out = ENTITIES.map((e) => {
      const el = e.toLowerCase();
      let dedicated = 0, mentions = 0;
      for (const r of rows) {
        const title = String(r.title ?? "").toLowerCase();
        const focus = String(r.focus_topic ?? "").toLowerCase();
        const body = String(r.body_markdown ?? "").toLowerCase();
        if (title.includes(el) || focus === el) dedicated++;
        else if (body.includes(el)) mentions++;
      }
      const status: "covered" | "partial" | "missing" = dedicated > 0 ? "covered" : mentions > 0 ? "partial" : "missing";
      return { entity: e, dedicated, mentions, status };
    });
    return { entities: out };
  });

// ============= COMPARISON SUGGESTIONS =============

export const getComparisonSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data: items } = await s.from("content_items").select("title, focus_topic, type").eq("status", "published");
    const existing = new Set((items ?? []).filter((i: any) => i.type === "comparison").map((i: any) => String(i.title ?? "").toLowerCase()));

    const seeds = [
      { a: "ChatGPT", b: "Claude", intent: "AI assistants for professionals", priority: "high" as const },
      { a: "Claude", b: "Gemini", intent: "Which reasoning model to pick", priority: "high" as const },
      { a: "ChatGPT", b: "Gemini", intent: "Everyday productivity AI", priority: "high" as const },
      { a: "AI", b: "Machine Learning", intent: "Foundational disambiguation", priority: "high" as const },
      { a: "Machine Learning", b: "Deep Learning", intent: "Career-relevant distinction", priority: "medium" as const },
      { a: "React", b: "Angular", intent: "Frontend framework decision", priority: "medium" as const },
      { a: "React", b: "Vue", intent: "Frontend framework decision", priority: "medium" as const },
      { a: "Docker", b: "Kubernetes", intent: "Container ecosystem", priority: "high" as const },
      { a: "VLSI", b: "Embedded Systems", intent: "Hardware career choice", priority: "medium" as const },
      { a: "SEO", b: "SEM", intent: "Digital marketing basics", priority: "medium" as const },
      { a: "Medical Coding", b: "Medical Billing", intent: "Healthcare career track", priority: "medium" as const },
      { a: "Frontend", b: "Backend", intent: "Career direction", priority: "high" as const },
      { a: "Data Science", b: "Data Analytics", intent: "Analytics career", priority: "medium" as const },
      { a: "AWS", b: "Azure", intent: "Cloud provider choice", priority: "medium" as const },
      { a: "Python", b: "JavaScript", intent: "First language decision", priority: "medium" as const },
    ].filter(({ a, b }) => {
      const k1 = `${a} vs ${b}`.toLowerCase();
      const k2 = `${b} vs ${a}`.toLowerCase();
      return !existing.has(k1) && !existing.has(k2);
    });

    return { suggestions: seeds };
  });

// ============= ROADMAP SUGGESTIONS =============

export const getRoadmapSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data: items } = await s.from("content_items").select("title, type").eq("status", "published");
    const existing = new Set((items ?? []).filter((i: any) => i.type === "roadmap").map((i: any) => String(i.title ?? "").toLowerCase()));

    const seeds = [
      { title: "AI Engineer", duration: "6–9 months", audience: "Beginner", priority: "high" as const },
      { title: "Frontend Developer", duration: "4–6 months", audience: "Beginner", priority: "high" as const },
      { title: "Backend Developer", duration: "5–7 months", audience: "Beginner", priority: "high" as const },
      { title: "Full Stack Developer", duration: "8–12 months", audience: "Beginner", priority: "high" as const },
      { title: "Cloud Engineer", duration: "6–9 months", audience: "Intermediate", priority: "high" as const },
      { title: "Cyber Security Analyst", duration: "6–8 months", audience: "Beginner", priority: "medium" as const },
      { title: "VLSI Engineer", duration: "9–12 months", audience: "Intermediate", priority: "medium" as const },
      { title: "Embedded Engineer", duration: "6–9 months", audience: "Intermediate", priority: "medium" as const },
      { title: "Marketing Specialist", duration: "3–5 months", audience: "Beginner", priority: "medium" as const },
      { title: "Financial Analyst", duration: "5–7 months", audience: "Beginner", priority: "medium" as const },
      { title: "Data Analyst", duration: "4–6 months", audience: "Beginner", priority: "high" as const },
      { title: "Data Scientist", duration: "9–12 months", audience: "Intermediate", priority: "high" as const },
      { title: "DevOps Engineer", duration: "6–8 months", audience: "Intermediate", priority: "medium" as const },
    ].filter((r) => !existing.has(r.title.toLowerCase()) && !existing.has(`${r.title.toLowerCase()} roadmap`));

    return { suggestions: seeds };
  });

// ============= GLOSSARY EXPANSION =============

export const getGlossarySuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data: items } = await s.from("content_items").select("title, type").eq("type", "glossary");
    const existing = new Set((items ?? []).map((i: any) => String(i.title ?? "").toLowerCase()));

    const catalog: Record<string, string[]> = {
      "AI & LLMs": ["Transformer","Attention Mechanism","Fine-tuning","RAG","Zero-Shot Learning","Few-Shot Learning","Hallucination","Tokenization","Vector Database","Embedding","Agent","Multimodal","Chain-of-Thought"],
      "Cloud & DevOps": ["Serverless","IaC","Terraform","Helm","Service Mesh","Kafka","CDN","Load Balancer","Blue-Green Deploy","GitOps"],
      "Cyber Security": ["Zero Trust","XDR","Threat Hunting","Ransomware","Phishing","SIEM","Penetration Testing","OWASP Top 10"],
      "Data": ["Data Lake","Data Warehouse","ETL","ELT","OLAP","Feature Store","Star Schema","Data Mesh"],
      "VLSI / Embedded": ["ASIC","FPGA","RTL","Testbench","Synthesis","STA","UVM","Firmware OTA","Bare-metal","RTOS"],
      "Finance": ["DCF","LBO","IRR","NPV","WACC","Comparable Analysis","Financial Modeling"],
      "Marketing": ["Bounce Rate","Conversion Rate","Impressions","CTR","CPC","CPM","Attribution"],
      "Medical": ["ICD-10","CPT","HCPCS","EHR","HIPAA","Modifier","Superbill"],
    };

    const suggestions: { term: string; category: string; priority: "high" | "medium" }[] = [];
    for (const [cat, terms] of Object.entries(catalog)) {
      for (const t of terms) {
        if (!existing.has(t.toLowerCase())) {
          suggestions.push({ term: t, category: cat, priority: ["Transformer","RAG","Fine-tuning","Vector Database","Zero Trust","ICD-10"].includes(t) ? "high" : "medium" });
        }
      }
    }

    return { suggestions };
  });

// ============= FAQ DISCOVERY =============

export const getFaqSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const questions = [
      { q: "What should I learn after AI basics?", confidence: 92, cluster: "AI" },
      { q: "How difficult is VLSI as a career?", confidence: 88, cluster: "VLSI" },
      { q: "What is Prompt Engineering used for?", confidence: 94, cluster: "AI" },
      { q: "Is medical coding a good career option in 2025?", confidence: 84, cluster: "Medical" },
      { q: "How much salary does a cloud engineer earn?", confidence: 90, cluster: "Cloud" },
      { q: "Which is better React or Angular for freshers?", confidence: 87, cluster: "Software" },
      { q: "How to start a career in cyber security without experience?", confidence: 89, cluster: "Cyber" },
      { q: "What tools do data scientists use daily?", confidence: 82, cluster: "Data" },
      { q: "How long does it take to become a full-stack developer?", confidence: 91, cluster: "Software" },
      { q: "Is embedded systems better than software for engineering students?", confidence: 78, cluster: "Embedded" },
      { q: "What is the difference between AI and Machine Learning?", confidence: 95, cluster: "AI" },
      { q: "How do I choose between ChatGPT and Claude for work?", confidence: 86, cluster: "AI" },
      { q: "What certifications should a DevOps engineer pursue?", confidence: 83, cluster: "Cloud" },
      { q: "Can I switch to data science from a non-technical background?", confidence: 85, cluster: "Data" },
      { q: "Is financial modeling worth learning in 2025?", confidence: 80, cluster: "Finance" },
    ];
    return { suggestions: questions };
  });

// ============= SEARCH INSIGHTS (GSC placeholder) =============

export const getSearchInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    // GSC connector integration lives outside this admin surface. When available,
    // this handler will proxy live data. For now we return a "connect" state so the
    // UI can render setup guidance without fabricating numbers.
    return { connected: false };
  });

// ============= CONTENT DECAY =============

export const getContentDecay = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data } = await s.from("content_items")
      .select("id, title, slug, type, updated_at, body_markdown, word_count, seo_title, seo_description, featured_image")
      .eq("status", "published");

    const now = Date.now();
    const rows = (data ?? []).map((r: any) => {
      const ageDays = Math.floor((now - new Date(r.updated_at).getTime()) / 86400000);
      const md = String(r.body_markdown ?? "");
      const internalLinks = (md.match(/\]\((\/[^)\s]+)\)/g) ?? []).length;
      const factors: string[] = [];
      if (ageDays > 180) factors.push(`Unreviewed for ${ageDays} days`);
      if (internalLinks < 3) factors.push("Few internal links");
      if (!r.featured_image) factors.push("Missing hero image");
      if (!r.seo_title || !r.seo_description) factors.push("Missing SEO metadata");
      if ((r.word_count ?? 0) < 400) factors.push("Thin content (< 400 words)");
      const decayScore = Math.min(100, factors.length * 22 + Math.min(30, Math.floor(ageDays / 30)));
      return { id: r.id, title: r.title, slug: r.slug, type: r.type, ageDays, factors, decayScore };
    }).filter((r) => r.decayScore > 20)
      .sort((a, b) => b.decayScore - a.decayScore);

    return { rows };
  });

// ============= EDITOR TASKS =============

export const getEditorTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data } = await s.from("content_items")
      .select("id, title, slug, type, status, updated_at, seo_title, seo_description, featured_image, focus_topic, body_markdown, word_count");

    const queues: Record<string, { id: string; title: string; slug: string; type: string; status: string }[]> = {
      "Needs Review": [],
      "Needs Metadata": [],
      "Needs Internal Links": [],
      "Needs Images": [],
      "Needs Glossary Links": [],
      "Needs Comparison": [],
    };

    for (const r of data ?? []) {
      const base = { id: r.id, title: r.title, slug: r.slug, type: r.type, status: r.status };
      if (r.status === "in_review") queues["Needs Review"].push(base);
      if (r.status === "published") {
        if (!r.seo_title || !r.seo_description) queues["Needs Metadata"].push(base);
        const md = String(r.body_markdown ?? "");
        const internal = (md.match(/\]\((\/[^)\s]+)\)/g) ?? []).length;
        if (internal < 3) queues["Needs Internal Links"].push(base);
        if (!r.featured_image) queues["Needs Images"].push(base);
        if (!/glossary/i.test(md)) queues["Needs Glossary Links"].push(base);
        if (r.type === "learn_guide" && !/\bvs\.?\b|compare|comparison/i.test(md)) queues["Needs Comparison"].push(base);
      }
    }

    return { queues };
  });

// ============= KNOWLEDGE GRAPH HEALTH =============

export const getGraphHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data } = await s.from("content_items").select("id, title, slug, body_markdown").eq("status", "published");
    const rows = data ?? [];
    const slugs = new Set(rows.map((r: any) => r.slug));

    let totalLinks = 0;
    let broken = 0;
    const connections: Record<string, number> = {};

    for (const r of rows) {
      const md = String(r.body_markdown ?? "");
      const hrefs = (md.match(/\]\((\/[^)\s]+)\)/g) ?? []).map((l) => l.slice(2, -1));
      let hits = 0;
      for (const href of hrefs) {
        totalLinks++;
        const segs = href.split("/").filter(Boolean);
        const matched = segs.some((seg) => slugs.has(seg));
        if (matched) hits++;
        else if (!/^https?:/.test(href)) broken++;
      }
      connections[r.id] = hits;
    }

    const values = Object.values(connections);
    const avg = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
    const isolated = values.filter((v) => v === 0).length;

    return {
      totalNodes: rows.length,
      totalLinks,
      averageConnections: avg,
      isolatedNodes: isolated,
      brokenRelationships: broken,
      connectedNodes: rows.length - isolated,
    };
  });

// ============= REPORTS =============

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    kind: z.enum(["weekly_health","monthly_seo","coverage","tasks","top_content","gaps"]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data: items } = await s.from("content_items").select("id, title, slug, type, status, updated_at, created_at, seo_title, seo_description, featured_image, word_count, body_markdown, focus_topic").eq("status", "published");

    const lines: string[] = [];
    const now = new Date().toISOString().slice(0, 10);
    const rows = items ?? [];

    if (data.kind === "weekly_health") {
      const scores = rows.map((r: any) => scoreOne(r));
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b.overall, 0) / scores.length) : 0;
      lines.push(`# Weekly Content Health — ${now}`, "");
      lines.push(`- Total published: ${rows.length}`);
      lines.push(`- Average health: ${avg}/100`);
      lines.push(`- Missing metadata: ${rows.filter((r: any) => !r.seo_title || !r.seo_description).length}`);
      lines.push(`- Missing images: ${rows.filter((r: any) => !r.featured_image).length}`);
    } else if (data.kind === "monthly_seo") {
      lines.push(`# Monthly SEO Report — ${now}`, "");
      lines.push(`- Published articles: ${rows.length}`);
      lines.push(`- Articles with focus topic: ${rows.filter((r: any) => r.focus_topic).length}`);
      lines.push(`- Long-form (>1500 words): ${rows.filter((r: any) => (r.word_count ?? 0) > 1500).length}`);
    } else if (data.kind === "coverage") {
      const byType: Record<string, number> = {};
      for (const r of rows) byType[r.type] = (byType[r.type] ?? 0) + 1;
      lines.push(`# Knowledge Coverage — ${now}`, "");
      for (const [k, v] of Object.entries(byType)) lines.push(`- ${k}: ${v}`);
    } else if (data.kind === "tasks") {
      lines.push(`# Editorial Task Report — ${now}`, "");
      lines.push(`- Needs metadata: ${rows.filter((r: any) => !r.seo_title || !r.seo_description).length}`);
      lines.push(`- Needs hero image: ${rows.filter((r: any) => !r.featured_image).length}`);
    } else if (data.kind === "top_content") {
      const scored = rows.map((r: any) => ({ title: r.title, score: scoreOne(r).overall })).sort((a: any, b: any) => b.score - a.score).slice(0, 20);
      lines.push(`# Top Performing Content — ${now}`, "");
      for (const r of scored) lines.push(`- **${r.title}** — ${r.score}/100`);
    } else if (data.kind === "gaps") {
      lines.push(`# Content Gaps — ${now}`, "");
      lines.push("- See /admin/content-intelligence/gaps for the full live list.");
    }

    return { markdown: lines.join("\n"), filename: `${data.kind}-${now}.md` };
  });

// ============= NOTIFICATIONS =============

export const getIntelligenceNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const s = context.supabase;
    const { data } = await s.from("content_items")
      .select("id, title, slug, type, updated_at, seo_title, seo_description, featured_image, body_markdown, status")
      .eq("status", "published");

    const rows = data ?? [];
    const now = Date.now();
    const notifs: { id: string; kind: string; severity: "high" | "medium" | "low"; title: string; detail: string; itemId?: string }[] = [];

    for (const r of rows) {
      const age = (now - new Date(r.updated_at).getTime()) / 86400000;
      if (age > 365) notifs.push({ id: `stale-${r.id}`, kind: "Review due", severity: "high", title: r.title, detail: `Unreviewed for ${Math.floor(age)} days.`, itemId: r.id });
      if (!r.seo_title || !r.seo_description) notifs.push({ id: `meta-${r.id}`, kind: "Metadata missing", severity: "medium", title: r.title, detail: "SEO title or description is missing.", itemId: r.id });
      if (!r.featured_image) notifs.push({ id: `img-${r.id}`, kind: "Hero image missing", severity: "low", title: r.title, detail: "No featured image set.", itemId: r.id });
    }

    // Duplicate risk
    const titles: Record<string, string[]> = {};
    for (const r of rows) {
      const k = String(r.title ?? "").toLowerCase().trim();
      if (!titles[k]) titles[k] = [];
      titles[k].push(r.id);
    }
    for (const [t, ids] of Object.entries(titles)) {
      if (ids.length > 1) notifs.push({ id: `dup-${ids[0]}`, kind: "Duplicate risk", severity: "medium", title: t, detail: `${ids.length} items share this title.` });
    }

    return { notifications: notifs.slice(0, 200) };
  });
