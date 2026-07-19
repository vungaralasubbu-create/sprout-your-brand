import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPublicCareerPage } from "@/lib/admin/career-hub.functions";
import { CAREER_HUB_TYPES, CAREER_PATH_TO_TYPE, CAREER_TYPE_TO_PATH, type CareerHubTypeId } from "@/lib/career-hub/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, GraduationCap, Rocket, Award, BookOpen, TrendingUp, Briefcase } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/career-hub/$type/$slug")({
  loader: async ({ params, context }) => {
    const typeId = CAREER_PATH_TO_TYPE[params.type];
    if (!typeId) throw notFound();
    const res = await context.queryClient.ensureQueryData({
      queryKey: ["career-page", typeId, params.slug],
      queryFn: () => getPublicCareerPage({ data: { page_type: typeId, slug: params.slug } }),
      staleTime: 5 * 60 * 1000,
    });
    if (!res?.page) throw notFound();
    return res;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const p: any = loaderData.page;
    const url = `https://glintr.com/career-hub/${params.type}/${params.slug}`;
    return {
      meta: [
        { title: p.seo_title || p.title },
        { name: "description", content: p.seo_description || p.summary || "" },
        { name: "keywords", content: (p.seo_keywords || []).join(", ") },
        { property: "og:title", content: p.seo_title || p.title },
        { property: "og:description", content: p.seo_description || p.summary || "" },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p.json_ld ? [{ type: "application/ld+json", children: JSON.stringify(p.json_ld) }] : [],
    };
  },
  component: CareerPageView,
  errorComponent: ({ error }) => <div className="p-6 text-red-500">{error.message}</div>,
  notFoundComponent: () => (
    <div className="p-12 text-center">
      <h1 className="text-2xl font-bold">Guide not found</h1>
      <p className="text-muted-foreground mt-2">This career guide doesn't exist or hasn't been published.</p>
      <Button asChild className="mt-4"><Link to="/career-hub">Browse Career Hub</Link></Button>
    </div>
  ),
});

function CareerPageView() {
  const { page, related } = Route.useLoaderData() as any;
  const { type } = Route.useParams();
  const typeMeta = CAREER_HUB_TYPES.find((t) => t.path === type)!;
  const p = page;

  return (
    <div className="min-h-screen bg-background">
      <section className="py-14 border-b bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link to="/career-hub" className="hover:text-primary">Career Hub</Link>
            <span>/</span>
            <Link to="/career-hub/$type" params={{ type }} className="hover:text-primary">{typeMeta.label}</Link>
          </div>
          <div className="flex items-start gap-4">
            <div className="text-5xl">{p.hero_emoji || typeMeta.emoji}</div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="info">{typeMeta.label}</Badge>
                {p.category && <Badge variant="outline">{p.category}</Badge>}
                {p.featured && <Badge variant="featured">Featured</Badge>}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{p.title}</h1>
              {p.subtitle && <p className="text-lg text-muted-foreground mt-2">{p.subtitle}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {p.summary && (
          <Card className="p-5 bg-primary/5 border-primary/20">
            <p className="text-base leading-relaxed">{p.summary}</p>
          </Card>
        )}

        {/* Roadmap stages */}
        {Array.isArray(p.roadmap) && p.roadmap.length > 0 && (
          <Section icon={Rocket} title="Career roadmap">
            <div className="space-y-4">
              {p.roadmap.map((r: any, i: number) => (
                <Card key={i} className="p-4 border-l-4 border-l-primary">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div className="font-semibold">{r.stage}</div>
                    <div className="text-xs text-muted-foreground">{r.outcome}</div>
                  </div>
                  <div className="text-sm text-primary mt-1">{r.focus}</div>
                  {Array.isArray(r.topics) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.topics.map((t: string, ti: number) => <span key={ti} className="text-xs bg-muted px-2 py-0.5 rounded">{t}</span>)}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Content sections */}
        {Array.isArray(p.content?.sections) && p.content.sections.length > 0 && (
          <Section icon={BookOpen} title="In-depth guide">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {p.content.sections.map((s: any, i: number) => (
                <div key={i}>
                  <h2>{s.heading}</h2>
                  <ReactMarkdown>{s.body || ""}</ReactMarkdown>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Salary data */}
        {p.content?.salary_data || (p as any).salary_data ? (
          <Section icon={TrendingUp} title="Salary snapshot (India)">
            <SalaryBlock data={p.content?.salary_data || (p as any).salary_data} />
          </Section>
        ) : null}

        {/* Learning path */}
        {Array.isArray(p.learning_path) && p.learning_path.length > 0 && (
          <Section icon={GraduationCap} title="Learning path">
            <ol className="space-y-2">
              {p.learning_path.map((l: any) => (
                <li key={l.step} className="flex gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">{l.step}</div>
                  <div>
                    <div className="font-medium">{l.title}</div>
                    <div className="text-xs text-muted-foreground">{l.resource_type} · {l.duration_weeks} weeks</div>
                    {l.notes && <div className="text-sm mt-1">{l.notes}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Projects */}
        {Array.isArray(p.projects) && p.projects.length > 0 && (
          <Section icon={Briefcase} title="Real-world projects to build">
            <div className="grid md:grid-cols-2 gap-3">
              {p.projects.map((pr: any, i: number) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{pr.title}</div>
                    <Badge variant={pr.difficulty === "hard" ? "danger" : pr.difficulty === "medium" ? "warning" : "success"}>{pr.difficulty}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{pr.description}</div>
                  {Array.isArray(pr.skills) && <div className="flex flex-wrap gap-1 mt-2">{pr.skills.map((s: string, si: number) => <span key={si} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{s}</span>)}</div>}
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {Array.isArray(p.certifications) && p.certifications.length > 0 && (
          <Section icon={Award} title="Certifications worth pursuing">
            <div className="grid md:grid-cols-2 gap-3">
              {p.certifications.map((c: any, i: number) => (
                <Card key={i} className="p-4 flex items-start gap-3">
                  <Award className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.issuer} · {c.level}</div>
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Recommended courses (Glintr internal link) */}
        {Array.isArray(p.recommended_courses) && p.recommended_courses.length > 0 && (
          <Section icon={GraduationCap} title="Recommended courses">
            <div className="grid md:grid-cols-2 gap-3">
              {p.recommended_courses.map((c: any, i: number) => (
                <Card key={i} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.provider} · {c.level}</div>
                  </div>
                  <Link to="/programs" className="text-sm text-primary hover:underline shrink-0">Explore →</Link>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* FAQs */}
        {Array.isArray(p.faqs) && p.faqs.length > 0 && (
          <Section icon={CheckCircle2} title="Frequently asked questions">
            <div className="space-y-3">
              {p.faqs.map((f: any, i: number) => (
                <details key={i} className="border rounded-lg p-4 group">
                  <summary className="font-medium cursor-pointer">{f.q}</summary>
                  <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
                </details>
              ))}
            </div>
          </Section>
        )}

        {/* Related / internal links */}
        {(related?.length > 0 || (p.internal_links || []).length > 0) && (
          <Section icon={ArrowRight} title="Keep exploring">
            {related?.length > 0 && (
              <div className="grid md:grid-cols-2 gap-2 mb-4">
                {related.slice(0, 6).map((r: any) => (
                  <Link key={r.slug} to="/career-hub/$type/$slug" params={{ type: CAREER_TYPE_TO_PATH[r.page_type as CareerHubTypeId] || type, slug: r.slug }}
                    className="p-3 rounded border hover:border-primary text-sm flex items-center gap-2">
                    <span className="text-lg">{r.hero_emoji || "🎯"}</span>
                    <span className="line-clamp-1">{r.title}</span>
                  </Link>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {(p.internal_links || []).map((l: any, i: number) => (
                <Link key={i} to={l.url as any} className="text-xs px-3 py-1.5 rounded-full border hover:border-primary hover:text-primary">
                  {l.label}
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* CTA */}
        <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <h3 className="text-2xl font-bold">Ready to actually build this career?</h3>
          <p className="text-muted-foreground mt-2">Glintr Programs — outcome-driven learning with real internships and hiring partners.</p>
          <Button size="lg" className="mt-4" asChild><Link to="/programs">Explore Programs <ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
        </Card>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-4"><Icon className="w-5 h-5 text-primary" /> {title}</h2>
      {children}
    </section>
  );
}

function SalaryBlock({ data }: { data: any }) {
  if (!data) return null;
  const rows = [
    { label: "Fresher", value: data.fresher_lpa },
    { label: "Mid-level", value: data.mid_lpa },
    { label: "Senior", value: data.senior_lpa },
  ];
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {rows.map((r) => (
          <Card key={r.label} className="p-4 text-center">
            <div className="text-xs text-muted-foreground">{r.label}</div>
            <div className="text-2xl font-bold text-primary mt-1">₹{r.value || "—"} LPA</div>
          </Card>
        ))}
      </div>
      {Array.isArray(data.top_cities) && (
        <div className="mb-2 text-sm"><span className="text-muted-foreground">Top cities: </span>{data.top_cities.join(" · ")}</div>
      )}
      {Array.isArray(data.top_companies) && (
        <div className="text-sm"><span className="text-muted-foreground">Top employers: </span>{data.top_companies.join(" · ")}</div>
      )}
    </div>
  );
}
