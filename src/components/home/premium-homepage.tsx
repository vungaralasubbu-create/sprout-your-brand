/**
 * Premium Glintr homepage — long-scroll editorial experience.
 * Uses existing tokens, motion utilities and route canonicals only.
 */
import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Compass,
  Rocket,
  Cpu,
  Wrench,
  Briefcase,
  Code2,
  Zap,
  Brain,
  Network,
  Layers,
  CircuitBoard,
  Building2,
  Wallet,
  Store,
  BookOpen,
  Target,
  TrendingUp,
  Users,
  GraduationCap,
} from "lucide-react";

import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { GlintrLogo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import mark from "@/assets/glintr-mark.png.asset.json";
import { useReveal, usePrefersReducedMotion } from "@/hooks/use-motion";
import { ThreeJourneys, EarnSpotlight } from "@/components/home/dimensional-sections";

/* --------------------------------------------------------------------- *
 * Small utilities
 * --------------------------------------------------------------------- */

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, dataVisible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-visible={dataVisible}
      className={cn("reveal", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function usePointerParallax(strength = 6) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  React.useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const handle = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", `${(x * strength).toFixed(2)}px`);
        el.style.setProperty("--py", `${(y * strength).toFixed(2)}px`);
      });
    };
    const leave = () => {
      el.style.setProperty("--px", "0px");
      el.style.setProperty("--py", "0px");
    };
    el.addEventListener("pointermove", handle);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", handle);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [reduced, strength]);
  return ref;
}

/* --------------------------------------------------------------------- *
 * 1. Premium Hero — Glintr Learning Universe
 * --------------------------------------------------------------------- */

function HeroUniverse() {
  const stageRef = usePointerParallax(8);
  return (
    <Section
      tone="default"
      padding="md"
      className="relative overflow-hidden isolate"
    >
      {/* Ambient field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 20% 10%, oklch(0.78 0.16 175 / 0.14), transparent 60%), radial-gradient(50% 50% at 85% 20%, oklch(0.62 0.19 245 / 0.12), transparent 60%), radial-gradient(60% 60% at 50% 100%, oklch(0.82 0.22 140 / 0.08), transparent 60%)",
        }}
      />
      {/* Fine grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.7 0.02 240 / 0.08) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.02 240 / 0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />

      <Container>
        <div className="grid gap-10 items-center lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 text-label text-primary">
              <span className="size-1.5 rounded-full bg-[var(--brand-cyan)] cat-pulse" />
              LEARN. BUILD. GROW.
            </div>
            <h1 className="text-hero text-balance">
              Build Skills For The World<br className="hidden md:block" /> That Is{" "}
              <span className="text-gradient-brand">Taking Shape.</span>
            </h1>
            <p className="text-subheading max-w-xl text-pretty">
              Explore practical learning across technology, engineering and
              management. Discover programs, build new skills and explore
              opportunities across the Glintr ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-1">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/programs">
                  Explore Programs <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#learning-direction">Find My Learning Direction</a>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/earn">
                  Start Earning <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--brand-cyan)]" />
                Practical Programs
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--brand-azure)]" />
                Structured Learning
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--brand-lime)]" />
                Partner & Brand Paths
              </span>
            </div>
          </div>

          <div
            ref={stageRef}
            className="relative aspect-square w-full max-w-[560px] justify-self-end"
            style={
              {
                ["--px" as string]: "0px",
                ["--py" as string]: "0px",
              } as React.CSSProperties
            }
          >
            <HeroLearningUniverse />
          </div>
        </div>
      </Container>

      {/* Scroll bridge — pathway extends downward */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-80px] h-40 -z-10"
      >
        <svg viewBox="0 0 1200 160" className="w-full h-full">
          <defs>
            <linearGradient id="bridge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--brand-cyan)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M100 0 C 300 60, 500 40, 600 90 S 900 140, 1100 80"
            stroke="url(#bridge)"
            strokeWidth="1.5"
            fill="none"
            className="cat-path"
          />
        </svg>
      </div>
    </Section>
  );
}

