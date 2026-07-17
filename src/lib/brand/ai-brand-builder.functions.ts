// AI Brand Builder — server functions powering the conversational wizard.
// Client-safe path: imported from src/routes/launch-your-brand.start.tsx
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callLovableAiJson, isAiAvailable } from "@/lib/ai-gateway.server";

// ---- Name generator --------------------------------------------------------

const NameInput = z.object({
  seed: z.string().trim().min(1).max(80),
  teach: z.string().trim().max(120).optional().default(""),
  audience: z.string().trim().max(120).optional().default(""),
});

export type BrandNameSuggestion = {
  name: string;
  tag: "Available" | "Premium" | "Recommended" | "Most Brandable";
  reason: string;
};

const FALLBACK_TAGS: BrandNameSuggestion["tag"][] = [
  "Recommended",
  "Most Brandable",
  "Premium",
  "Available",
  "Recommended",
  "Available",
  "Premium",
  "Most Brandable",
  "Available",
  "Recommended",
];

function fallbackNames(seed: string): BrandNameSuggestion[] {
  const base = seed.replace(/academy|masters?|institute|labs?/gi, "").trim() || "Glint";
  const stems = [
    `${base} Academy`,
    `${base} Labs`,
    `${base} Institute`,
    `${base} Nexus`,
    `${base} Forge`,
    `${base} Sphere`,
    `${base} Collective`,
    `${base} School of Excellence`,
    `${base} Studio`,
    `${base} Bridge`,
  ];
  return stems.map((name, i) => ({
    name,
    tag: FALLBACK_TAGS[i] ?? "Available",
    reason: "AI-inspired variant",
  }));
}

export const generateBrandNames = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => NameInput.parse(raw))
  .handler(async ({ data }): Promise<BrandNameSuggestion[]> => {
    if (!isAiAvailable()) return fallbackNames(data.seed);
    try {
      const result = await callLovableAiJson<{ names: BrandNameSuggestion[] }>({
        temperature: 0.9,
        messages: [
          {
            role: "system",
            content:
              "You are a world-class brand naming strategist for education companies. " +
              "Return ONE JSON object with a `names` array of exactly 10 items. " +
              "Each item: { name, tag, reason }. " +
              'tag must be one of: "Available", "Premium", "Recommended", "Most Brandable". ' +
              "Names should be short (1-3 words), memorable, brandable, .com friendly, and free of clichés. " +
              "Avoid trademarks. Mix inventive words, latin roots, and modern coinages.",
          },
          {
            role: "user",
            content: `The partner typed: "${data.seed}". They teach: ${data.teach || "general upskilling"}. Audience: ${data.audience || "students & professionals"}. Suggest 10 names.`,
          },
        ],
      });
      const list = Array.isArray(result?.names) ? result.names.slice(0, 10) : [];
      if (list.length < 6) return fallbackNames(data.seed);
      return list.map((n, i) => ({
        name: String(n.name || "").slice(0, 40),
        tag: (["Available", "Premium", "Recommended", "Most Brandable"].includes(String(n.tag))
          ? n.tag
          : FALLBACK_TAGS[i]) as BrandNameSuggestion["tag"],
        reason: String(n.reason || "").slice(0, 140),
      }));
    } catch (e) {
      console.error("[generateBrandNames]", e);
      return fallbackNames(data.seed);
    }
  });

// ---- Brand kit + copy + marketing ------------------------------------------

const KitInput = z.object({
  brandName: z.string().trim().min(1).max(60),
  teach: z.string().trim().max(200).optional().default(""),
  audience: z.string().trim().max(120).optional().default(""),
  goal: z.string().trim().max(120).optional().default(""),
  founder: z.string().trim().max(80).optional().default(""),
});

export type BrandKit = {
  tagline: string;
  colors: { primary: string; secondary: string; accent: string; background: string; foreground: string };
  typography: { heading: string; body: string };
  mission: string;
  vision: string;
  about: string;
  homepageHero: { headline: string; sub: string; cta: string };
  faqs: { q: string; a: string }[];
  policies: { privacy: string; terms: string; refund: string };
  programs: { title: string; description: string; outcome: string }[];
  categories: string[];
  learningPaths: string[];
  menu: string[];
  marketing: {
    instagram: string[];
    linkedin: string[];
    facebook: string[];
    youtubeBanner: string;
    whatsappBanner: string;
    brochureIntro: string;
    businessPresentation: string;
  };
};

