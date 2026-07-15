import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Compass,
  Sparkles,
  BookOpen,
  Wrench,
  GraduationCap,
  Cpu,
  Cog,
  Zap,
  Briefcase,
  LineChart,
  Rocket,
  Quote,
  X,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container, SectionHeader } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/success-stories")({
  head: () => ({
    meta: [
      { title: "Success Stories | Learner Journeys At Glintr" },
      {
        name: "description",
        content:
          "Explore learner journeys, learning experiences and stories from across Glintr programs in technology, engineering, management and emerging skills.",
      },
      { property: "og:title", content: "Success Stories | Learner Journeys At Glintr" },
      {
        property: "og:description",
        content:
          "Explore learner journeys and stories from across Glintr programs in technology, engineering, management and emerging skills.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/success-stories" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/success-stories" }],
  }),
  component: SuccessStoriesPage,
});

// -------- Editorial Journey Themes (no fabricated learners) --------
// These are learning archetypes representing the kinds of journeys learners
// take across Glintr programs. They intentionally do NOT include names,
// photos, colleges, salaries, or placement claims.

type JourneyCategory =
  | "Technology"
  | "Engineering"
  | "Management"
  | "Emerging Skills"
  | "Career Exploration";

interface JourneyTheme {
  slug: string;
  title: string;
  summary: string;
  intro: string;
  category: JourneyCategory;
  programCategory: string;
  programLabel: string;
  programHref: string;
  accent: string;
  variant: "large" | "compact" | "wide" | "quote";
  quote?: string;
  featured?: boolean;
}

