import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowDown,
  Users,
  Building2,
  GraduationCap,
  Megaphone,
  Globe,
  Compass,
  BookOpen,
  Sparkles,
  ShieldCheck,
  LineChart,
  Layers,
  Rocket,
  Handshake,
  Link2,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Cpu,
  Zap,
  Cog,
  Briefcase,
  Target,
  Wallet,
  BarChart3,
  FileCheck2,
  MessageCircle,
  Search,
  UserCircle2,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container, SectionHeader } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listCategories, listCourses } from "@/lib/programs";

export const Route = createFileRoute("/partner-network")({
  head: () => ({
    meta: [
      {
        title:
          "Glintr Partner Network | Explore Education Partnership Opportunities",
      },
      {
        name: "description",
        content:
          "Explore the Glintr Partner Network, partner participation models, learning program opportunities and tools for eligible education-focused partners.",
      },
      { property: "og:title", content: "Glintr Partner Network" },
      {
        property: "og:description",
        content:
          "Explore the Glintr Partner Network, partner participation models, learning program opportunities and tools for eligible education-focused partners.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/partner-network" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/partner-network" }],
  }),
  component: PartnerNetworkPage,
});

/* ─────────────────────────── DATA ─────────────────────────── */

const PARTNER_TYPES = [
  {
    id: "independent",
    icon: UserCircle2,
    title: "Independent Education Partners",
    tagline:
      "Education-focused individuals connecting relevant learners with suitable Glintr programs.",
    suits:
      "Independent professionals with an interest in learner mentorship, career guidance or skill development.",
    participation:
      "Explore individual partner participation using authorised referral tools and approved marketing resources.",
    features: [
      "Program discovery",
      "Referral tools",
      "Approved resources",
      "Performance visibility",
    ],
  },
  {
    id: "communities",
    icon: Users,
    title: "Training And Career Communities",
    tagline:
      "Education-focused communities engaged with learners across skills, technology and careers.",
    suits:
      "Groups running study circles, career discussions or skill-based content for learners.",
    participation:
      "Community-scale referral participation with campaign resources and applicable eligibility.",
    features: [
      "Campaign resources",
      "Community referral links",
      "Program bundles",
      "Attribution",
    ],
  },
  {
    id: "digital",
    icon: Megaphone,
    title: "Digital Growth Partners",
    tagline:
      "Eligible partners with responsible digital reach and education-focused audiences.",
    suits:
      "Creators, publishers and growth-focused partners working on responsible learner acquisition.",
    participation:
      "Structured digital participation using approved creatives and traceable referral paths.",
    features: [
      "Creative library",
      "Deep links",
      "Traceable attribution",
      "Campaign reporting",
    ],
  },
  {
    id: "campus",
    icon: GraduationCap,
    title: "Campus And Student Communities",
    tagline:
      "Student-led communities and eligible campus networks creating learner awareness.",
    suits:
      "Ambassadors, chapters and student communities on eligible campuses.",
    participation:
      "Campus-scoped participation via the existing Campus Ambassador experience.",
    features: [
      "Campus referral",
      "Ambassador tools",
      "Recognition",
      "College leaderboards",
    ],
  },
  {
    id: "business",
    icon: Building2,
    title: "Business And Distribution Partners",
    tagline:
      "Eligible organisations exploring structured education distribution.",
    suits:
      "Training companies, ed-services businesses and distribution partners.",
    participation:
      "Business-scale participation subject to review and applicable commercial terms.",
    features: [
      "Program access",
      "Team dashboards",
      "Structured onboarding",
      "Reporting",
    ],
  },
] as const;

const PATHS = [
  {
    id: "independent",
    label: "I Work Independently",
    icon: UserCircle2,
    desc: "Explore individual partner participation and available program models.",
    steps: [
      "Explore partner models",
      "Submit application",
      "Review eligible programs",
      "Access approved partner tools after approval",
      "Connect interested learners",
      "Track applicable verified activity",
    ],
  },
  {
    id: "community",
    label: "I Have A Learner Community",
    icon: Users,
    desc: "Bring your community into the partner network with campaign resources.",
    steps: [
      "Explore community participation",
      "Submit application with community context",
      "Coordinate approved campaign resources",
      "Share authorised referral paths",
      "Track community-level referral activity",
      "Review applicable outcomes",
    ],
  },
  {
    id: "team",
    label: "I Work With A Team",
    icon: Handshake,
    desc: "Structured participation for small teams focused on responsible outreach.",
    steps: [
      "Explore team participation options",
      "Submit team application",
      "Review eligible programs and terms",
      "Access approved partner tools after approval",
      "Coordinate learner conversations",
      "Track verified activity",
    ],
  },
  {
    id: "business",
    label: "I Represent A Business",
    icon: Building2,
    desc: "Business-scale distribution and program partnership discovery.",
    steps: [
      "Explore business partnership options",
      "Submit business application",
      "Review commercial and program terms",
      "Onboarding on approval",
      "Distribute eligible programs",
      "Review structured reporting",
    ],
  },
  {
    id: "campus",
    label: "I Am Part Of A Campus Community",
    icon: GraduationCap,
    desc: "Campus-scoped participation via the Campus Ambassador experience.",
    steps: [
      "Explore campus ambassador program",
      "Submit ambassador application",
      "Complete campus verification",
      "Access ambassador tools",
      "Refer interested learners",
      "Track ambassador performance",
    ],
    cta: { label: "Explore Campus Ambassador", href: "/campus-ambassador" },
  },
] as const;

const JOURNEY = [
  {
    n: "01",
    title: "Explore",
    body: "Review the Glintr partner ecosystem and available participation models.",
    icon: Compass,
  },
  {
    n: "02",
    title: "Apply",
    body: "Submit the applicable partner information through the existing partner application process.",
    icon: FileCheck2,
  },
  {
    n: "03",
    title: "Get Access",
    body: "Approved partners may receive access to eligible programs, partner tools and approved marketing resources.",
    icon: BadgeCheck,
  },
  {
    n: "04",
    title: "Connect Learners",
    body: "Use authorised referral and program discovery tools to connect interested learners with relevant Glintr programs.",
    icon: Link2,
  },
  {
    n: "05",
    title: "Track Verified Activity",
    body: "Applicable partner activity can be tracked through existing referral, enrollment, earnings and payout systems based on the partner model.",
    icon: BarChart3,
  },
] as const;

const FLOW = [
  { title: "Partner", body: "An eligible individual or organisation approved for partner participation." },
  { title: "Approved Program Access", body: "Programs made available to the partner based on the applicable model and eligibility." },
  { title: "Approved Marketing Or Referral Tools", body: "Authorised creatives, links and resources shared with approved partners." },
  { title: "Learner Interest", body: "A prospective learner explores a Glintr program through partner activity." },
  { title: "Referral Lead", body: "A learner inquiry or lead recorded through an eligible referral path according to the applicable architecture." },
  { title: "Applicable Enrollment Process", body: "The learner proceeds through the standard enrollment steps and payment workflow." },
  { title: "Verification", body: "Enrollment and payment are reviewed and marked as verified where applicable." },
  { title: "Eligible Commercial Outcome Where Applicable", body: "Where the partner model supports it, verified activity may become eligible for the published commercial terms." },
] as const;

const MODELS = [
  {
    id: "seventy",
    label: "70% Revenue Model",
    href: "/earn#own",
    summary:
      "Partners bringing their own learner leads may participate under the 70% revenue model, subject to applicable terms.",
    points: [
      "Owned lead flow",
      "Partner-led outreach",
      "70% revenue share on eligible enrolments",
      "Governed by published terms",
    ],
    accent: "from-primary/10 to-primary/0",
  },
  {
    id: "fifty",
    label: "50% Supported Model",
    href: "/earn#supported",
    summary:
      "Partners working with supported opportunities may participate under the 50% supported model, subject to eligibility.",
    points: [
      "Supported opportunities",
      "Focus on closing",
      "Applicable revenue share up to 50%",
      "Governed by published terms",
    ],
    accent: "from-accent/10 to-accent/0",
  },
] as const;

const COMPARE_ROWS = [
  { k: "Participation Approach", a: "Partner-led with own leads", b: "Closing-focused on supported opportunities" },
  { k: "Marketing Responsibility", a: "Partner-driven", b: "Shared with Glintr" },
  { k: "Glintr Support", a: "Program & tooling support", b: "Lead pipeline & tooling support" },
  { k: "Program Access", a: "Based on eligibility", b: "Based on eligibility" },
  { k: "Tracking", a: "Authorised referral & enrollment tracking", b: "Authorised referral & enrollment tracking" },
  { k: "Applicable Commercial Terms", a: "Up to 70%", b: "Up to 50%" },
] as const;

const TOOLS = [
  { id: "programs", label: "Programs", icon: BookOpen, headline: "Program Discovery", body: "Explore eligible programs and understand available partner opportunities." },
  { id: "referrals", label: "Referrals", icon: Link2, headline: "Referral Tools", body: "Use authorised referral links and lead attribution tools where available." },
  { id: "marketing", label: "Marketing", icon: Megaphone, headline: "Marketing Resources", body: "Access approved promotional resources for applicable programs and campaigns." },
  { id: "performance", label: "Performance", icon: LineChart, headline: "Performance Tracking", body: "Review referral and verified enrollment activity through the authorised partner experience." },
  { id: "earnings", label: "Earnings", icon: Wallet, headline: "Earnings Visibility", body: "View applicable commission or revenue activity based on the partner model." },
  { id: "payouts", label: "Payouts", icon: BadgeCheck, headline: "Payout Workflow", body: "Use the existing payout process for eligible available earnings." },
] as const;

const WHY = [
  { icon: Layers, title: "Program Diversity", body: "Explore learning opportunities across multiple technology, engineering and management domains." },
  { icon: Link2, title: "Structured Attribution", body: "Applicable referral activity is connected through Glintr's authorised referral architecture." },
  { icon: Megaphone, title: "Approved Marketing Resources", body: "Eligible partners can access program and campaign resources designed for responsible communication." },
  { icon: LineChart, title: "Performance Visibility", body: "Track applicable lead and verified enrollment activity through authorised partner tools." },
  { icon: ShieldCheck, title: "Clear Commercial Models", body: "Partner participation is governed by the applicable model, program eligibility and published terms." },
  { icon: Globe, title: "Growing Education Ecosystem", body: "Participate in a platform connecting learners, programs, campus communities and partners." },
] as const;

const RESPONSIBILITIES = [
  { title: "Communicate Programs Accurately", body: "Use approved program information and avoid unsupported outcome claims." },
  { title: "Respect Learner Privacy", body: "Do not misuse learner contact or enrollment information." },
  { title: "Use Approved Resources", body: "Use applicable Glintr marketing and referral tools responsibly." },
  { title: "Follow Published Terms", body: "Partner activity is subject to the applicable participation model and policies." },
  { title: "Avoid Misleading Claims", body: "Do not promise guaranteed employment, salaries or guaranteed learner outcomes." },
] as const;

const FAQS = [
  { q: "Who can apply to become a Glintr partner?", a: "Eligible individuals, education-focused communities, teams and businesses may explore Glintr partner opportunities. Application availability and approval depend on the applicable partner model and current requirements." },
  { q: "Is partner approval automatic?", a: "No. Partner applications may be reviewed before access to applicable partner tools or programs is provided." },
  { q: "Can partners promote every Glintr program?", a: "Program access may depend on the partner model, program availability and applicable eligibility rules." },
  { q: "How is partner activity tracked?", a: "Applicable referral and enrollment activity is tracked through Glintr's authorised systems and verification workflows." },
  { q: "Does every referral create earnings?", a: "No. Referral activity, learner leads and verified enrollments are different stages. Commercial eligibility depends on the applicable partner model and published terms." },
  { q: "When can eligible earnings be paid out?", a: "Payout availability depends on the existing earnings, payout and applicable policy workflow." },
] as const;

const NETWORK_KEYWORDS = ["Clarity", "Attribution", "Verification", "Transparency", "Growth"] as const;

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "computer-science": Cpu,
  electronics: Zap,
  "electronics-electrical": Zap,
  mechanical: Cog,
  "mechanical-engineering": Cog,
  management: Briefcase,
};

/* ─────────────────────────── PAGE ─────────────────────────── */

function PartnerNetworkPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <PartnerTypeExplorer />
        <PartnerPaths />
        <JourneySection />
        <VerifiedActivity />
        <EcosystemFlow />
        <ModelsSection />
        <CompareModels />
        <ProgramCategoryRail />
        <ProgramOpportunities />
        <PartnerToolsShowcase />
        <WhySection />
        <PartnerPathStories />
        <NetworkVisualBreak />
        <BuiltResponsibly />
        <ResponsibilitiesSection />
        <EligibilitySection />
        <ApplicationJourney />
        <FaqSection />
        <SupportConnection />
        <FinalCta />
      </main>
      <StickyCta />
      <SiteFooter />
    </div>
  );
}

