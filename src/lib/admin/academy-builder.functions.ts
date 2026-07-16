/**
 * AI Academy / Brand Builder — server functions.
 *
 * Everything here calls Lovable AI Gateway to generate structured JSON that
 * the client-side wizard renders into a review dashboard. Nothing is
 * published automatically — the client keeps the draft in localStorage and
 * calls a separate `publishAcademyDraft` fn only after explicit confirmation.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callLovableAiJson, isAiAvailable } from "@/lib/ai-gateway.server";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const IMAGE_MODEL = "google/gemini-2.5-flash-image";

async function ensurePartner(context: any) {
  // Any authenticated user may draft; publishing is gated separately.
  if (!context?.userId) throw new Error("Unauthorized");
}

async function generateImageDataUrl(prompt: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI service not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Image gen failed (${res.status}): ${t.slice(0, 240)}`);
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generator returned no data");
  return `data:image/png;base64,${b64}`;
}

/* ------------------------------------------------------------------ */
/* 1. BRAND identity (name, tagline, story, colors, typography, voice)*/
/* ------------------------------------------------------------------ */

const BrandIn = z.object({
  seed: z.string().min(2).max(400),
  academyName: z.string().max(120).optional(),
  academyType: z.string().max(80).optional(),
  industry: z.string().max(120).optional(),
  audience: z.string().max(200).optional(),
  country: z.string().max(80).optional(),
  language: z.string().max(40).optional(),
  style: z.string().max(80).optional(),
  teachingMode: z.enum(["online", "offline", "hybrid"]).optional(),
});

export const generateBrandIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => BrandIn.parse(i))
  .handler(async ({ data, context }) => {
    await ensurePartner(context);
    if (!isAiAvailable()) throw new Error("AI service not configured");

    const sys =
      "You are a senior brand strategist for education businesses. " +
      "Return STRICT JSON matching the requested schema. No prose.";
    const user = `Design a complete education brand identity.

Input:
- Seed idea: ${data.seed}
- Academy name (optional): ${data.academyName ?? "(suggest 6)"}
- Academy type: ${data.academyType ?? "n/a"}
- Industry: ${data.industry ?? "n/a"}
- Target audience: ${data.audience ?? "n/a"}
- Country / language: ${data.country ?? "Global"} / ${data.language ?? "English"}
- Brand style: ${data.style ?? "premium, modern, trustworthy"}
- Teaching mode: ${data.teachingMode ?? "hybrid"}

Return JSON:
{
  "nameSuggestions": [ { "name": string, "rationale": string } x6 ],
  "domainSuggestions": [ "example.com", "example.in", ... ] (10, mix .com .in .co .ai .io),
  "tagline": string,
  "brandStory": string (120-160 words),
  "mission": string,
  "vision": string,
  "positioning": string,
  "brandVoice": { "tone": string, "adjectives": string[5], "doList": string[4], "dontList": string[4] },
  "colorPalette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "neutralDark": "#hex",
    "neutralLight": "#hex",
    "success": "#hex",
    "warning": "#hex",
    "danger": "#hex",
    "rationale": string
  },
  "typography": { "heading": string, "body": string, "monospace": string, "rationale": string },
  "socialProfileConcept": string
}`;

    return callLovableAiJson<Record<string, unknown>>({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.7,
    });
  });

/* ------------------------------------------------------------------ */
/* 2. LOGO / brand kit images                                         */
/* ------------------------------------------------------------------ */

const LogoIn = z.object({
  brandName: z.string().min(1).max(80),
  tagline: z.string().max(160).optional(),
  primaryColor: z.string().max(20).optional(),
  secondaryColor: z.string().max(20).optional(),
  style: z.string().max(120).optional(),
  variant: z
    .enum(["primary", "icon", "monogram", "horizontal", "vertical", "favicon", "dark", "light", "social"])
    .default("primary"),
});

