import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ChevronRight, Download, Phone, Clock, GraduationCap, Globe, ShieldCheck, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getCourseBySlug, getRelatedCourses, formatPrice } from "@/lib/programs";
import { supabase } from "@/integrations/supabase/client";

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

function CoursePage() {
  const { category, course } = Route.useParams();
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const ref = search?.get("ref") ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["course", category, course],
    queryFn: () => getCourseBySlug(category, course),
  });

  useEffect(() => {
    if (!ref || !data) return;
    try {
      sessionStorage.setItem("glintr_ref", ref);
    } catch { /* ignore */ }
    supabase.from("partner_referral_events").insert({
      partner_ref: ref,
      course_id: data.id,
      event_type: "visit",
      session_id: getSessionId(),
    }).then(() => {});
  }, [ref, data]);

  if (isLoading) return <PageShell><div className="p-24 text-center text-muted-foreground">Loading…</div></PageShell>;
  if (!data) return <PageShell><NotFound /></PageShell>;

  const c = data;
  const { data: related = [] } = useRelated(c.id, c.category_id);

  return (
    <PageShell>
      {/* HERO */}
      <Section className="pt-12 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
        <Container>
          <nav className="text-caption mb-4 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="size-3.5" />
            <Link to="/programs" className="hover:text-foreground">Programs</Link>
            <ChevronRight className="size-3.5" />
            <Link to="/programs/$category" params={{ category }} className="hover:text-foreground">{c.category.name}</Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{c.name}</span>
          </nav>
          <div className="grid lg:grid-cols-[1fr_360px] gap-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{c.category.name}</Badge>
                {c.is_bestseller ? <Badge variant="bestseller">Best Seller</Badge> : null}
                {c.is_featured ? <Badge variant="certified">Featured</Badge> : null}
              </div>
              <h1 className="text-display-md font-display font-semibold tracking-tight text-balance">{c.name}</h1>
              <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl">{c.short_description}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-caption">
                {c.duration ? <span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{c.duration}</span> : null}
                {c.learning_mode ? <span className="inline-flex items-center gap-1.5"><Globe className="size-4" />{c.learning_mode}</span> : null}
                {c.level ? <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-4" />{c.level}</span> : null}
                {c.language ? <span className="inline-flex items-center gap-1.5"><Sparkles className="size-4" />{c.language}</span> : null}
              </div>
            </div>
            <aside className="card-elevated p-6 self-start lg:sticky lg:top-24">
              {c.offer_price != null || c.base_price != null ? (
                <div className="mb-5">
                  <div className="text-caption">Program fee</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-display font-semibold">{formatPrice(c.offer_price ?? c.base_price, c.currency ?? "INR")}</span>
                    {c.offer_price && c.base_price && c.offer_price < c.base_price ? (
                      <span className="text-caption line-through">{formatPrice(c.base_price, c.currency ?? "INR")}</span>
                    ) : null}
                  </div>
                  {c.emi_available ? <p className="text-caption mt-1">EMI available{c.emi_starting ? ` from ${formatPrice(c.emi_starting, c.currency ?? "INR")}/mo` : ""}</p> : null}
                </div>
              ) : null}
              <div className="flex flex-col gap-2">
                <Button asChild size="lg" variant="gradient">
                  <Link to="/programs/$category/$course/apply" params={{ category, course }}>Apply now</Link>
                </Button>
                {c.brochure ? (
                  <Button asChild variant="outline" size="lg">
                    <a href={c.brochure.file_url} target="_blank" rel="noreferrer"><Download className="size-4" />Download brochure</a>
                  </Button>
                ) : null}
                <Button variant="ghost" size="lg" asChild>
                  <Link to="/launch-your-brand/consultation"><Phone className="size-4" />Talk to a counsellor</Link>
                </Button>
              </div>
              <ul className="mt-6 space-y-2 text-caption">
                <li className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-primary" />Career and mentorship support</li>
                <li className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-primary" />Course completion certificate</li>
              </ul>
            </aside>
          </div>
        </Container>
      </Section>

      {/* OVERVIEW */}
      {c.full_description ? (
        <SectionBlock title="Course overview">
          <p className="text-body-lg text-muted-foreground max-w-3xl">{c.full_description}</p>
        </SectionBlock>
      ) : null}

      {/* SKILLS */}
      {c.skills.length > 0 ? (
        <SectionBlock title="Skills you'll learn">
          <div className="flex flex-wrap gap-2">
            {c.skills.map((s) => (
              <Badge key={s} variant="outline" className="text-sm px-3 py-1.5">{s}</Badge>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {/* CURRICULUM */}
      {c.modules.length > 0 ? (
        <SectionBlock title="Curriculum">
          <Accordion type="single" collapsible className="max-w-3xl">
            {c.modules.map((m, i) => (
              <AccordionItem value={m.id} key={m.id}>
                <AccordionTrigger className="text-left">
                  <span className="font-medium">Module {m.number ?? i + 1}: {m.name}</span>
                </AccordionTrigger>
                <AccordionContent>
                  {m.description ? <p className="text-muted-foreground mb-3">{m.description}</p> : null}
                  {m.topics.length ? (
                    <ul className="space-y-1.5 text-body">
                      {m.topics.map((t) => (<li key={t.id}>• {t.name}</li>))}
                    </ul>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SectionBlock>
      ) : null}

      {/* TOOLS */}
      {c.tools.length > 0 ? (
        <SectionBlock title="Tools & technologies">
          <div className="flex flex-wrap gap-3">
            {c.tools.map((t) => (
              <div key={t.name} className="card-elevated px-4 py-2 text-sm font-medium">{t.name}</div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {/* CERTIFICATIONS */}
      {c.certifications.length > 0 ? (
        <SectionBlock title="Certification">
          <div className="grid md:grid-cols-2 gap-6">
            {c.certifications.map((cert, i) => (
              <div key={i} className="card-elevated p-6">
                <h3 className="font-display text-lg font-semibold">{cert.name}</h3>
                {cert.issuer ? <p className="text-caption mt-1">Issued by {cert.issuer}</p> : null}
                {cert.description ? <p className="mt-3 text-muted-foreground">{cert.description}</p> : null}
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {/* CAREER ROLES */}
      {c.career_roles.length > 0 ? (
        <SectionBlock title="Career opportunities">
          <p className="text-caption mb-4">Indicative salary ranges based on industry data. Actual outcomes vary.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {c.career_roles.map((r, i) => (
              <div key={i} className="card-elevated p-5">
                <h3 className="font-medium">{r.title}</h3>
                {r.salary_min && r.salary_max ? (
                  <p className="text-caption mt-1 text-mono">{formatPrice(r.salary_min, r.currency ?? "INR")} – {formatPrice(r.salary_max, r.currency ?? "INR")} / {r.salary_period ?? "yearly"}</p>
                ) : null}
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {/* PLACEMENT */}
      {c.placement.length > 0 ? (
        <SectionBlock title="Placement & career support">
          <p className="text-caption mb-4">Career and placement support may be available according to the selected program terms.</p>
          <ul className="grid md:grid-cols-2 gap-3">
            {c.placement.map((p, i) => (
              <li key={i} className="card-elevated p-4"><span className="font-medium">{p.support_type}</span>{p.description ? <span className="text-muted-foreground"> — {p.description}</span> : null}</li>
            ))}
          </ul>
        </SectionBlock>
      ) : null}

      {/* WHO */}
      {c.target_audience ? (
        <SectionBlock title="Who should join">
          <p className="text-body-lg text-muted-foreground max-w-3xl">{c.target_audience}</p>
        </SectionBlock>
      ) : null}

      {/* FAQ */}
      {c.faqs.length > 0 ? (
        <SectionBlock title="Frequently asked questions">
          <Accordion type="single" collapsible className="max-w-3xl">
            {c.faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{f.question}</AccordionTrigger>
                <AccordionContent><p className="text-muted-foreground">{f.answer}</p></AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SectionBlock>
      ) : null}

      {/* RELATED */}
      {related.length > 0 ? (
        <SectionBlock title="Related programs">
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((r: any) => (
              <Link key={r.id} to="/programs/$category/$course" params={{ category: r.category.slug, course: r.slug }} className="card-elevated hover:card-elevated-hover p-5">
                <h3 className="font-medium">{r.name}</h3>
                <p className="text-caption mt-1 line-clamp-2">{r.short_description}</p>
              </Link>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {/* FINAL CTA */}
      <Section className="py-16 bg-surface-2/40">
        <Container className="text-center max-w-2xl">
          <h2 className="text-heading-xl font-display font-semibold">Ready to apply?</h2>
          <p className="mt-3 text-muted-foreground">Take the next step toward a career in {c.name}.</p>
          <Button asChild size="lg" variant="gradient" className="mt-6">
            <Link to="/programs/$category/$course/apply" params={{ category, course }}>Apply now</Link>
          </Button>
        </Container>
      </Section>

      {/* MOBILE STICKY CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur p-3 flex gap-2">
        <Button asChild variant="gradient" className="flex-1">
          <Link to="/programs/$category/$course/apply" params={{ category, course }}>Apply now</Link>
        </Button>
      </div>
    </PageShell>
  );
}

function useRelated(courseId?: string, categoryId?: string) {
  return useQuery({
    queryKey: ["related", courseId],
    queryFn: () => (courseId && categoryId ? getRelatedCourses(courseId, categoryId) : []),
    enabled: Boolean(courseId && categoryId),
  });
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Section className="py-12 border-t border-border/50">
      <Container>
        <h2 className="text-heading-lg font-display font-semibold mb-6">{title}</h2>
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
        <Button asChild className="mt-6"><Link to="/programs">Browse programs</Link></Button>
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
