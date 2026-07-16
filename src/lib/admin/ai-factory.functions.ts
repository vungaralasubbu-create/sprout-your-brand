/**
 * AI Content Factory — Phase 2
 * One-shot generation pipeline: complete article + images + SEO + linking + QA + publish.
 * All fns require admin (super_admin / admin / editor via is_admin RPC).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callLovableAiJson, isAiAvailable } from "@/lib/ai-gateway.server";

async function ensureAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error) throw new Error("Failed to verify admin");
  if (!data) throw new Error("Forbidden");
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 90);
}
function wordCount(s: string) {
  return s.replace(/`{1,3}[\s\S]*?`{1,3}/g, " ").replace(/[#>*_\-\[\]()!]/g, " ").split(/\s+/).filter(Boolean).length;
}
function readingTime(wc: number) { return Math.max(1, Math.round(wc / 220)); }

const AUDIENCES = ["beginner", "intermediate", "advanced", "professional"] as const;
const DEPTHS = ["quick", "standard", "comprehensive", "master"] as const;
const DEPTH_TARGETS: Record<string, { min: number; max: number; sections: number }> = {
  quick: { min: 500, max: 900, sections: 5 },
  standard: { min: 1000, max: 1600, sections: 7 },
  comprehensive: { min: 1800, max: 2600, sections: 10 },
  master: { min: 2800, max: 4000, sections: 12 },
};

// ---------- IMAGE GENERATION (Lovable Gateway → storage bucket) ----------

const IMAGE_MODEL = "google/gemini-2.5-flash-image";
const BASE_STYLE =
  "Premium Glintr editorial visual. Modern, clean, cinematic. Deep navy background (#0A1128), " +
  "cyan/azure and lime green accents, subtle grid, soft glow, no faces, no logos, no text overlays. " +
  "3D isometric or abstract geometry. High detail, magazine-quality.";

async function generateImageBase64(prompt: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI service not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [{ role: "user", content: `${prompt}\n\nStyle: ${BASE_STYLE}` }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Image generation failed (${res.status}): ${t.slice(0, 240)}`);
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generator returned no data");
  return b64;
}

async function uploadPngAndSign(context: any, path: string, b64: string): Promise<string> {
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const { error: upErr } = await context.supabase.storage
    .from("content-media")
    .upload(path, buf, { contentType: "image/png", upsert: true });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
  // Signed URL valid for ~100 years
  const { data: signed, error: sErr } = await context.supabase.storage
    .from("content-media")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 100);
  if (sErr) throw new Error(`Sign failed: ${sErr.message}`);
  return signed.signedUrl;
}

// ============= 1. COMPLETE DRAFT (one-shot) =============

const CompleteInput = z.object({
  topic: z.string().min(2).max(240),
  depth: z.enum(DEPTHS).default("comprehensive"),
  audience: z.enum(AUDIENCES).default("intermediate"),
  focusKeywords: z.array(z.string()).optional(),
  notes: z.string().optional(),
  // Kept for backward compatibility with existing UI; images now run as a
  // separate background task via generateFactoryImages so a failure in image
  // generation never fails article generation.
  generateImages: z.boolean().default(false),
});

export const generateCompleteDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompleteInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (!isAiAvailable()) throw new Error("AI service not configured. Set LOVABLE_API_KEY.");

    const t = DEPTH_TARGETS[data.depth];
    const kw = (data.focusKeywords ?? []).join(", ");

    // --- Fetch internal linking context ---
    const [courses, glossary, learn, blogs] = await Promise.all([
      context.supabase.from("courses").select("slug, name, category_slug").eq("status", "published").limit(60),
      context.supabase.from("content_items").select("slug, title").eq("type", "glossary").eq("status", "published").limit(80),
      context.supabase.from("content_items").select("slug, title").eq("type", "learn_guide").eq("status", "published").limit(60),
      context.supabase.from("blog_posts").select("slug, title").eq("is_published", true).limit(60),
    ]);

    const internalCatalog = {
      courses: (courses.data ?? []).map((c: any) => ({ path: `/programs/${c.category_slug}/${c.slug}`, title: c.name })),
      glossary: (glossary.data ?? []).map((g: any) => ({ path: `/glossary/${g.slug}`, title: g.title })),
      learn: (learn.data ?? []).map((l: any) => ({ path: `/learn/${l.slug}`, title: l.title })),
      blogs: (blogs.data ?? []).map((b: any) => ({ path: `/blog/${b.slug}`, title: b.title })),
    };

    // --- Generate everything in one JSON call ---
    const sys = `You are Glintr's senior AI editor. You produce publication-ready blog articles with rigorous factual accuracy.
NEVER invent statistics, quotes, brand partnerships, certifications, or people. Mark unverified claims with "needs_verification": true in warnings.
Return ONLY valid JSON.`;

    const usr = `Write a complete publication-ready article for Glintr.

Topic: "${data.topic}"
Depth: ${data.depth} (${t.min}–${t.max} words, ~${t.sections} sections)
Audience: ${data.audience}
${kw ? `Focus keywords (use naturally): ${kw}` : ""}
${data.notes ? `Editor notes: ${data.notes}` : ""}

Internal linking catalog (use real paths where relevant):
${JSON.stringify(internalCatalog).slice(0, 5000)}

Return JSON with EVERY field:
{
  "title": "SEO-friendly title, <=70 chars",
  "slug": "kebab-case",
  "seo_title": "40–65 chars",
  "seo_description": "130–158 chars",
  "subtitle": "one-line subtitle",
  "short_summary": "2–3 sentences",
  "intro": "150–250 words with a Quick Answer paragraph",
  "body_markdown": "FULL markdown body with H2/H3 headings, at least one comparison table, 2 bulleted lists, callout blockquotes (>), and NO placeholder images. Insert marker tokens {{HERO_IMAGE}} at top and {{SECTION_IMAGE_1}}, {{SECTION_IMAGE_2}}, {{SECTION_IMAGE_3}} where illustrations belong. Include natural markdown links to real internal paths from the catalog when relevant.",
  "conclusion": "150–200 words",
  "cta_headline": "short CTA headline",
  "cta_body": "short paragraph pointing to related Glintr programs",
  "faqs": [{"question":"...","answer":"..."}],  // 6-10 items
  "keywords": ["..."],  // 6-12 SEO keywords
  "tags": ["..."],  // 5-8 tags
  "category": "AI | Programming | Business | Career | Design | Data | Cloud | Marketing | Cyber Security | Engineering",
  "difficulty": "beginner|intermediate|advanced",
  "internal_links": [{"anchor":"...","path":"/..."}],  // 5-10 items chosen from the catalog
  "related_course_slugs": ["..."],  // 2-4 slugs from catalog courses
  "related_blog_slugs": ["..."],  // 2-4 slugs
  "image_plan": {
    "hero": {"prompt":"specific hero visual prompt","alt":"...","caption":"..."},
    "thumbnail": {"prompt":"...","alt":"..."},
    "social": {"prompt":"1200x630 hero-style OG image","alt":"..."},
    "sections": [
      {"key":"SECTION_IMAGE_1","prompt":"...","alt":"...","caption":"..."},
      {"key":"SECTION_IMAGE_2","prompt":"...","alt":"...","caption":"..."},
      {"key":"SECTION_IMAGE_3","prompt":"...","alt":"...","caption":"..."}
    ],
    "infographic": {"prompt":"vertical infographic showing key data points","alt":"..."},
    "diagram": {"prompt":"clean architecture/workflow diagram","alt":"..."}
  },
  "visual_blocks": {
    "comparison_table": {"title":"...","columns":["A","B"],"rows":[["...","..."]]},
    "stats_cards": [{"stat":"...","label":"...","note":"needs_verification if uncertain"}],
    "callouts": [{"kind":"tip|warning|note","body":"..."}],
    "timeline": [{"year":"...","event":"..."}],
    "roadmap": [{"phase":"Week 1","items":["...","..."]}]
  },
  "warnings": ["short editor cautions about anything to verify"]
}

Rules:
- Content must be factual, well-structured, non-hyped.
- Do NOT fabricate stats — if you include a statistic, add a warning.
- Body must reach the target word count.
- Return valid JSON only.`;

    const draft = await callLovableAiJson<any>({
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      temperature: 0.55,
      model: "google/gemini-2.5-flash",
    });

    // Normalize + defaults
    const title = String(draft.title || data.topic).slice(0, 140);
    const slug = slugify(draft.slug || title);
    const body_markdown = String(draft.body_markdown || "");
    const wc = wordCount(body_markdown);

    // --- Image generation (optional, isolated) ---
    // Images are generated as a separate background step by default so that
    // a failure here does not fail article/metadata/SEO/FAQ/link generation.
    // The article, metadata, SEO, FAQs, and internal links are already fully
    // populated in `draft` above. Callers should invoke generateFactoryImages
    // after saveFactoryDraft to attach images asynchronously.
    let images: Record<string, string> = {};
    const imageErrors: string[] = [];
    if (data.generateImages) {
      try {
        const out = await runImageGeneration(context, slug, draft.image_plan ?? {});
        images = out.images;
        imageErrors.push(...out.errors);
      } catch (e: any) {
        // Never let image failure crash article generation.
        console.error("[generateCompleteDraft] image generation failed", e);
        imageErrors.push(String(e?.message ?? e));
      }
    }

    const finalBody = substituteImageTokens(body_markdown, images, draft.image_plan ?? {}, title);

    return {
      draft: {
        ...draft,
        title,
        slug,
        body_markdown: finalBody,
        word_count: wc,
        reading_time_min: readingTime(wc),
      },
      images,
      imageErrors,
    };
  });

// ---- Shared helpers for image pipeline ----

function substituteImageTokens(
  body: string,
  images: Record<string, string>,
  plan: any,
  title: string,
): string {
  let finalBody = body;
  const heroUrl = images.hero || null;
  const secImgs = [images.section_1, images.section_2, images.section_3];
  if (heroUrl) {
    finalBody = finalBody.replace(/\{\{HERO_IMAGE\}\}/g, `![${plan?.hero?.alt ?? title}](${heroUrl})`);
  } else {
    finalBody = finalBody.replace(/\{\{HERO_IMAGE\}\}/g, "");
  }
  [1, 2, 3].forEach((n) => {
    const url = secImgs[n - 1];
    const meta = plan?.sections?.[n - 1];
    const alt = meta?.alt ?? `Illustration ${n}`;
    finalBody = finalBody.replace(
      new RegExp(`\\{\\{SECTION_IMAGE_${n}\\}\\}`, "g"),
      url ? `\n\n![${alt}](${url})\n${meta?.caption ? `*${meta.caption}*\n` : ""}` : "",
    );
  });
  return finalBody;
}

async function runImageGeneration(
  context: any,
  slug: string,
  plan: any,
): Promise<{ images: Record<string, string>; errors: string[] }> {
  const stem = `factory/${slug}-${Date.now()}`;
  const jobs: [string, string][] = [];
  if (plan?.hero?.prompt) jobs.push(["hero", plan.hero.prompt]);
  if (plan?.thumbnail?.prompt) jobs.push(["thumbnail", plan.thumbnail.prompt]);
  if (plan?.social?.prompt) jobs.push(["social", plan.social.prompt]);
  (plan?.sections ?? []).slice(0, 3).forEach((s: any, i: number) => {
    if (s?.prompt) jobs.push([`section_${i + 1}`, s.prompt]);
  });
  if (plan?.infographic?.prompt) jobs.push(["infographic", plan.infographic.prompt]);
  if (plan?.diagram?.prompt) jobs.push(["diagram", plan.diagram.prompt]);

  const images: Record<string, string> = {};
  const errors: string[] = [];
  const results = await Promise.allSettled(
    jobs.map(async ([kind, prompt]) => {
      const b64 = await generateImageBase64(prompt);
      const url = await uploadPngAndSign(context, `${stem}/${kind}.png`, b64);
      return [kind, url] as const;
    }),
  );
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      const [kind, url] = r.value;
      images[kind] = url;
    } else {
      errors.push(`${jobs[i][0]}: ${String(r.reason?.message ?? r.reason)}`);
    }
  }
  return { images, errors };
}

// ============= 1b. GENERATE IMAGES FOR AN EXISTING DRAFT (separate task) =============

const GenImagesInput = z.object({ id: z.string().uuid() });
export const generateFactoryImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GenImagesInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: it } = await context.supabase
      .from("content_items")
      .select("id, slug, title, body_markdown, metadata, featured_image")
      .eq("id", data.id)
      .maybeSingle();
    if (!it) throw new Error("Not found");
    const meta = (it as any).metadata ?? {};
    const plan = meta.image_plan ?? {};

    let images: Record<string, string> = {};
    let errors: string[] = [];
    try {
      const out = await runImageGeneration(context, (it as any).slug, plan);
      images = out.images;
      errors = out.errors;
    } catch (e: any) {
      console.error("[generateFactoryImages] failed", e);
      errors.push(String(e?.message ?? e));
    }

    const finalBody = substituteImageTokens(
      String((it as any).body_markdown ?? ""),
      images,
      plan,
      (it as any).title ?? "",
    );

    const md = { ...meta, images: { ...(meta.images ?? {}), ...images }, image_errors: errors };
    const update: any = {
      body_markdown: finalBody,
      metadata: md,
      last_edited_by: context.userId,
    };
    if (images.hero && !(it as any).featured_image) update.featured_image = images.hero;

    const { error } = await context.supabase.from("content_items").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);

    return { images, errors };
  });

// ============= 2. SAVE FACTORY DRAFT =============

const SaveInput = z.object({
  draft: z.any(),
  images: z.record(z.string()).optional(),
  focusKeywords: z.array(z.string()).optional(),
});

export const saveFactoryDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SaveInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const d = data.draft ?? {};
    const wc = wordCount(String(d.body_markdown ?? ""));

    const payload: any = {
      type: "learn_guide",
      status: "in_review",
      title: d.title ?? "Untitled",
      slug: slugify(d.slug ?? d.title ?? "untitled"),
      summary: d.short_summary ?? d.subtitle ?? null,
      body_markdown: d.body_markdown ?? "",
      seo_title: d.seo_title ?? null,
      seo_description: d.seo_description ?? null,
      focus_topic: d.title ?? null,
      schema_type: "Article",
      featured_image: data.images?.hero ?? null,
      related_topics: d.related_blog_slugs ?? [],
      outline: d.faqs ? { faqs: d.faqs } : [],
      word_count: wc,
      reading_time_min: readingTime(wc),
      tag_slugs: (d.tags ?? []).map(slugify),
      metadata: {
        generated_by: "ai_factory",
        depth: d.depth ?? "comprehensive",
        audience: d.audience ?? "intermediate",
        focus_keywords: data.focusKeywords ?? [],
        images: data.images ?? {},
        visual_blocks: d.visual_blocks ?? {},
        internal_links: d.internal_links ?? [],
        related_course_slugs: d.related_course_slugs ?? [],
        related_blog_slugs: d.related_blog_slugs ?? [],
        faqs: d.faqs ?? [],
        keywords: d.keywords ?? [],
        difficulty: d.difficulty ?? "intermediate",
        category: d.category ?? null,
        cta: { headline: d.cta_headline ?? null, body: d.cta_body ?? null },
        subtitle: d.subtitle ?? null,
        intro: d.intro ?? null,
        conclusion: d.conclusion ?? null,
        warnings: d.warnings ?? [],
      },
      created_by: context.userId,
      last_edited_by: context.userId,
    };
    const { data: row, error } = await context.supabase.from("content_items").insert(payload).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return { id: (row as any)?.id };
  });

// ============= 3. EDITOR ACTIONS (rewrite / expand / shorten / regenerate section) =============

const EditInput = z.object({
  mode: z.enum(["rewrite", "expand", "shorten", "regenerate_section"]),
  text: z.string().min(1).max(20000),
  instruction: z.string().max(2000).optional(),
});
export const aiEditText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => EditInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const goals: Record<string, string> = {
      rewrite: "Rewrite this passage for clarity and voice, keeping meaning and facts intact.",
      expand: "Expand this passage with more depth, examples, and structure. Do NOT invent facts.",
      shorten: "Shorten this passage while keeping every key idea.",
      regenerate_section: "Rewrite this section from scratch, keeping the same heading and intent.",
    };
    const out = await callLovableAiJson<{ text: string }>({
      messages: [
        { role: "system", content: `You are a senior editor. ${goals[data.mode]} Return ONLY JSON {"text":"..."}. Preserve markdown. Do not fabricate statistics or quotes.` },
        { role: "user", content: `${data.instruction ? `Instruction: ${data.instruction}\n\n` : ""}Passage:\n\n${data.text}` },
      ],
      temperature: 0.55,
    });
    return { text: out.text || "" };
  });

// ============= 4. REGENERATE IMAGE =============

const ImgInput = z.object({
  id: z.string().uuid(),
  kind: z.enum(["hero", "thumbnail", "social", "section_1", "section_2", "section_3", "infographic", "diagram"]),
  prompt: z.string().min(4).max(600),
  alt: z.string().max(300).optional(),
});
export const regenerateFactoryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ImgInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: item } = await context.supabase.from("content_items").select("id, slug, metadata, featured_image, body_markdown").eq("id", data.id).maybeSingle();
    if (!item) throw new Error("Not found");
    const b64 = await generateImageBase64(data.prompt);
    const path = `factory/${item.slug}-${Date.now()}/${data.kind}.png`;
    const url = await uploadPngAndSign(context, path, b64);

    const md: any = { ...((item as any).metadata ?? {}) };
    md.images = { ...(md.images ?? {}), [data.kind]: url };

    const update: any = { metadata: md, last_edited_by: context.userId };
    if (data.kind === "hero") update.featured_image = url;

    const { error } = await context.supabase.from("content_items").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { url };
  });

// ============= 5. QUALITY CHECK =============

const QaInput = z.object({ id: z.string().uuid() });
export const runFactoryQualityCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => QaInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: it } = await context.supabase.from("content_items").select("*").eq("id", data.id).maybeSingle();
    if (!it) throw new Error("Not found");
    const md = String((it as any).body_markdown ?? "");
    const wc = (it as any).word_count ?? 0;

    const headings = (md.match(/^#{1,3}\s.+$/gm) ?? []).length;
    const links = md.match(/\[([^\]]+)\]\(([^)]+)\)/g) ?? [];
    const internal = links.filter((l) => !/\]\(https?:/.test(l));
    const external = links.filter((l) => /\]\(https?:/.test(l));
    const images = md.match(/!\[([^\]]*)\]\(([^)]+)\)/g) ?? [];
    const missingAlt = md.match(/!\[\s*\]\(/g) ?? [];
    const brokenTokens = md.match(/\{\{[A-Z_0-9]+\}\}/g) ?? [];
    const placeholders = md.match(/\b(TBD|TODO|lorem ipsum|placeholder)\b/gi) ?? [];

    const seoT = ((it as any).seo_title ?? "").length;
    const seoD = ((it as any).seo_description ?? "").length;
    const hasHero = !!(it as any).featured_image;
    const meta = (it as any).metadata ?? {};

    const checks = [
      { key: "wordcount", pass: wc >= 900, msg: `${wc} words${wc < 900 ? " — extend to 900+ for authority" : ""}` },
      { key: "headings", pass: headings >= 4, msg: `${headings} headings` },
      { key: "internal_links", pass: internal.length >= 3, msg: `${internal.length} internal links` },
      { key: "external_links", pass: external.length >= 0, msg: `${external.length} external links` },
      { key: "images_present", pass: images.length >= 1, msg: `${images.length} images` },
      { key: "alt_text", pass: missingAlt.length === 0, msg: missingAlt.length ? `${missingAlt.length} images missing alt text` : "All images have alt text" },
      { key: "seo_title", pass: seoT >= 30 && seoT <= 70, msg: `SEO title ${seoT} chars` },
      { key: "seo_description", pass: seoD >= 120 && seoD <= 160, msg: `Meta description ${seoD} chars` },
      { key: "hero_image", pass: hasHero, msg: hasHero ? "Hero image set" : "Hero image missing" },
      { key: "faqs", pass: (meta.faqs?.length ?? 0) >= 4, msg: `${meta.faqs?.length ?? 0} FAQs` },
      { key: "no_broken_tokens", pass: brokenTokens.length === 0, msg: brokenTokens.length ? `Unresolved tokens: ${brokenTokens.join(", ")}` : "No broken tokens" },
      { key: "no_placeholders", pass: placeholders.length === 0, msg: placeholders.length ? `Placeholder text found: ${placeholders.join(", ")}` : "No placeholders" },
    ];
    const passed = checks.filter((c) => c.pass).length;
    const score = Math.round((passed / checks.length) * 100);

    await context.supabase.from("content_items").update({
      metadata: { ...meta, last_qa: { score, checks, at: new Date().toISOString() } },
    }).eq("id", data.id);

    return { score, checks, counts: { wc, headings, internalLinks: internal.length, externalLinks: external.length, images: images.length, missingAlt: missingAlt.length } };
  });

// ============= 6. PUBLISH TO BLOG =============

const PubInput = z.object({ id: z.string().uuid() });
export const publishFactoryDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PubInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: it } = await context.supabase.from("content_items").select("*").eq("id", data.id).maybeSingle();
    if (!it) throw new Error("Not found");
    const meta = (it as any).metadata ?? {};

    // Build JSON-LD
    const canonical = `https://glintr.com/blog/${(it as any).slug}`;
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: (it as any).title,
      description: (it as any).seo_description ?? (it as any).summary,
      image: (it as any).featured_image ? [(it as any).featured_image] : undefined,
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      author: { "@type": "Organization", name: "Glintr Editorial" },
      publisher: { "@type": "Organization", name: "Glintr" },
      mainEntityOfPage: canonical,
    };
    const faqSchema = (meta.faqs ?? []).length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (meta.faqs ?? []).map((f: any) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

    // Insert into blog_posts (or update if slug exists)
    const payload = {
      slug: (it as any).slug,
      title: (it as any).title,
      subtitle: meta.subtitle ?? null,
      short_summary: (it as any).summary ?? meta.subtitle ?? (it as any).title,
      intro: meta.intro ?? null,
      content_markdown: (it as any).body_markdown ?? "",
      author_display_name: "Glintr Editorial",
      featured_image_url: (it as any).featured_image ?? null,
      hero_image_url: (it as any).featured_image ?? null,
      thumbnail_url: meta.images?.thumbnail ?? (it as any).featured_image ?? null,
      social_image_url: meta.images?.social ?? (it as any).featured_image ?? null,
      status: "published",
      is_published: true,
      published_at: new Date().toISOString(),
      editorial_updated_at: new Date().toISOString(),
      reading_time_minutes: (it as any).reading_time_min ?? null,
      seo_title: (it as any).seo_title ?? (it as any).title,
      seo_description: (it as any).seo_description ?? (it as any).summary ?? "",
      keywords: meta.keywords ?? [],
      skill_level: meta.difficulty ?? null,
      faqs: meta.faqs ?? [],
      related_blog_slugs: meta.related_blog_slugs ?? [],
      related_course_slugs: meta.related_course_slugs ?? [],
      schema_jsonld: faqSchema ? [schema, faqSchema] : schema,
    };

    const { data: existing } = await context.supabase.from("blog_posts").select("id").eq("slug", payload.slug).maybeSingle();
    if (existing) {
      const { error } = await context.supabase.from("blog_posts").update(payload).eq("id", (existing as any).id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("blog_posts").insert(payload);
      if (error) throw new Error(error.message);
    }

    // Mark content_item published
    await context.supabase.from("content_items").update({
      status: "published",
      published_at: new Date().toISOString(),
      last_edited_by: context.userId,
    }).eq("id", data.id);

    return { ok: true, slug: (it as any).slug, url: `/blog/${(it as any).slug}` };
  });

// ============= 7. LOAD DRAFT =============

export const loadFactoryDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: it } = await context.supabase.from("content_items").select("*").eq("id", data.id).maybeSingle();
    if (!it) throw new Error("Not found");
    return it;
  });