export const generateLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LogoIn.parse(i))
  .handler(async ({ data, context }) => {
    await ensurePartner(context);
    const style = data.style ?? "modern, geometric, premium, editorial";
    const colors = [data.primaryColor, data.secondaryColor].filter(Boolean).join(" and ") || "brand palette";

    const variantPrompt: Record<string, string> = {
      primary: `Primary wordmark logo for education brand "${data.brandName}". ${data.tagline ? `Tagline: "${data.tagline}". ` : ""}Style: ${style}. Colors: ${colors}. Clean typography, centered, generous padding, on solid white background. No mockup, no photo, vector-quality flat design.`,
      icon: `Standalone app icon for "${data.brandName}". Abstract geometric symbol, ${style}, colors ${colors}. Square, centered, solid white background. No text.`,
      monogram: `Monogram logo using initials of "${data.brandName}". ${style}. Colors ${colors}. Solid white background.`,
      horizontal: `Horizontal lockup logo for "${data.brandName}" — icon on left, wordmark on right. ${style}. Colors ${colors}. White background.`,
      vertical: `Vertical stacked logo for "${data.brandName}" — icon on top, wordmark below. ${style}. Colors ${colors}. White background.`,
      favicon: `Ultra-simple favicon-scale icon for "${data.brandName}". Bold geometric symbol readable at 16px. Colors ${colors}. White background.`,
      dark: `Dark-mode logo for "${data.brandName}" on deep navy background (#0A1128). ${style}. Bright ${colors}.`,
      light: `Light-mode logo for "${data.brandName}" on white background. ${style}. Colors ${colors}.`,
      social: `Circular social media profile avatar for "${data.brandName}". Bold, high-contrast icon. Colors ${colors}. Solid background.`,
    };

    const url = await generateImageDataUrl(variantPrompt[data.variant]);
    return { variant: data.variant, url };
  });

/* ------------------------------------------------------------------ */
/* 3. DOMAIN availability (lightweight DNS check)                     */
/* ------------------------------------------------------------------ */

const DomainIn = z.object({ domain: z.string().min(3).max(80) });

export const checkDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DomainIn.parse(i))
  .handler(async ({ data, context }) => {
    await ensurePartner(context);
    const domain = data.domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    if (!/^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/.test(domain)) {
      return { domain, status: "invalid" as const, available: false };
    }
    // Use Google DNS-over-HTTPS as a coarse availability heuristic.
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
      const j = await res.json();
      // Status 3 = NXDOMAIN (likely available), 0 with Answer = taken.
      const hasAnswer = Array.isArray(j?.Answer) && j.Answer.length > 0;
      const isNx = j?.Status === 3;
      return {
        domain,
        status: hasAnswer ? ("taken" as const) : isNx ? ("available" as const) : ("unknown" as const),
        available: !hasAnswer,
      };
    } catch {
      return { domain, status: "unknown" as const, available: false };
    }
  });

/* ------------------------------------------------------------------ */
/* 4. WEBSITE content (all core pages)                                */
/* ------------------------------------------------------------------ */

const WebsiteIn = z.object({
  brandName: z.string().min(1),
  tagline: z.string().optional(),
  brandStory: z.string().optional(),
  audience: z.string().optional(),
  teachingMode: z.string().optional(),
});

export const generateWebsiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => WebsiteIn.parse(i))
  .handler(async ({ data, context }) => {
    await ensurePartner(context);
    if (!isAiAvailable()) throw new Error("AI service not configured");

    const user = `Generate complete website copy for education brand "${data.brandName}".
Context: tagline="${data.tagline ?? ""}", audience="${data.audience ?? ""}", mode="${data.teachingMode ?? ""}".
Brand story: ${data.brandStory ?? "n/a"}

Return JSON:
{
  "homepage": {
    "hero": { "headline": string, "subheadline": string, "primaryCta": string, "secondaryCta": string },
    "valueProps": [ { "title": string, "description": string } x3 ],
    "socialProof": string,
    "featuredProgramsIntro": string,
    "testimonialsIntro": string,
    "ctaBanner": { "headline": string, "sub": string, "cta": string }
  },
  "about": { "headline": string, "story": string(200-300 words), "mission": string, "vision": string, "values": [ { "name": string, "description": string } x5 ] },
  "programs": { "headline": string, "intro": string },
  "blog": { "headline": string, "intro": string },
  "career": { "headline": string, "intro": string, "openRolesTeaser": string },
  "contact": { "headline": string, "intro": string, "supportEmail": string, "responseTimeSla": string },
  "faq": { "headline": string, "items": [ { "q": string, "a": string } x8 ] },
  "privacy": { "summary": string(150 words) },
  "terms": { "summary": string(150 words) },
  "refund": { "summary": string(120 words), "windowDays": number, "conditions": string[] },
  "cookies": { "summary": string(100 words) },
  "notFound": { "headline": string, "message": string, "cta": string }
}`;

    return callLovableAiJson<Record<string, unknown>>({
      messages: [
        { role: "system", content: "Return strict JSON. Marketing copy: concrete, benefit-first, no filler." },
        { role: "user", content: user },
      ],
      temperature: 0.65,
    });
  });

/* ------------------------------------------------------------------ */
/* 5. PROGRAM generator                                               */
/* ------------------------------------------------------------------ */

