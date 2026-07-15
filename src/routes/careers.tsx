import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Sparkles,
  Compass,
  Layers,
  LineChart,
  Users,
  Building2,
  Rocket,
  Palette,
  BookOpen,
  Cpu,
  Megaphone,
  Handshake,
  Cog,
  UserCircle,
  ChevronDown,
  MapPin,
  Briefcase,
  ArrowDown,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container, SectionHeader } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  listDepartments,
  listRoles,
  listFeaturedRoles,
  WORK_TYPES,
  LOCATION_TYPES,
  EXPERIENCE_LEVELS,
  formatWorkType,
  formatLocationType,
  formatExperienceLevel,
  type DbDepartment,
  type DbRole,
} from "@/lib/careers/careers";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers At Glintr | Build The Future Of Learning" },
      {
        name: "description",
        content:
          "Explore career opportunities at Glintr across product, engineering, design, learning, growth, partnerships and operations.",
      },
      { property: "og:title", content: "Careers At Glintr" },
      {
        property: "og:description",
        content:
          "Career opportunities at Glintr across product, engineering, design, learning, growth, partnerships and operations.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/careers" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/careers" }],
  }),
  component: CareersPage,
});

const TEAM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  product: Layers,
  engineering: Cpu,
  design: Palette,
  "learning-and-programs": BookOpen,
  "growth-and-marketing": Megaphone,
  partnerships: Handshake,
  operations: Cog,
  "people-and-culture": UserCircle,
};

const WHY_PILLARS = [
  { icon: Users, title: "Build For Learners", body: "Work on experiences designed to make learning discovery and program journeys clearer." },
  { icon: Compass, title: "Solve Connected Problems", body: "Explore challenges across education, technology, program operations and platform growth." },
  { icon: Layers, title: "Think Beyond One Domain", body: "Glintr works across technology, engineering, management and emerging skill areas." },
  { icon: LineChart, title: "Grow Responsibly", body: "Build systems and experiences designed for clarity, trust and sustainable platform growth." },
];

const PRINCIPLES = [
  { n: "01", title: "Clarity Matters", body: "Good products and good teams communicate clearly." },
  { n: "02", title: "Understand The Problem", body: "Start by understanding the learner, user or system challenge." },
  { n: "03", title: "Build Responsibly", body: "Growth should not come at the cost of trust or platform quality." },
  { n: "04", title: "Learn Continuously", body: "Technology, education and user expectations keep changing." },
  { n: "05", title: "Work Across Boundaries", body: "Many important problems require collaboration between teams." },
];

const LIFE_THEMES = [
  { icon: Users, title: "Building Together", body: "Many platform challenges connect product, technology, learning and operations." },
  { icon: Sparkles, title: "Learning While Building", body: "The domains Glintr works across continue to evolve, and teams need to keep exploring." },
  { icon: Compass, title: "Thinking From The User's View", body: "Learner, partner and platform experiences should be understandable." },
  { icon: Rocket, title: "Moving With Purpose", body: "Speed matters, but so do reliability and thoughtful execution." },
];

const JOURNEY = [
  { n: "01", title: "Discover", body: "Explore teams and understand what Glintr is building." },
  { n: "02", title: "Find A Role", body: "Review published opportunities aligned with your experience or interests." },
  { n: "03", title: "Apply", body: "Submit your application through the authorised Careers application experience." },
  { n: "04", title: "Review", body: "The applicable hiring team may review your application." },
  { n: "05", title: "Conversation", body: "Selected applicants may be contacted for the next stage." },
  { n: "06", title: "Next Steps", body: "The hiring process continues according to the applicable role and hiring workflow." },
];

const PROBLEMS = [
  { title: "Learning Discovery", body: "How can learners understand growing skill domains more clearly?" },
  { title: "Program Experience", body: "How can education journeys feel structured and easier to navigate?" },
  { title: "Platform Scale", body: "How can systems support more learners, programs and partners reliably?" },
  { title: "Responsible Growth", body: "How can education opportunities reach more people without misleading communication?" },
  { title: "Connected Ecosystems", body: "How can learners, campus communities and partners interact through clearer systems?" },
];