function fallbackKit(input: z.infer<typeof KitInput>): BrandKit {
  const b = input.brandName;
  const topic = input.teach || "future-ready skills";
  return {
    tagline: `${b} — Learn. Launch. Lead.`,
    colors: {
      primary: "#0EA5E9",
      secondary: "#6366F1",
      accent: "#84CC16",
      background: "#0B1220",
      foreground: "#F8FAFC",
    },
    typography: { heading: "Space Grotesk", body: "Inter" },
    mission: `To make world-class ${topic} education accessible, outcome-driven, and career-defining.`,
    vision: `A generation of learners who don't just study — they build, earn, and lead.`,
    about: `${b} is a modern learning brand focused on ${topic}. We combine live mentorship, project-based learning, and career support so every learner ships work that matters.`,
    homepageHero: {
      headline: `Become a specialist in ${topic}.`,
      sub: `Live cohorts. Real projects. Career outcomes.`,
      cta: "Start Learning",
    },
    faqs: [
      { q: "Who is this for?", a: `Anyone serious about mastering ${topic} — students, working professionals, and career switchers.` },
      { q: "Do I get a certificate?", a: `Yes. All ${b} programs include a verified certificate of completion.` },
      { q: "What if I miss a class?", a: "Every session is recorded and available in your dashboard within 24 hours." },
      { q: "Is there placement support?", a: "Yes — 1:1 career coaching, portfolio review, and hiring partner introductions." },
    ],
    policies: {
      privacy: `${b} respects your privacy. We collect only the data required to deliver your learning experience and never sell it to third parties.`,
      terms: `By enrolling in ${b} programs you agree to attend sessions, complete assignments, and adhere to our community code of conduct.`,
      refund: `${b} offers a 7-day no-questions refund window from the date of enrollment.`,
    },
    programs: [
      { title: `${topic} Foundations`, description: "Beginner-friendly path covering core concepts and first hands-on projects.", outcome: "Ship 3 portfolio projects" },
      { title: `${topic} Pro`, description: "Advanced cohort with mentorship and career track.", outcome: "Land your first role" },
      { title: `${topic} Career Accelerator`, description: "Interview prep, resume review, hiring partner intros.", outcome: "Job in 90 days" },
    ],
    categories: ["Foundations", "Advanced", "Career"],
    learningPaths: ["Beginner → Job-ready", "Working professional upskill", "Career switch fast-track"],
    menu: ["Programs", "Live Cohorts", "Career", "About", "Contact"],
    marketing: {
      instagram: [
        `🚀 ${b} is here. Master ${topic} with live cohorts and real projects.`,
        `Skill #1 our learners wish they started sooner: ${topic}. DM "START" to begin.`,
        `Meet ${b} — where ${topic} careers are built.`,
      ],
      linkedin: [
        `Excited to introduce ${b} — a modern academy for ${topic} professionals. Live cohorts, project-based, career-first.`,
        `We built ${b} because upskilling shouldn't feel like homework. It should feel like building your future.`,
      ],
      facebook: [
        `Learn ${topic} the modern way. Live classes, mentors, projects. Join ${b} today.`,
      ],
      youtubeBanner: `${b} — Live cohorts in ${topic}. New batch every month.`,
      whatsappBanner: `${b} · ${topic} programs · Chat with an advisor →`,
      brochureIntro: `Welcome to ${b}. This brochure walks you through our ${topic} programs, mentors, curriculum, and career outcomes.`,
      businessPresentation: `${b} · Investor & partner deck · Mission, market, programs, and traction.`,
    },
  };
}

export const generateBrandKit = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => KitInput.parse(raw))
  .handler(async ({ data }): Promise<BrandKit> => {
    if (!isAiAvailable()) return fallbackKit(data);
    try {
      const result = await callLovableAiJson<BrandKit>({
        temperature: 0.75,
        messages: [
          {
            role: "system",
            content:
              "You are a senior brand director + copy chief for education brands. " +
              "Return ONE JSON object shaped exactly like the BrandKit type. " +
              "Fields: tagline (string, <=60 chars), colors {primary,secondary,accent,background,foreground} (hex), " +
              "typography {heading,body} (Google Font names), mission (<=180), vision (<=140), about (<=280), " +
              "homepageHero {headline,sub,cta}, faqs (array of 4-6 {q,a}), policies {privacy,terms,refund} (each ~2 sentences), " +
              "programs (array of 3-5 {title,description,outcome}), categories (3-5 strings), learningPaths (3 strings), " +
              "menu (5 strings), marketing {instagram (3 posts), linkedin (2 posts), facebook (1 post), " +
              "youtubeBanner, whatsappBanner, brochureIntro, businessPresentation} (short strings). " +
              "Colors must feel premium and readable (WCAG AA on background/foreground). " +
              "Voice: modern, confident, warm, outcome-driven. No corporate clichés.",
          },
          {
            role: "user",
            content: `Brand: ${data.brandName}\nFounder: ${data.founder || "n/a"}\nTeaches: ${data.teach || "AI & upskilling"}\nAudience: ${data.audience || "students & professionals"}\nGoal: ${data.goal || "launch a profitable education brand"}\nGenerate the full brand kit.`,
          },
        ],
      });
      // Merge with fallback for missing fields
      const fb = fallbackKit(data);
      return {
        ...fb,
        ...result,
        colors: { ...fb.colors, ...(result?.colors || {}) },
        typography: { ...fb.typography, ...(result?.typography || {}) },
        homepageHero: { ...fb.homepageHero, ...(result?.homepageHero || {}) },
        policies: { ...fb.policies, ...(result?.policies || {}) },
        marketing: { ...fb.marketing, ...(result?.marketing || {}) },
        faqs: Array.isArray(result?.faqs) && result.faqs.length ? result.faqs : fb.faqs,
        programs: Array.isArray(result?.programs) && result.programs.length ? result.programs : fb.programs,
        categories: Array.isArray(result?.categories) && result.categories.length ? result.categories : fb.categories,
        learningPaths: Array.isArray(result?.learningPaths) && result.learningPaths.length ? result.learningPaths : fb.learningPaths,
        menu: Array.isArray(result?.menu) && result.menu.length ? result.menu : fb.menu,
      };
    } catch (e) {
      console.error("[generateBrandKit]", e);
      return fallbackKit(data);
    }
  });