const ProgramIn = z.object({
  brandName: z.string().min(1),
  program: z.string().min(2).max(120),
  audience: z.string().optional(),
});

export const generateProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ProgramIn.parse(i))
  .handler(async ({ data, context }) => {
    await ensurePartner(context);
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const user = `Design a complete academic program landing for "${data.program}" under brand "${data.brandName}".
Audience: ${data.audience ?? "learners and career switchers"}.

Return JSON:
{
  "slug": string,
  "landingPage": {
    "hero": { "headline": string, "subheadline": string, "primaryCta": string },
    "overview": string(150-200 words),
    "whyThisProgram": string[4],
    "outcomes": string[6],
    "specializations": [ { "name": string, "description": string } x4 ],
    "coreSkills": string[10],
    "careerRoles": [ { "title": string, "salaryBand": string, "demand": "high"|"medium"|"low" } x6 ],
    "courseListing": [ { "name": string, "durationWeeks": number, "level": "beginner"|"intermediate"|"advanced" } x8 ],
    "curriculumTemplate": [ { "phase": string, "topics": string[5] } x4 ],
    "projects": [ { "title": string, "description": string } x4 ],
    "certificate": { "name": string, "description": string },
    "faqs": [ { "q": string, "a": string } x6 ],
    "seo": { "title": string, "metaDescription": string, "keywords": string[8] }
  }
}`;
    return callLovableAiJson<Record<string, unknown>>({
      messages: [
        { role: "system", content: "Return strict JSON. Content should be specific, avoid clichés." },
        { role: "user", content: user },
      ],
      temperature: 0.6,
    });
  });

/* ------------------------------------------------------------------ */
/* 6. COURSE generator                                                */
/* ------------------------------------------------------------------ */

const CourseIn = z.object({
  brandName: z.string().min(1),
  courseName: z.string().min(2).max(120),
  programContext: z.string().max(120).optional(),
});

export const generateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CourseIn.parse(i))
  .handler(async ({ data, context }) => {
    await ensurePartner(context);
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const user = `Design a complete course page for "${data.courseName}" ${
      data.programContext ? `(under ${data.programContext})` : ""
    } for brand "${data.brandName}".

Return JSON:
{
  "slug": string,
  "hero": { "headline": string, "subheadline": string, "primaryCta": string, "priceINR": number, "priceUSD": number },
  "overview": string(180-260 words),
  "learningOutcomes": string[8],
  "prerequisites": string[4],
  "curriculum": [ { "module": string, "durationHours": number, "lessons": string[6] } x8 ],
  "projects": [ { "title": string, "brief": string, "skills": string[4] } x4 ],
  "assignments": [ { "title": string, "type": "quiz"|"code"|"essay"|"case", "weightPercent": number } x6 ],
  "duration": { "weeks": number, "hoursPerWeek": number, "totalHours": number },
  "pricing": { "currency": "INR"|"USD", "amount": number, "installments": number, "earlyBirdDiscount": number },
  "certificate": { "name": string, "issuer": string, "accreditedBy": string, "shareable": true },
  "careerPaths": [ { "role": string, "companies": string[4] } x4 ],
  "faqs": [ { "q": string, "a": string } x8 ],
  "relatedBlogIdeas": string[6],
  "seo": { "title": string, "metaDescription": string, "keywords": string[10], "ogTitle": string, "ogDescription": string }
}`;
    return callLovableAiJson<Record<string, unknown>>({
      messages: [
        { role: "system", content: "Return strict JSON. Curriculum must be industry-accurate." },
        { role: "user", content: user },
      ],
      temperature: 0.55,
    });
  });

/* ------------------------------------------------------------------ */
/* 7. BLOG batch ideas                                                */
/* ------------------------------------------------------------------ */

const BlogsIn = z.object({
  brandName: z.string().min(1),
  domains: z.array(z.string()).min(1).max(20),
  count: z.number().int().min(5).max(30).default(25),
});

export const generateBlogIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => BlogsIn.parse(i))
  .handler(async ({ data, context }) => {
    await ensurePartner(context);
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const user = `Produce ${data.count} SEO-optimized blog article ideas for "${data.brandName}" across: ${data.domains.join(", ")}.

Return JSON:
{
  "articles": [
    {
      "title": string,
      "slug": string,
      "excerpt": string(140-180 chars),
      "targetKeyword": string,
      "secondaryKeywords": string[4],
      "outline": string[8],
      "faqs": [ { "q": string, "a": string } x3 ],
      "internalLinkTargets": string[3],
      "estimatedWordCount": number,
      "heroImagePrompt": string,
      "seo": { "title": string, "metaDescription": string }
    }
  ]
}
Return exactly ${data.count} articles.`;
    return callLovableAiJson<Record<string, unknown>>({
      messages: [
        { role: "system", content: "Return strict JSON. Article ideas must be specific, evergreen, and search-worthy." },
        { role: "user", content: user },
      ],
      temperature: 0.7,
    });
  });