const FAQS = [
  { q: "How do I apply for a role?", a: "Open a published career opportunity and use the application form available on the role page." },
  { q: "Can I apply for more than one role?", a: "Applicants may apply to relevant published opportunities. Each application should reflect the applicable role." },
  { q: "Does submitting an application guarantee an interview?", a: "No. Applications may be reviewed according to the role and hiring process. Submission does not guarantee an interview or selection." },
  { q: "Can I apply if I do not match every preferred qualification?", a: "Preferred qualifications may differ from required criteria. Review the specific role information before applying." },
  { q: "Where can I see current openings?", a: "Published open opportunities are listed in the Open Opportunities section of the Careers page." },
];

const PAGE_SIZE = 10;

function CareersPage() {
  const [departments, setDepartments] = React.useState<DbDepartment[]>([]);
  const [featured, setFeatured] = React.useState<DbRole[]>([]);
  const [roles, setRoles] = React.useState<DbRole[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [team, setTeam] = React.useState<string>("all");
  const [workType, setWorkType] = React.useState<string>("all");
  const [locationType, setLocationType] = React.useState<string>("all");
  const [experience, setExperience] = React.useState<string>("all");
  const [offset, setOffset] = React.useState(0);
  const [activeTeam, setActiveTeam] = React.useState<string | null>(null);

  // Debounced search
  const [searchDebounced, setSearchDebounced] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Initial load
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, f] = await Promise.all([listDepartments(), listFeaturedRoles()]);
        if (!alive) return;
        setDepartments(d);
        setFeatured(f);
        if (d[0]) setActiveTeam(d[0].slug);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Unable to load careers.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Roles query
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { rows, total } = await listRoles(
          {
            search: searchDebounced,
            departmentSlug: team === "all" ? undefined : team,
            workType: workType === "all" ? undefined : workType,
            locationType: locationType === "all" ? undefined : locationType,
            experienceLevel: experience === "all" ? undefined : experience,
          },
          { limit: PAGE_SIZE, offset: 0 },
        );
        if (!alive) return;
        setRoles(rows);
        setTotal(total);
        setOffset(rows.length);
      } catch (e: any) {
        if (alive) setError("Unable to load career opportunities.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [searchDebounced, team, workType, locationType, experience]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const { rows } = await listRoles(
        {
          search: searchDebounced,
          departmentSlug: team === "all" ? undefined : team,
          workType: workType === "all" ? undefined : workType,
          locationType: locationType === "all" ? undefined : locationType,
          experienceLevel: experience === "all" ? undefined : experience,
        },
        { limit: PAGE_SIZE, offset },
      );
      setRoles((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        return [...prev, ...rows.filter((r) => !ids.has(r.id))];
      });
      setOffset((o) => o + rows.length);
    } finally {
      setLoadingMore(false);
    }
  }

  const canLoadMore = roles.length < total;

  const clearFilters = () => {
    setSearch("");
    setTeam("all");
    setWorkType("all");
    setLocationType("all");
    setExperience("all");
  };

  const hasFilters =
    !!search || team !== "all" || workType !== "all" || locationType !== "all" || experience !== "all";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <Section tone="surface" padding="lg" className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"
        />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div className="flex flex-col gap-6">
              <div className="text-label text-primary">CAREERS AT GLINTR</div>
              <h1 className="text-display text-balance">
                Build The Future Of Learning With Us
              </h1>
              <p className="text-subheading text-muted-foreground max-w-2xl">
                Glintr is building an education and career-focused ecosystem connecting learners with
                practical programs, evolving skill domains and clearer ways to explore what comes next.
              </p>
              <p className="text-body text-muted-foreground max-w-2xl">
                We're interested in people who care about education, technology, thoughtful products
                and building systems that can grow responsibly.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" asChild>
                  <a href="#open-opportunities">
                    Explore Open Roles <ArrowRight className="ml-2 size-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#inside-glintr">Discover Life At Glintr</a>
                </Button>
              </div>
            </div>

            <TeamEcosystemVisual departments={departments} />
          </div>

          <a
            href="#why-glintr"
            className="mt-14 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground/80 hover:text-foreground transition-colors w-fit"
          >
            <span>Explore Careers</span>
            <ArrowDown className="size-3.5 animate-bounce" />
          </a>
        </Container>
      </Section>

      {/* WHY GLINTR */}
      <Section id="why-glintr" padding="lg">
        <Container>
          <SectionHeader
            align="left"
            eyebrow="WHY GLINTR"
            title="Why Build At Glintr?"
            description="Education is evolving alongside technology, industries and the way learners make career decisions. Building for this space requires more than publishing content. It requires thoughtful products, reliable systems and clear communication."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {WHY_PILLARS.map((p, i) => (
              <div
                key={p.title}
                className={cn(
                  "relative rounded-2xl border bg-card p-6 flex flex-col gap-3 transition-all hover:border-primary/40 hover:-translate-y-0.5",
                  i % 2 === 1 && "lg:translate-y-6",
                )}
              >
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <p.icon className="size-5" />
                </div>
                <h3 className="font-semibold text-lg">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* INSIDE GLINTR — TEAM EXPLORER */}
      <Section id="inside-glintr" tone="surface" padding="lg">
        <Container>
          <SectionHeader
            align="left"
            eyebrow="INSIDE GLINTR"
            title="Different Teams. One Growing Learning Ecosystem."
            description="Explore the areas Glintr teams work across. These are public career exploration groups — actual open opportunities are listed further below."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            {/* Desktop sticky nav */}
            <nav className="hidden lg:block">
              <div className="sticky top-24 flex flex-col gap-1">
                {departments.map((d) => {
                  const Icon = TEAM_ICONS[d.slug] ?? Layers;
                  const isActive = activeTeam === d.slug;
                  return (
                    <button
                      key={d.slug}
                      onClick={() => setActiveTeam(d.slug)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-background hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      <span className="font-medium">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Mobile chip row */}
            <div className="lg:hidden -mx-6 px-6 overflow-x-auto">
              <div className="flex gap-2 pb-3 w-max">
                {departments.map((d) => {
                  const isActive = activeTeam === d.slug;
                  return (
                    <button
                      key={d.slug}
                      onClick={() => setActiveTeam(d.slug)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border",
                      )}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0">
              {departments
                .filter((d) => d.slug === activeTeam)
                .map((d) => (
                  <TeamDetail
                    key={d.slug}
                    dept={d}
                    onView={() => {
                      setTeam(d.slug);
                      const el = document.getElementById("open-opportunities");
                      el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  />
                ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* PRINCIPLES */}
      <Section padding="lg">
        <Container>
          <SectionHeader
            align="left"
            eyebrow="HOW WE THINK ABOUT WORK"
            title="Five Principles That Shape How We Build"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div
                key={p.n}
                className="rounded-2xl border bg-card p-6 flex flex-col gap-3"
              >
                <div className="text-label text-primary">{p.n}</div>
                <h3 className="font-semibold text-lg">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* LIFE AT GLINTR */}
      <Section tone="surface" padding="lg">
        <Container>
          <SectionHeader
            align="left"
            eyebrow="LIFE AT GLINTR"
            title="A Team Building Across Education And Technology"
          />
          <div className="mt-10 -mx-6 px-6 overflow-x-auto pb-4">
            <div className="flex gap-4 w-max">
              {LIFE_THEMES.map((t) => (
                <div
                  key={t.title}
                  className="min-w-[280px] max-w-[320px] rounded-2xl border bg-card p-6 flex flex-col gap-3"
                >
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <t.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-lg">{t.title}</h3>
                  <p className="text-sm text-muted-foreground">{t.body}</p>
                  <div className="mt-auto h-24 rounded-xl bg-gradient-to-br from-primary/10 via-accent/10 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* JOURNEY */}
      <Section padding="lg">
        <Container>
          <SectionHeader
            align="left"
            eyebrow="CAREER JOURNEY"
            title="Your Journey With Glintr Could Start Here"
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {JOURNEY.map((s) => (
              <li
                key={s.n}
                className="rounded-2xl border bg-card p-6 flex flex-col gap-2 relative overflow-hidden"
              >
                <div className="text-label text-primary">{s.n}</div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* FEATURED OPPORTUNITIES */}
      {featured.length > 0 ? (
        <Section tone="surface" padding="md">
          <Container>
            <SectionHeader
              align="left"
              eyebrow="FEATURED"
              title="Featured Opportunities"
            />
            <div className="mt-8 -mx-6 px-6 overflow-x-auto pb-4">
              <div className="flex gap-4 w-max">
                {featured.map((r) => (
                  <FeaturedRoleCard
                    key={r.id}
                    role={r}
                    department={departments.find((d) => d.id === r.department_id)}
                  />
                ))}
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* OPEN OPPORTUNITIES */}
      <Section id="open-opportunities" padding="lg">
        <Container>
          <div className="flex flex-col gap-2 mb-8">
            <div className="text-label text-primary">OPEN OPPORTUNITIES</div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-section text-balance">
                {total > 0 ? `${total} Open Opportunit${total === 1 ? "y" : "ies"}` : "Open Opportunities"}
              </h2>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,180px))] items-stretch mb-8">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                aria-label="Search roles"
                placeholder="Search by role, team or skill"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
            <Select value={team} onValueChange={setTeam}>
              <SelectTrigger aria-label="Team" className="h-11">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.slug} value={d.slug}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={workType} onValueChange={setWorkType}>
              <SelectTrigger aria-label="Work type" className="h-11">
                <SelectValue placeholder="Work Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Work Types</SelectItem>
                {WORK_TYPES.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger aria-label="Location type" className="h-11">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {LOCATION_TYPES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger aria-label="Experience level" className="h-11">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Experience</SelectItem>
                {EXPERIENCE_LEVELS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className="rounded-2xl border bg-card p-10 text-center">
              <h3 className="font-semibold text-lg">Unable To Load Career Opportunities</h3>
              <p className="text-sm text-muted-foreground mt-2">We couldn't load open roles right now.</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : roles.length === 0 ? (
            hasFilters ? (
              <div className="rounded-2xl border bg-card p-10 text-center">
                <h3 className="font-semibold text-lg">No Roles Match Your Search</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Try changing your search or filters to explore other open opportunities.
                </p>
                <div className="mt-4 flex gap-2 justify-center">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button onClick={clearFilters}>View All Open Roles</Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card p-10 text-center">
                <h3 className="font-semibold text-lg">No Open Roles Right Now</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
                  We're continuing to build Glintr. New opportunities will appear here when roles are published.
                </p>
                <div className="mt-4 flex gap-2 justify-center">
                  <Button variant="outline" asChild>
                    <Link to="/about">Explore Glintr</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/programs">View Programs</Link>
                  </Button>
                </div>
              </div>
            )
          ) : (
            <>
              <ul className="space-y-3">
                {roles.map((r) => (
                  <RoleRow
                    key={r.id}
                    role={r}
                    department={departments.find((d) => d.id === r.department_id)}
                  />
                ))}
              </ul>
              {canLoadMore ? (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Loading…" : "Load More Roles"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </Container>
      </Section>

      {/* PROBLEMS */}
      <Section tone="surface" padding="lg">
        <Container>
          <SectionHeader
            align="left"
            eyebrow="PROBLEMS WORTH WORKING ON"
            title="What We're Building For"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div
                key={p.title}
                className="group rounded-2xl border bg-card p-6 flex flex-col gap-2 transition-all hover:border-primary/40 hover:-translate-y-0.5"
              >
                <h3 className="font-semibold text-lg">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section padding="lg">
        <Container size="md">
          <SectionHeader align="left" eyebrow="CAREERS QUESTIONS" title="Common Questions" />
          <Accordion type="single" collapsible className="mt-10">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`f-${i}`}>
                <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      {/* FINAL CTA */}
      <Section tone="gradient" padding="lg">
        <Container size="md" className="text-center">
          <div className="text-label text-primary-foreground/80 mb-3">BUILD WITH GLINTR</div>
          <h2 className="text-section text-balance text-primary-foreground">
            Find A Problem You Want To Help Solve
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">
            Explore current opportunities across Glintr teams and discover where your experience, curiosity
            and skills may fit.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="muted" asChild>
              <a href="#open-opportunities">View Open Roles</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/about">About Glintr</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </div>
  );
}

function TeamEcosystemVisual({ departments }: { departments: DbDepartment[] }) {
  const teams = departments.slice(0, 8);
  return (
    <div className="relative aspect-square max-w-[480px] mx-auto w-full">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl border bg-card px-5 py-3 shadow-lg text-center z-10">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Building</div>
          <div className="font-semibold">Glintr</div>
        </div>
      </div>
      {teams.map((t, i) => {
        const angle = (i / teams.length) * Math.PI * 2 - Math.PI / 2;
        const r = 42; // percent
        const left = 50 + Math.cos(angle) * r;
        const top = 50 + Math.sin(angle) * r;
        const Icon = TEAM_ICONS[t.slug] ?? Layers;
        return (
          <div
            key={t.slug}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 shadow-sm text-xs font-medium animate-fade-in"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${i * 60}ms`,
            }}
          >
            <Icon className="size-3.5 text-primary" />
            <span>{t.name}</span>
          </div>
        );
      })}
    </div>
  );
}

function TeamDetail({
  dept,
  onView,
}: {
  dept: DbDepartment;
  onView: () => void;
}) {
  const Icon = TEAM_ICONS[dept.slug] ?? Layers;
  return (
    <div className="rounded-3xl border bg-card p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{dept.name}</div>
          <h3 className="text-2xl font-semibold leading-tight">{dept.headline ?? dept.name}</h3>
        </div>
      </div>
      {dept.purpose ? <p className="text-muted-foreground max-w-2xl">{dept.purpose}</p> : null}
      {dept.focus_areas.length > 0 ? (
        <>
          <div className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
            Possible focus areas
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {dept.focus_areas.map((f) => (
              <Badge key={f} variant="muted" className="font-normal">
                {f}
              </Badge>
            ))}
          </div>
        </>
      ) : null}
      <div className="mt-6">
        <Button variant="outline" onClick={onView}>
          View {dept.name} Roles <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function FeaturedRoleCard({
  role,
  department,
}: {
  role: DbRole;
  department?: DbDepartment;
}) {
  return (
    <Link
      to="/careers/$roleSlug"
      params={{ roleSlug: role.slug }}
      className="group min-w-[300px] max-w-[340px] rounded-2xl border bg-card p-6 flex flex-col gap-3 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {department ? <span>{department.name}</span> : null}
        <span>·</span>
        <span>{formatWorkType(role.work_type)}</span>
      </div>
      <h3 className="font-semibold text-lg leading-tight">{role.title}</h3>
      {role.short_summary ? (
        <p className="text-sm text-muted-foreground line-clamp-3">{role.short_summary}</p>
      ) : null}
      <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="size-3.5" />
        <span>{role.location_display ?? formatLocationType(role.location_type)}</span>
      </div>
      <span className="text-sm text-primary inline-flex items-center gap-1 mt-1">
        View Role
        <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </span>
    </Link>
  );
}

function RoleRow({
  role,
  department,
}: {
  role: DbRole;
  department?: DbDepartment;
}) {
  const exp = formatExperienceLevel(role.experience_level);
  return (
    <li>
      <Link
        to="/careers/$roleSlug"
        params={{ roleSlug: role.slug }}
        className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-6 rounded-2xl border bg-card p-5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
            {department ? <Badge variant="muted" className="font-normal">{department.name}</Badge> : null}
            <Badge variant="outline" className="font-normal">
              <Briefcase className="size-3 mr-1" />
              {formatWorkType(role.work_type)}
            </Badge>
            <Badge variant="outline" className="font-normal">
              <MapPin className="size-3 mr-1" />
              {formatLocationType(role.location_type)}
            </Badge>
            {exp ? (
              <Badge variant="outline" className="font-normal">
                {exp}
              </Badge>
            ) : null}
          </div>
          <h3 className="font-semibold text-lg leading-tight">{role.title}</h3>
          {role.short_summary ? (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{role.short_summary}</p>
          ) : null}
          {role.location_display ? (
            <div className="text-xs text-muted-foreground mt-2">{role.location_display}</div>
          ) : null}
        </div>
        <div className="text-sm text-primary inline-flex items-center gap-1 shrink-0">
          View Role
          <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </Link>
    </li>
  );
}
