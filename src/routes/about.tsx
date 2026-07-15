import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Compass,
  BookOpen,
  Wrench,
  Sparkles,
  GraduationCap,
  Users,
  Building2,
  Shield,
  LineChart,
  Layers,
  Sparkle,
  Cpu,
  Cog,
  Zap,
  Briefcase,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container, SectionHeader } from "@/components/shared/section";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Glintr | Learning, Skills And Career-Focused Education" },
      {
        name: "description",
        content:
          "Learn about Glintr, an education and career-focused platform helping learners explore practical programs across technology, engineering, management and emerging skill domains.",
      },
      { property: "og:title", content: "About Glintr" },
      {
        property: "og:description",
        content:
          "An education and career-focused platform helping learners explore practical programs across technology, engineering, management and emerging skill domains.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/about" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/about" }],
  }),
  component: AboutPage,
});

const PROBLEMS = [
  {
    icon: Layers,
    title: "Too Many Learning Choices",
    body: "Learners can access thousands of courses and resources, but more choice does not always create more clarity.",
  },
  {
    icon: LineChart,
    title: "Skills Change Quickly",
    body: "Technology and industry requirements continue to evolve, making practical and current learning increasingly important.",
  },
  {
    icon: Compass,
    title: "Learning And Opportunity Feel Disconnected",
    body: "Learners often complete programs without clearly understanding how their skills connect to projects, industries or career paths.",
  },
  {
    icon: Shield,
    title: "Access Is Uneven",
    body: "Quality career-focused learning and industry exposure are not equally accessible across colleges, cities and learner communities.",
  },
];

const APPROACH = [
  {
    icon: Compass,
    title: "Discover",
    body: "Help learners explore programs across technology, engineering, management and emerging fields.",
  },
  {
    icon: BookOpen,
    title: "Learn",
    body: "Provide structured learning experiences designed around clear topics, skills and program outcomes.",
  },
  {
    icon: Wrench,
    title: "Apply",
    body: "Encourage practical understanding through projects, activities and applied learning experiences where supported.",
  },
  {
    icon: Sparkles,
    title: "Grow",
    body: "Create pathways for learners, campus communities and partners to participate in a broader learning ecosystem.",
  },
];

const CATEGORIES: {
  name: string;
  slug: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    name: "Computer Science",
    slug: "computer-science",
    description:
      "AI, Machine Learning, Data Science and modern software domains.",
    icon: Cpu,
  },
  {
    name: "Electronics & Electrical",
    slug: "electronics-electrical",
    description:
      "Embedded Systems, IoT, VLSI and applied electronics learning.",
    icon: Zap,
  },
  {
    name: "Mechanical Engineering",
    slug: "mechanical-engineering",
    description:
      "Design, robotics and applied mechanical technology programs.",
    icon: Cog,
  },
  {
    name: "Management",
    slug: "management",
    description:
      "Digital marketing, finance, investment banking, HR and business skills.",
    icon: Briefcase,
  },
];

const LEARNING_AREAS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Data Science",
  "Internet of Things",
  "Robotics",
  "Embedded Systems",
  "VLSI",
  "Digital Marketing",
  "Finance",
  "Investment Banking",
  "Human Resources",
];

const HOW_STEPS = [
  {
    step: "01",
    title: "Explore",
    body: "Discover learning programs across relevant career and industry domains.",
  },
  {
    step: "02",
    title: "Choose",
    body: "Review program information and identify a learning path aligned with your interests.",
  },
  {
    step: "03",
    title: "Learn",
    body: "Access the applicable learning experience and progress through structured program content.",
  },
  {
    step: "04",
    title: "Build Forward",
    body: "Use your learning, projects and practical understanding to continue developing your career direction.",
  },
];

const PRINCIPLES = [
  {
    title: "Clarity Before Complexity",
    body: "Learning choices should be easier to understand.",
  },
  {
    title: "Practical Relevance",
    body: "Programs should connect concepts with applicable skills and real-world context.",
  },
  {
    title: "Accessible Growth",
    body: "A learner's college or city should not define the limits of what they can explore.",
  },
  {
    title: "Responsible Communication",
    body: "Education outcomes should be communicated clearly without misleading guarantees.",
  },
  {
    title: "Continuous Evolution",
    body: "Learning platforms must evolve as technologies, industries and learner needs change.",
  },
];