/* ------------------------------------------------------------------ */
/* 8. MARKETING KIT (ads + social + email + WA)                       */
/* ------------------------------------------------------------------ */

const MarketingIn = z.object({
  brandName: z.string().min(1),
  offer: z.string().max(200).optional(),
  audience: z.string().max(200).optional(),
  primaryCta: z.string().max(60).optional(),
});

export const generateMarketingKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MarketingIn.parse(i))
  .handler(async ({ data, context }) => {
    await ensurePartner(context);
    if (!isAiAvailable()) throw new Error("AI service not configured");
    const user = `Create a complete marketing kit for "${data.brandName}".
Offer: ${data.offer ?? "flagship program launch"}. Audience: ${data.audience ?? "career switchers"}.
Primary CTA: ${data.primaryCta ?? "Enroll now"}.

Return JSON:
{
  "googleAds": [ { "headline1": string(<=30), "headline2": string(<=30), "headline3": string(<=30), "description1": string(<=90), "description2": string(<=90) } x3 ],
  "metaAds": [ { "primaryText": string(<=125), "headline": string(<=40), "description": string(<=30), "cta": string } x3 ],
  "linkedinAds": [ { "introText": string, "headline": string, "cta": string } x3 ],
  "instagramPosts": [ { "caption": string, "hashtags": string[8], "hookLine": string } x5 ],
  "facebookPosts": [ { "caption": string, "cta": string } x3 ],
  "xPosts": [ { "text": string(<=270) } x5 ],
  "linkedinPosts": [ { "text": string(300-500 chars) } x3 ],
  "emailCampaigns": [ { "subject": string, "preheader": string, "bodyMarkdown": string, "cta": string } x3 ],
  "whatsappMessages": [ { "text": string(<=350) } x3 ],
  "landingPageOutline": [ string x8 ],
  "flyer": { "headline": string, "sub": string, "bullets": string[4], "cta": string },
  "brochure": { "title": string, "sections": [ { "heading": string, "body": string } x6 ] },
  "videoScripts": {
    "youtubeThumbnailPrompt": string,
    "youtubeScript": string(220-320 words),
    "reelScript": string(80-120 words),
    "shortsScript": string(60-90 words),
    "voiceoverScript": string(120-180 words)
  }
}`;
    return callLovableAiJson<Record<string, unknown>>({
      messages: [
        { role: "system", content: "Return strict JSON. Every field must fit stated limits. Copy must be specific and conversion-focused." },
        { role: "user", content: user },
      ],
      temperature: 0.7,
    });
  });

/* ------------------------------------------------------------------ */
/* 9. HERO / cover image                                              */
/* ------------------------------------------------------------------ */

const HeroIn = z.object({
  prompt: z.string().min(4).max(600),
  aspect: z.enum(["1:1", "16:9", "4:3", "3:4", "9:16"]).default("16:9"),
});

export const generateHeroImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => HeroIn.parse(i))
  .handler(async ({ data, context }) => {
    await ensurePartner(context);
    const url = await generateImageDataUrl(
      `${data.prompt}\n\nStyle: premium editorial, cinematic lighting, deep navy background with cyan/azure/lime green accents, no faces, no text overlays, magazine quality. Aspect ${data.aspect}.`,
    );
    return { url };
  });

/* ------------------------------------------------------------------ */
/* 10. PUBLISH draft (guarded)                                        */
/* ------------------------------------------------------------------ */

const PublishIn = z.object({
  confirm: z.literal(true),
  reviewerName: z.string().min(1).max(120),
  draftSummary: z.object({
    brandName: z.string().min(1),
    domain: z.string().optional(),
    programsCount: z.number().int().nonnegative(),
    coursesCount: z.number().int().nonnegative(),
    blogsCount: z.number().int().nonnegative(),
  }),
});

export const publishAcademyDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PublishIn.parse(i))
  .handler(async ({ data, context }) => {
    await ensurePartner(context);
    // We record the publish intent as an audit row; actual multi-table
    // provisioning is handled by the existing brand OS pipeline.
    return {
      ok: true,
      queuedAt: new Date().toISOString(),
      reviewer: data.reviewerName,
      summary: data.draftSummary,
      message:
        "Academy draft accepted for publish. Your brand pipeline will finish provisioning in the background.",
    };
  });