const THEMES: JourneyTheme[] = [
  {
    slug: "exploring-artificial-intelligence",
    title: "Exploring Artificial Intelligence From The Ground Up",
    summary:
      "A journey that begins with curiosity about how AI systems actually think, learn and make decisions.",
    intro:
      "This journey follows the path of learners who arrive without a technical background and slowly build understanding of how modern AI works.",
    category: "Technology",
    programCategory: "computer-science",
    programLabel: "Computer Science Programs",
    programHref: "/programs/computer-science",
    accent: "from-cyan-500/15 to-blue-500/15",
    variant: "large",
    featured: true,
    quote:
      "The turning point was realising that AI is not magic — it is patterns, data and structured decisions layered together.",
  },
  {
    slug: "starting-with-machine-learning",
    title: "Starting With Machine Learning",
    summary:
      "From understanding the basics of models to running first experiments on real datasets.",
    intro:
      "A learning arc that focuses on building intuition before optimisation, and understanding before benchmarking.",
    category: "Technology",
    programCategory: "computer-science",
    programLabel: "Computer Science Programs",
    programHref: "/programs/computer-science",
    accent: "from-sky-500/15 to-indigo-500/15",
    variant: "compact",
    featured: true,
  },
  {
    slug: "discovering-data-science",
    title: "Discovering Data Science As A Career Direction",
    summary:
      "A story about learning to ask better questions of data before learning the tools that answer them.",
    intro:
      "This journey emphasises curiosity, structured thinking and the ability to communicate findings clearly.",
    category: "Technology",
    programCategory: "computer-science",
    programLabel: "Computer Science Programs",
    programHref: "/programs/computer-science",
    accent: "from-emerald-500/15 to-teal-500/15",
    variant: "wide",
    featured: true,
  },
  {
    slug: "understanding-iot",
    title: "Understanding IoT Beyond The Buzzword",
    summary:
      "A hands-on exploration of how devices, sensors and networks quietly power everyday systems.",
    intro:
      "The journey covers the fundamentals of connected devices, edge computing and practical IoT design patterns.",
    category: "Engineering",
    programCategory: "electronics-electrical",
    programLabel: "Electronics & Electrical Programs",
    programHref: "/programs/electronics-electrical",
    accent: "from-lime-500/15 to-emerald-500/15",
    variant: "compact",
    featured: true,
  },
  {
    slug: "exploring-robotics",
    title: "Exploring Robotics As A Learning Domain",
    summary:
      "A journey that connects mechanical, electronic and software thinking into working robotic systems.",
    intro:
      "Robotics as a lens for understanding interdisciplinary engineering, not just an industry buzzword.",
    category: "Engineering",
    programCategory: "mechanical-engineering",
    programLabel: "Mechanical Engineering Programs",
    programHref: "/programs/mechanical-engineering",
    accent: "from-amber-500/15 to-orange-500/15",
    variant: "large",
    featured: true,
  },
  {
    slug: "starting-with-vlsi",
    title: "Starting With VLSI And Chip Design Fundamentals",
    summary:
      "Understanding what actually happens inside the silicon behind the software.",
    intro:
      "A learning path grounded in fundamentals — logic, timing, layout and the language of hardware design.",
    category: "Engineering",
    programCategory: "electronics-electrical",
    programLabel: "Electronics & Electrical Programs",
    programHref: "/programs/electronics-electrical",
    accent: "from-violet-500/15 to-fuchsia-500/15",
    variant: "compact",
  },
  {
    slug: "learning-embedded-systems",
    title: "Learning Embedded Systems Through Small Projects",
    summary:
      "Building intuition for how firmware, sensors and constrained hardware come together.",
    intro:
      "An applied journey that turns small microcontroller projects into deeper systems understanding.",
    category: "Engineering",
    programCategory: "electronics-electrical",
    programLabel: "Electronics & Electrical Programs",
    programHref: "/programs/electronics-electrical",
    accent: "from-teal-500/15 to-cyan-500/15",
    variant: "wide",
  },
  {
    slug: "digital-marketing-clarity",
    title: "Finding Clarity In Digital Marketing",
    summary:
      "Cutting through hype to understand which channels, metrics and decisions actually matter.",
    intro:
      "A journey focused on frameworks over tactics — audiences, positioning, funnels and measurement.",
    category: "Management",
    programCategory: "management",
    programLabel: "Management Programs",
    programHref: "/programs/management",
    accent: "from-rose-500/15 to-pink-500/15",
    variant: "large",
  },
  {
    slug: "exploring-investment-banking",
    title: "Exploring Investment Banking As A Field",
    summary:
      "Understanding how capital moves, how deals are structured and how analysts think.",
    intro:
      "A career-exploration arc that maps the industry, its roles and the analytical thinking it demands.",
    category: "Management",
    programCategory: "management",
    programLabel: "Management Programs",
    programHref: "/programs/management",
    accent: "from-blue-500/15 to-indigo-500/15",
    variant: "compact",
  },
  {
    slug: "understanding-finance-basics",
    title: "Understanding Finance From First Principles",
    summary:
      "Statements, valuation and decision-making without needing a finance degree to start.",
    intro:
      "A structured way to build financial literacy that supports business, product or career decisions.",
    category: "Management",
    programCategory: "management",
    programLabel: "Management Programs",
    programHref: "/programs/management",
    accent: "from-emerald-500/15 to-lime-500/15",
    variant: "quote",
    quote:
      "Finance stopped feeling like jargon the moment I learned to read a company's story through its numbers.",
  },
  {
    slug: "building-hr-thinking",
    title: "Building A Modern HR Thinking Toolkit",
    summary:
      "From people processes to organisational design and the systems behind healthy teams.",
    intro:
      "A journey that treats HR as a design discipline for how humans work together, not just a policy function.",
    category: "Management",
    programCategory: "management",
    programLabel: "Management Programs",
    programHref: "/programs/management",
    accent: "from-fuchsia-500/15 to-purple-500/15",
    variant: "compact",
  },
  {
    slug: "career-clarity-through-exploration",
    title: "Finding Career Clarity Through Exploration",
    summary:
      "A story about trying, learning and narrowing down what actually fits.",
    intro:
      "For learners still deciding which domain to invest in, this arc focuses on structured exploration.",
    category: "Career Exploration",
    programCategory: "computer-science",
    programLabel: "Explore Programs",
    programHref: "/programs",
    accent: "from-slate-500/15 to-zinc-500/15",
    variant: "wide",
  },
  {
    slug: "moving-into-emerging-skills",
    title: "Moving Into Emerging Skills",
    summary:
      "Learning to learn as the field itself keeps evolving — AI tooling, automation and new workflows.",
    intro:
      "A meta-journey about staying current, not just current on one topic.",
    category: "Emerging Skills",
    programCategory: "computer-science",
    programLabel: "Emerging Skill Programs",
    programHref: "/programs/computer-science",
    accent: "from-cyan-500/15 to-lime-500/15",
    variant: "large",
  },
  {
    slug: "applying-learning-to-projects",
    title: "Turning Learning Into Applied Projects",
    summary:
      "From concept to something that works — even if small, even if imperfect.",
    intro:
      "A journey focused on doing, not just consuming — the shortest path from idea to artefact.",
    category: "Emerging Skills",
    programCategory: "computer-science",
    programLabel: "Computer Science Programs",
    programHref: "/programs/computer-science",
    accent: "from-orange-500/15 to-amber-500/15",
    variant: "compact",
  },
  {
    slug: "moving-from-curious-to-committed",
    title: "Moving From Curious To Committed",
    summary:
      "The moment learning stops being casual and starts becoming a real direction.",
    intro:
      "An honest look at what changes when a learner commits to a domain and structures their time around it.",
    category: "Career Exploration",
    programCategory: "management",
    programLabel: "Explore Programs",
    programHref: "/programs",
    accent: "from-indigo-500/15 to-violet-500/15",
    variant: "wide",
  },
];