/* ─────────────────────────── HERO ─────────────────────────── */

function Hero() {
  const scrollToTypes = () => {
    document
      .getElementById("who-the-network-is-for")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <Section padding="lg" tone="mesh" className="overflow-hidden">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <span className="text-label text-primary">Glintr Partner Network</span>
            <h1 className="text-hero text-balance font-display">
              Grow With A Learning Ecosystem Built For Wider Reach
            </h1>
            <p className="text-subheading text-pretty max-w-2xl">
              The Glintr Partner Network brings together individuals, education-focused
              teams and growth partners interested in helping learners discover relevant
              programs across technology, engineering, management and emerging skills.
            </p>
            <p className="text-body text-muted-foreground max-w-2xl">
              Explore structured partnership models, program opportunities and a growing
              ecosystem designed around responsible learner acquisition and verified
              outcomes.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" onClick={scrollToTypes}>
                Explore Partner Network
                <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/partner/apply">
                  Become A Partner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <NetworkVisual />
        </div>
        <button
          onClick={scrollToTypes}
          className="mx-auto mt-16 flex items-center gap-2 text-label text-muted-foreground hover:text-foreground transition-colors group"
          aria-label="Scroll to explore the network"
        >
          <span>Explore The Network</span>
          <span className="relative block h-6 w-px bg-border overflow-hidden">
            <span className="absolute inset-0 bg-gradient-to-b from-transparent via-primary to-transparent animate-[scroll-cue_2s_ease-in-out_infinite]" />
          </span>
        </button>
      </Container>
      <style>{`@keyframes scroll-cue{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}`}</style>
    </Section>
  );
}

