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
import { CourseHeroVisual } from "@/components/course/hero-visual";
import { ProjectVisual } from "@/components/course/project-visual";
import { supabase } from "@/integrations/supabase/client";
import { CounsellorForm } from "@/components/shared/counsellor-form";
import { trackProgramView, trackApplyClick, trackEvent } from "@/lib/analytics/client";
import { cn } from "@/lib/utils";

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

  // ---- Derive dynamic content with graceful fallbacks ----
  const highlights = buildHighlights(c);
  const learningExperience = getExperienceCards(sectionMap.get("learning_experience")?.content);
  const programExperience = getExperienceCards(sectionMap.get("program_experience")?.content);
  const audienceCards = getAudienceCards(sectionMap.get("audience")?.content, c.target_audience);
  const whyContent = sectionMap.get("why_this_program")?.content as
    | { headline?: string; body?: string; points?: string[] }
    | undefined;

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

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-center">
            <Reveal>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-caption font-mono uppercase tracking-widest text-primary">
                  {c.category.name}
                </span>
                {c.is_bestseller ? <Badge variant="bestseller">Best Seller</Badge> : null}
                {c.is_featured ? <Badge variant="certified">Featured</Badge> : null}
              </div>
              <h1 className="font-display font-semibold tracking-[-0.03em] text-balance leading-[0.95] text-[clamp(2.6rem,6.4vw,5rem)]">
                {formatHeroTitle(c.name)}
              </h1>
              {c.short_description ? (
                <p className="mt-6 text-body-lg text-muted-foreground max-w-xl">
                  {c.short_description}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3">
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

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
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
            </Reveal>

            <Reveal delay={150}>
              <div className="relative">
                <CourseHeroVisual
                  courseName={c.name}
                  categoryName={c.category.name}
                  imageUrl={c.hero_image_url ?? c.thumbnail_url ?? null}
                />
                {/* floating Program Focus card */}
                <div className="hidden sm:block absolute -bottom-8 -left-6 lg:-left-10 rounded-2xl border border-border/60 bg-surface-1/95 backdrop-blur p-5 shadow-2xl w-[260px] animate-[fade-in_0.6s_ease-out_0.4s_both]">
                  <div className="text-caption font-mono uppercase tracking-widest text-primary">
                    Program Focus
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Hammer className="size-3.5" />
                      </span>
                      Practical Skills
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Rocket className="size-3.5" />
                      </span>
                      Projects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Briefcase className="size-3.5" />
                      </span>
                      Career Preparation
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>


      {/* ============ QUICK STATS ============ */}
      <Section className="py-8 border-y bg-surface-2/40">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {buildQuickStats(c).map((h, i) => (
              <Reveal key={h.label} delay={i * 70}>
                <div className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-surface-1 p-4 hover:border-primary/50 hover:shadow-sm transition-all">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary shrink-0 transition-transform group-hover:scale-105">
                    <h.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-caption">{h.label}</div>
                    <div className="text-sm font-semibold truncate">{h.value}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============ LEARN BY BUILDING ============ */}
      <Section className="py-14 lg:py-20">
        <Container>
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="text-caption font-mono uppercase tracking-widest text-primary">
                Learning Experience
              </span>
              <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
                Learn By Building.
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                Develop practical skills through structured learning, guided practice and real-world applications.
              </p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(learningExperience.length > 0
              ? learningExperience.slice(0, 4)
              : DEFAULT_LEARN_CARDS
            ).map((card, i) => (
              <Reveal key={i} delay={i * 90}>
                <ExperienceCard {...card} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>


      {/* ============ WHY THIS PROGRAM ============ */}
      {c.full_description || whyContent ? (
        <Section className="py-14 lg:py-20">
          <Container>
            <div className="grid lg:grid-cols-[0.4fr_1fr] gap-10 lg:gap-16">
              <div>
                <span className="text-caption font-mono uppercase tracking-widest text-primary">
                  Why This Program
                </span>
                <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
                  {whyContent?.headline ?? defaultWhyHeadline(c.name)}
                </h2>
              </div>
              <div className="space-y-6">
                <p className="text-body-lg text-muted-foreground">
                  {whyContent?.body ?? c.full_description}
                </p>
                {whyContent?.points?.length ? (
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {whyContent.points.map((p, i) => (
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
        >
          <Curriculum modules={c.modules as any} skills={c.skills} />
        </SectionBlock>
      ) : null}

      {/* ============ SKILLS ============ */}
      {c.skills.length > 0 ? (
        <SectionBlock eyebrow="Skills" title="Skills You Can Put To Work." tone="soft">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {c.skills.map((s) => (
              <div
                key={s}
                className="group relative rounded-xl border border-border/60 bg-surface-1 p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{s}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {/* ============ TOOLS ============ */}
      {c.tools.length > 0 ? (
        <SectionBlock eyebrow="Toolkit" title="Tools You'll Work With">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {c.tools.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-border/60 bg-surface-1 p-5 flex items-center gap-4 hover:border-primary/50 transition-colors"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                  {t.logo_url ? (
                    <img src={t.logo_url} alt={t.name} className="size-8 object-contain" />
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
        </SectionBlock>
      ) : null}

      {/* ============ PROJECTS SLIDER ============ */}
      {c.projects.length > 0 ? (
        <SectionBlock
          eyebrow="Projects"
          title="Build Projects That Show Your Skills."
          tone="soft"
        >
          <ProjectSlider projects={c.projects as any} />
        </SectionBlock>
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


      {/* ============ PROGRAM EXPERIENCE FEATURE ============ */}
      {programExperience.length > 0 ? (
        <Section className="py-14 lg:py-20 bg-[oklch(0.18_0.04_255)] text-white relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.6_0.18_220/0.25),transparent_60%)]"
          />
          <Container className="relative">
            <div className="max-w-2xl mb-10">
              <span className="text-caption font-mono uppercase tracking-widest text-[oklch(0.85_0.15_180)]">
                Program Experience
              </span>
              <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-white text-balance">
                More Than Lessons. A Complete Learning Experience.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {programExperience.slice(0, 8).map((card, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-lg bg-white/10 text-[oklch(0.9_0.15_180)]">
                    <card.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{card.title}</h3>
                  <p className="mt-1.5 text-sm text-white/70 line-clamp-3">{card.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ============ CERTIFICATION ============ */}
      {c.certifications.length > 0 ? (
        <Section className="py-14 lg:py-20">
          <Container>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <span className="text-caption font-mono uppercase tracking-widest text-primary">
                  Certification
                </span>
                <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
                  Show What You've Learned.
                </h2>
                <p className="mt-5 text-body-lg text-muted-foreground">
                  Complete the applicable program requirements and receive a course completion
                  certificate you can share with employers and on your professional profiles.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {c.certifications.map((cert, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">{cert.name}</div>
                        {cert.issuer ? (
                          <div className="text-caption">Issued by {cert.issuer}</div>
                        ) : null}
                        {cert.description ? (
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {cert.description}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <CertificatePreview
                imageUrl={c.certifications.find((x) => x.image_url)?.image_url ?? null}
                courseName={c.name}
              />
            </div>
          </Container>
        </Section>
      ) : null}

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
        <SectionBlock eyebrow="Career Support" title="Build Skills. Prepare For Opportunities.">
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

      {/* ============ WHO SHOULD JOIN ============ */}
      {audienceCards.length > 0 ? (
        <SectionBlock eyebrow="Audience" title="Is This Program For You?" tone="soft">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {audienceCards.slice(0, 6).map((a, i) => (
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

      {/* ============ PRICING ============ */}
      {price != null ? (
        <Section className="py-14 lg:py-20">
          <Container>
            <div className="max-w-2xl mx-auto text-center mb-8">
              <span className="text-caption font-mono uppercase tracking-widest text-primary">
                Program Access
              </span>
              <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
                Choose Your Learning Path.
              </h2>
            </div>
            <div className="max-w-lg mx-auto rounded-3xl border border-border bg-surface-1 p-8 shadow-xl relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-24 -right-24 size-64 rounded-full bg-primary/10 blur-3xl"
              />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">Program Fee</Badge>
                  {c.emi_available ? <Badge variant="outline">EMI available</Badge> : null}
                </div>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-display-md font-display font-semibold">
                    {formatPrice(price, c.currency ?? "INR")}
                  </span>
                  {c.offer_price && c.base_price && c.offer_price < c.base_price ? (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(c.base_price, c.currency ?? "INR")}
                    </span>
                  ) : null}
                </div>
                {c.emi_available && c.emi_starting ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    EMI starting {formatPrice(c.emi_starting, c.currency ?? "INR")}/mo
                  </p>
                ) : null}
                {c.pricing_notes ? (
                  <p className="mt-3 text-sm text-muted-foreground">{c.pricing_notes}</p>
                ) : null}

                <ul className="mt-6 space-y-2.5 border-t border-border/60 pt-6">
                  {buildIncludedFeatures(c).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-col gap-2.5">
                  <Button asChild size="lg" variant="gradient">
                    <Link to="/programs/$category/$course/apply" params={applyTo} onClick={onApplyClick}>
                      Apply Now
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <CounsellorForm size="lg" variant="outline" context={counsellorCtx} />
                </div>
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ============ FAQ ============ */}
      {c.faqs.length > 0 ? (
        <SectionBlock eyebrow="Questions" title="Frequently Asked Questions" tone="soft">
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            {c.faqs.map((f, i) => (
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

      {/* ============ RELATED ============ */}
      {related.length > 0 ? (
        <SectionBlock eyebrow="Explore More" title="You May Also Explore">
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

      {/* ============ FINAL CTA ============ */}
      <Section className="relative overflow-hidden py-16 lg:py-24">
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
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  tone?: "soft";
}) {
  return (
    <Section
      className={cn("py-14 lg:py-20", tone === "soft" ? "bg-surface-2/40 border-y" : "")}
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
  return (
    <>
      <SiteHeader />
      <main className="pb-24 lg:pb-0">{children}</main>
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
          className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface-1 text-foreground/80 hover:text-primary hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Next projects"
          disabled={!canNext}
          onClick={() => nudge(1)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface-1 text-foreground/80 hover:text-primary hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

