// Knowledge base builder — pulls live data from the database so the AI
// always speaks current pricing / offerings.

export type KnowledgeSnapshot = {
  courses: Array<{
    id: string;
    slug: string;
    title: string;
    category?: string | null;
    duration?: string | null;
    priceLabel?: string | null;
    mode?: string | null;
    outcomes?: string | null;
  }>;
  categories: Array<{ slug: string; name: string; description?: string | null }>;
  faqs: Array<{ q: string; a: string; topic: string; priority: number }>;
};

let cache: { data: KnowledgeSnapshot; ts: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

function fmtPrice(offer: number | null, base: number | null, currency: string | null): string | null {
  const cur = currency ?? "INR";
  if (offer && base && offer < base) return `${cur} ${offer} (was ${base})`;
  if (offer) return `${cur} ${offer}`;
  if (base) return `${cur} ${base}`;
  return null;
}

export async function loadKnowledgeSnapshot(): Promise<KnowledgeSnapshot> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.data;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [coursesRes, catsRes, faqsRes, kbRes] = await Promise.all([
    supabaseAdmin
      .from("courses")
      .select("id,slug,name,category_id,duration,base_price,offer_price,currency,learning_mode,short_description")
      .eq("is_published", true)
      .limit(80),
    supabaseAdmin.from("course_categories").select("id,slug,name,short_description").eq("is_active", true).limit(40),
    supabaseAdmin
      .from("faqs")
      .select("question,short_answer,full_answer,category_id,display_order")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .limit(60),
    supabaseAdmin
      .from("ai_sales_knowledge")
      .select("topic,question,answer,priority")
      .eq("active", true)
      .order("priority", { ascending: false })
      .limit(60),
  ]);

  const catById = new Map<string, string>();
  for (const c of catsRes.data ?? []) {
    if (c.id && c.slug) catById.set(c.id as string, c.slug as string);
  }

  const courses = (coursesRes.data ?? []).map((c) => ({
    id: c.id as string,
    slug: (c.slug as string) ?? "",
    title: (c.name as string) ?? "",
    category: c.category_id ? catById.get(c.category_id as string) ?? null : null,
    duration: (c.duration as string | null) ?? null,
    priceLabel: fmtPrice(
      (c.offer_price as number | null) ?? null,
      (c.base_price as number | null) ?? null,
      (c.currency as string | null) ?? null,
    ),
    mode: (c.learning_mode as string | null) ?? null,
    outcomes: (c.short_description as string | null) ?? null,
  }));

  const categories = (catsRes.data ?? []).map((c) => ({
    slug: (c.slug as string) ?? "",
    name: (c.name as string) ?? "",
    description: (c.short_description as string | null) ?? null,
  }));

  const faqs = [
    ...(faqsRes.data ?? []).map((f, idx) => ({
      q: (f.question as string) ?? "",
      a: ((f.short_answer as string) || (f.full_answer as string) || "").slice(0, 600),
      topic: "faq",
      priority: 100 - (idx as number),
    })),
    ...(kbRes.data ?? []).map((k) => ({
      q: (k.question as string) ?? "",
      a: (k.answer as string) ?? "",
      topic: (k.topic as string) ?? "curated",
      priority: ((k.priority as number) ?? 0) + 200,
    })),
  ];

  const snapshot: KnowledgeSnapshot = { courses, categories, faqs };
  cache = { data: snapshot, ts: Date.now() };
  return snapshot;
}