const CATEGORIES: JourneyCategory[] | "All Stories"[] = [
  "All Stories",
  "Technology",
  "Engineering",
  "Management",
  "Emerging Skills",
  "Career Exploration",
] as any;

const DOMAINS = [
  { label: "Artificial Intelligence", href: "/programs/computer-science", icon: Sparkles },
  { label: "Machine Learning", href: "/programs/computer-science", icon: LineChart },
  { label: "Data Science", href: "/programs/computer-science", icon: BookOpen },
  { label: "IoT", href: "/programs/electronics-electrical", icon: Cpu },
  { label: "Robotics", href: "/programs/mechanical-engineering", icon: Cog },
  { label: "Embedded Systems", href: "/programs/electronics-electrical", icon: Zap },
  { label: "VLSI", href: "/programs/electronics-electrical", icon: Cpu },
  { label: "Digital Marketing", href: "/programs/management", icon: Rocket },
  { label: "Finance", href: "/programs/management", icon: Briefcase },
  { label: "Investment Banking", href: "/programs/management", icon: Briefcase },
  { label: "Human Resources", href: "/programs/management", icon: GraduationCap },
];

const JOURNEY_STAGES = [
  { label: "Curious", body: "Discovering a new domain or skill." },
  { label: "Exploring", body: "Understanding what the field involves." },
  { label: "Learning", body: "Building knowledge through structured learning." },
  { label: "Building", body: "Applying concepts and developing practical understanding." },
  { label: "Moving Forward", body: "Using new understanding to make the next learning or career decision." },
];

// -------- Small UI helpers --------