function HeroLearningUniverse() {
  // Ring of learning nodes around the Glintr mark
  const nodes = [
    { label: "AI", angle: 270 },
    { label: "ML", angle: 305 },
    { label: "ChatGPT", angle: 340 },
    { label: "Claude", angle: 15 },
    { label: "Gemini", angle: 50 },
    { label: "Web", angle: 85 },
    { label: "App", angle: 120 },
    { label: "VLSI", angle: 155 },
    { label: "Embedded", angle: 190 },
    { label: "IoT", angle: 220 },
    { label: "Mechanical", angle: 240 },
    { label: "Management", angle: 258 },
  ];
  const R = 42; // percent
  const cx = 50;
  const cy = 50;
  return (
    <div
      className="absolute inset-0"
      style={{
        transform: "translate3d(var(--px, 0px), var(--py, 0px), 0)",
        transition: "transform 0.45s cubic-bezier(0.2,0.8,0.2,1)",
      }}
    >
      {/* SVG lattice */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="u-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity="0.35" />
            <stop offset="60%" stopColor="var(--brand-azure)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="var(--brand-azure)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r="46" fill="url(#u-glow)" />
        {/* Concentric rings */}
        {[18, 30, 42].map((r, i) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="oklch(0.7 0.05 240 / 0.25)"
            strokeWidth="0.15"
            className={i === 1 ? "cat-rotate-slow" : undefined}
            strokeDasharray={i === 2 ? "0.6 1.2" : undefined}
          />
        ))}
        {/* Radial pathways */}
        {nodes.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = cx + Math.cos(rad) * R;
          const y = cy + Math.sin(rad) * R;
          return (
            <line
              key={`p-${n.label}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="oklch(0.7 0.1 220 / 0.25)"
              strokeWidth="0.12"
              className="cat-path"
            />
          );
        })}
        {/* Node dots */}
        {nodes.map((n, i) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = cx + Math.cos(rad) * R;
          const y = cy + Math.sin(rad) * R;
          return (
            <circle
              key={`d-${n.label}`}
              cx={x}
              cy={y}
              r="0.9"
              fill="var(--brand-cyan)"
              className={i % 3 === 0 ? "cat-pulse" : undefined}
            />
          );
        })}
      </svg>

      {/* Center mark */}
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ transform: "translate3d(calc(var(--px)*-0.4), calc(var(--py)*-0.4), 0)" }}
      >
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -m-8 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.16 175 / 0.5), transparent 70%)",
            }}
          />
          <img
            src={mark.url}
            alt="Glintr"
            className="relative h-24 w-24 md:h-32 md:w-32 object-contain drop-shadow-[0_10px_30px_rgba(0,180,220,0.25)]"
          />
        </div>
      </div>

      {/* Node labels */}
      {nodes.map((n) => {
        const rad = (n.angle * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * R;
        const y = 50 + Math.sin(rad) * R;
        return (
          <div
            key={`l-${n.label}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[10px] font-medium tracking-wide text-foreground/80 backdrop-blur-sm shadow-sm"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {n.label}
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------- *
 * 2. Motion Statement
 * --------------------------------------------------------------------- */

function MotionStatement() {
  const lines = [
    "LEARN WHAT IS CHANGING.",
    "BUILD WHAT COMES NEXT.",
    "GROW THROUGH PRACTICAL SKILLS.",
    "GLINTR.",
  ];
  return (
    <Section tone="default" padding="lg" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 50%, oklch(0.62 0.19 245 / 0.06), transparent 70%)",
        }}
      />
      <Container size="lg">
        <div className="flex flex-col gap-6 md:gap-8">
          {lines.map((line, i) => (
            <Reveal key={line} delay={i * 120}>
              <p
                className={cn(
                  "font-display font-bold tracking-tight leading-[0.95] text-balance",
                  i === lines.length - 1
                    ? "text-6xl md:text-8xl text-gradient-brand"
                    : "text-4xl md:text-6xl",
                  i < lines.length - 1 && "text-foreground/85",
                )}
              >
                {line}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 3. Technology Landscape (three-layer marquee)
 * --------------------------------------------------------------------- */

function TechnologyLandscape() {
  const large = [
    "Generative AI",
    "Machine Learning",
    "Cloud",
    "VLSI",
    "Embedded Systems",
    "Web Development",
    "App Development",
    "Data",
    "IoT",
    "Semiconductors",
  ];
  const medium = [
    "Python",
    "React",
    "TypeScript",
    "Node",
    "SQL",
    "PyTorch",
    "TensorFlow",
    "Kubernetes",
    "Docker",
    "AWS",
    "GCP",
    "Azure",
    "PostgreSQL",
    "GitHub",
  ];
  const skills = [
    "Prompt Engineering",
    "Systems Design",
    "Product",
    "Marketing",
    "Finance",
    "HR",
    "Operations",
    "Analytics",
    "Communication",
    "Strategy",
  ];
  return (
    <Section tone="surface" padding="lg" className="relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="max-w-3xl">
            <div className="text-label text-primary mb-3">
              TECHNOLOGY ECOSYSTEMS EXPLORED
            </div>
            <h2 className="text-section text-balance">
              Learn across the technologies shaping modern work.
            </h2>
            <p className="text-subheading mt-4 max-w-2xl">
              Programs across the Glintr ecosystem explore practical
              technologies, platforms and skills relevant to today's roles.
            </p>
          </div>
        </Reveal>
      </Container>

      <div className="relative mt-10 flex flex-col gap-4 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <MarqueeRow items={large} speed={70} size="lg" />
        <MarqueeRow items={medium} speed={55} size="md" reverse />
        <MarqueeRow items={skills} speed={45} size="sm" />
      </div>

      <Container>
        <p className="mt-10 text-xs text-muted-foreground max-w-2xl">
          Third-party names and marks referenced above belong to their
          respective owners. References do not imply endorsement, affiliation,
          or partnership unless expressly stated.
        </p>
      </Container>
    </Section>
  );
}

function MarqueeRow({
  items,
  speed = 60,
  size = "md",
  reverse,
}: {
  items: string[];
  speed?: number;
  size?: "sm" | "md" | "lg";
  reverse?: boolean;
}) {
  const doubled = [...items, ...items];
  const sizeCls =
    size === "lg"
      ? "text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground/70"
      : size === "md"
        ? "text-xl md:text-2xl font-medium text-foreground/60"
        : "text-sm md:text-base uppercase tracking-wider text-muted-foreground";
  return (
    <div className="group overflow-hidden py-2">
      <div
        className="flex gap-10 md:gap-14 whitespace-nowrap will-change-transform"
        style={{
          animation: `glintr-marquee ${speed}s linear infinite ${reverse ? "reverse" : ""}`,
        }}
      >
        {doubled.map((label, i) => (
          <span key={`${label}-${i}`} className={cn("shrink-0", sizeCls)}>
            {label}
            <span
              aria-hidden
              className="mx-8 md:mx-12 inline-block align-middle size-1.5 rounded-full bg-[var(--brand-cyan)] opacity-40"
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- *
 * 4. Program Universe — asymmetric category panels
 * --------------------------------------------------------------------- */

interface CategoryPanel {
  slug: "computer-science" | "electronics-electrical" | "mechanical-engineering" | "management";
  name: string;
  count: number;
  description: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_PANELS: CategoryPanel[] = [
  {
    slug: "computer-science",
    name: "Computer Science",
    count: 11,
    description:
      "AI, machine learning, web, app and modern software foundations.",
    accent: "var(--brand-cyan)",
    Icon: Code2,
  },
  {
    slug: "electronics-electrical",
    name: "Electronics & Electrical",
    count: 4,
    description: "VLSI, embedded systems, IoT and signal-driven hardware.",
    accent: "var(--brand-azure)",
    Icon: CircuitBoard,
  },
  {
    slug: "mechanical-engineering",
    name: "Mechanical Engineering",
    count: 6,
    description: "Design, systems and engineering for physical products.",
    accent: "var(--brand-lime)",
    Icon: Wrench,
  },
  {
    slug: "management",
    name: "Management",
    count: 8,
    description: "Business, strategy, marketing, HR and finance foundations.",
    accent: "var(--brand-violet)",
    Icon: Briefcase,
  },
];

function ProgramUniverse() {
  return (
    <Section tone="default" padding="lg" className="relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-label text-primary mb-3">
                EXPLORE THE GLINTR PROGRAM UNIVERSE
              </div>
              <h2 className="text-section text-balance">
                Choose the field you want to build in.
              </h2>
            </div>
            <Link
              to="/programs"
              className="story-link text-sm font-medium text-foreground/80"
            >
              View all programs →
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-6 md:grid-rows-2">
          {CATEGORY_PANELS.map((p, i) => (
            <Reveal
              key={p.slug}
              delay={i * 80}
              className={cn(
                i === 0 && "md:col-span-4 md:row-span-1",
                i === 1 && "md:col-span-2 md:row-span-1",
                i === 2 && "md:col-span-2 md:row-span-1",
                i === 3 && "md:col-span-4 md:row-span-1",
              )}
            >
              <CategoryPanelCard panel={p} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function CategoryPanelCard({ panel }: { panel: CategoryPanel }) {
  const { Icon } = panel;
  return (
    <Link
      to="/programs/$category"
      params={{ category: panel.slug }}
      className="lift-card group relative block h-full min-h-[280px] overflow-hidden rounded-3xl border border-border/60 bg-surface p-6 md:p-8"
    >
      {/* Ambient category glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 transition-opacity group-hover:opacity-100"
        style={{
          background: `radial-gradient(70% 55% at 90% 0%, color-mix(in oklab, ${panel.accent} 22%, transparent), transparent 60%)`,
        }}
      />
      {/* Decorative SVG geometry per category */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-6 -bottom-10 h-56 w-56 opacity-70"
      >
        <g stroke={panel.accent} strokeWidth="0.6" fill="none" opacity="0.55">
          {panel.slug === "computer-science" && (
            <>
              <circle cx="100" cy="100" r="60" strokeDasharray="1 3" className="cat-rotate-slow" />
              <circle cx="100" cy="100" r="38" className="cat-path" />
              <circle cx="100" cy="40" r="3" fill={panel.accent} className="cat-node" />
              <circle cx="160" cy="100" r="3" fill={panel.accent} className="cat-node" />
              <circle cx="100" cy="160" r="3" fill={panel.accent} className="cat-node" />
              <circle cx="40" cy="100" r="3" fill={panel.accent} className="cat-node" />
            </>
          )}
          {panel.slug === "electronics-electrical" && (
            <>
              <path d="M20 60 H70 V100 H120 V60 H180" className="cat-path" />
              <path d="M20 140 H60 V100" className="cat-path" />
              <circle cx="70" cy="60" r="3" fill={panel.accent} className="cat-node" />
              <circle cx="120" cy="100" r="3" fill={panel.accent} className="cat-node" />
              <circle cx="180" cy="60" r="3" fill={panel.accent} className="cat-node" />
            </>
          )}
          {panel.slug === "mechanical-engineering" && (
            <>
              <circle cx="100" cy="100" r="55" className="cat-rotate" />
              <circle cx="100" cy="100" r="30" />
              {Array.from({ length: 8 }).map((_, i) => {
                const a = (i / 8) * Math.PI * 2;
                return (
                  <line
                    key={i}
                    x1={100 + Math.cos(a) * 30}
                    y1={100 + Math.sin(a) * 30}
                    x2={100 + Math.cos(a) * 55}
                    y2={100 + Math.sin(a) * 55}
                  />
                );
              })}
            </>
          )}
          {panel.slug === "management" && (
            <>
              <path d="M30 160 L70 110 L100 130 L140 70 L180 40" className="cat-path" />
              <circle cx="70" cy="110" r="3" fill={panel.accent} className="cat-node" />
              <circle cx="100" cy="130" r="3" fill={panel.accent} className="cat-node" />
              <circle cx="140" cy="70" r="3" fill={panel.accent} className="cat-node" />
              <circle cx="180" cy="40" r="3" fill={panel.accent} className="cat-node" />
            </>
          )}
        </g>
      </svg>

      <div className="relative flex h-full flex-col justify-between gap-6">
        <div className="flex items-center justify-between">
          <div
            className="grid size-11 place-items-center rounded-xl border border-border/60 bg-background/60 backdrop-blur"
            style={{ color: panel.accent }}
          >
            <Icon className="size-5" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {panel.count} programs
          </span>
        </div>
        <div>
          <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
            {panel.name}
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {panel.description}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground/85 transition-transform group-hover:translate-x-1">
            Explore category <ArrowRight className="size-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* --------------------------------------------------------------------- *
 * 5. Generative AI Spotlight
 * --------------------------------------------------------------------- */

interface AIProgram {
  slug: string;
  name: string;
  metaphor: string;
  bullets: string[];
  accent: string;
  variant: AIWorkspaceVariant;
}

// AI program graphics are rendered by <AIWorkspaceVisual /> — a
// dimensional Input → Processing Core → Output composition with an
// autonomous ~10s animation sequence per variant.

const AI_PROGRAMS: AIProgram[] = [
  {
    slug: "chatgpt",
    name: "ChatGPT",
    metaphor: "Prompt pathways · context blocks · instruction flow",
    bullets: [
      "Practical prompt design foundations",
      "Working with context and constraints",
      "Applied instruction patterns",
    ],
    accent: "oklch(0.78 0.16 175)",
    variant: "chatgpt",
  },
  {
    slug: "claude-ai",
    name: "Claude AI",
    metaphor: "Document layers · context systems · analysis paths",
    bullets: [
      "Long-context reasoning practice",
      "Working with documents and structure",
      "Applied analysis workflows",
    ],
    accent: "oklch(0.62 0.19 245)",
    variant: "claude",
  },
  {
    slug: "gemini-ai",
    name: "Gemini AI",
    metaphor: "Multimodal nodes · information connections · synthesis paths",
    bullets: [
      "Working across text and media",
      "Connecting information sources",
      "Applied synthesis practice",
    ],
    accent: "oklch(0.66 0.21 300)",
    variant: "gemini",
  },
];


function GenerativeAISpotlight() {
  const [active, setActive] = React.useState(0);
  const activeProgram = AI_PROGRAMS[active];
  return (
    <Section tone="surface2" padding="lg" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 40% at 20% 20%, oklch(0.78 0.16 175 / 0.10), transparent 60%), radial-gradient(50% 40% at 80% 80%, oklch(0.55 0.24 265 / 0.10), transparent 60%)",
        }}
      />
      <Container>
        <Reveal>
          <div className="max-w-3xl mb-10">
            <div className="text-label text-primary mb-3 inline-flex items-center gap-2">
              <Sparkles className="size-3.5" /> GENERATIVE AI SPOTLIGHT
            </div>
            <h2 className="text-section text-balance">
              Learn to work with the AI systems changing how work gets done.
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <Reveal>
            <div
              key={activeProgram.slug}
              className="relative aspect-square w-full max-w-[560px] overflow-hidden rounded-3xl border border-border/60 bg-background/60 backdrop-blur animate-fade-in"
            >
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(60% 60% at 50% 50%, color-mix(in oklab, ${activeProgram.accent} 14%, transparent), transparent 70%)`,
                }}
              />
              <activeProgram.Graphic accent={activeProgram.accent} />
            </div>
          </Reveal>

          <div className="flex flex-col gap-4">
            <div role="tablist" className="flex flex-wrap gap-2">
              {AI_PROGRAMS.map((p, i) => (
                <button
                  key={p.slug}
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    i === active
                      ? "border-transparent bg-foreground text-background shadow-md"
                      : "border-border bg-background/60 text-foreground/75 hover:border-foreground/40",
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div key={activeProgram.slug} className="animate-fade-in">
              <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                {activeProgram.name}
              </h3>
              <p className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">
                {activeProgram.metaphor}
              </p>
              <ul className="mt-6 space-y-3">
                {activeProgram.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-foreground/85">
                    <span
                      aria-hidden
                      className="mt-2 size-1.5 shrink-0 rounded-full"
                      style={{ background: activeProgram.accent }}
                    />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Button asChild>
                  <Link
                    to="/programs/$category/$course"
                    params={{
                      category: "computer-science",
                      course: activeProgram.slug,
                    }}
                  >
                    Explore Program <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link
                    to="/programs/$category"
                    params={{ category: "computer-science" }}
                  >
                    All AI programs
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 6. Interactive Learning Direction
 * --------------------------------------------------------------------- */

interface DirectionNode {
  id: string;
  label: string;
  paths: {
    label: string;
    to: "/programs/$category" | "/programs/$category/$course";
    params: { category: string; course?: string };
  }[];
}

const DIRECTIONS: DirectionNode[] = [
  {
    id: "ai",
    label: "I want to explore AI",
    paths: [
      { label: "Artificial Intelligence", to: "/programs/$category/$course", params: { category: "computer-science", course: "artificial-intelligence" } },
      { label: "Machine Learning", to: "/programs/$category/$course", params: { category: "computer-science", course: "machine-learning" } },
      { label: "ChatGPT", to: "/programs/$category/$course", params: { category: "computer-science", course: "chatgpt" } },
      { label: "Claude AI", to: "/programs/$category/$course", params: { category: "computer-science", course: "claude-ai" } },
      { label: "Gemini AI", to: "/programs/$category/$course", params: { category: "computer-science", course: "gemini-ai" } },
    ],
  },
  {
    id: "software",
    label: "I want to build digital products",
    paths: [
      { label: "Computer Science programs", to: "/programs/$category", params: { category: "computer-science" } },
    ],
  },
  {
    id: "hardware",
    label: "I want to work with hardware",
    paths: [
      { label: "Electronics & Electrical", to: "/programs/$category", params: { category: "electronics-electrical" } },
    ],
  },
  {
    id: "engineering",
    label: "I want to explore engineering",
    paths: [
      { label: "Mechanical Engineering", to: "/programs/$category", params: { category: "mechanical-engineering" } },
    ],
  },
  {
    id: "business",
    label: "I want to build business skills",
    paths: [
      { label: "Management programs", to: "/programs/$category", params: { category: "management" } },
    ],
  },
];

function LearningDirection() {
  const [active, setActive] = React.useState<string | null>("ai");
  const activeDir = DIRECTIONS.find((d) => d.id === active) ?? null;
  return (
    <Section
      id="learning-direction"
      tone="default"
      padding="lg"
      className="relative overflow-hidden"
    >
      <Container>
        <Reveal>
          <div className="max-w-3xl mb-10">
            <div className="text-label text-primary mb-3 inline-flex items-center gap-2">
              <Compass className="size-3.5" /> LEARNING DIRECTION
            </div>
            <h2 className="text-section text-balance">
              Where do you want to go next?
            </h2>
            <p className="text-subheading mt-4">
              Pick a direction. Glintr will surface the programs and areas that
              match — no forms, no waiting.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-3">
            {DIRECTIONS.map((d) => {
              const isActive = d.id === active;
              return (
                <button
                  key={d.id}
                  onClick={() => setActive(d.id)}
                  className={cn(
                    "group relative flex items-center justify-between gap-4 rounded-2xl border p-5 text-left transition-all",
                    isActive
                      ? "border-foreground/70 bg-surface shadow-lg"
                      : "border-border/60 bg-background hover:border-foreground/40",
                  )}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-full border text-xs font-semibold transition-colors",
                        isActive
                          ? "border-transparent bg-foreground text-background"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {DIRECTIONS.indexOf(d) + 1}
                    </span>
                    <span className="font-medium text-foreground/90">{d.label}</span>
                  </div>
                  <ArrowRight
                    className={cn(
                      "size-4 shrink-0 transition-transform",
                      isActive ? "translate-x-1 text-foreground" : "text-muted-foreground group-hover:translate-x-0.5",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div
            aria-live="polite"
            className="relative min-h-[320px] rounded-3xl border border-border/60 bg-surface p-6 md:p-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background:
                  "radial-gradient(50% 40% at 80% 0%, oklch(0.78 0.16 175 / 0.12), transparent 65%)",
              }}
            />
            <div className="relative">
              {activeDir ? (
                <div key={activeDir.id} className="animate-fade-in">
                  <div className="text-sm uppercase tracking-wider text-muted-foreground">
                    Pathway activated
                  </div>
                  <h3 className="mt-2 font-display text-2xl md:text-3xl font-bold tracking-tight">
                    {activeDir.label}
                  </h3>
                  <div className="mt-6 flex flex-col gap-2">
                    {activeDir.paths.map((p) => (
                      <Link
                        key={p.label}
                        to={p.to}
                        params={p.params as { category: string; course: string }}
                        className="lift-card group flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3"
                      >
                        <span className="font-medium text-foreground/90">{p.label}</span>
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 7. Campus Community (abstract network — no fabricated claims)
 * --------------------------------------------------------------------- */

function CampusCommunity() {
  // Abstract nodes — do NOT name specific institutions.
  const nodes = React.useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        x: (Math.sin(i * 7.31) + 1) * 50,
        y: (Math.cos(i * 4.19) + 1) * 50,
        r: 0.6 + ((i * 13) % 5) * 0.25,
      })),
    [],
  );
  return (
    <Section tone="default" padding="lg" className="relative overflow-hidden">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] items-center">
          <Reveal>
            <div>
              <div className="text-label text-primary mb-3">
                A LEARNING COMMUNITY
              </div>
              <h2 className="text-section text-balance">
                Learners come from different campuses. They build their own
                direction.
              </h2>
              <p className="text-subheading mt-4 max-w-lg">
                Glintr programs are explored by students and independent
                learners representing diverse institutions and backgrounds.
                Every learning direction is personal.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
                {["AI", "Engineering", "Electronics", "Management"].map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-border/60 bg-surface px-4 py-3 text-sm font-medium"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl border border-border/60 bg-surface">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(45% 45% at 30% 40%, oklch(0.78 0.16 175 / 0.12), transparent 60%), radial-gradient(45% 45% at 70% 60%, oklch(0.55 0.24 265 / 0.12), transparent 60%)",
                }}
              />
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                <g stroke="oklch(0.6 0.1 235 / 0.35)" strokeWidth="0.15" fill="none">
                  {nodes.slice(0, 30).map((n, i) => {
                    const target = nodes[(i * 3 + 5) % nodes.length];
                    return (
                      <line
                        key={i}
                        x1={n.x}
                        y1={n.y}
                        x2={target.x}
                        y2={target.y}
                        className={i % 5 === 0 ? "cat-path" : undefined}
                        opacity={i % 5 === 0 ? undefined : 0.35}
                      />
                    );
                  })}
                </g>
                {nodes.map((n, i) => (
                  <circle
                    key={n.id}
                    cx={n.x}
                    cy={n.y}
                    r={n.r}
                    fill="var(--brand-cyan)"
                    className={i % 6 === 0 ? "cat-pulse" : undefined}
                    opacity={0.55 + (i % 4) * 0.1}
                  />
                ))}
              </svg>
              <div className="absolute bottom-4 left-4 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                Abstract network · representative
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 8. Learning Journey
 * --------------------------------------------------------------------- */

const JOURNEY_STAGES = [
  "Discover",
  "Explore",
  "Compare",
  "Choose",
  "Enroll",
  "Learn",
  "Practice",
  "Progress",
  "Complete applicable requirements",
  "Explore what comes next",
];

function LearningJourney() {
  return (
    <Section tone="surface" padding="lg" className="relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="max-w-3xl mb-14">
            <div className="text-label text-primary mb-3">LEARNING JOURNEY</div>
            <h2 className="text-section text-balance">
              From curiosity to a learning direction.
            </h2>
          </div>
        </Reveal>

        <div className="relative">
          {/* Vertical spine */}
          <div
            aria-hidden
            className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--brand-cyan), var(--brand-azure), transparent)",
            }}
          />
          <div className="flex flex-col gap-10 md:gap-14">
            {JOURNEY_STAGES.map((stage, i) => (
              <Reveal key={stage} delay={i * 60}>
                <div
                  className={cn(
                    "relative grid md:grid-cols-2 items-center gap-6",
                    i % 2 === 1 && "md:[&>*:first-child]:order-2",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-4",
                      "md:justify-end",
                      i % 2 === 1 && "md:justify-start",
                    )}
                  >
                    <div className="hidden md:block text-6xl font-display font-bold text-foreground/10 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "relative rounded-2xl border border-border/60 bg-background p-5 md:p-6 shadow-sm ml-14 md:ml-0",
                    )}
                  >
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Stage {i + 1}
                    </div>
                    <div className="mt-1 font-display text-xl md:text-2xl font-semibold">
                      {stage}
                    </div>
                  </div>
                  {/* Node on spine */}
                  <div
                    aria-hidden
                    className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 grid size-4 place-items-center rounded-full bg-background border-2 border-[var(--brand-cyan)]"
                  >
                    <span className="size-1.5 rounded-full bg-[var(--brand-cyan)] cat-pulse" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 9. Skills & Program Network
 * --------------------------------------------------------------------- */

const SKILL_HUBS = [
  {
    id: "ai",
    label: "AI",
    color: "var(--brand-cyan)",
    programs: [
      { slug: "artificial-intelligence", name: "Artificial Intelligence" },
      { slug: "machine-learning", name: "Machine Learning" },
      { slug: "chatgpt", name: "ChatGPT" },
      { slug: "claude-ai", name: "Claude AI" },
      { slug: "gemini-ai", name: "Gemini AI" },
    ],
    category: "computer-science",
  },
  {
    id: "software",
    label: "Software",
    color: "var(--brand-azure)",
    programs: [{ slug: undefined, name: "Web & App development" }],
    category: "computer-science",
  },
  {
    id: "electronics",
    label: "Electronics",
    color: "var(--brand-royal)",
    programs: [
      { slug: undefined, name: "VLSI" },
      { slug: undefined, name: "Embedded Systems" },
      { slug: undefined, name: "IoT" },
    ],
    category: "electronics-electrical",
  },
  {
    id: "engineering",
    label: "Engineering",
    color: "var(--brand-lime)",
    programs: [{ slug: undefined, name: "Mechanical programs" }],
    category: "mechanical-engineering",
  },
  {
    id: "business",
    label: "Business",
    color: "var(--brand-violet)",
    programs: [{ slug: undefined, name: "Management programs" }],
    category: "management",
  },
] as const;

function SkillsNetwork() {
  const [active, setActive] = React.useState<string>("ai");
  const activeHub = SKILL_HUBS.find((h) => h.id === active)!;
  return (
    <Section tone="default" padding="lg" className="relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="max-w-3xl mb-10">
            <div className="text-label text-primary mb-3 inline-flex items-center gap-2">
              <Network className="size-3.5" /> SKILLS NETWORK
            </div>
            <h2 className="text-section text-balance">
              Skills do not exist in isolation.
            </h2>
            <p className="text-subheading mt-4">
              Explore how programs and learning areas connect across the
              Glintr ecosystem.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-center">
          <div className="relative aspect-square w-full max-w-[560px] mx-auto">
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
              <circle cx="100" cy="100" r="70" fill="none" stroke="oklch(0.7 0.05 240 / 0.25)" strokeWidth="0.3" strokeDasharray="1 2" className="cat-rotate-slow" />
              {SKILL_HUBS.map((h, i) => {
                const angle = (i / SKILL_HUBS.length) * Math.PI * 2 - Math.PI / 2;
                const x = 100 + Math.cos(angle) * 70;
                const y = 100 + Math.sin(angle) * 70;
                const isActive = h.id === active;
                return (
                  <g key={h.id}>
                    <line
                      x1="100"
                      y1="100"
                      x2={x}
                      y2={y}
                      stroke={h.color}
                      strokeWidth={isActive ? 1 : 0.4}
                      opacity={isActive ? 0.9 : 0.35}
                      className={isActive ? "cat-path" : undefined}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 6 : 4}
                      fill={h.color}
                      className="cursor-pointer"
                      onClick={() => setActive(h.id)}
                      style={{ transition: "r 0.3s" }}
                    />
                    <text
                      x={x}
                      y={y + 12}
                      textAnchor="middle"
                      fontSize="4"
                      fontWeight="600"
                      fill="currentColor"
                      className="pointer-events-none select-none"
                    >
                      {h.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 -m-6 rounded-full blur-2xl"
                  style={{ background: "radial-gradient(circle, oklch(0.78 0.16 175 / 0.35), transparent 70%)" }}
                />
                <img src={mark.url} alt="" className="relative h-16 w-16 object-contain" />
              </div>
            </div>
          </div>

          <div>
            <div role="tablist" className="flex flex-wrap gap-2 mb-6">
              {SKILL_HUBS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setActive(h.id)}
                  aria-selected={h.id === active}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                    h.id === active
                      ? "border-transparent bg-foreground text-background"
                      : "border-border bg-surface text-foreground/70 hover:border-foreground/40",
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
            <div key={active} className="animate-fade-in space-y-2">
              {activeHub.programs.map((p) =>
                p.slug ? (
                  <Link
                    key={p.name}
                    to="/programs/$category/$course"
                    params={{ category: activeHub.category, course: p.slug }}
                    className="lift-card group flex items-center justify-between rounded-xl border border-border/60 bg-surface px-4 py-3"
                  >
                    <span className="font-medium">{p.name}</span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link
                    key={p.name}
                    to="/programs/$category"
                    params={{ category: activeHub.category }}
                    className="lift-card group flex items-center justify-between rounded-xl border border-border/60 bg-surface px-4 py-3"
                  >
                    <span className="font-medium">{p.name}</span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 10. Why Glintr — editorial flow
 * --------------------------------------------------------------------- */

const WHY_THEMES = [
  { title: "Explore focused programs", body: "Curated learning across CS, electronics, mechanical and management." },
  { title: "Understand learning directions", body: "See how skills connect before you commit to a path." },
  { title: "Learn through structured experiences", body: "Modules, lessons and progress designed with intent." },
  { title: "Explore practical concepts", body: "Applied learning that meets how modern work is actually done." },
  { title: "Track applicable learning progress", body: "Progress, assessments and requirements — all in one place." },
  { title: "Build across modern skill areas", body: "From generative AI to product, marketing and beyond." },
];

function WhyGlintr() {
  return (
    <Section tone="surface2" padding="lg" className="relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="max-w-3xl mb-14">
            <div className="text-label text-primary mb-3">WHY GLINTR?</div>
            <h2 className="text-section text-balance">
              A learning platform built for the way real skills develop.
            </h2>
          </div>
        </Reveal>

        <div className="relative grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {WHY_THEMES.map((t, i) => (
            <Reveal key={t.title} delay={i * 60}>
              <div className="relative pl-14">
                <span className="absolute left-0 top-0 font-display text-4xl font-bold text-foreground/15 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl font-semibold">{t.title}</h3>
                <p className="mt-2 text-muted-foreground">{t.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 11. Earn With Us
 * --------------------------------------------------------------------- */

function EarnWithUs() {
  return (
    <Section tone="default" padding="lg" className="relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="max-w-3xl mb-12">
            <div className="text-label text-primary mb-3 inline-flex items-center gap-2">
              <Wallet className="size-3.5" /> EARN WITH US
            </div>
            <h2 className="text-section text-balance">
              Learning is one path. Building an income channel can be another.
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-3">
          {[
            {
              title: "Become a Partner",
              body: "Join the Glintr partner network and start representing programs.",
              cta: "See how it works",
              to: "/earn" as const,
              Icon: Users,
              accent: "var(--brand-cyan)",
            },
            {
              title: "70% Revenue Model",
              body: "Bring your own leads. Keep 70% of eligible revenue on every successful sale.",
              cta: "See the 70% model",
              to: "/70-revenue-model" as const,
              Icon: TrendingUp,
              accent: "var(--brand-lime)",
            },
            {
              title: "50% Supported Model",
              body: "Sell using platform-supported leads with a 50% eligible revenue share.",
              cta: "See the 50% model",
              to: "/50-supported-model" as const,
              Icon: Target,
              accent: "var(--brand-azure)",
            },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 80}>
              <Link
                to={c.to}
                className="lift-card group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border/60 bg-surface p-6 md:p-8"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(50% 45% at 100% 0%, color-mix(in oklab, ${c.accent} 22%, transparent), transparent 60%)`,
                  }}
                />
                <div className="relative">
                  <div
                    className="grid size-11 place-items-center rounded-xl border border-border/60 bg-background/60"
                    style={{ color: c.accent }}
                  >
                    <c.Icon className="size-5" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold">{c.title}</h3>
                  <p className="mt-2 text-muted-foreground">{c.body}</p>
                </div>
                <div className="relative mt-8 inline-flex items-center gap-2 text-sm font-medium">
                  {c.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Lead assignment on the 50% Supported Model is based on applicable
          performance, qualification, eligibility and lead availability. No
          leads are guaranteed.
        </p>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 12. Revenue Visual Story
 * --------------------------------------------------------------------- */

function RevenueStory() {
  return (
    <Section tone="surface" padding="lg" className="relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="max-w-3xl mb-14">
            <div className="text-label text-primary mb-3">REVENUE VISUAL STORY</div>
            <h2 className="text-section text-balance">
              Where the money flows when a sale is eligible.
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-2">
          {[
            { label: "70% MODEL", partner: 70, glintr: 30, note: "Bring your own leads.", accent: "var(--brand-lime)", to: "/70-revenue-model" as const },
            { label: "50% SUPPORTED MODEL", partner: 50, glintr: 50, note: "Platform-supported leads (performance-based assignment).", accent: "var(--brand-azure)", to: "/50-supported-model" as const },
          ].map((m) => (
            <Reveal key={m.label}>
              <div className="rounded-3xl border border-border/60 bg-background p-6 md:p-8">
                <div className="text-xs font-semibold tracking-wider text-muted-foreground">
                  {m.label}
                </div>
                <div className="mt-4 font-display text-4xl md:text-5xl font-bold tabular-nums">
                  ₹1,00,000
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    eligible revenue
                  </span>
                </div>

                <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${m.partner}%`,
                      background: `linear-gradient(90deg, ${m.accent}, color-mix(in oklab, ${m.accent} 60%, white))`,
                    }}
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Partner share</div>
                    <div className="mt-1 font-display text-3xl font-bold tabular-nums">
                      ₹{(m.partner * 1000).toLocaleString("en-IN")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {m.partner}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Glintr share</div>
                    <div className="mt-1 font-display text-3xl font-bold tabular-nums">
                      ₹{(m.glintr * 1000).toLocaleString("en-IN")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {m.glintr}%
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-sm text-muted-foreground">{m.note}</p>
                <Button variant="ghost" className="mt-4 px-0" asChild>
                  <Link to={m.to}>
                    See the model <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 13. Launch Your Brand — brand assembly flow
 * --------------------------------------------------------------------- */

const LAUNCH_STAGES = [
  { key: "idea", label: "Idea", Icon: Sparkles },
  { key: "brand", label: "Brand", Icon: Store },
  { key: "programs", label: "Programs", Icon: BookOpen },
  { key: "learning", label: "Learning", Icon: GraduationCap },
  { key: "lms", label: "LMS", Icon: Layers },
  { key: "experience", label: "Student Experience", Icon: Users },
  { key: "growth", label: "Growth", Icon: TrendingUp },
  { key: "launch", label: "Launch", Icon: Rocket },
];

function LaunchYourBrand() {
  return (
    <Section tone="default" padding="lg" className="relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="max-w-3xl mb-14">
            <div className="text-label text-primary mb-3 inline-flex items-center gap-2">
              <Rocket className="size-3.5" /> LAUNCH YOUR BRAND
            </div>
            <h2 className="text-section text-balance">
              Build more than a course. Explore an education brand.
            </h2>
          </div>
        </Reveal>

        <div className="relative">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--brand-cyan), var(--brand-azure), var(--brand-violet), transparent)",
            }}
          />
          <div className="relative grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {LAUNCH_STAGES.map((s, i) => (
              <Reveal key={s.key} delay={i * 50}>
                <div className="flex flex-col items-center text-center">
                  <div className="grid size-12 place-items-center rounded-full border-2 border-[var(--brand-cyan)] bg-background text-foreground shadow-sm">
                    <s.Icon className="size-5" />
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                    Stage {i + 1}
                  </div>
                  <div className="text-sm font-semibold">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "White Label EdTech", to: "/white-label-edtech" as const },
            { label: "Brand Setup", to: "/brand-setup" as const },
            { label: "LMS", to: "/lms" as const },
            { label: "Marketing Support", to: "/marketing-support" as const },
            { label: "Book Consultation", to: "/book-consultation" as const },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="lift-card group flex items-center justify-between rounded-2xl border border-border/60 bg-surface px-4 py-4"
            >
              <span className="font-medium">{l.label}</span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 14. Glintr Ecosystem visual
 * --------------------------------------------------------------------- */

const ECOSYSTEM = {
  learn: {
    title: "LEARN",
    color: "var(--brand-cyan)",
    Icon: BookOpen,
    items: ["Programs", "Lessons", "Progress", "Assessments", "Certificates where applicable"],
  },
  earn: {
    title: "EARN",
    color: "var(--brand-lime)",
    Icon: Wallet,
    items: ["Become a Partner", "70% Revenue Model", "50% Supported Model", "Campus Ambassador"],
  },
  build: {
    title: "BUILD",
    color: "var(--brand-violet)",
    Icon: Rocket,
    items: ["White Label EdTech", "Brand Setup", "LMS", "Marketing Support"],
  },
} as const;

function GlintrEcosystem() {
  const [active, setActive] = React.useState<keyof typeof ECOSYSTEM>("learn");
  const a = ECOSYSTEM[active];
  return (
    <Section tone="surface2" padding="lg" className="relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="max-w-3xl mb-10">
            <div className="text-label text-primary mb-3">GLINTR PLATFORM</div>
            <h2 className="text-section text-balance">
              One ecosystem. Multiple journeys.
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] items-center">
          <div className="relative aspect-square w-full max-w-[520px] mx-auto">
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
              {(Object.keys(ECOSYSTEM) as Array<keyof typeof ECOSYSTEM>).map(
                (key, i, arr) => {
                  const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
                  const x = 100 + Math.cos(angle) * 70;
                  const y = 100 + Math.sin(angle) * 70;
                  const isA = key === active;
                  return (
                    <g key={key}>
                      <line
                        x1="100"
                        y1="100"
                        x2={x}
                        y2={y}
                        stroke={ECOSYSTEM[key].color}
                        strokeWidth={isA ? 1.2 : 0.4}
                        opacity={isA ? 0.9 : 0.3}
                        className={isA ? "cat-path" : undefined}
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={isA ? 10 : 7}
                        fill={ECOSYSTEM[key].color}
                        opacity={isA ? 1 : 0.65}
                        className="cursor-pointer"
                        onClick={() => setActive(key)}
                        style={{ transition: "all 0.3s" }}
                      />
                      <text
                        x={x}
                        y={y + 1.5}
                        textAnchor="middle"
                        fontSize="4"
                        fontWeight="700"
                        fill="white"
                        className="pointer-events-none select-none"
                      >
                        {ECOSYSTEM[key].title}
                      </text>
                    </g>
                  );
                },
              )}
            </svg>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <img src={mark.url} alt="" className="h-14 w-14 object-contain" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(ECOSYSTEM) as Array<keyof typeof ECOSYSTEM>).map((k) => (
                <button
                  key={k}
                  onClick={() => setActive(k)}
                  aria-selected={k === active}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-semibold tracking-wider transition-all",
                    k === active
                      ? "border-transparent bg-foreground text-background"
                      : "border-border bg-background text-foreground/70 hover:border-foreground/40",
                  )}
                >
                  {ECOSYSTEM[k].title}
                </button>
              ))}
            </div>
            <div key={active} className="animate-fade-in">
              <div className="inline-flex items-center gap-2 text-label" style={{ color: a.color }}>
                <a.Icon className="size-4" /> {a.title}
              </div>
              <ul className="mt-4 space-y-2">
                {a.items.map((i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3"
                  >
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full"
                      style={{ background: a.color }}
                    />
                    <span className="font-medium">{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 15. Glintr By The Numbers (real data only)
 * --------------------------------------------------------------------- */

function GlintrNumbers() {
  return (
    <Section tone="default" padding="lg" className="relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="max-w-3xl mb-12">
            <div className="text-label text-primary mb-3">GLINTR BY THE NUMBERS</div>
            <h2 className="text-section text-balance">
              A learning ecosystem, in real numbers.
            </h2>
          </div>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: 29, l: "Published programs" },
            { n: 4, l: "Program categories" },
            { n: 3, l: "Ways to grow with Glintr" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 80}>
              <div className="rounded-3xl border border-border/60 bg-surface p-8">
                <div className="font-display text-6xl md:text-7xl font-bold tabular-nums tracking-tight">
                  {s.n}
                </div>
                <div className="mt-2 text-muted-foreground">{s.l}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * 16. Final Brand Statement + Pre-footer pathways
 * --------------------------------------------------------------------- */

function FinalBrandStatement() {
  return (
    <Section tone="default" padding="lg" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, oklch(0.78 0.16 175 / 0.14), transparent 60%), radial-gradient(50% 50% at 50% 90%, oklch(0.55 0.24 265 / 0.14), transparent 60%)",
        }}
      />
      <Container size="lg">
        <div className="relative flex flex-col items-center text-center">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -m-10 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.78 0.16 175 / 0.35), transparent 70%)",
              }}
            />
            <img src={mark.url} alt="Glintr" className="relative h-24 w-24 object-contain" />
          </div>
          <h2 className="mt-8 font-display text-4xl md:text-6xl font-bold tracking-tight text-balance">
            The next skill can change your direction.
          </h2>
          <p className="mt-6 text-subheading max-w-2xl">
            Explore what you want to learn, build and grow with Glintr.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="gradient" size="lg" asChild>
              <Link to="/programs">
                Explore Programs <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#learning-direction">Find My Learning Direction</a>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/earn">
                Start Earning <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function PreFooterPathways() {
  const paths = [
    { key: "learn", label: "LEARN", body: "Explore programs", to: "/programs" as const, Icon: BookOpen, color: "var(--brand-cyan)" },
    { key: "earn", label: "EARN", body: "Become a partner", to: "/earn" as const, Icon: Wallet, color: "var(--brand-lime)" },
    { key: "build", label: "BUILD", body: "Launch your brand", to: "/launch-your-brand" as const, Icon: Rocket, color: "var(--brand-violet)" },
  ];
  return (
    <Section tone="surface" padding="lg" className="relative overflow-hidden">
      <Container>
        <div className="grid gap-5 md:grid-cols-3">
          {paths.map((p, i) => (
            <Reveal key={p.key} delay={i * 80}>
              <Link
                to={p.to}
                className="lift-card group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border/60 bg-background p-8"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(60% 60% at 0% 100%, color-mix(in oklab, ${p.color} 22%, transparent), transparent 60%)`,
                  }}
                />
                <div className="relative">
                  <div
                    className="grid size-11 place-items-center rounded-xl border border-border/60 bg-surface"
                    style={{ color: p.color }}
                  >
                    <p.Icon className="size-5" />
                  </div>
                  <div className="mt-6 text-xs font-semibold tracking-widest text-muted-foreground">
                    {p.label}
                  </div>
                  <div className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight">
                    {p.body}
                  </div>
                </div>
                <div className="relative mt-10 inline-flex items-center gap-2 text-sm font-medium">
                  Continue <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- *
 * Divider — motion graphic between major sections
 * --------------------------------------------------------------------- */

function MotionDivider({ variant = "line" }: { variant?: "line" | "nodes" }) {
  return (
    <div aria-hidden className="relative h-16 overflow-hidden">
      <svg viewBox="0 0 1200 60" className="absolute inset-0 h-full w-full">
        {variant === "line" ? (
          <path
            d="M0 30 Q 300 0 600 30 T 1200 30"
            stroke="var(--brand-cyan)"
            strokeOpacity="0.4"
            strokeWidth="1"
            fill="none"
            className="cat-path"
          />
        ) : (
          <>
            {Array.from({ length: 40 }).map((_, i) => (
              <circle
                key={i}
                cx={i * 30 + 15}
                cy={30}
                r="1.2"
                fill="var(--brand-azure)"
                opacity={0.15 + (i % 5) * 0.15}
                className={i % 7 === 0 ? "cat-pulse" : undefined}
              />
            ))}
          </>
        )}
      </svg>
    </div>
  );
}

/* --------------------------------------------------------------------- *
 * Page assembly
 * --------------------------------------------------------------------- */

export function PremiumHomepage() {
  return (
    <>
      <HeroUniverse />
      <ThreeJourneys />
      <MotionStatement />
      <EarnSpotlight />
      <TechnologyLandscape />
      <MotionDivider variant="line" />
      <ProgramUniverse />
      <GenerativeAISpotlight />
      <LearningDirection />
      <MotionDivider variant="nodes" />
      <CampusCommunity />
      <LearningJourney />
      <SkillsNetwork />
      <WhyGlintr />
      <MotionDivider variant="line" />
      <EarnWithUs />
      <RevenueStory />
      <LaunchYourBrand />
      <GlintrEcosystem />
      <GlintrNumbers />
      <FinalBrandStatement />
      <PreFooterPathways />
    </>
  );
}