const IDENTITY = [
  { label: "Platform", value: "Education And Career-Focused Learning Ecosystem" },
  { label: "Focus", value: "Technology, Engineering, Management And Emerging Skills" },
  { label: "Community", value: "Learners, Campus Communities And Partners" },
  { label: "Approach", value: "Discover, Learn, Apply And Grow" },
];

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* HERO */}
        <Section tone="mesh" padding="lg" as="header">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
              <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
                <span className="text-label text-primary">ABOUT GLINTR</span>
                <h1 className="text-display text-balance">
                  Building Better Paths From Learning To Opportunity
                </h1>
                <p className="text-subheading text-pretty max-w-xl">
                  Glintr is an education and career-focused platform designed to
                  make industry-relevant learning, practical exposure and growth
                  opportunities more accessible to learners.
                </p>
                <p className="text-body text-muted-foreground max-w-xl">
                  We work across technology, engineering, management and
                  emerging career domains to help learners discover programs
                  that align with real skills and evolving industry needs.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild variant="gradient" size="lg">
                    <Link to="/programs">
                      Explore Programs
                      <ArrowRight className="ml-1 size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/earn">Partner With Glintr</Link>
                  </Button>
                </div>
              </div>

              <EcosystemVisual />
            </div>
          </Container>
        </Section>

        {/* INTRODUCTION */}
        <Section tone="default" padding="lg">
          <Container size="md">
            <div className="flex flex-col gap-6">
              <span className="text-label text-primary">INTRODUCTION</span>
              <h2 className="text-section text-balance">
                Learning Should Lead Somewhere
              </h2>
              <div className="flex flex-col gap-5 text-subheading text-pretty text-muted-foreground">
                <p>
                  Education is changing quickly. Learners are expected to
                  understand new technologies, build practical skills and make
                  career decisions earlier than ever.
                </p>
                <p>
                  At the same time, discovering the right learning path can be
                  difficult. Programs are spread across different categories,
                  career information is often fragmented and learners may
                  struggle to understand how a skill connects to future
                  opportunities.
                </p>
                <p className="text-foreground">
                  Glintr is being built to make this journey clearer.
                </p>
                <p>
                  We bring together career-focused programs, practical learning
                  experiences and partner-led opportunities in one growing
                  education ecosystem.
                </p>
              </div>
            </div>
          </Container>
        </Section>

        {/* PROBLEM */}
        <Section tone="surface" padding="lg">
          <Container>
            <SectionHeader
              eyebrow="THE PROBLEM WE SEE"
              title="Learning Today Is Full Of Choice, But Short On Clarity"
              description="Four gaps we consistently see across learners, colleges and career journeys."
              align="left"
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {PROBLEMS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-border bg-background p-6 md:p-8"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <p.icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-heading">{p.title}</h3>
                  <p className="mt-2 text-body text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* APPROACH */}
        <Section tone="default" padding="lg">
          <Container>
            <SectionHeader
              eyebrow="OUR APPROACH"
              title="An Ecosystem, Not A Catalog"
              description="Glintr is building an ecosystem where learners can discover relevant programs, develop practical skills and engage with opportunities designed around evolving industry domains."
              align="left"
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {APPROACH.map((a, i) => (
                <div
                  key={a.title}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <a.icon className="size-5" aria-hidden />
                    </div>
                    <span className="text-label text-muted-foreground">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-heading">{a.title}</h3>
                  <p className="text-body text-muted-foreground">{a.body}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* WHAT WE FOCUS ON */}
        <Section tone="surface" padding="lg">
          <Container>
            <SectionHeader
              eyebrow="WHAT WE FOCUS ON"
              title="Career-Focused Learning Areas"
              description="Programs organised around meaningful industry categories, not endless tag clouds."
              align="left"
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {CATEGORIES.map((c) => (
                <div
                  key={c.slug}
                  className="group flex flex-col justify-between gap-6 rounded-2xl border border-border bg-background p-6 md:p-8"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <c.icon className="size-5" aria-hidden />
                    </div>
                    <h3 className="text-heading">{c.name}</h3>
                    <p className="text-body text-muted-foreground">{c.description}</p>
                  </div>
                  <div>
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        to="/programs/$category"
                        params={{ category: c.slug }}
                      >
                        Explore Programs
                        <ArrowRight className="ml-1 size-4" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-dashed border-border bg-background/60 p-6 md:p-8">
              <p className="text-label text-muted-foreground">LEARNING AREAS</p>
              <p className="mt-2 text-body text-muted-foreground max-w-3xl">
                Across these categories, Glintr programs explore evolving
                learning areas including:
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {LEARNING_AREAS.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* HOW GLINTR WORKS */}
        <Section tone="default" padding="lg">
          <Container>
            <SectionHeader
              eyebrow="HOW GLINTR WORKS"
              title="From Curiosity To A Clearer Direction"
              align="left"
            />
            <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {HOW_STEPS.map((s) => (
                <li
                  key={s.step}
                  className="rounded-2xl border border-border bg-surface p-6"
                >
                  <div className="text-label text-primary">STEP {s.step}</div>
                  <h3 className="mt-3 text-heading">{s.title}</h3>
                  <p className="mt-2 text-body text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </Container>
        </Section>

        {/* WHO WE BUILD FOR */}
        <Section tone="surface" padding="lg">
          <Container>
            <SectionHeader
              eyebrow="WHO WE BUILD FOR"
              title="Three Communities, One Ecosystem"
              align="left"
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <AudienceCard
                icon={GraduationCap}
                title="Learners"
                body="For students and early-career learners exploring practical, career-focused skills across growing domains."
                cta={{ to: "/programs", label: "Explore Programs" }}
              />
              <AudienceCard
                icon={Users}
                title="Campus Communities"
                body="For campus ambassadors and student communities helping learners discover relevant education opportunities."
                cta={{ to: "/campus-ambassador", label: "Campus Ambassador Program" }}
              />
              <AudienceCard
                icon={Building2}
                title="Partners"
                body="For individuals and organisations interested in participating in Glintr's education distribution and growth ecosystem."
                cta={{ to: "/earn", label: "Become A Partner" }}
              />
            </div>
          </Container>
        </Section>

        {/* PRINCIPLES */}
        <Section tone="default" padding="lg">
          <Container>
            <SectionHeader
              eyebrow="WHAT GUIDES US"
              title="Principles We Build On"
              align="left"
            />
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {PRINCIPLES.map((p, i) => (
                <div key={p.title} className="border-l-2 border-primary/60 pl-5">
                  <div className="text-label text-muted-foreground">
                    0{i + 1}
                  </div>
                  <h3 className="mt-2 text-heading">{p.title}</h3>
                  <p className="mt-2 text-body text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* RESPONSIBLE COMMUNICATION */}
        <Section tone="surface" padding="lg">
          <Container size="md">
            <div className="rounded-3xl border border-border bg-background p-8 md:p-12">
              <span className="text-label text-primary">
                RESPONSIBLE EDUCATION COMMUNICATION
              </span>
              <h2 className="mt-3 text-section text-balance">
                Clear About What Learning Can Do
              </h2>
              <div className="mt-6 flex flex-col gap-4 text-body text-muted-foreground">
                <p>
                  We believe education platforms should communicate outcomes
                  responsibly.
                </p>
                <p>
                  Programs can help learners build knowledge, understand tools,
                  explore domains and develop practical skills. Individual
                  outcomes may vary based on the learner, program, effort,
                  experience and opportunity.
                </p>
                <p>
                  Glintr does not present learning as an automatic guarantee of
                  employment, salary, promotion or business success.
                </p>
                <p>
                  Where a specific program includes defined benefits, projects,
                  support or opportunities, those details are communicated on
                  the applicable program page.
                </p>
              </div>
            </div>
          </Container>
        </Section>

        {/* CAMPUS COMMUNITIES */}
        <Section tone="default" padding="lg">
          <Container>
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col gap-5 min-w-0">

                <span className="text-label text-primary">
                  WORKING WITH CAMPUS COMMUNITIES
                </span>
                <h2 className="text-section text-balance">
                  Growing Through Campus Communities
                </h2>
                <p className="text-body text-muted-foreground">
                  Colleges and student communities are important places for
                  learning discovery.
                </p>
                <p className="text-body text-muted-foreground">
                  The Glintr Campus Ambassador Program allows eligible students
                  to participate in program awareness, campus engagement and
                  learner referral activities.
                </p>
                <p className="text-body text-muted-foreground">
                  Ambassadors may access approved campaign resources, referral
                  tools and performance features based on their account status
                  and program rules.
                </p>
                <div>
                  <Button asChild variant="gradient" size="lg">
                    <Link to="/campus-ambassador">
                      Explore Campus Ambassador Program
                      <ArrowRight className="ml-1 size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
              <IllustrationTile
                icon={Users}
                title="Campus Engagement"
                bullets={[
                  "Program awareness across campuses",
                  "Approved referral and campaign tools",
                  "Structured participation and recognition",
                ]}
              />
            </div>
          </Container>
        </Section>

        {/* PARTNERS */}
        <Section tone="surface" padding="lg">
          <Container>
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <IllustrationTile
                icon={Building2}
                title="Partner Ecosystem"
                bullets={[
                  "Extend the reach of learning programs",
                  "Multiple participation models",
                  "Guided by program eligibility and policies",
                ]}
              />
              <div className="flex flex-col gap-5 min-w-0">
                <span className="text-label text-primary">
                  WORKING WITH PARTNERS
                </span>
                <h2 className="text-section text-balance">
                  Building With Partners
                </h2>
                <p className="text-body text-muted-foreground">
                  Glintr also works with eligible partners who help extend the
                  reach of learning programs and education opportunities.
                </p>
                <p className="text-body text-muted-foreground">
                  The Glintr partner ecosystem may support different
                  participation models based on program eligibility, commercial
                  terms and applicable policies.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="gradient" size="lg">
                    <Link to="/earn">Become A Partner</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/earn">Explore Partner Model</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* VISION */}
        <Section tone="gradient" padding="lg">
          <Container size="md">
            <div className="flex flex-col gap-6 text-center items-center">
              <span className="text-label opacity-90">OUR VISION</span>
              <h2 className="text-display text-balance">
                A More Connected Future For Learning
              </h2>
              <p className="text-subheading text-pretty opacity-95 max-w-2xl">
                Our long-term vision is to help create a learning ecosystem
                where discovering a skill, understanding a domain and finding a
                path forward feels more connected.
              </p>
              <p className="text-body opacity-90 max-w-2xl">
                We want learners to have clearer ways to explore evolving
                technologies and career areas, while giving campus communities
                and partners structured ways to participate in the education
                ecosystem.
              </p>
              <p className="text-body opacity-90">
                Glintr is being built for that journey.
              </p>
            </div>
          </Container>
        </Section>

        {/* GLINTR AT A GLANCE */}
        <Section tone="default" padding="lg">
          <Container>
            <SectionHeader
              eyebrow="COMPANY IDENTITY"
              title="Glintr At A Glance"
              align="left"
            />
            <dl className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {IDENTITY.map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-border bg-surface p-6"
                >
                  <dt className="text-label text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="mt-2 text-body text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>

        {/* FINAL CTA */}
        <Section tone="surface" padding="lg">
          <Container size="md">
            <div className="flex flex-col gap-6 text-center items-center rounded-3xl border border-border bg-background p-10 md:p-16">
              <span className="text-label text-primary">START EXPLORING</span>
              <h2 className="text-section text-balance">
                Find Your Next Learning Direction
              </h2>
              <p className="text-subheading text-pretty text-muted-foreground max-w-2xl">
                Explore Glintr programs across technology, engineering,
                management and emerging career domains.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="gradient" size="lg">
                  <Link to="/programs">
                    Explore Programs
                    <ArrowRight className="ml-1 size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/earn">Partner With Glintr</Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

function AudienceCard({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta: { to: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-background p-6 md:p-8">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </div>
      <div>
        <h3 className="text-heading">{title}</h3>
        <p className="mt-2 text-body text-muted-foreground">{body}</p>
      </div>
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link to={cta.to as any}>
            {cta.label}
            <ArrowRight className="ml-1 size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function IllustrationTile({
  icon: Icon,
  title,
  bullets,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  bullets: string[];
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-background to-surface p-8 md:p-10">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="mt-5 text-heading">{title}</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-body text-muted-foreground">
            <Sparkle className="mt-1 size-4 text-primary" aria-hidden />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Abstract "learning ecosystem" visual — a central Glintr node connected to
 * six surrounding nodes. Built with UI primitives, no stock imagery.
 */
function EcosystemVisual() {
  const nodes = [
    { label: "Learners", icon: GraduationCap },
    { label: "Programs", icon: BookOpen },
    { label: "Campus", icon: Users },
    { label: "Partners", icon: Building2 },
    { label: "Skills", icon: Wrench },
    { label: "Opportunities", icon: Sparkles },
  ];
  return (
    <div
      aria-hidden
      className="relative mx-auto aspect-square w-full max-w-md rounded-3xl border border-border bg-background/70 p-6 shadow-sm backdrop-blur-sm"
    >
      <div className="absolute inset-6 rounded-2xl bg-gradient-to-br from-primary/8 via-transparent to-primary/5" />
      <div className="relative grid h-full grid-cols-3 grid-rows-3 gap-3">
        {nodes.slice(0, 3).map((n) => (
          <NodeChip key={n.label} label={n.label} icon={n.icon} />
        ))}
        <div className="col-span-3 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-gradient-brand px-6 py-4 text-primary-foreground shadow-md">
            <div className="text-label opacity-90">CORE</div>
            <div className="text-heading">Glintr</div>
          </div>
        </div>
        {nodes.slice(3).map((n) => (
          <NodeChip key={n.label} label={n.label} icon={n.icon} />
        ))}
      </div>
    </div>
  );
}

function NodeChip({
  label,
  icon: Icon,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface px-2 py-3 text-center">
      <Icon className="size-4 text-primary" aria-hidden />
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  );
}
