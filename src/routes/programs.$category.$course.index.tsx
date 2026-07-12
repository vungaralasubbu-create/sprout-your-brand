import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
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
import { CourseHeroVisual } from "@/components/course/hero-visual";
import { supabase } from "@/integrations/supabase/client";
import { CounsellorForm } from "@/components/shared/counsellor-form";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/programs/$category/$course/")({
  head: ({ params }) => ({
    meta: [
      { title: `${pretty(params.course)} — Glintr` },
      { name: "description", content: `Explore the ${pretty(params.course)} program on Glintr.` },
      { property: "og:title", content: `${pretty(params.course)} — Glintr` },
    ],
  }),
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
          className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent"
        />
        <Container>
          <nav className="text-caption mb-6 flex items-center gap-1.5 flex-wrap">
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

          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-caption font-mono uppercase tracking-widest text-primary">
                  {c.category.name}
                </span>
                {c.is_bestseller ? <Badge variant="bestseller">Best Seller</Badge> : null}
                {c.is_featured ? <Badge variant="certified">Featured</Badge> : null}
              </div>
              <h1 className="text-display-lg lg:text-[3.5rem] leading-[1.05] font-display font-semibold tracking-tight text-balance">
                {c.name}
              </h1>
              {c.short_description ? (
                <p className="mt-5 text-body-lg text-muted-foreground max-w-2xl">
                  {c.short_description}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" variant="gradient">
                  <Link to="/programs/$category/$course/apply" params={applyTo}>
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

              <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 max-w-xl">
                {c.duration ? (
                  <MetaStat icon={Clock} label="Duration" value={c.duration} />
                ) : null}
                {c.learning_mode ? (
                  <MetaStat icon={Globe} label="Learning mode" value={c.learning_mode} />
                ) : null}
                {c.level ? (
                  <MetaStat icon={GraduationCap} label="Level" value={c.level} />
                ) : null}
                {c.language ? (
                  <MetaStat icon={Sparkles} label="Language" value={c.language} />
                ) : null}
              </dl>
            </div>

            <div className="relative">
              <CourseHeroVisual
                courseName={c.name}
                categoryName={c.category.name}
                imageUrl={c.hero_image_url ?? c.thumbnail_url ?? null}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* ============ HIGHLIGHT STRIP ============ */}
      {highlights.length > 0 ? (
        <Section className="py-6 border-y bg-surface-2/40">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {highlights.map((h) => (
                <div key={h.label} className="flex items-center gap-3 py-2">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <h.icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium leading-tight">{h.label}</span>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ============ WHY THIS PROGRAM ============ */}
      {c.full_description || whyContent ? (
        <Section className="py-20 lg:py-28">
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

      {/* ============ LEARNING EXPERIENCE ============ */}
      {learningExperience.length > 0 ? (
        <Section className="py-20 bg-surface-2/40 border-y">
          <Container>
            <div className="max-w-2xl mb-12">
              <span className="text-caption font-mono uppercase tracking-widest text-primary">
                Learning Experience
              </span>
              <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
                Learn By Understanding. Grow By Building.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {learningExperience.slice(0, 4).map((card, i) => (
                <ExperienceCard key={i} {...card} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

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

      {/* ============ PROJECTS ============ */}
      {c.projects.length > 0 ? (
        <SectionBlock eyebrow="Projects" title="Build Work Worth Showing." tone="soft">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {c.projects.slice(0, 3).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          {c.projects.length > 3 ? (
            <p className="mt-6 text-caption">
              Additional project templates available inside the program.
            </p>
          ) : null}
        </SectionBlock>
      ) : null}

      {/* ============ PROGRAM EXPERIENCE FEATURE ============ */}
      {programExperience.length > 0 ? (
        <Section className="py-20 lg:py-24 bg-[oklch(0.18_0.04_255)] text-white relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.6_0.18_220/0.25),transparent_60%)]"
          />
          <Container className="relative">
            <div className="max-w-2xl mb-12">
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
        <Section className="py-20 lg:py-24">
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
        <Section className="py-20 lg:py-24">
          <Container>
            <div className="max-w-2xl mx-auto text-center mb-10">
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
                    <Link to="/programs/$category/$course/apply" params={applyTo}>
                      Apply Now
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/launch-your-brand/consultation">Talk To A Counsellor</Link>
                  </Button>
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
      <Section className="py-20 lg:py-28 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
              Ready To Build Skills That Move You Forward?
            </h2>
            <p className="mt-5 text-body-lg text-muted-foreground">
              Take the next step in {c.name} with mentorship, projects, and career support built
              into the program.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="gradient">
                <Link to="/programs/$category/$course/apply" params={applyTo}>
                  Apply Now
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/launch-your-brand/consultation">Talk To A Counsellor</Link>
              </Button>
            </div>
          </div>
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
              <Button asChild variant="outline" size="sm">
                <Link to="/launch-your-brand/consultation">Talk To A Counsellor</Link>
              </Button>
              <Button asChild size="sm" variant="gradient">
                <Link to="/programs/$category/$course/apply" params={applyTo}>
                  Apply Now
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur p-3 flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/launch-your-brand/consultation">Talk To Us</Link>
        </Button>
        <Button asChild variant="gradient" className="flex-1">
          <Link to="/programs/$category/$course/apply" params={applyTo}>
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
      <div className="aspect-video bg-gradient-to-br from-primary/15 via-accent/10 to-transparent relative overflow-hidden">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full grid place-items-center">
            <Hammer className="size-10 text-primary/60" />
          </div>
        )}
      </div>
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
      className={cn("py-20 lg:py-24", tone === "soft" ? "bg-surface-2/40 border-y" : "")}
    >
      <Container>
        <div className="max-w-2xl mb-12">
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
