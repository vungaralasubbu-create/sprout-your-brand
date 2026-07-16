import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCourseBySlug, getPricingSettings, listCourses, resolvePricingDisplay } from "@/lib/programs";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, BookOpen, Award, Clock, Layers, Sparkles, CheckCircle2, Signal,
  GraduationCap, Briefcase, Users, HelpCircle, Star, Wrench, Heart, Share2,
} from "lucide-react";
import { ProgramPriceDisplay } from "@/components/student/programs/program-price-display";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/student/programs/view/$slug")({ component: Page });

/** Fetches a course by slug alone (browse card only has `slug` + `category.slug`). */
async function getCourseInfo(slug: string) {
  // Get slug + category slug via lightweight query
  const { data: base } = await supabase
    .from("courses")
    .select("slug, category:course_categories!inner(slug)")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("status", "published")
    .maybeSingle<{ slug: string; category: { slug: string } }>();
  if (!base) return null;
  return getCourseBySlug(base.category.slug, base.slug);
}

function toStringList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string") {
    return value.split(/\r?\n|•|\u2022|;|\|/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function Page() {
  const { slug } = Route.useParams();
  const { data: course, isLoading } = useQuery({
    queryKey: ["catalog-course", slug],
    queryFn: () => getCourseInfo(slug),
  });
  const { data: pricingSettings } = useQuery({
    queryKey: ["pricing-settings"],
    queryFn: () => getPricingSettings(),
  });
  const { data: related = [] } = useQuery({
    queryKey: ["catalog-related", course?.category_id],
    queryFn: () => listCourses({ categoryId: course!.category_id }).then(r => r.filter(c => c.id !== course!.id).slice(0, 3)),
    enabled: !!course?.category_id,
  });

  const pricing = useMemo(() => {
    if (!course) return null;
    return resolvePricingDisplay(
      {
        base_price: course.base_price,
        offer_price: course.offer_price,
        currency: course.currency,
        scholarship_available: course.scholarship_available,
        pricing_notes: course.pricing_notes,
      },
      pricingSettings,
    );
  }, [course, pricingSettings]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 space-y-4 max-w-[1200px]">
        <div className="h-6 w-40 bg-surface-1 animate-pulse rounded" />
        <Card className="h-64 animate-pulse" />
        <Card className="h-48 animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 max-w-2xl">
        <Card className="p-8 text-center">
          <BookOpen className="size-8 text-muted-foreground mx-auto mb-2" />
          <div className="font-display text-lg font-semibold">Program not found</div>
          <div className="text-sm text-muted-foreground mt-1">This program is unavailable or has been unpublished.</div>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/student/programs"><ArrowLeft className="size-4 mr-1" /> Back to Programs</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const outcomes = toStringList((course as any).learning_outcomes ?? (course as any).what_you_will_learn);
  const skills = course.skills ?? [];
  const tools = course.tools ?? [];
  const roles = course.career_roles ?? [];
  const modules = course.modules ?? [];
  const faqs = course.faqs ?? [];
  const projects = course.projects ?? [];
  const certifications = course.certifications ?? [];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1200px]">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground">
          <Link to="/student/programs"><ArrowLeft className="size-4 mr-1" /> Back to Programs</Link>
        </Button>
      </div>

      {/* Hero */}
      <Card className="p-0 overflow-hidden">
        <div className="grid md:grid-cols-[1fr_360px]">
          <div className="p-6 lg:p-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>{course.category.name}</span>
              {course.level && <><span>·</span><span>{course.level}</span></>}
              {course.learning_mode && <><span>·</span><span>{course.learning_mode}</span></>}
              {course.duration && <><span>·</span><span>{course.duration}</span></>}
            </div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">{course.name}</h1>
            {course.short_description && (
              <p className="text-muted-foreground leading-relaxed">{course.short_description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {course.is_bestseller && <Badge className="bg-amber-500 text-white border-0">Bestseller</Badge>}
              {course.is_trending && <Badge className="bg-primary text-white border-0">Trending</Badge>}
              {course.is_featured && <Badge className="bg-emerald-600 text-white border-0">Featured</Badge>}
              {course.emi_available && <Badge variant="outline">EMI Available</Badge>}
              {course.scholarship_available && <Badge variant="outline">Scholarship</Badge>}
            </div>
          </div>
          <div className="relative bg-surface-1 md:border-l border-border/70 min-h-[220px]">
            {course.hero_image_url || course.thumbnail_url ? (
              <img
                src={course.hero_image_url ?? course.thumbnail_url ?? ""}
                alt={course.name}
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <BookOpen className="size-16 text-primary/50" />
              </div>
            )}
          </div>
        </div>

        {/* Sticky-ish CTA strip */}
        <div className="border-t border-border/70 p-4 lg:p-6 flex flex-col md:flex-row md:items-center gap-4 bg-surface-1/60">
          <ProgramPriceDisplay pricing={pricing} size="lg" className="flex-1" />
          <div className="flex flex-wrap gap-2">
            <Button size="lg" className="min-w-[160px]">
              <Sparkles className="size-4 mr-1.5" /> Request Enrollment
            </Button>
            <Button size="lg" variant="outline"><Heart className="size-4 mr-1.5" /> Wishlist</Button>
            <Button size="lg" variant="ghost"><Share2 className="size-4 mr-1.5" /> Share</Button>
          </div>
        </div>
      </Card>

      {/* Quick facts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {course.duration && <Fact icon={Clock} label="Duration" value={course.duration} />}
        {course.level && <Fact icon={Signal} label="Level" value={course.level} />}
        {course.learning_mode && <Fact icon={Layers} label="Mode" value={course.learning_mode} />}
        {certifications.length > 0 && <Fact icon={Award} label="Certificate" value="Included" />}
      </div>

      {/* Overview */}
      {course.full_description && (
        <Section title="Program Overview">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{course.full_description}</p>
        </Section>
      )}

      {/* Learning outcomes */}
      {outcomes.length > 0 && (
        <Section title="What you'll learn" icon={GraduationCap}>
          <ul className="grid md:grid-cols-2 gap-2">
            {outcomes.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" /> <span>{o}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Curriculum */}
      {modules.length > 0 && (
        <Section title="Curriculum" icon={BookOpen}>
          <div className="space-y-2">
            {modules.map((m: any, i: number) => (
              <div key={m.id} className="rounded-lg border border-border/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Module {m.number ?? i + 1}</div>
                    <div className="font-medium">{m.name}</div>
                  </div>
                  {m.duration && <div className="text-[11px] text-muted-foreground shrink-0">{m.duration}</div>}
                </div>
                {m.description && <p className="text-sm text-muted-foreground mt-2">{m.description}</p>}
                {m.topics?.length > 0 && (
                  <ul className="mt-2 grid md:grid-cols-2 gap-1 text-sm text-foreground/85">
                    {m.topics.map((t: any) => <li key={t.id} className="flex gap-1.5 items-start"><Circle /> {t.name}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <Section title="Real-world projects" icon={Wrench}>
          <div className="grid md:grid-cols-2 gap-3">
            {projects.slice(0, 6).map((p: any) => (
              <div key={p.id} className="rounded-lg border border-border/70 p-4">
                <div className="font-medium text-sm">{p.name}</div>
                {p.short_description && <p className="text-[13px] text-muted-foreground mt-1">{p.short_description}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.difficulty && <Badge variant="outline" className="text-[10px]">{p.difficulty}</Badge>}
                  {p.duration && <Badge variant="outline" className="text-[10px]">{p.duration}</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tools */}
      {tools.length > 0 && (
        <Section title="Tools you'll use">
          <div className="flex flex-wrap gap-2">
            {tools.map((t: any, i: number) => <Badge key={i} variant="outline">{t.name}</Badge>)}
          </div>
        </Section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Section title="Skills covered">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s: string, i: number) => <Badge key={i} variant="outline" className="text-[11px]">{s}</Badge>)}
          </div>
        </Section>
      )}

      {/* Certificates */}
      {certifications.length > 0 && (
        <Section title="Certificate" icon={Award}>
          <div className="grid md:grid-cols-2 gap-3">
            {certifications.map((c: any, i: number) => (
              <div key={i} className="rounded-lg border border-border/70 p-4">
                <div className="font-medium text-sm">{c.name}</div>
                {c.issuer && <div className="text-[11px] text-muted-foreground mt-0.5">Issued by {c.issuer}</div>}
                {c.description && <p className="text-[13px] text-muted-foreground mt-2">{c.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Career + Salary insights */}
      {roles.length > 0 && (
        <Section title="Career opportunities & salary insights" icon={Briefcase}>
          <div className="grid md:grid-cols-2 gap-3">
            {roles.map((r: any, i: number) => (
              <div key={i} className="rounded-lg border border-border/70 p-4">
                <div className="font-medium text-sm">{r.title}</div>
                {r.description && <p className="text-[13px] text-muted-foreground mt-1">{r.description}</p>}
                {(r.salary_min || r.salary_max) && (
                  <div className="text-[12px] font-mono mt-2 text-emerald-700">
                    {r.currency ?? "₹"}{(r.salary_min ?? 0).toLocaleString("en-IN")}
                    {r.salary_max ? ` – ${r.currency ?? "₹"}${r.salary_max.toLocaleString("en-IN")}` : ""}
                    {r.salary_period ? ` / ${r.salary_period}` : " / yr"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Reviews placeholder */}
      <Section title="What learners say" icon={Star}>
        <div className="rounded-lg border border-border/70 p-6 text-center text-sm text-muted-foreground">
          Verified learner reviews will appear here once cohorts complete this program.
        </div>
      </Section>

      {/* FAQs */}
      {faqs.length > 0 && (
        <Section title="FAQs" icon={HelpCircle}>
          <div className="space-y-2">
            {faqs.map((f: any, i: number) => (
              <details key={i} className="rounded-lg border border-border/70 p-4 group">
                <summary className="cursor-pointer font-medium text-sm">{f.question}</summary>
                <p className="text-[13px] text-muted-foreground mt-2">{f.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <Section title="Students also viewed" icon={Users}>
          <div className="grid md:grid-cols-3 gap-3">
            {related.map((r: any) => (
              <Link
                key={r.id}
                to="/student/programs/view/$slug"
                params={{ slug: r.slug }}
                className="rounded-lg border border-border/70 p-4 hover:border-primary/50 transition-colors"
              >
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{r.category?.name}</div>
                <div className="font-medium text-sm mt-1 line-clamp-2">{r.name}</div>
                {r.short_description && <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2">{r.short_description}</p>}
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Circle() {
  return <span className="mt-1.5 size-1 rounded-full bg-muted-foreground/60 shrink-0" />;
}

function Fact({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 p-3 bg-white">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
        <Icon className="size-3" /> {label}
      </div>
      <div className="text-sm font-medium mt-1">{value}</div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <Card className="p-5 lg:p-6 space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-4 text-primary" />}
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </Card>
  );
}