function NetworkVisual() {
  const nodes = [
    { label: "Programs", x: 50, y: 8, icon: BookOpen },
    { label: "Learners", x: 92, y: 30, icon: GraduationCap },
    { label: "Partners", x: 88, y: 78, icon: Handshake },
    { label: "Campus Communities", x: 50, y: 94, icon: Users },
    { label: "Marketing Resources", x: 12, y: 78, icon: Megaphone },
    { label: "Verified Enrollments", x: 8, y: 30, icon: BadgeCheck },
  ];
  return (
    <div className="relative aspect-square w-full max-w-[520px] mx-auto rounded-3xl border border-border/60 bg-surface/60 backdrop-blur-sm p-4 md:p-6">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {nodes.map((n, i) => (
          <line
            key={i}
            x1={50}
            y1={50}
            x2={n.x}
            y2={n.y}
            stroke="currentColor"
            strokeWidth={0.15}
            className="text-primary/40 [stroke-dasharray:2_2] animate-[pulse_3s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-brand text-primary-foreground px-5 py-3 shadow-lg font-display font-semibold text-lg">
        Glintr
      </div>
      {nodes.map((n) => {
        const Icon = n.icon;
        return (
          <div
            key={n.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs md:text-sm shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            <span className="whitespace-nowrap font-medium">{n.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── PARTNER TYPE EXPLORER ─────────────────────────── */

function PartnerTypeExplorer() {
  const [active, setActive] = React.useState<string>(PARTNER_TYPES[0].id);
  const current = PARTNER_TYPES.find((p) => p.id === active) ?? PARTNER_TYPES[0];
  const Icon = current.icon;
  return (
    <Section padding="lg" tone="surface" id="who-the-network-is-for">
      <Container>
        <SectionHeader
          eyebrow="Partner Ecosystem"
          title="Who The Network Is For"
          description="Different partners bring different strengths. Glintr's partner ecosystem is designed to support eligible participants who can responsibly connect learners with relevant education opportunities."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-6 lg:mx-0 px-6 lg:px-0 snap-x snap-mandatory">
            {PARTNER_TYPES.map((p) => {
              const PIcon = p.icon;
              const isActive = active === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "shrink-0 lg:shrink snap-start text-left rounded-xl border px-4 py-3 transition-all flex items-center gap-3 min-w-[240px] lg:min-w-0",
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  <div className={cn("rounded-lg p-2", isActive ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <PIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">{p.title}</span>
                </button>
              );
            })}
          </div>
          <Card className="p-8 bg-background">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-xl bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-display font-semibold">{current.title}</h3>
            </div>
            <p className="text-body text-muted-foreground mb-6">{current.tagline}</p>
            <dl className="grid gap-5 sm:grid-cols-2 mb-6">
              <div>
                <dt className="text-label text-primary mb-1">Who It May Suit</dt>
                <dd className="text-sm">{current.suits}</dd>
              </div>
              <div>
                <dt className="text-label text-primary mb-1">Typical Participation</dt>
                <dd className="text-sm">{current.participation}</dd>
              </div>
            </dl>
            <div>
              <div className="text-label text-primary mb-2">Relevant Glintr Features</div>
              <div className="flex flex-wrap gap-2">
                {current.features.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/partner/apply">
                  Explore Partnership
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/earn">View Partner Models</Link>
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── PARTNER PATHS ─────────────────────────── */

function PartnerPaths() {
  const [active, setActive] = React.useState<string>(PATHS[0].id);
  const current = PATHS.find((p) => p.id === active) ?? PATHS[0];
  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Discovery Guide"
          title="One Network. Different Paths To Participate."
          description="Choose the path that best reflects how you'd like to explore the Glintr partner ecosystem."
        />
        <p className="text-center text-xs text-muted-foreground mt-3 max-w-xl mx-auto">
          This is a discovery guide only. Partner eligibility is confirmed through the applicable application workflow.
        </p>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid gap-3">
            <div className="text-label text-primary mb-1">Interested In Partnering With Glintr</div>
            {PATHS.map((p) => {
              const Icon = p.icon;
              const isActive = active === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "text-left flex items-center gap-3 rounded-xl border p-4 transition-all",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className={cn("rounded-lg p-2", isActive ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{p.label}</span>
                  {isActive && <ChevronRight className="ml-auto h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <Card className="p-8">
            <h3 className="text-xl font-display font-semibold mb-2">{current.label}</h3>
            <p className="text-muted-foreground mb-6">{current.desc}</p>
            <ol className="space-y-3">
              {current.steps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              {"cta" in current && current.cta ? (
                <Button asChild>
                  <Link to={current.cta.href}>
                    {current.cta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/partner/apply">
                    Explore Partnership
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost">
                <Link to="/earn">Explore Partner Models</Link>
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── JOURNEY ─────────────────────────── */

function JourneySection() {
  const [active, setActive] = React.useState(0);
  const refs = React.useRef<Array<HTMLDivElement | null>>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number(e.target.getAttribute("data-idx"));
            setActive(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <Section padding="lg" tone="surface">
      <Container>
        <SectionHeader
          eyebrow="How It Works"
          title="How The Glintr Partner Ecosystem Works"
          description="Five stages that describe how the partner ecosystem operates in practice."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ol className="space-y-4">
              {JOURNEY.map((s, i) => {
                const isActive = active === i;
                const Icon = s.icon;
                return (
                  <li
                    key={s.n}
                    className={cn(
                      "flex gap-4 rounded-xl p-4 transition-all",
                      isActive ? "bg-primary/5 border border-primary/40" : "border border-transparent",
                    )}
                  >
                    <div
                      className={cn(
                        "shrink-0 flex h-10 w-10 items-center justify-center rounded-lg font-display font-semibold text-sm",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {s.n}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-semibold">
                        <Icon className="h-4 w-4 text-primary" />
                        {s.title}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{s.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="space-y-6">
            {JOURNEY.map((s, i) => (
              <div
                key={s.n}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                data-idx={i}
                className="rounded-2xl border border-border bg-background p-8 min-h-[280px]"
              >
                <div className="text-label text-primary">Stage {s.n}</div>
                <h3 className="text-2xl font-display font-semibold mt-2">{s.title}</h3>
                <p className="text-muted-foreground mt-3">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── VERIFIED ACTIVITY ─────────────────────────── */

function VerifiedActivity() {
  return (
    <Section padding="lg">
      <Container size="lg">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-10 md:p-14">
          <div className="text-label text-primary">Responsible Partner Model</div>
          <h2 className="text-section font-display mt-3 text-balance">
            Built Around Verified Activity
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <p className="text-body text-muted-foreground">
              Glintr's partner ecosystem is designed around traceable referral activity
              and applicable verified enrollment outcomes.
            </p>
            <ul className="space-y-3 text-sm">
              {[
                "A referral click is not the same as a learner lead.",
                "A learner lead is not automatically a verified enrollment.",
                "A payment submission is not automatically payment verification.",
                "Commission or revenue eligibility depends on the applicable partner model, program rules and published commercial terms.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <ShieldCheck className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── ECOSYSTEM FLOW ─────────────────────────── */

function EcosystemFlow() {
  const [hover, setHover] = React.useState<number | null>(null);
  return (
    <Section padding="lg" tone="surface">
      <Container>
        <SectionHeader
          eyebrow="Ecosystem Flow"
          title="Partner Ecosystem Flow"
          description="From partner participation to eligible commercial outcomes, one step at a time."
        />
        <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((f, i) => {
            const isActive = hover === i;
            return (
              <li
                key={f.title}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                className={cn(
                  "relative rounded-xl border p-5 bg-background transition-all outline-none",
                  isActive ? "border-primary shadow-md -translate-y-0.5" : "border-border",
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="font-semibold text-sm">{f.title}</div>
                <p
                  className={cn(
                    "text-xs text-muted-foreground mt-2 transition-all",
                    isActive ? "opacity-100" : "opacity-70",
                  )}
                >
                  {f.body}
                </p>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── MODELS ─────────────────────────── */

function ModelsSection() {
  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Participation Models"
          title="Explore Partner Models"
          description="Two clear public models describe how eligible partners may participate in the Glintr ecosystem."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {MODELS.map((m) => (
            <Card
              key={m.id}
              className={cn(
                "relative overflow-hidden p-8 md:p-10 border-border hover:border-primary/60 transition-all",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br pointer-events-none opacity-100",
                  m.accent,
                )}
              />
              <div className="relative">
                <div className="text-label text-primary">Partner Model</div>
                <h3 className="text-3xl font-display font-semibold mt-2">{m.label}</h3>
                <p className="mt-4 text-muted-foreground">{m.summary}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {m.points.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to={m.href}>
                      Explore {m.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link to="/#income-calculator">
                      Estimate With Income Calculator
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── COMPARE ─────────────────────────── */

function CompareModels() {
  return (
    <Section padding="md" tone="surface">
      <Container size="lg">
        <SectionHeader
          eyebrow="Comparison"
          title="Compare Participation Models"
          description="A public preview of how the two partner models compare. Full details live on each model's dedicated page."
        />
        <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-6 py-4 font-medium text-muted-foreground w-1/3">Category</th>
                <th className="text-left px-6 py-4 font-semibold">70% Revenue Model</th>
                <th className="text-left px-6 py-4 font-semibold">50% Supported Model</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr key={r.k} className="border-b border-border last:border-b-0">
                  <td className="px-6 py-4 text-muted-foreground">{r.k}</td>
                  <td className="px-6 py-4">{r.a}</td>
                  <td className="px-6 py-4">{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/earn#own">View Full 70% Model Details</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/earn#supported">View Full 50% Model Details</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── PROGRAM CATEGORIES ─────────────────────────── */

function ProgramCategoryRail() {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["pn", "categories"],
    queryFn: listCategories,
  });
  const { data: courses } = useQuery({
    queryKey: ["pn", "courses-all"],
    queryFn: () => listCourses(),
  });

  const countByCategory = React.useMemo(() => {
    const m = new Map<string, number>();
    (courses ?? []).forEach((c) => {
      m.set(c.category_id, (m.get(c.category_id) ?? 0) + 1);
    });
    return m;
  }, [courses]);

  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Program Network"
          title="Programs Across Growing Learning Domains"
          description="Partners may explore program opportunities across published learning categories."
        />
        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <ErrorRetry label="Unable To Load Program Categories" />
          ) : (categories ?? []).length === 0 ? (
            <EmptyState
              title="Program Categories Are Being Updated"
              action={{ label: "Explore All Programs", href: "/programs" }}
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 pb-2">
              {(categories ?? []).map((c) => {
                const Icon = CATEGORY_ICONS[c.slug] ?? Layers;
                const count = countByCategory.get(c.id) ?? 0;
                return (
                  <Link
                    key={c.id}
                    to="/programs/$category"
                    params={{ category: c.slug }}
                    className="snap-start shrink-0 w-[280px] rounded-2xl border border-border bg-background p-6 hover:border-primary/60 hover:shadow-md transition-all group"
                  >
                    <div className="rounded-lg bg-primary/10 p-2.5 w-fit">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-4 font-display font-semibold text-lg">{c.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {count > 0 ? `${count} published ${count === 1 ? "program" : "programs"}` : "Programs coming soon"}
                    </div>
                    <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary group-hover:gap-2 transition-all">
                      Explore Programs
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── PROGRAM OPPORTUNITIES ─────────────────────────── */

function ProgramOpportunities() {
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["pn", "featured-courses"],
    queryFn: () => listCourses({ featured: true }),
  });

  const railRef = React.useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <Section padding="lg" tone="surface">
      <Container>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <SectionHeader
            align="left"
            eyebrow="Program Opportunities"
            title="Explore Partner Program Opportunities"
            description="A preview of published programs that partners may explore. See all programs for the full catalog."
          />
          <div className="hidden md:flex gap-2">
            <Button variant="outline" size="icon" onClick={() => scroll(-1)} aria-label="Previous programs">
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scroll(1)} aria-label="Next programs">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <ErrorRetry label="Unable To Load Program Opportunities" />
          ) : (courses ?? []).length === 0 ? (
            <EmptyState
              title="Partner Program Opportunities Are Being Updated"
              action={{ label: "Explore All Programs", href: "/programs" }}
            />
          ) : (
            <div
              ref={railRef}
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 pb-2 scroll-smooth"
            >
              {(courses ?? []).slice(0, 12).map((c) => (
                <Link
                  key={c.id}
                  to="/programs/$category/$course"
                  params={{ category: c.category.slug, course: c.slug }}
                  className="snap-start shrink-0 w-[320px] rounded-2xl border border-border bg-background p-6 hover:border-primary/60 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {c.category.name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">
                      <Sparkles className="h-3 w-3" /> Partner Opportunity Available
                    </span>
                  </div>
                  <h3 className="mt-3 font-display font-semibold text-lg leading-snug">
                    {c.name}
                  </h3>
                  {c.short_description ? (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {c.short_description}
                    </p>
                  ) : null}
                  <div className="mt-5 inline-flex items-center gap-1 text-sm text-primary group-hover:gap-2 transition-all">
                    Explore Program
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link to="/programs">
              View All Programs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── TOOLS SHOWCASE ─────────────────────────── */

function PartnerToolsShowcase() {
  const [active, setActive] = React.useState<string>(TOOLS[0].id);
  const current = TOOLS.find((t) => t.id === active) ?? TOOLS[0];
  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Partner Tools"
          title="Tools Designed For Approved Partners"
          description="A public preview of the partner experience. Actual data is only visible inside the authorised partner workspace."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-6 lg:mx-0 px-6 lg:px-0 snap-x snap-mandatory">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "shrink-0 lg:shrink flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all min-w-[130px] lg:min-w-0",
                    isActive
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <Card className="p-8 md:p-10 bg-gradient-to-br from-surface via-background to-surface">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <current.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl">{current.headline}</h3>
            </div>
            <p className="mt-3 text-muted-foreground">{current.body}</p>
            <ConceptualToolPreview toolId={current.id} />
          </Card>
        </div>
      </Container>
    </Section>
  );
}

function ConceptualToolPreview({ toolId }: { toolId: string }) {
  // Neutral, non-fabricated placeholder UIs.
  const cell = "rounded-lg border border-border bg-background p-4";
  const label = "text-xs text-muted-foreground";
  const val = "mt-1 font-display font-semibold";

  if (toolId === "programs") {
    return (
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className={cell}><div className={label}>Available Programs</div><div className={val}>Explore Catalog</div></div>
        <div className={cell}><div className={label}>Program Filters</div><div className={val}>Category · Level · Mode</div></div>
        <div className={cell}><div className={label}>Eligibility</div><div className={val}>Model-based</div></div>
      </div>
    );
  }
  if (toolId === "referrals") {
    return (
      <div className="mt-6 space-y-3">
        <div className={cell}>
          <div className={label}>Authorised Referral Link</div>
          <div className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" /> glintr.com/ref/•••••
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={cell}><div className={label}>Referral Clicks</div><div className={val}>Tracked</div></div>
          <div className={cell}><div className={label}>Learner Leads</div><div className={val}>Recorded</div></div>
          <div className={cell}><div className={label}>Verified Enrollments</div><div className={val}>Reviewed</div></div>
        </div>
      </div>
    );
  }
  if (toolId === "marketing") {
    return (
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className={cell}><div className={label}>Approved Creatives</div><div className={val}>Program & Campaign</div></div>
        <div className={cell}><div className={label}>Current Campaigns</div><div className={val}>Available Where Applicable</div></div>
      </div>
    );
  }
  if (toolId === "performance") {
    return (
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className={cell}><div className={label}>Verified Activity</div><div className={val}>Available</div></div>
        <div className={cell}><div className={label}>Conversion Signals</div><div className={val}>Applicable</div></div>
        <div className={cell}><div className={label}>Reporting Windows</div><div className={val}>Daily · Monthly</div></div>
      </div>
    );
  }
  if (toolId === "earnings") {
    return (
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className={cell}><div className={label}>Eligible Activity</div><div className={val}>Tracked</div></div>
        <div className={cell}><div className={label}>Pending Review</div><div className={val}>Under Verification</div></div>
        <div className={cell}><div className={label}>Available</div><div className={val}>Per Applicable Terms</div></div>
      </div>
    );
  }
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <div className={cell}><div className={label}>Payout Workflow</div><div className={val}>Request · Review · Process</div></div>
      <div className={cell}><div className={label}>Payout Account</div><div className={val}>Bank · UPI (Masked)</div></div>
    </div>
  );
}

/* ─────────────────────────── WHY ─────────────────────────── */

function WhySection() {
  return (
    <Section padding="lg" tone="surface">
      <Container>
        <SectionHeader
          eyebrow="Why Partners Explore Glintr"
          title="A Learning Ecosystem With Structured Partnership"
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {WHY.map((w, i) => {
            const Icon = w.icon;
            return (
              <Card
                key={w.title}
                className={cn(
                  "p-6 hover:border-primary/50 transition-all",
                  i % 3 === 1 && "lg:translate-y-6",
                )}
              >
                <div className="rounded-lg bg-primary/10 p-2.5 w-fit">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display font-semibold">{w.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{w.body}</p>
              </Card>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── PARTNER PATH STORIES ─────────────────────────── */

function PartnerPathStories() {
  const [active, setActive] = React.useState("independent");
  const paths = [
    {
      id: "independent",
      label: "Independent Partner Path",
      body: [
        "Explore partner model",
        "Submit application",
        "Review eligible programs",
        "Access approved partner tools after approval",
        "Connect interested learners",
        "Track applicable verified activity",
      ],
    },
    {
      id: "community",
      label: "Community Partner Path",
      body: [
        "Explore community participation",
        "Submit community application",
        "Coordinate approved campaign resources",
        "Share authorised referral paths",
        "Track community-scale activity",
        "Review applicable outcomes",
      ],
    },
    {
      id: "team",
      label: "Team-Based Partner Path",
      body: [
        "Explore team participation",
        "Submit team application",
        "Review programs and applicable terms",
        "Onboard team members on approval",
        "Coordinate learner conversations",
        "Track structured team activity",
      ],
    },
    {
      id: "business",
      label: "Business Partner Path",
      body: [
        "Explore business participation",
        "Submit business application",
        "Review commercial and program terms",
        "Onboarding on approval",
        "Distribute eligible programs",
        "Review structured reporting",
      ],
    },
  ];
  const current = paths.find((p) => p.id === active) ?? paths[0];
  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Partner Journeys"
          title="Different Partners. Different Growth Journeys."
          description="Illustrative partner paths for exploration purposes. These are conceptual scenarios, not testimonials."
        />
        <div className="mt-10">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {paths.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                aria-pressed={active === p.id}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-all",
                  active === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/40",
                )}
              >
                Explore A Partner Path · {p.label}
              </button>
            ))}
          </div>
          <Card className="p-8 md:p-10 max-w-3xl mx-auto">
            <div className="text-label text-primary">Conceptual Scenario</div>
            <h3 className="mt-2 text-2xl font-display font-semibold">{current.label}</h3>
            <ol className="mt-6 space-y-3">
              {current.body.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <Button asChild>
                <Link to="/partner/apply">
                  Explore Partnership
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── NETWORK VISUAL BREAK ─────────────────────────── */

function NetworkVisualBreak() {
  const groups = [
    { label: "Partners", icon: Handshake, x: 15, y: 20 },
    { label: "Programs", icon: BookOpen, x: 50, y: 15 },
    { label: "Learning Domains", icon: Layers, x: 85, y: 25 },
    { label: "Learners", icon: GraduationCap, x: 25, y: 75 },
    { label: "Campus Communities", icon: Users, x: 75, y: 75 },
  ];
  const [visible, setVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Section padding="xl" tone="surface2" className="overflow-hidden">
      <Container>
        <SectionHeader
          eyebrow="Ecosystem Map"
          title="A Network That Grows Through Connections"
          description="An abstract view of the partner ecosystem — each group connects to shape a wider learning network."
        />
        <div
          ref={ref}
          className="mt-12 relative mx-auto aspect-[16/9] w-full max-w-4xl rounded-3xl border border-border bg-background overflow-hidden"
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {groups.map((a, i) =>
              groups.slice(i + 1).map((b, j) => (
                <line
                  key={`${i}-${j}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="currentColor"
                  strokeWidth={0.15}
                  className={cn(
                    "text-primary/40 transition-all",
                    visible ? "opacity-100" : "opacity-0",
                  )}
                  style={{ transitionDelay: `${(i + j) * 120}ms` }}
                />
              )),
            )}
          </svg>
          {groups.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div
                key={g.label}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs md:text-sm shadow-sm transition-all",
                  visible ? "opacity-100 scale-100" : "opacity-0 scale-90",
                )}
                style={{
                  left: `${g.x}%`,
                  top: `${g.y}%`,
                  transitionDelay: `${idx * 120 + 200}ms`,
                }}
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium whitespace-nowrap">{g.label}</span>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── BUILT RESPONSIBLY ─────────────────────────── */

function BuiltResponsibly() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Section padding="lg">
      <Container size="lg">
        <div ref={ref} className="rounded-3xl border border-border bg-background p-10 md:p-16">
          <div className="text-label text-primary">Ecosystem Principles</div>
          <h2 className="text-section font-display mt-3 max-w-3xl text-balance">
            Built To Grow Responsibly
          </h2>
          <p className="mt-6 text-body text-muted-foreground max-w-3xl">
            A strong partner network is not only about adding more participants. It
            requires clear program information, responsible learner communication,
            traceable activity and structured commercial processes. Glintr is building
            its partner ecosystem around those foundations.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {NETWORK_KEYWORDS.map((k, i) => (
              <span
                key={k}
                className={cn(
                  "rounded-full border border-border bg-surface px-5 py-2 font-display text-lg md:text-xl transition-all duration-500",
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── RESPONSIBILITIES ─────────────────────────── */

function ResponsibilitiesSection() {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <Section padding="lg" tone="surface">
      <Container size="lg">
        <SectionHeader
          eyebrow="Partner Responsibilities"
          title="Responsible Partnership Matters"
          description="Important public principles that guide participation across the partner network."
        />
        <div className="mt-10 space-y-3">
          {RESPONSIBILITIES.map((r, i) => {
            const isOpen = open === i;
            return (
              <button
                key={r.title}
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className={cn(
                  "w-full text-left rounded-xl border bg-background p-5 transition-all",
                  isOpen ? "border-primary" : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="font-semibold">{r.title}</div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "grid overflow-hidden transition-all duration-300",
                    isOpen ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="min-h-0 text-sm text-muted-foreground">{r.body}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── ELIGIBILITY ─────────────────────────── */

function EligibilitySection() {
  const items = [
    { icon: UserCircle2, title: "Individuals", body: "Education-focused individuals exploring structured partner participation." },
    { icon: Users, title: "Communities", body: "Learner, career or education-focused communities." },
    { icon: Handshake, title: "Teams", body: "Small teams working on responsible learner outreach or education growth." },
    { icon: Building2, title: "Businesses", body: "Eligible businesses exploring education distribution or program partnership opportunities." },
  ];
  const scrollToTypes = () => {
    document.getElementById("who-the-network-is-for")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <Section padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Eligibility"
          title="Who Can Apply?"
          description="Partner applications may be reviewed based on the applicable partner model, intended participation, program fit and Glintr's current partner requirements."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Card key={it.title} className="p-6">
                <div className="rounded-lg bg-primary/10 p-2.5 w-fit">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display font-semibold">{it.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
              </Card>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={scrollToTypes}>
            Check Partner Options
          </Button>
          <Button asChild>
            <Link to="/partner/apply">
              Become A Partner
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── APPLICATION JOURNEY ─────────────────────────── */

function ApplicationJourney() {
  const steps = [
    { title: "Explore The Network", body: "Understand Glintr's partner ecosystem." },
    { title: "Choose A Relevant Model", body: "Review available public participation models." },
    { title: "Submit Your Application", body: "Provide the required partner information." },
    { title: "Application Review", body: "Glintr reviews the application according to the existing workflow." },
    { title: "Partner Access", body: "Approved partners may access eligible partner tools and programs." },
    { title: "Start Participating", body: "Use approved resources and referral tools according to applicable terms." },
  ];
  return (
    <Section padding="lg" tone="surface">
      <Container size="lg">
        <SectionHeader
          eyebrow="Application"
          title="From Interest To Partner Access"
        />
        <ol className="mt-10 relative border-l border-border ml-4 space-y-8">
          {steps.map((s, i) => (
            <li key={s.title} className="pl-8 relative">
              <span className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {i + 1}
              </span>
              <h3 className="font-display font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Button asChild>
            <Link to="/partner/apply">
              Start Your Application
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── FAQ ─────────────────────────── */

function FaqSection() {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <Section padding="lg">
      <Container size="lg">
        <SectionHeader
          eyebrow="FAQs"
          title="Common Partner Questions"
        />
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={cn("rounded-xl border bg-background", isOpen ? "border-primary" : "border-border")}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                >
                  <span className="font-medium">{f.q}</span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>
                <div className={cn("grid overflow-hidden transition-all duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="min-h-0 px-5 pb-5 text-sm text-muted-foreground">{f.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── SUPPORT ─────────────────────────── */

function SupportConnection() {
  return (
    <Section padding="md" tone="surface">
      <Container size="lg">
        <div className="rounded-2xl border border-border bg-background p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-label text-primary">Partner Support</div>
            <h3 className="mt-2 text-2xl font-display font-semibold">Questions About Partnering?</h3>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Explore partner support information or contact Glintr for applicable partnership questions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/support"><MessageCircle className="mr-2 h-4 w-4" />Partner Support</Link>
            </Button>
            <Button asChild>
              <Link to="/contact">Contact Glintr</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── FINAL CTA ─────────────────────────── */

function FinalCta() {
  return (
    <Section padding="xl" tone="gradient" className="text-primary-foreground">
      <Container size="lg" className="text-center">
        <div className="text-label opacity-80">Join The Network</div>
        <h2 className="mt-4 text-hero font-display text-balance">
          Explore Your Place In The Glintr Partner Ecosystem
        </h2>
        <p className="mt-5 text-subheading opacity-90 max-w-2xl mx-auto">
          Review partner models, explore learning programs and submit an application when
          you're ready to participate.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/partner/apply">
              Become A Partner
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/earn">Explore Partner Models</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/programs">View Programs</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── STICKY CTA ─────────────────────────── */

function StickyCta() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      setVisible(window.scrollY > 800 && window.scrollY < document.body.scrollHeight - 1400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={cn(
        "fixed z-40 transition-all duration-300",
        "bottom-4 right-4 md:bottom-6 md:right-6",
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none",
      )}
      aria-hidden={!visible}
    >
      <Button asChild size="lg" className="shadow-xl">
        <Link to="/partner/apply">
          <Rocket className="mr-2 h-4 w-4" />
          Become A Partner
        </Link>
      </Button>
    </div>
  );
}

/* ─────────────────────────── SHARED HELPERS ─────────────────────────── */

function ErrorRetry({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-10 text-center">
      <div className="mx-auto rounded-full bg-muted p-3 w-fit">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-4 font-semibold">{label}</div>
      <div className="mt-4">
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  );
}

function EmptyState({ title, action }: { title: string; action: { label: string; href: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center">
      <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit">
        <Target className="h-5 w-5 text-primary" />
      </div>
      <div className="mt-4 font-semibold">{title}</div>
      <div className="mt-4">
        <Button asChild variant="outline">
          <Link to={action.href}>
            {action.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
