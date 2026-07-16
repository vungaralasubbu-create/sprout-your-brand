import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Download,
  Phone,
  Clock,
  GraduationCap,
  Globe,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Wrench,
  Target,
  Users,
  Award,
  Briefcase,
  Rocket,
  Layers,
  CheckCircle2,
  ArrowRight,
  Compass,
  Hammer,
  LineChart,
  Lightbulb,
  Quote,
  Star,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { ProgramDiscoveryFooter } from "@/components/shared/program-discovery-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCourseBySlug, getRelatedCourses, formatPrice } from "@/lib/programs";
import { getCourseSeo } from "@/lib/seo";
import {
  getProgramEditorial,
  getRelatedBlogsForProgram,
} from "@/data/program-editorial";


import { ProjectVisual } from "@/components/course/project-visual";
import { CoursePricingPlans } from "@/components/course/pricing-plans";

import {
  HiringPartners,
  ToolsMaster,
  StudentLearningJourney,
  PortfolioProjects,
  CareerRoadmap,
  SalaryGrowth,
  CareerServices,
  CertificationBadges,
  SuccessCounters,
  AIToolsUsage,
  ProgramPersonalization,
} from "@/components/course/premium-sections";
import { getCourseContentPack } from "@/lib/course-content-pack";
import { CertificateShowcase } from "@/components/course/certificate-showcase";
import { supabase } from "@/integrations/supabase/client";
import { CounsellorForm } from "@/components/shared/counsellor-form";
import { trackProgramView, trackApplyClick, trackEvent } from "@/lib/analytics/client";
import { cn } from "@/lib/utils";
import { ProgramScrollProgress } from "@/components/programs/program-scroll-progress";
import { ProgramHeroGraphic } from "@/components/programs/program-hero-graphic";
import { QuickAnswer, KeyTakeaways } from "@/components/shared/geo";


const SITE_URL = "https://glintr.com";

export const Route = createFileRoute("/programs/$category/$course/")({
  loader: async ({ params }) => ({ seo: await getCourseSeo(params.category, params.course) }),
  head: ({ params, loaderData }) => {
    const seo = loaderData?.seo;
    const canonical = `${SITE_URL}/programs/${params.category}/${params.course}`;
    const name = seo?.name ?? pretty(params.course);
    const title = seo?.seo_title ?? `${name} Course | Glintr`;
    const description =
      seo?.seo_description ??
      seo?.short_description ??
      `Learn ${name} with Glintr — a career-focused program with mentorship, projects, and placement support.`;
    const image = seo?.og_image_url ?? seo?.hero_image_url ?? seo?.thumbnail_url ?? undefined;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: canonical },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Programs", item: `${SITE_URL}/programs` },
        {
          "@type": "ListItem",
          position: 3,
          name: seo?.category.name ?? pretty(params.category),
          item: `${SITE_URL}/programs/${params.category}`,
        },
        { "@type": "ListItem", position: 4, name, item: canonical },
      ],
    };
    const scripts: Array<{ type: string; children: string }> = [
      { type: "application/ld+json", children: JSON.stringify(breadcrumbs) },
    ];
    if (seo) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name,
          description,
          url: canonical,
          ...(image ? { image } : {}),
          provider: {
            "@type": "Organization",
            name: "Glintr",
            sameAs: SITE_URL,
          },
          ...(seo.language ? { inLanguage: seo.language } : {}),
          ...(seo.duration ? { timeRequired: seo.duration } : {}),
          ...(seo.level ? { educationalLevel: seo.level } : {}),
          about: seo.category.name,
        }),
      });
    }
    // FAQ JSON-LD from editorial content (unique per program).
    const editorialFaqs = getProgramEditorial(params.course).faqs ?? [];
    if (editorialFaqs.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: editorialFaqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }),
      });
    }

    return {
      meta,
      links: [{ rel: "canonical", href: canonical }],
      scripts,
    };
  },
  component: CoursePage,
});

function pretty(s: string) {
  return s.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}



/** Look up a course_sections entry by section_type; returns its `content`. */
function useSectionMap(
  sections: Array<{ section_type: string; title: string | null; content: unknown }>,
) {
  return useMemo(() => {
    const m = new Map<string, { title: string | null; content: any }>();
    for (const s of sections) m.set(s.section_type, { title: s.title, content: s.content as any });
    return m;
  }, [sections]);
}