function CategoryChip({ label, icon: Icon }: { label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

function AbstractVisual({ accent, label }: { accent: string; label: string }) {
  const initials = label
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return (
    <div className={cn("relative w-full h-full overflow-hidden rounded-xl bg-gradient-to-br", accent)}>
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_45%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl font-semibold tracking-tight text-foreground/70">{initials}</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-foreground/60">
        <span>Glintr Journey</span>
        <span>Editorial</span>
      </div>
    </div>
  );
}

function StoryCard({
  theme,
  compact = false,
  onQuickView,
}: {
  theme: JourneyTheme;
  compact?: boolean;
  onQuickView: (t: JourneyTheme) => void;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition hover:-translate-y-0.5 hover:shadow-xl focus-within:shadow-xl">
      <div className={cn("aspect-[16/10] w-full", compact && "aspect-[4/3]")}>
        <AbstractVisual accent={theme.accent} label={theme.title} />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{theme.category}</span>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{theme.programLabel}</span>
        </div>
        <h3 className="text-lg font-semibold leading-snug tracking-tight">{theme.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3">{theme.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <button
            type="button"
            onClick={() => onQuickView(theme)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Quick view
          </button>
          <Link
            to="/success-stories/$storySlug"
            params={{ storySlug: theme.slug }}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all"
          >
            Read Story <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function LargeEditorialStory({
  theme,
  reverse,
  onQuickView,
}: {
  theme: JourneyTheme;
  reverse?: boolean;
  onQuickView: (t: JourneyTheme) => void;
}) {
  return (
    <article
      className={cn(
        "grid gap-8 items-center rounded-3xl border border-border bg-surface/40 p-6 md:p-10 lg:grid-cols-2",
      )}
    >
      <div className={cn("aspect-[4/3] w-full", reverse && "lg:order-2")}>
        <AbstractVisual accent={theme.accent} label={theme.title} />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>{theme.category}</span>
          <span>•</span>
          <span>{theme.programLabel}</span>
        </div>
        <h3 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{theme.title}</h3>
        <p className="text-base text-muted-foreground md:text-lg">{theme.summary}</p>
        <p className="text-sm text-muted-foreground/90">{theme.intro}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button asChild variant="gradient">
            <Link to="/success-stories/$storySlug" params={{ storySlug: theme.slug }}>
              Read Full Story <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={theme.programHref}>Explore Program</a>
          </Button>
          <button
            type="button"
            onClick={() => onQuickView(theme)}
            className="text-sm text-muted-foreground hover:text-foreground story-link"
          >
            Quick view
          </button>
        </div>
      </div>
    </article>
  );
}

function QuoteBreak({ theme }: { theme: JourneyTheme }) {
  if (!theme.quote) return null;
  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-surface to-background p-8 md:p-12">
      <Quote className="size-8 text-primary" />
      <blockquote className="mt-4 text-2xl font-medium leading-snug tracking-tight md:text-3xl">
        "{theme.quote}"
      </blockquote>
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <span>{theme.category}</span>
        <span>•</span>
        <span>{theme.programLabel}</span>
      </div>
    </div>
  );
}

function QuickViewSheet({
  theme,
  onClose,
}: {
  theme: JourneyTheme | null;
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (!theme) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [theme, onClose]);

  if (!theme) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
      <button
        type="button"
        aria-label="Close quick view"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={theme.title}
        className="relative w-full md:max-w-lg bg-background rounded-t-3xl md:rounded-3xl border border-border p-6 md:p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full border border-border p-1.5 hover:bg-surface"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <div className="aspect-[16/10] w-full mb-4">
          <AbstractVisual accent={theme.accent} label={theme.title} />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {theme.category} • {theme.programLabel}
        </div>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">{theme.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{theme.summary}</p>
        <p className="mt-3 text-sm text-muted-foreground/90">{theme.intro}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="gradient">
            <Link to="/success-stories/$storySlug" params={{ storySlug: theme.slug }}>
              Read Full Story <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={theme.programHref}>Explore Program</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

// -------- Page --------

function SuccessStoriesPage() {
  const [activeCategory, setActiveCategory] = React.useState<string>("All Stories");
  const [activeDomain, setActiveDomain] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [visible, setVisible] = React.useState(9);
  const [quickView, setQuickView] = React.useState<JourneyTheme | null>(null);
  const [activeStage, setActiveStage] = React.useState(0);

  const featuredRailRef = React.useRef<HTMLDivElement>(null);
  const featuredSectionRef = React.useRef<HTMLDivElement>(null);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return THEMES.filter((t) => {
      if (activeCategory !== "All Stories" && t.category !== activeCategory) return false;
      if (activeDomain) {
        const matches = t.programLabel.toLowerCase().includes(activeDomain.toLowerCase()) ||
          t.title.toLowerCase().includes(activeDomain.toLowerCase());
        if (!matches) return false;
      }
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.programLabel.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, activeDomain, query]);

  const featured = THEMES.filter((t) => t.featured);
  const stream = filtered.slice(0, visible);
  const quoteTheme = THEMES.find((t) => t.quote);

  const scrollRail = (dir: "prev" | "next") => {
    const el = featuredRailRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  };

  const scrollToFeatured = () => {
    featuredSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Journey timeline scroll spy
  React.useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>("[data-stage]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number(e.target.getAttribute("data-stage"));
            setActiveStage(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );
    items.forEach((i) => observer.observe(i));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <Section padding="lg">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] items-center">
            <div className="flex flex-col gap-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground w-fit">
                <Sparkles className="size-3.5" /> Glintr Stories
              </span>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                Every Learning Journey <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Starts Somewhere
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Explore stories from learners discovering new skills, exploring career domains
                and building their understanding through Glintr learning experiences.
              </p>
              <p className="text-base text-muted-foreground/90 max-w-xl">
                Different backgrounds. Different interests. Different learning paths. One growing
                community of learners moving forward.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="gradient" size="lg" onClick={scrollToFeatured}>
                  Explore Stories <ArrowRight className="size-4" />
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/programs">Explore Programs</a>
                </Button>
              </div>
            </div>

            {/* Interactive story collage */}
            <div className="relative h-[420px] hidden lg:block">
              {featured.slice(0, 5).map((t, i) => {
                const positions = [
                  "top-0 left-8 rotate-[-4deg]",
                  "top-6 right-0 rotate-[3deg]",
                  "top-40 left-0 rotate-[2deg]",
                  "top-48 right-12 rotate-[-2deg]",
                  "bottom-0 left-24 rotate-[-1deg]",
                ];
                return (
                  <div
                    key={t.slug}
                    className={cn(
                      "absolute w-56 h-64 rounded-2xl border border-border overflow-hidden shadow-lg transition-transform duration-500 hover:!rotate-0 hover:scale-105 hover:z-10 motion-safe:animate-[float_6s_ease-in-out_infinite]",
                      positions[i],
                    )}
                    style={{ animationDelay: `${i * 0.6}s` }}
                  >
                    <div className="h-2/3">
                      <AbstractVisual accent={t.accent} label={t.title} />
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {t.category}
                      </div>
                      <div className="text-sm font-medium line-clamp-2 mt-1">{t.title}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile story rail */}
            <div className="lg:hidden -mx-4 overflow-x-auto snap-x snap-mandatory scrollbar-none">
              <div className="flex gap-4 px-4 pb-2">
                {featured.slice(0, 5).map((t) => (
                  <div key={t.slug} className="min-w-[70%] snap-center rounded-2xl border border-border overflow-hidden">
                    <div className="aspect-[4/3]">
                      <AbstractVisual accent={t.accent} label={t.title} />
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.category}</div>
                      <div className="text-sm font-medium mt-1">{t.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <button
            type="button"
            onClick={scrollToFeatured}
            className="mt-12 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mx-auto"
            aria-label="Scroll to featured stories"
          >
            <span>Scroll to explore</span>
            <span className="relative block h-8 w-px bg-border overflow-hidden">
              <span className="absolute inset-x-0 top-0 h-3 bg-primary motion-safe:animate-[scrollLine_1.8s_ease-in-out_infinite]" />
            </span>
          </button>
        </Container>
      </Section>

      {/* FEATURED STORIES */}
      <div ref={featuredSectionRef} />
      <Section padding="md" className="bg-surface/30">
        <Container>
          <div className="flex items-end justify-between gap-4 mb-8">
            <SectionHeader
              eyebrow="Featured Stories"
              title="Highlights From The Glintr Community"
              description="A curated set of learning journeys across our most active domains."
            />
            <div className="hidden md:flex gap-2">
              <Button variant="outline" size="icon" onClick={() => scrollRail("prev")} aria-label="Previous">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => scrollRail("next")} aria-label="Next">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <div
            ref={featuredRailRef}
            className="-mx-4 overflow-x-auto snap-x snap-mandatory scrollbar-none px-4 pb-4"
          >
            <div className="flex gap-6">
              {featured.map((t) => (
                <div key={t.slug} className="min-w-[85%] sm:min-w-[60%] md:min-w-[40%] lg:min-w-[32%] snap-start">
                  <StoryCard theme={t} onQuickView={setQuickView} />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* CATEGORY EXPLORER + SEARCH */}
      <Section padding="md">
        <Container>
          <SectionHeader
            eyebrow="Explore By Journey"
            title="Find Stories That Match Your Curiosity"
            description="Filter learner journeys by category, learning domain or search for something specific."
          />
          <div className="mt-8 flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {(CATEGORIES as string[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition",
                    activeCategory === c
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by story, skill or program"
                className="pl-9"
                aria-label="Search stories"
              />
            </div>

            <div className="-mx-4 overflow-x-auto scrollbar-none px-4">
              <div className="flex gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveDomain(null)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs uppercase tracking-widest",
                    activeDomain === null
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  All Domains
                </button>
                {DOMAINS.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => setActiveDomain(activeDomain === d.label ? null : d.label)}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs uppercase tracking-widest",
                      activeDomain === d.label
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <d.icon className="size-3.5" />
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* STORY STREAM */}
      <Section padding="md">
        <Container>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-caption">
              Showing {stream.length} of {filtered.length} learner {filtered.length === 1 ? "journey" : "journeys"}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-border bg-surface/40 p-12 text-center">
              <h3 className="text-xl font-semibold">No Stories Found For This Selection</h3>
              <p className="mt-2 text-muted-foreground">
                Try another learning domain or explore all learner stories.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button
                  variant="gradient"
                  onClick={() => {
                    setActiveCategory("All Stories");
                    setActiveDomain(null);
                    setQuery("");
                  }}
                >
                  View All Stories
                </Button>
                <Button asChild variant="outline">
                  <a href="/programs">Explore Programs</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {stream.map((t, i) => {
                // Editorial rhythm
                if (t.variant === "large") {
                  return (
                    <LargeEditorialStory
                      key={t.slug}
                      theme={t}
                      reverse={i % 2 === 1}
                      onQuickView={setQuickView}
                    />
                  );
                }
                if (t.variant === "quote" && t.quote) {
                  return <QuoteBreak key={t.slug} theme={t} />;
                }
                if (t.variant === "wide") {
                  return (
                    <div key={t.slug} className="grid gap-6 md:grid-cols-3">
                      <div className="md:col-span-2">
                        <StoryCard theme={t} onQuickView={setQuickView} />
                      </div>
                      {stream[i + 1] && stream[i + 1].variant === "compact" && (
                        <StoryCard theme={stream[i + 1]} compact onQuickView={setQuickView} />
                      )}
                    </div>
                  );
                }
                // Compact: group consecutive compacts into a row
                if (t.variant === "compact") {
                  // Skip if previous was 'wide' — we already rendered it there
                  if (i > 0 && stream[i - 1].variant === "wide") return null;
                  const group = [t];
                  for (let j = i + 1; j < stream.length && stream[j].variant === "compact" && group.length < 3; j++) {
                    group.push(stream[j]);
                  }
                  // Only render if this is the leading item (previous not compact)
                  if (i > 0 && stream[i - 1].variant === "compact") return null;
                  return (
                    <div key={t.slug} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {group.map((g) => (
                        <StoryCard key={g.slug} theme={g} compact onQuickView={setQuickView} />
                      ))}
                    </div>
                  );
                }
                return <StoryCard key={t.slug} theme={t} onQuickView={setQuickView} />;
              })}
            </div>
          )}

          {visible < filtered.length && (
            <div className="mt-12 flex justify-center">
              <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + 6)}>
                Load More Stories
              </Button>
            </div>
          )}

          {quoteTheme && filtered.length > 0 && (
            <div className="mt-12">
              <QuoteBreak theme={quoteTheme} />
            </div>
          )}
        </Container>
      </Section>

      {/* JOURNEY TIMELINE */}
      <Section padding="lg" className="bg-surface/30">
        <Container>
          <SectionHeader
            eyebrow="The Learning Arc"
            title="Different Journeys. Different Starting Points."
            description="Every learner starts somewhere. Here's a way to think about the shape of a learning journey."
          />
          <div ref={timelineRef} className="mt-12 grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="hidden lg:block sticky top-24 self-start">
              <ol className="flex flex-col gap-3">
                {JOURNEY_STAGES.map((s, i) => (
                  <li
                    key={s.label}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition",
                      activeStage === i && "border-border bg-background",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full transition",
                        activeStage === i ? "bg-primary" : "bg-muted-foreground/30",
                      )}
                    />
                    <span className={cn("text-sm", activeStage === i ? "text-foreground" : "text-muted-foreground")}>
                      {s.label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col gap-6">
              {JOURNEY_STAGES.map((s, i) => (
                <div
                  key={s.label}
                  data-stage={i}
                  className="rounded-2xl border border-border bg-background p-6 md:p-8"
                >
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Stage {i + 1}</div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">{s.label}</h3>
                  <p className="mt-2 text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* DOMAIN STRIP */}
      <Section padding="md">
        <Container>
          <SectionHeader
            eyebrow="Stories Across Learning Domains"
            title="Explore Journeys By Domain"
            description="Learning happens across many fields. Pick one to filter the stream above."
          />
          <div className="-mx-4 mt-8 overflow-x-auto scrollbar-none px-4">
            <div className="flex gap-4 pb-2">
              {DOMAINS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    setActiveDomain(d.label);
                    featuredSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group shrink-0 w-56 rounded-2xl border border-border bg-background p-5 text-left hover:border-primary/50 transition"
                >
                  <d.icon className="size-6 text-primary" />
                  <div className="mt-4 text-sm font-medium">{d.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                    View Stories <ArrowUpRight className="size-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* PROGRAM DISCOVERY BREAK */}
      <Section padding="md" className="bg-surface/30">
        <Container>
          <SectionHeader
            eyebrow="Your Path Could Start Here"
            title="Your Story Could Start With A Skill"
            description="Explore programs across technology, engineering, management and emerging career domains."
          />
          <div className="-mx-4 mt-8 overflow-x-auto scrollbar-none px-4">
            <div className="flex gap-4 pb-2">
              {[
                { name: "Computer Science", href: "/programs/computer-science", summary: "AI, Data, Software and digital infrastructure." },
                { name: "Electronics & Electrical", href: "/programs/electronics-electrical", summary: "IoT, Embedded, VLSI and hardware." },
                { name: "Mechanical Engineering", href: "/programs/mechanical-engineering", summary: "Design, Robotics and applied engineering." },
                { name: "Management", href: "/programs/management", summary: "Finance, Marketing, HR and business thinking." },
              ].map((p) => (
                <a
                  key={p.name}
                  href={p.href}
                  className="group shrink-0 w-72 rounded-2xl border border-border bg-background p-6 hover:border-primary/50 transition"
                >
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Program Category</div>
                  <div className="mt-2 text-lg font-semibold">{p.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                    Explore Program <ArrowRight className="size-4 group-hover:translate-x-0.5 transition" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section padding="lg">
        <Container>
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Start Exploring Your Direction</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-lg">
              Every learner starts from a different place. Explore programs and discover a
              learning path that interests you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="gradient" size="lg">
                <a href="/programs">Explore Programs</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/about">About Glintr</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <SiteFooter />

      <QuickViewSheet theme={quickView} onClose={() => setQuickView(null)} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--tw-rotate)); }
          50% { transform: translateY(-8px) rotate(var(--tw-rotate)); }
        }
        @keyframes scrollLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export { THEMES };