export function renderKnowledgePrompt(snap: KnowledgeSnapshot): string {
  const lines: string[] = [];
  lines.push("## GLINTR CORE FACTS");
  lines.push("- Company: Glintr — EdTech platform helping students launch careers and helping professionals become education entrepreneurs.");
  lines.push("- Partner models: 70% Revenue Share, 50% Supported. Pages: /70-revenue-model, /50-supported-model");
  lines.push("- Support: /contact  |  Book a 1:1 call: /book-consultation  |  EMI/Refund: /refund-policy");
  lines.push("- Programs live at /programs. Detail pages at /programs/{slug}. Income calculator: /income-calculator.");
  lines.push("");
  lines.push("## FLAGSHIP PROGRAM FAMILIES (map student intent → these first, then attach a matching course from LIVE PROGRAMS)");
  lines.push("- Glintr Internship Program → /programs?track=internship");
  lines.push("    For: college internship credit, mandatory internship, internship certificate submission, resume proof.");
  lines.push("    Includes: real industry project, industry mentor, internship completion certificate, project report,");
  lines.push("    presentation guidance, course access, flexible online mode, college-submission ready docs.");
  lines.push("- Career Launch Program → /programs?track=career-launch");
  lines.push("    For: placement, first job, career switch, portfolio building.");
  lines.push("    Includes: placement prep, mock interviews, resume + LinkedIn overhaul, industry projects,");
  lines.push("    coding practice, 1:1 career mentor, portfolio, interview preparation.");
  lines.push("- Self-Paced AI / Tech Program → /programs?mode=self-paced");
  lines.push("    For: skill development, upskilling on a budget, working professionals with limited time.");
  lines.push("- Live Mentorship Program → /programs?mode=live");
  lines.push("    For: learners who want live cohorts, doubt support, weekend classes, structured accountability.");
  lines.push("- Advanced / Premium AI Program → /programs?tier=premium");
  lines.push("    For: serious AI career switchers, senior professionals, entrepreneurs.");
  lines.push("- Add-ons: Certification pack, Resume Service, Mock Interview Package, Portfolio Package, LinkedIn Optimization → /career/os");
  lines.push("");
  lines.push("## INTENT → RECOMMENDATION MAP (use this to choose the primary program family)");
  lines.push("- College internship required / mandatory internship / needs certificate → Internship Program");
  lines.push("- College credit / UGC internship / submission deadline → Internship Program + emphasize college-ready deliverables");
  lines.push("- Placement / job search / campus placement missed → Career Launch Program");
  lines.push("- Resume building / weak resume → Career Launch or Internship + Resume Service add-on");
  lines.push("- Career switch (working professional) → Live Mentorship or Advanced AI + EMI");
  lines.push("- 'Just want to learn AI' / self study → Self-Paced AI, compare with Live and Advanced");
  lines.push("- Certification only → Certification add-on + shortest matching program");
  lines.push("- 'I don't know which course' → enter CAREER DISCOVERY MODE (see behavior spec)");
  lines.push("- Higher studies / MS / MBA aspirant → Internship Program (for SOP + project) + Resume Service");
  lines.push("- Freelancer / Entrepreneur → 70% Revenue Model + relevant self-paced skill");
  lines.push("");
  lines.push("## SUPPORT & TRUST FACTS");
  lines.push("- We are UGC-friendly for internship reports (project report + presentation + mentor sign-off).");
  lines.push("- EMI available; scholarship windows for verified students; refund policy at /refund-policy.");
  lines.push("- Real industry mentors, real company projects — not certificate-only mills.");
  lines.push("");
  lines.push("## LIVE CATEGORIES");
  for (const c of snap.categories.slice(0, 20)) {
    lines.push(`- ${c.name} (/programs?category=${c.slug})`);
  }
  lines.push("");
  lines.push("## LIVE PROGRAMS (current DB — cite exact titles and slugs, never invent)");
  for (const c of snap.courses.slice(0, 60)) {
    const bits = [
      c.title,
      c.category ? `cat=${c.category}` : "",
      c.duration ? `dur=${c.duration}` : "",
      c.priceLabel ? `price=${c.priceLabel}` : "",
      c.mode ? `mode=${c.mode}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    lines.push(`- ${bits}  → /programs/${c.slug}`);
  }
  lines.push("");
  if (snap.faqs.length) {
    lines.push("## CURATED Q&A (prefer answers here verbatim when the question matches)");
    for (const f of snap.faqs.slice(0, 30)) {
      lines.push(`Q: ${f.q}`);
      lines.push(`A: ${f.a}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}