function CoursePage() {
  const { category, course } = Route.useParams();
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const ref = search?.get("ref") ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["course", category, course],
    queryFn: () => getCourseBySlug(category, course),
  });
  const { data: related = [] } = useRelated(data?.id, data?.category_id);

  useEffect(() => {
    if (!ref || !data) return;
    try {
      sessionStorage.setItem("glintr_ref", ref);
    } catch {
      /* ignore */
    }
    supabase
      .from("partner_referral_events")
      .insert({
        partner_ref: ref,
        course_id: data.id,
        event_type: "visit",
        session_id: getSessionId(),
      })
      .then(() => {});
  }, [ref, data]);

  // Fire program_view once per session per course.
  useEffect(() => {
    if (!data) return;
    trackProgramView({
      id: data.id,
      name: data.name,
      category: data.category?.name ?? null,
      partner_code: ref ?? null,
    });
  }, [data, ref]);

  // sticky bar visibility
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 620);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sectionMap = useSectionMap((data?.sections ?? []) as any);

  if (isLoading)
    return (
      <PageShell>
        <div className="p-24 text-center text-muted-foreground">Loading program…</div>
      </PageShell>
    );
  if (!data)
    return (
      <PageShell>
        <NotFound />
      </PageShell>
    );

  const c = data;
  const price = c.offer_price ?? c.base_price;
  const applyTo = { category, course };
  const counsellorCtx = { course_id: c.id, course_name: c.name, category_name: c.category.name };
  const onApplyClick = () =>
    trackApplyClick({
      id: c.id,
      name: c.name,
      category: c.category.name,
      partner_code: ref ?? null,
    });

  // ---- Category-specific content pack (hiring partners, tools, roadmap, etc.) ----
  const contentPack = getCourseContentPack(c.category.slug, c.slug);
  // ---- Derive dynamic content with graceful fallbacks ----
  const highlights = buildHighlights(c);
  const learningExperience = getExperienceCards(sectionMap.get("learning_experience")?.content);
  const programExperience = getExperienceCards(sectionMap.get("program_experience")?.content);
  const audienceCards = getAudienceCards(sectionMap.get("audience")?.content, c.target_audience);
  const whyContent = sectionMap.get("why_this_program")?.content as
    | { headline?: string; body?: string; points?: string[] }
    | undefined;
  const editorial = getProgramEditorial(c.slug);
  const editorialBlogs = getRelatedBlogsForProgram(c.slug);
  const displayAudience = audienceCards.length > 0 ? audienceCards : (editorial.audience ?? []);
  const displayFaqs = c.faqs.length > 0 ? c.faqs : (editorial.faqs ?? []);
  const whyPoints =
    whyContent?.points && whyContent.points.length > 0
      ? whyContent.points
      : (editorial.whyPoints ?? []);
  const whyBody = whyContent?.body ?? c.full_description ?? editorial.overview ?? null;
  const showWhySection = Boolean(whyBody || whyPoints.length);

  // ---- GEO: Quick Answer + Key Takeaways (AI-search primitives) ----
  const quickAnswer =
    c.short_description ?? editorial.overview ?? whyBody ?? `${c.name} is a structured educational program from Glintr, designed to build a clear working understanding of ${c.name} through guided lessons, projects and mentor support.`;
  const keyTakeaways = (whyPoints.length ? whyPoints : editorial.whyPoints ?? []).slice(0, 5);


  return (
    <PageShell>
      {/* ============ HERO ============ */}
      <Section className="pt-10 pb-16 lg:pt-14 lg:pb-24 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.05] via-transparent to-transparent"
        />
        <div
          aria-hidden
          className="absolute -top-32 -left-32 -z-10 size-[420px] rounded-full bg-primary/10 blur-[120px]"
        />
        <Container>
          <nav className="text-caption mb-8 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="size-3.5" />
            <Link to="/programs" className="hover:text-foreground">Programs</Link>
            <ChevronRight className="size-3.5" />
            <Link to="/programs/$category" params={{ category }} className="hover:text-foreground">
              {c.category.name}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{c.name}</span>
          </nav>

          {(() => {
            const heroImage = c.hero_image_url ?? c.thumbnail_url ?? null;
            return (
          <div className="grid gap-10 lg:gap-16 items-center lg:grid-cols-[1.2fr_1fr]">

            <Reveal>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-caption font-mono uppercase tracking-widest text-primary">
                  {c.category.name}
                </span>
                {c.is_bestseller ? <Badge variant="bestseller">Best Seller</Badge> : null}
                {c.is_featured ? <Badge variant="certified">Featured</Badge> : null}
              </div>
              <h1 className="font-display font-semibold tracking-[-0.03em] text-balance leading-[0.95] text-[clamp(2.4rem,5.6vw,4.4rem)]">
                {formatHeroTitle(c.name)}
              </h1>
              {c.short_description ? (
                <p className="mt-6 text-body-lg text-muted-foreground max-w-xl">
                  {c.short_description}
                </p>
              ) : null}

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                {c.duration ? (
                  <span className="inline-flex items-center gap-2 text-foreground/85">
                    <Clock className="size-4 text-primary/80" />
                    {c.duration}
                  </span>
                ) : null}
                {c.learning_mode ? (
                  <span className="inline-flex items-center gap-2 text-foreground/85">
                    <Globe className="size-4 text-primary/80" />
                    {c.learning_mode}
                  </span>
                ) : null}
                {c.level ? (
                  <span className="inline-flex items-center gap-2 text-foreground/85">
                    <GraduationCap className="size-4 text-primary/80" />
                    {c.level}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-2 text-foreground/85">
                  <Award className="size-4 text-primary/80" />
                  Certificate
                </span>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" variant="gradient">
                  <Link to="/programs/$category/$course/apply" params={applyTo} onClick={onApplyClick}>
                    Apply Now
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <CounsellorForm size="lg" variant="outline" context={counsellorCtx} />
                {c.brochure ? (
                  <a
                    href={c.brochure.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
                  >
                    <Download className="size-4" />
                    Download Brochure
                  </a>
                ) : null}
              </div>
              <p className="mt-4 text-caption text-muted-foreground">
                Mentor-led · Project-based · Career support included
              </p>
            </Reveal>

            {heroImage ? (
              <Reveal delay={150}>
                <div className="relative overflow-hidden rounded-3xl border border-border/60 shadow-xl aspect-[4/3]">
                  <img
                    src={heroImage}
                    alt={c.name}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
              </Reveal>
            ) : (
              <Reveal delay={150}>
                <ProgramHeroGraphic slug={c.slug} categorySlug={c.category.slug} />
              </Reveal>
            )}

          </div>
            );
          })()}
        </Container>
      </Section>

      {/* ============ GEO: QUICK ANSWER + KEY TAKEAWAYS ============ */}
      <Section className="py-10 lg:py-14 border-t bg-surface-1/40">
        <Container>
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-8">
            <QuickAnswer
              term={c.name}
              question={`What is ${c.name}?`}
              answer={quickAnswer}
            />
            {keyTakeaways.length ? <KeyTakeaways items={keyTakeaways} /> : null}
          </div>
        </Container>
      </Section>


      <Section className="relative overflow-hidden py-20 lg:py-28 bg-[oklch(0.16_0.04_255)] text-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.55_0.18_220/0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.7_0.15_180/0.22),transparent_60%)]"
        />
        <Container className="relative">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 items-start">
            <Reveal>
              <div>
                <span className="text-caption font-mono uppercase tracking-widest text-[oklch(0.85_0.15_200)]">
                  {c.category.name}
                </span>
                <h2 className="mt-4 font-display font-semibold tracking-[-0.025em] text-balance text-white leading-[1.02] text-[clamp(2rem,4.4vw,3.5rem)]">
                  Don't Just Learn It.<br />
                  <span className="bg-gradient-to-r from-[oklch(0.82_0.16_200)] via-[oklch(0.78_0.16_220)] to-[oklch(0.7_0.16_240)] bg-clip-text text-transparent">
                    Build With It.
                  </span>
                </h2>
                <p className="mt-5 text-white/70 max-w-md leading-relaxed">
                  {c.short_description ??
                    `${c.name} is designed to turn learning into a portfolio — through structured practice, real projects and mentor support.`}
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="space-y-7">
                {buildIntroSteps(c).map((step, i) => (
                  <div key={i} className="flex gap-5">
                    <span className="font-mono text-[oklch(0.85_0.15_200)] text-2xl font-semibold shrink-0 pt-1">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-xl text-white">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-white/70 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

        </Container>
      </Section>

      {/* ============ SUCCESS COUNTERS ============ */}
      <SuccessCounters />

      {/* ============ PERSONALIZATION (journey-aware) ============ */}
      <ProgramPersonalization />

      {/* ============ HIRING PARTNERS ============ */}
      <HiringPartners partners={contentPack.hiringPartners} />

      {/* ============ TOOLS YOU'LL MASTER ============ */}
      <ToolsMaster tools={contentPack.tools} />

      {/* ============ 8-STAGE JOURNEY ============ */}
      <StudentLearningJourney />

      {/* ============ LEARNING JOURNEY ============ */}
      <Section className="py-16 lg:py-24 bg-surface-2/40 border-y">
        <Container>
          <Reveal>
            <div className="max-w-2xl mb-12">
              <span className="text-caption font-mono uppercase tracking-widest text-primary">
                The Path
              </span>
              <h2 className="mt-3 font-display font-semibold tracking-tight text-balance text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.05]">
                Your Learning Journey
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                A guided path — from foundations to a portfolio you can show.
              </p>
            </div>
          </Reveal>
          <LearningJourney />
        </Container>
      </Section>

      {/* Image Story removed — no real course imagery yet. Content flows directly into Why / Syllabus. */}





      {/* ============ WHY THIS PROGRAM ============ */}
      {showWhySection ? (
        <Section className="py-14 lg:py-20">
          <Container>
            <div className="grid lg:grid-cols-[0.4fr_1fr] gap-10 lg:gap-16">
              <div>
                <span className="text-caption font-mono uppercase tracking-widest text-primary">
                  Why Learn {c.name}
                </span>
                <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
                  {whyContent?.headline ?? defaultWhyHeadline(c.name)}
                </h2>
              </div>
              <div className="space-y-6">
                {whyBody ? (
                  <p className="text-body-lg text-muted-foreground">{whyBody}</p>
                ) : null}
                {whyPoints.length ? (
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {whyPoints.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface-1 p-4"
                      >
                        <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{p}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

            </div>
          </Container>
        </Section>
      ) : null}

      {/* (Learning Experience is rendered as "Learn By Building" above.) */}


      {/* ============ CURRICULUM ============ */}
      {c.modules.length > 0 ? (
        <SectionBlock
          eyebrow="Program Syllabus"
          title="What You'll Learn"
          tone="soft"
        >
          <Curriculum modules={c.modules as any} skills={c.skills} />
        </SectionBlock>
      ) : null}

      {/* Image Story 2 removed — no real course imagery yet. */}


      {/* ============ SKILLS MARQUEE ============ */}
      {c.skills.length > 0 ? (
        <Section className="py-14 lg:py-20 border-y bg-surface-1">
          <Container>
            <Reveal>
              <div className="max-w-2xl mb-8">
                <span className="text-caption font-mono uppercase tracking-widest text-primary">
                  Skills You'll Build
                </span>
                <h2 className="mt-3 font-display font-semibold tracking-tight text-balance text-[clamp(1.8rem,3.4vw,2.75rem)] leading-[1.05]">
                  Skills You Can Put To Work.
                </h2>
              </div>
            </Reveal>
          </Container>
          <SkillsMarquee skills={c.skills} />
        </Section>
      ) : null}

      {/* ============ TOOLS ============ */}
      {c.tools.length > 0 ? (
        <Section className="pt-14 pb-6 lg:pt-20 lg:pb-10">
          <Container>
            <div className="max-w-2xl mb-10">
              <span className="text-caption font-mono uppercase tracking-widest text-primary">
                Toolkit
              </span>
              <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
                Tools You'll Work With
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {c.tools.map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-border/60 bg-surface-1 p-5 flex items-center gap-4 hover:border-primary/50 transition-colors"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                    {t.logo_url ? (
                      <img src={t.logo_url} alt={t.name} width={32} height={32} loading="lazy" decoding="async" className="size-8 object-contain" />
                    ) : (
                      <Wrench className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{t.name}</div>
                    <div className="text-caption truncate">Industry tool</div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}


      {/* ============ PROJECTS SLIDER (dark) ============ */}
      {c.projects.length > 0 ? (
        <Section className="relative overflow-hidden py-16 lg:py-24 bg-[oklch(0.14_0.04_255)] text-white">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.55_0.18_220/0.28),transparent_55%)]"
          />
          <Container className="relative">
            <Reveal>
              <div className="max-w-2xl mb-10">
                <span className="text-caption font-mono uppercase tracking-widest text-[oklch(0.85_0.15_200)]">
                  Projects
                </span>
                <h2 className="mt-3 font-display font-semibold tracking-tight text-balance text-white text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.05]">
                  Build Work Worth Showing.
                </h2>
                <p className="mt-4 text-white/70 max-w-xl">
                  Portfolio-ready projects that make your skills tangible to
                  employers, teams and clients.
                </p>
              </div>
            </Reveal>
            <ProjectSlider projects={c.projects as any} dark />
          </Container>
        </Section>
      ) : null}


      {/* ============ REVIEWS (renders only when approved reviews are supplied) ============ */}
      <CourseReviewsSection courseId={c.id} />

      {/* ============ VISUAL BREAK ============ */}
      <Section className="relative overflow-hidden py-20 lg:py-28 text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,oklch(0.28_0.14_255),oklch(0.42_0.16_220),oklch(0.55_0.15_195))] bg-[length:200%_200%] animate-[gradient-shift_14s_ease-in-out_infinite]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/10" />
        <Container>
          <Reveal>
            <div className="max-w-3xl">
              <span className="text-caption font-mono uppercase tracking-widest text-white/80">
                {c.category.name}
              </span>
              <h2 className="mt-3 text-heading-xl lg:text-display-md font-display font-semibold tracking-tight text-balance text-white">
                Build Skills.
                <br className="hidden sm:block" /> Create Projects.
                <br className="hidden sm:block" /> Show What You Can Do.
              </h2>
              <p className="mt-5 text-body-lg text-white/85 max-w-2xl">
                {c.name} is designed to move you from learning to doing — through structured
                practice, real projects and mentor support.
              </p>
            </div>
          </Reveal>
        </Container>
      </Section>


      {/* ============ CERTIFICATION (dynamic, course-specific) ============ */}
      <Section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-br from-[oklch(0.97_0.02_220)] via-white to-[oklch(0.98_0.015_200)]">
        <div
          aria-hidden
          className="absolute -top-32 -right-32 size-[420px] rounded-full bg-primary/10 blur-[110px]"
        />
        <Container className="relative">
          <Reveal>
            <div className="max-w-2xl">
              <span className="text-caption font-mono uppercase tracking-widest text-primary">
                Certification
              </span>
              <h2 className="mt-3 font-display font-semibold tracking-tight text-balance text-[clamp(2rem,4vw,3.2rem)] leading-[1.02]">
                Finish The {c.name} Program.<br />
                Earn Two Certificates.
              </h2>
              <p className="mt-5 text-body-lg text-muted-foreground">
                Complete the {c.name} program to receive your Course Completion certificate,
                and finish the applied internship track to earn a separate Internship Completion
                certificate — both issued by Glintr and shareable on your professional profile.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-10 lg:mt-14">
              <CertificateShowcase courseName={c.name} />
            </div>
          </Reveal>
        </Container>
      </Section>


      {/* ============ CAREER OPPORTUNITIES ============ */}
      {c.career_roles.length > 0 ? (
        <SectionBlock eyebrow="Career Paths" title="Where These Skills Can Take You." tone="soft">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {c.career_roles.map((r, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-surface-1 p-6 hover:border-primary/50 transition-colors"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="size-5" />
                </span>
                <h3 className="mt-4 font-display font-semibold text-lg">{r.title}</h3>
                {r.description ? (
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
                    {r.description}
                  </p>
                ) : null}
                {r.salary_min && r.salary_max ? (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="text-caption">Indicative industry salary insight</div>
                    <div className="text-sm font-mono mt-0.5">
                      {formatPrice(r.salary_min, r.currency ?? "INR")} –{" "}
                      {formatPrice(r.salary_max, r.currency ?? "INR")} /{" "}
                      {r.salary_period ?? "yearly"}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {/* ============ PLACEMENT / CAREER SUPPORT ============ */}
      {c.placement.length > 0 ? (
        <SectionBlock eyebrow="Career Support" title="Build Skills. Prepare For Opportunities." className="!pb-6 lg:!pb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {c.placement.map((p, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-surface-1 p-5 flex gap-4"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Target className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{p.support_type}</div>
                  {p.description ? (
                    <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-caption max-w-2xl">
            Career and placement support may be available according to the selected program terms.
          </p>
        </SectionBlock>
      ) : null}

      {/* ============ WHO CAN LEARN ============ */}
      {displayAudience.length > 0 ? (
        <SectionBlock eyebrow="Who Can Learn This" title="Is This Program For You?" tone="soft">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayAudience.slice(0, 6).map((a, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-surface-1 p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Users className="size-5" />
                </span>
                <h3 className="mt-4 font-display font-semibold">{a.title}</h3>
                {a.description ? (
                  <p className="mt-1.5 text-sm text-muted-foreground">{a.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {/* ============ PORTFOLIO PROJECTS ============ */}
      <PortfolioProjects projects={contentPack.portfolio} />

      {/* ============ CAREER ROADMAP ============ */}
      <CareerRoadmap stages={contentPack.careerRoadmap} />

      {/* ============ SALARY GROWTH ============ */}
      <SalaryGrowth stages={contentPack.salaryStages} />

      {/* ============ CAREER SERVICES ============ */}
      <CareerServices />

      {/* ============ CERTIFICATION BADGES ============ */}
      <CertificationBadges />

      {/* ============ PRODUCTIVITY / AI IN YOUR WORKFLOW ============ */}
      <AIToolsUsage items={contentPack.aiToolsUsage} />

      {/* ============ PRICING ============ */}
      <CoursePricingPlans
        applyTo={applyTo}
        onApplyClick={onApplyClick}
        counsellorCtx={counsellorCtx}
      />


      {/* ============ FAQ ============ */}
      {displayFaqs.length > 0 ? (
        <SectionBlock eyebrow="Questions" title="Frequently Asked Questions" tone="soft">
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            {displayFaqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/60">
                <AccordionTrigger className="text-left text-base font-medium">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">{f.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SectionBlock>
      ) : null}

      {/* ============ RELATED PROGRAMS ============ */}
      {related.length > 0 ? (
        <SectionBlock eyebrow="Explore More" title="Related Programs" className="!pb-8 lg:!pb-10">
          <div className="grid md:grid-cols-3 gap-6">
            {related.slice(0, 3).map((r: any) => (
              <Link
                key={r.id}
                to="/programs/$category/$course"
                params={{ category: r.category.slug, course: r.slug }}
                className="group rounded-2xl border border-border/60 bg-surface-1 p-6 hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <div className="text-caption font-mono uppercase tracking-widest text-primary">
                  {r.category.name}
                </div>
                <h3 className="mt-3 font-display font-semibold text-lg group-hover:text-primary transition-colors">
                  {r.name}
                </h3>
                {r.short_description ? (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {r.short_description}
                  </p>
                ) : null}
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                  Explore program
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/programs">Explore All Programs</Link>
            </Button>
          </div>
        </SectionBlock>
      ) : null}

      {/* ============ RELATED BLOG ARTICLES ============ */}
      {editorialBlogs.length > 0 ? (
        <SectionBlock eyebrow="Read More" title="Related Articles" tone="soft" className="!pb-8 lg:!pb-10">
          <div className="grid md:grid-cols-3 gap-6">
            {editorialBlogs.map((b) => (
              <Link
                key={b.slug}
                to="/blog/$slug"
                params={{ slug: b.slug }}
                className="group rounded-2xl border border-border/60 bg-surface-1 p-6 hover:border-primary/50 hover:shadow-lg transition-all flex flex-col"
              >
                <div className="text-caption font-mono uppercase tracking-widest text-primary">
                  Article
                </div>
                <h3 className="mt-3 font-display font-semibold text-lg group-hover:text-primary transition-colors line-clamp-3">
                  {b.title}
                </h3>
                <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-medium text-primary">
                  Read article
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/blog">Explore All Articles</Link>
            </Button>
          </div>
        </SectionBlock>
      ) : null}


      {/* ============ FINAL CTA ============ */}
      <Section className="relative overflow-hidden py-10 lg:py-14">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,oklch(0.32_0.14_255),oklch(0.48_0.16_220),oklch(0.6_0.14_195))] bg-[length:200%_200%] animate-[gradient-shift_18s_ease-in-out_infinite]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/10" />
        <Container>
          <Reveal>
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
                Ready To Start Building Your Skills?
              </h2>
              <p className="mt-5 text-body-lg text-white/90">
                Take the next step in {c.name} with mentorship, projects, and career support built
                into the program.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Link to="/programs/$category/$course/apply" params={applyTo} onClick={onApplyClick}>
                    Apply Now
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <CounsellorForm
                  size="lg"
                  variant="outline"
                  context={counsellorCtx}
                  className="border-white/40 text-white hover:bg-white/10 hover:text-white"
                />
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>


      {/* ============ STICKY BARS ============ */}
      {/* Desktop */}
      <div
        className={cn(
          "hidden lg:block fixed top-0 inset-x-0 z-40 border-b bg-background/95 backdrop-blur transition-transform duration-300",
          showSticky ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <Container>
          <div className="h-16 flex items-center justify-between gap-6">
            <div className="min-w-0 flex items-center gap-4">
              <span className="text-caption font-mono uppercase tracking-widest text-primary shrink-0">
                {c.category.name}
              </span>
              <span className="font-display font-semibold truncate">{c.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {price != null ? (
                <span className="text-sm font-mono">
                  {formatPrice(price, c.currency ?? "INR")}
                </span>
              ) : null}
              <CounsellorForm size="sm" variant="outline" context={counsellorCtx} />
              <Button asChild size="sm" variant="gradient">
                <Link to="/programs/$category/$course/apply" params={applyTo} onClick={onApplyClick}>
                  Apply Now
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur p-3 flex gap-2">
        <CounsellorForm size="md" variant="outline" context={counsellorCtx} className="flex-1" />
        <Button asChild variant="gradient" className="flex-1">
          <Link to="/programs/$category/$course/apply" params={applyTo} onClick={onApplyClick}>
            Apply Now
          </Link>
        </Button>
      </div>
    </PageShell>
  );
}

// -------------------- Sub-components --------------------

function MetaStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-caption inline-flex items-center gap-1.5">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function Curriculum({
  modules,
  skills,
}: {
  modules: Array<{
    id: string;
    number: number | null;
    name: string;
    description: string | null;
    topics: Array<{ id: string; name: string; description?: string | null }>;
  }>;
  skills: string[];
}) {
  const [active, setActive] = useState(0);
  const current = modules[active];

  return (
    <>
      {/* Desktop: split view */}
      <div className="hidden lg:grid grid-cols-[340px_1fr] gap-8">
        <div className="space-y-2">
          {modules.map((m, i) => {
            const isActive = i === active;
            return (
              <button
                key={m.id}
                onClick={() => setActive(i)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 bg-surface-1 hover:border-border",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "font-mono text-xs shrink-0 mt-0.5",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {String(m.number ?? i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "font-medium text-sm leading-snug",
                        isActive ? "text-foreground" : "text-foreground/80",
                      )}
                    >
                      {m.name}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {current ? (
          <div className="rounded-2xl border border-border/60 bg-surface-1 p-8">
            <div className="flex items-center gap-3 text-caption font-mono uppercase tracking-widest">
              <span className="text-primary">
                Module {String(current.number ?? active + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-2 text-heading-lg font-display font-semibold">{current.name}</h3>
            {current.description ? (
              <p className="mt-3 text-muted-foreground">{current.description}</p>
            ) : null}
            {current.topics.length > 0 ? (
              <div className="mt-6">
                <div className="text-caption font-mono uppercase tracking-widest mb-3">
                  Topics
                </div>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {current.topics.map((t) => (
                    <li key={t.id} className="flex items-start gap-2 text-sm">
                      <BookOpen className="size-4 text-primary shrink-0 mt-0.5" />
                      <span>{t.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {skills.length > 0 ? (
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="text-caption font-mono uppercase tracking-widest mb-3">
                  Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 8).map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Mobile: accordion */}
      <Accordion type="single" collapsible className="lg:hidden">
        {modules.map((m, i) => (
          <AccordionItem key={m.id} value={m.id}>
            <AccordionTrigger className="text-left">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-primary">
                  {String(m.number ?? i + 1).padStart(2, "0")}
                </span>
                <span className="font-medium">{m.name}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {m.description ? (
                <p className="text-muted-foreground mb-3">{m.description}</p>
              ) : null}
              {m.topics.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {m.topics.map((t) => (
                    <li key={t.id} className="flex items-start gap-2">
                      <BookOpen className="size-4 text-primary shrink-0 mt-0.5" />
                      <span>{t.name}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}

function ProjectCard({
  project,
}: {
  project: {
    id: string;
    name: string;
    short_description: string | null;
    image_url: string | null;
    project_type: string | null;
    difficulty: string | null;
    industry: string | null;
  };
}) {
  return (
    <div className="group rounded-2xl border border-border/60 bg-surface-1 overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all">
      {project.image_url ? (
        <div className="aspect-video overflow-hidden">
          <img
            src={project.image_url}
            alt={project.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <ProjectVisual name={project.name} className="aspect-video" />
      )}
      <div className="p-5">
        {project.project_type ? (
          <div className="text-caption font-mono uppercase tracking-widest text-primary">
            {project.project_type}
          </div>
        ) : null}
        <h3 className="mt-2 font-display font-semibold text-lg">{project.name}</h3>
        {project.short_description ? (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
            {project.short_description}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {project.difficulty ? <Badge variant="outline">{project.difficulty}</Badge> : null}
          {project.industry ? <Badge variant="outline">{project.industry}</Badge> : null}
        </div>
      </div>
    </div>
  );
}

function ExperienceCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface-1 p-6 hover:border-primary/50 transition-colors">
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-display font-semibold text-lg">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">{description}</p>
    </div>
  );
}

function CertificatePreview({
  imageUrl,
  courseName,
}: {
  imageUrl: string | null;
  courseName: string;
}) {
  if (imageUrl) {
    return (
      <div className="rounded-2xl border border-border/60 bg-surface-1 p-4 shadow-lg">
        <img
          src={imageUrl}
          alt={`${courseName} certificate`}
          className="w-full rounded-xl"
        />
        <p className="mt-3 text-caption text-center">Certificate Preview</p>
      </div>
    );
  }
  return (
    <div className="relative">
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-surface-1 to-surface-2 p-8 lg:p-10 shadow-xl aspect-[4/3] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="font-display text-2xl font-semibold tracking-tight">glintr</div>
          <Award className="size-8 text-primary" />
        </div>
        <div className="text-center">
          <div className="text-caption font-mono uppercase tracking-widest">
            Certificate of Completion
          </div>
          <div className="mt-3 font-display text-xl lg:text-2xl font-semibold text-balance">
            {courseName}
          </div>
          <div className="mt-3 text-caption">This certifies successful completion of the program.</div>
        </div>
        <div className="flex items-end justify-between text-caption font-mono">
          <div>
            <div className="h-px w-24 bg-foreground/30 mb-1" />
            Signature
          </div>
          <div>
            <div className="h-px w-24 bg-foreground/30 mb-1" />
            Date
          </div>
        </div>
      </div>
      <p className="mt-3 text-caption text-center">Certificate Preview</p>
    </div>
  );
}

// -------------------- Helpers --------------------

function SectionBlock({
  title,
  eyebrow,
  children,
  tone,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  tone?: "soft";
  className?: string;
}) {
  return (
    <Section
      className={cn("py-14 lg:py-20", tone === "soft" ? "bg-surface-2/40 border-y" : "", className)}
    >
      <Container>
        <div className="max-w-2xl mb-10">
          {eyebrow ? (
            <span className="text-caption font-mono uppercase tracking-widest text-primary">
              {eyebrow}
            </span>
          ) : null}
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            {title}
          </h2>
        </div>
        {children}
      </Container>
    </Section>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="text-center max-w-md">
        <h1 className="text-heading-xl font-display font-semibold">Program not found</h1>
        <p className="mt-3 text-muted-foreground">This program isn't published yet.</p>
        <Button asChild className="mt-6">
          <Link to="/programs">Browse programs</Link>
        </Button>
      </div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  const { category } = Route.useParams();
  return (
    <>
      <ProgramScrollProgress />
      <SiteHeader />
      <main className="pb-24 lg:pb-0">
        {children}
        <Section>
          <Container>
            <ProgramDiscoveryFooter categorySlug={category} />
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}


function useRelated(courseId?: string, categoryId?: string) {
  return useQuery({
    queryKey: ["related", courseId],
    queryFn: () => (courseId && categoryId ? getRelatedCourses(courseId, categoryId) : []),
    enabled: Boolean(courseId && categoryId),
  });
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem("glintr_sid");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("glintr_sid", id);
    }
    return id;
  } catch {
    return null;
  }
}

// ---- Content derivation helpers ----

function buildHighlights(c: {
  duration: string | null;
  level: string | null;
  learning_mode: string | null;
}) {
  const items: Array<{ icon: React.ComponentType<{ className?: string }>; label: string }> = [];
  if (c.duration) items.push({ icon: Clock, label: c.duration });
  items.push({ icon: Hammer, label: "Project-Based Learning" });
  items.push({ icon: Compass, label: "Mentorship & Career Support" });
  items.push({ icon: Award, label: "Course Completion Certificate" });
  return items.slice(0, 4);
}

function defaultWhyHeadline(courseName: string) {
  const lower = courseName.toLowerCase();
  if (/autocad|cad|drafting/.test(lower))
    return "Turn Ideas Into Precise Technical Designs.";
  if (/digital marketing|marketing|seo/.test(lower))
    return "Learn How Modern Brands Find, Engage And Convert Customers.";
  if (/artificial intelligence|\bai\b|machine learning/.test(lower))
    return "Learn To Build With The Technology Shaping The Future.";
  if (/data science|analytics/.test(lower))
    return "Turn Data Into Decisions That Move Business Forward.";
  if (/vlsi|semiconductor|chip/.test(lower))
    return "Design The Silicon That Powers Modern Systems.";
  if (/robotic|automation/.test(lower))
    return "Build The Automation That Powers Modern Industry.";
  if (/human resources|\bhr\b/.test(lower))
    return "Shape The Teams That Build Successful Companies.";
  return `Build A Career In ${courseName}.`;
}

function getExperienceCards(content: any):
  Array<{ title: string; description: string; icon: React.ComponentType<{ className?: string }> }> {
  if (!Array.isArray(content)) return [];
  const iconFor = (title: string) => {
    const t = title.toLowerCase();
    if (/project|build|hands/.test(t)) return Hammer;
    if (/mentor|guid/.test(t)) return Compass;
    if (/career|placement|opportunity/.test(t)) return Briefcase;
    if (/curriculum|learn|understand/.test(t)) return BookOpen;
    if (/flexible|schedule|pace/.test(t)) return Clock;
    if (/practical|tool/.test(t)) return Wrench;
    if (/capstone|showcase/.test(t)) return Rocket;
    if (/industry|relevant/.test(t)) return LineChart;
    if (/support/.test(t)) return ShieldCheck;
    return Lightbulb;
  };
  return content
    .filter((x) => x && typeof x === "object" && x.title)
    .map((x: any) => ({
      title: String(x.title),
      description: String(x.description ?? ""),
      icon: iconFor(String(x.title)),
    }));
}

function getAudienceCards(content: any, fallbackText: string | null) {
  if (Array.isArray(content)) {
    return content
      .filter((x) => x && typeof x === "object" && x.title)
      .map((x: any) => ({ title: String(x.title), description: x.description ? String(x.description) : null }));
  }
  if (typeof fallbackText === "string" && fallbackText.trim()) {
    // Best-effort: split short comma / bullet lists into cards.
    const parts = fallbackText
      .split(/\n|•|\||,/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 60);
    if (parts.length >= 2) {
      return parts.slice(0, 6).map((p) => ({ title: p, description: null as string | null }));
    }
  }
  return [];
}

function buildIncludedFeatures(c: {
  duration: string | null;
  level: string | null;
  emi_available: boolean;
}) {
  const features = [
    "Full curriculum access with lifetime updates",
    "Guided projects and practical assignments",
    "Mentorship and structured learning journey",
    "Course completion certificate",
  ];
  if (c.duration) features.unshift(`${c.duration} of structured learning`);
  if (c.emi_available) features.push("EMI payment options available");
  return features.slice(0, 6);
}

// Suppress unused-import lint noise for icons referenced only via helpers.
void Layers;
void Quote;
void Star;
void Phone;
void ShieldCheck;

// -------------------- New: Reveal, Slider, Reviews, helpers --------------------

function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Comp = Tag as any;
  return (
    <Comp
      ref={ref as any}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

function ProjectSlider({
  projects,
  dark = false,
}: {
  projects: Array<{
    id: string;
    name: string;
    short_description: string | null;
    image_url: string | null;
    project_type: string | null;
    difficulty: string | null;
    industry: string | null;
  }>;
  dark?: boolean;
}) {

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [projects.length]);

  const nudge = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-project-card]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          type="button"
          aria-label="Previous projects"
          disabled={!canPrev}
          onClick={() => nudge(-1)}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
            dark
              ? "border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/40"
              : "border-border bg-surface-1 text-foreground/80 hover:text-primary hover:border-primary/50",
          )}
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Next projects"
          disabled={!canNext}
          onClick={() => nudge(1)}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
            dark
              ? "border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/40"
              : "border-border bg-surface-1 text-foreground/80 hover:text-primary hover:border-primary/50",
          )}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >

        {projects.map((p) => (
          <div
            key={p.id}
            data-project-card
            className="snap-start shrink-0 w-[85%] sm:w-[46%] lg:w-[calc((100%-3rem)/3)]"
          >
            <ProjectCard project={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Reviews section. Renders only when approved reviews exist in the
 * `course_reviews` table. Silently hides when the table is missing or
 * returns no approved rows — no fake reviews, ever.
 */
interface CourseReview {
  id: string;
  student_name: string;
  student_role?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
  review_text: string;
}
function CourseReviewsSection({ courseId }: { courseId: string }) {
  const { data } = useQuery<CourseReview[]>({
    queryKey: ["course-reviews", courseId],
    queryFn: async () => {
      try {
        const res = await (supabase as any)
          .from("course_reviews")
          .select("id,student_name,student_role,avatar_url,rating,review_text")
          .eq("course_id", courseId)
          .eq("is_approved", true)
          .order("display_order", { ascending: true })
          .limit(12);
        if (res.error) return [];
        return (res.data ?? []) as CourseReview[];
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  const reviews = data ?? [];
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const nudge = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };
  if (reviews.length === 0) return null;

  return (
    <SectionBlock eyebrow="Student Reviews" title="What Learners Say.">
      <div className="relative">
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            type="button"
            aria-label="Previous review"
            onClick={() => nudge(-1)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface-1 hover:text-primary hover:border-primary/50 transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next review"
            onClick={() => nudge(1)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface-1 hover:text-primary hover:border-primary/50 transition-colors"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map((r) => (
            <article
              key={r.id}
              className="snap-start shrink-0 w-[85%] sm:w-[46%] lg:w-[calc((100%-3rem)/3)] rounded-2xl border border-border/60 bg-surface-1 p-6"
            >
              <Quote className="size-6 text-primary/60" />
              {typeof r.rating === "number" ? (
                <div className="mt-3 flex items-center gap-0.5" aria-label={`Rated ${r.rating} of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-4",
                        i < Math.round(r.rating ?? 0)
                          ? "fill-warning text-warning"
                          : "text-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
              ) : null}
              <p className="mt-3 text-sm text-foreground/90 leading-relaxed line-clamp-6">
                {r.review_text}
              </p>
              <div className="mt-5 flex items-center gap-3">
                {r.avatar_url ? (
                  <img
                    src={r.avatar_url}
                    alt=""
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {r.student_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{r.student_name}</div>
                  {r.student_role ? (
                    <div className="text-caption truncate">{r.student_role}</div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionBlock>
  );
}

function buildQuickStats(c: {
  duration: string | null;
  level: string | null;
  learning_mode: string | null;
}): Array<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string }> {
  const items: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string }> = [];
  items.push({ icon: Clock, label: "Duration", value: c.duration ?? "Self-paced" });
  items.push({ icon: Globe, label: "Learning Mode", value: c.learning_mode ?? "Online" });
  items.push({ icon: GraduationCap, label: "Skill Level", value: c.level ?? "All Levels" });
  items.push({ icon: Award, label: "Certificate", value: "On Completion" });
  return items;
}

const DEFAULT_LEARN_CARDS: Array<{
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    title: "Structured Learning",
    description: "A guided curriculum that builds knowledge step by step from fundamentals to applied skills.",
    icon: BookOpen,
  },
  {
    title: "Practical Projects",
    description: "Hands-on projects and assignments so you learn by building, not just watching.",
    icon: Hammer,
  },
  {
    title: "Mentor Support",
    description: "Guidance from mentors who help you unblock, refine your work and stay on track.",
    icon: Compass,
  },
  {
    title: "Career Preparation",
    description: "Skill development, showcase-ready projects and career support to help you move forward.",
    icon: Briefcase,
  },
];


// -------------------- Hero title formatting --------------------

/**
 * Split a course name into (roughly) two balanced lines so it renders as a
 * bold editorial two-line headline. Short names render as-is.
 */
function formatHeroTitle(name: string): React.ReactNode {
  const words = name.trim().split(/\s+/);
  if (words.length <= 2) return name;
  // Find split index closest to the middle character-wise.
  const total = name.length;
  let best = 1;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(" ").length;
    const delta = Math.abs(left - (total - left));
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  }
  const line1 = words.slice(0, best).join(" ");
  const line2 = words.slice(best).join(" ");
  return (
    <>
      {line1}
      <br />
      {line2}
    </>
  );
}

// -------------------- Dark intro steps --------------------

function buildIntroSteps(c: {
  name: string;
  short_description: string | null;
}): Array<{ title: string; description: string }> {
  const name = c.name;
  return [
    {
      title: "Learn The Core Skills",
      description: `Master the fundamentals of ${name} through a structured, guided curriculum designed for real-world application.`,
    },
    {
      title: "Build Practical Projects",
      description: "Apply what you learn through hands-on projects reviewed by mentors and modelled on industry work.",
    },
    {
      title: "Apply What You Learn",
      description: "Graduate with a portfolio, career-ready skills and the confidence to take on new opportunities.",
    },
  ];
}

// -------------------- Learning Journey timeline --------------------

const JOURNEY_STAGES: Array<{
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    title: "Foundation",
    description: "Ground the fundamentals with structured learning and guided practice.",
    icon: BookOpen,
  },
  {
    title: "Practice",
    description: "Sharpen skills through mentor-reviewed exercises and short builds.",
    icon: Compass,
  },
  {
    title: "Build",
    description: "Deliver real projects that stitch every skill together into practical work.",
    icon: Hammer,
  },
  {
    title: "Showcase",
    description: "Finish with a portfolio, certificate and clear next steps for your career.",
    icon: Rocket,
  },
];

function LearningJourney() {
  return (
    <div className="relative">
      {/* Desktop: horizontal path */}
      <div className="hidden md:block">
        <div
          aria-hidden
          className="absolute left-0 right-0 top-[38px] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />
        <ol className="relative grid grid-cols-4 gap-6">
          {JOURNEY_STAGES.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <li className="flex flex-col items-center text-center px-2">
                <div className="relative">
                  <span className="inline-flex size-[76px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg ring-8 ring-surface-2/40">
                    <s.icon className="size-7" />
                  </span>
                  <span className="absolute -top-2 -right-2 inline-flex size-7 items-center justify-center rounded-full bg-background border border-border font-mono text-xs font-semibold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-display font-semibold text-lg tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-[220px]">
                  {s.description}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>

      {/* Mobile: vertical timeline */}
      <ol className="md:hidden relative pl-10">
        <span
          aria-hidden
          className="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-primary/30 to-transparent"
        />
        {JOURNEY_STAGES.map((s, i) => (
          <Reveal key={s.title} delay={i * 100}>
            <li className="relative pb-8 last:pb-0">
              <span className="absolute -left-10 top-0 inline-flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-md">
                <s.icon className="size-5" />
              </span>
              <div className="text-caption font-mono text-primary">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-1 font-display font-semibold text-lg tracking-tight">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

// -------------------- Skills marquee --------------------

function SkillsMarquee({ skills }: { skills: string[] }) {
  // Duplicate the list so translateX(-50%) creates a seamless loop.
  const items = [...skills, ...skills];
  return (
    <div
      className="relative w-full overflow-hidden"
      aria-label="Skills you'll build"
    >
      {/* soft edge fades */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-surface-1 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-surface-1 to-transparent"
      />
      <div
        className="flex w-max gap-3 py-2 will-change-transform motion-safe:animate-[glintr-marquee_28s_linear_infinite] hover:[animation-play-state:paused]"
      >
        {items.map((s, i) => (
          <span
            key={`${s}-${i}`}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-5 py-2.5 text-sm font-medium whitespace-nowrap shadow-sm"
          >
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </span>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
