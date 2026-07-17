/**
 * Dimensional homepage sections (v2 visual upgrade).
 *
 *  - ThreeJourneys   : LEARN / EARN / BUILD spatial pathway system.
 *  - EarnSpotlight   : dimensional 70% / 50% revenue system with a
 *                      deterministic mini revenue-share calculator.
 *
 *  Everything uses CSS 3D perspective, layered gradients, SVG depth,
 *  and existing motion utilities. No WebGL. Respects reduced motion.
 *  No revenue-model logic changes — 70% is exactly 70%, 50% is exactly 50%.
 */
import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Rocket,
  TrendingUp,
  Wallet,
  Target,
  BadgeIndianRupee,
  Sparkles,
} from "lucide-react";

import { Container, Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-motion";
import { partnerEarningsCopy } from "@/data/partner-earnings-copy";

/* --------------------------------------------------------------------- *
 * Shared: reveal-on-scroll helper (kept local to avoid a circular import)
 * --------------------------------------------------------------------- */

function useInView<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

/* --------------------------------------------------------------------- *
 * Section A. Three Journeys — LEARN / EARN / BUILD
 * --------------------------------------------------------------------- */

type JourneyKey = "learn" | "earn" | "build";

interface JourneyDef {
  key: JourneyKey;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const JOURNEYS: JourneyDef[] = [
  {
    key: "learn",
    label: "LEARN",
    eyebrow: "BUILD SKILLS",
    title: "Career-ready programs across AI, engineering and management.",
    body:
      "Study practical, mentor-led programs designed for the technologies shaping work today.",
    cta: "Explore Programs",
    to: "/programs",
    Icon: GraduationCap,
    accent: "var(--brand-cyan)",
  },
  {
    key: "earn",
    label: "EARN",
    eyebrow: "BUILD A REVENUE CHANNEL",
    title: "Turn your network and sales ability into a revenue channel.",
    body:
      "Represent eligible programs as a Partner. Choose the 70% model or the 50% Supported model.",
    cta: partnerEarningsCopy.cta.primary,
    to: "/earn",
    Icon: Wallet,
    accent: "var(--brand-lime)",
  },
  {
    key: "build",
    label: "BUILD",
    eyebrow: "LAUNCH AN EDUCATION BRAND",
    title: "Launch your own EdTech brand on Glintr infrastructure.",
    body:
      "Your brand, your website, your LMS, your programs — powered by Glintr's learning and business system.",
    cta: "Launch Your Brand",
    to: "/launch-your-brand",
    Icon: Rocket,
    accent: "var(--brand-violet)",
  },
];

export function ThreeJourneys() {
  const [active, setActive] = React.useState<JourneyKey>("learn");
  const { ref, visible } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="surface" padding="lg" className="relative overflow-hidden">
      {/* Ambient depth field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 15% 10%, oklch(0.78 0.16 175 / 0.10), transparent 60%), radial-gradient(50% 55% at 85% 20%, oklch(0.62 0.19 245 / 0.10), transparent 60%), radial-gradient(60% 60% at 50% 100%, oklch(0.82 0.22 140 / 0.08), transparent 60%)",
        }}
      />

      <Container>
        <div ref={ref} className="max-w-3xl mb-10">
          <div className="text-label text-primary mb-3 inline-flex items-center gap-2">
            <Sparkles className="size-3.5" /> THREE JOURNEYS · ONE PLATFORM
          </div>
          <h2 className="text-section text-balance">
            There is more than one way to grow with Glintr.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Learn a skill. Earn a revenue share. Or launch an education brand
            of your own. Pick the pathway that matches how you want to grow.
          </p>
        </div>

        {/* Journey switcher */}
        <div
          role="tablist"
          aria-label="Choose a Glintr journey"
          className="flex flex-wrap gap-2 mb-8"
        >
          {JOURNEYS.map((j) => {
            const isActive = active === j.key;
            return (
              <button
                key={j.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(j.key)}
                className={cn(
                  "group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "border-transparent text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.19_245/0.45)]"
                    : "border-border/70 bg-background/60 text-foreground hover:border-primary/40",
                )}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(120deg, ${j.accent}, color-mix(in oklab, ${j.accent} 55%, oklch(0.62 0.19 245)))`,
                      }
                    : undefined
                }
              >
                <j.Icon className="size-4" />
                {j.label}
              </button>
            );
          })}
        </div>

        {/* Dimensional pathway stage */}
        <div
          className="persp-scene relative rounded-[28px] border border-border/50 bg-background/40 p-4 sm:p-6"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.99 0.01 240 / 0.7), oklch(0.98 0.01 240 / 0.4))",
          }}
        >
          {/* Desktop / tablet: full grid (unchanged) */}
          <div className="hidden md:grid gap-4 lg:grid-cols-3">
            {JOURNEYS.map((j, i) => {
              const isActive = active === j.key;
              return (
                <JourneyCard
                  key={j.key}
                  journey={j}
                  index={i}
                  active={isActive}
                  visible={visible}
                  reduced={reduced}
                  onActivate={() => setActive(j.key)}
                />
              );
            })}
          </div>

          {/* Mobile: single active card with swipe + fade/slide */}
          <MobileJourneyStage
            active={active}
            setActive={setActive}
            visible={visible}
            reduced={reduced}
          />
        </div>
      </Container>
    </Section>
  );
}

function MobileJourneyStage({
  active,
  setActive,
  visible,
  reduced,
}: {
  active: JourneyKey;
  setActive: (k: JourneyKey) => void;
  visible: boolean;
  reduced: boolean;
}) {
  const activeIndex = JOURNEYS.findIndex((j) => j.key === active);
  const journey = JOURNEYS[activeIndex];
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);

  const go = React.useCallback(
    (next: JourneyKey) => {
      if (next !== active) setActive(next);
    },
    [active, setActive],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchStart.current;
    touchStart.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    const idx = JOURNEYS.findIndex((j) => j.key === active);
    if (dx < 0 && idx < JOURNEYS.length - 1) go(JOURNEYS[idx + 1].key);
    if (dx > 0 && idx > 0) go(JOURNEYS[idx - 1].key);
  };

  return (
    <div
      className="md:hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        key={journey.key}
        className={cn("animate-fade-in", reduced && "animate-none")}
      >
        <JourneyCard
          journey={journey}
          index={0}
          active
          visible={visible}
          reduced={reduced}
          onActivate={() => {}}
        />
      </div>
      <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
        {JOURNEYS.map((j) => (
          <span
            key={j.key}
            className={cn(
              "h-1.5 rounded-full transition-all",
              j.key === active ? "w-6 bg-primary" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function JourneyCard({
  journey,
  index,
  active,
  visible,
  reduced,
  onActivate,
}: {
  journey: JourneyDef;
  index: number;
  active: boolean;
  visible: boolean;
  reduced: boolean;
  onActivate: () => void;
}) {
  const shift = reduced ? 0 : active ? 22 : -6;
  return (
    <div
      onMouseEnter={() => !reduced && onActivate()}
      onFocus={() => onActivate()}
      className="depth-lift group relative overflow-hidden rounded-3xl border border-border/60 bg-background p-5 sm:p-6 md:p-7"
      style={{
        transform: `translateZ(${shift}px)`,
        transition: "transform .55s cubic-bezier(.2,.7,.2,1), box-shadow .4s ease",
        boxShadow: active
          ? `0 30px 80px -30px color-mix(in oklab, ${journey.accent} 60%, transparent)`
          : "0 8px 24px -18px oklch(0.4 0.02 240 / 0.35)",
        opacity: visible ? 1 : 0,
        transitionDelay: `${index * 60}ms`,
      }}
    >
      {/* Perspective backdrop pathway */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(55% 45% at 100% 0%, color-mix(in oklab, ${journey.accent} 22%, transparent), transparent 60%), radial-gradient(60% 50% at 0% 100%, color-mix(in oklab, ${journey.accent} 14%, transparent), transparent 60%)`,
          }}
        />
        <svg
          viewBox="0 0 400 240"
          className="absolute inset-0 h-full w-full opacity-70"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`jg-${journey.key}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor={journey.accent} stopOpacity="0.35" />
              <stop offset="100%" stopColor={journey.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((k) => (
            <path
              key={k}
              d={`M -40 ${60 + k * 40} C 120 ${20 + k * 40}, 260 ${
                140 - k * 20
              }, 440 ${80 + k * 30}`}
              fill="none"
              stroke={`url(#jg-${journey.key})`}
              strokeWidth={1.25}
            />
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="grid size-12 place-items-center rounded-2xl border border-border/60 bg-background/70"
          style={{ color: journey.accent }}
        >
          <journey.Icon className="size-5" />
        </div>
        <div className="text-label" style={{ color: journey.accent }}>
          {journey.label}
        </div>
      </div>

      <div className="mt-5 text-xs font-bold tracking-wider text-muted-foreground">
        {journey.eyebrow}
      </div>
      <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold leading-tight text-balance">
        {journey.title}
      </h3>
      <p className="mt-3 text-muted-foreground">{journey.body}</p>

      <Button
        variant={active ? "gradient" : "outline"}
        size="md"
        className="mt-6"
        asChild
      >
        <Link to={journey.to as never}>
          {journey.cta} <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

/* --------------------------------------------------------------------- *
 * Section B. Earn Spotlight — dimensional revenue system + mini calc
 * --------------------------------------------------------------------- */

const AMOUNT_PRESETS = [25000, 50000, 100000, 200000, 500000];

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatINR(n: number) {
  return INR.format(Math.max(0, Math.round(n)));
}

type ModelKey = 70 | 50;

export function EarnSpotlight() {
  const [amount, setAmount] = React.useState<number>(100000);
  const [model, setModel] = React.useState<ModelKey>(70);
  const reduced = usePrefersReducedMotion();

  const partner = Math.round((amount * model) / 100);
  const glintr = amount - partner;

  return (
    <Section
      id="earn-spotlight"
      tone="default"
      padding="lg"
      className="relative overflow-hidden"
    >
      {/* Deep ambient field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 50% at 20% 10%, oklch(0.82 0.22 140 / 0.10), transparent 60%), radial-gradient(55% 50% at 85% 10%, oklch(0.62 0.19 245 / 0.10), transparent 60%), radial-gradient(60% 60% at 50% 100%, oklch(0.78 0.16 175 / 0.08), transparent 60%)",
        }}
      />

      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {/* Left — copy + model selector */}
          <div>
            <div className="text-label text-primary mb-3 inline-flex items-center gap-2">
              <Wallet className="size-3.5" /> EARN WITH GLINTR
            </div>
            <h2 className="text-section text-balance">
              Turn your network and sales ability into a revenue channel.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">
              Explore Glintr's Partner models. Sell eligible career-focused
              programs and earn through successful applicable sales.
            </p>

            <div
              role="tablist"
              aria-label="Choose a revenue-share model"
              className="mt-8 inline-flex rounded-full border border-border/70 bg-background p-1"
            >
              {[70, 50].map((m) => {
                const active = model === m;
                return (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setModel(m as ModelKey)}
                    className={cn(
                      "relative rounded-full px-5 py-2 text-sm font-bold transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    style={
                      active
                        ? {
                            background:
                              m === 70
                                ? "linear-gradient(120deg, var(--brand-lime), color-mix(in oklab, var(--brand-lime) 55%, var(--brand-cyan)))"
                                : "linear-gradient(120deg, var(--brand-azure), color-mix(in oklab, var(--brand-azure) 55%, var(--brand-violet)))",
                          }
                        : undefined
                    }
                  >
                    {m}% {m === 70 ? "Model" : "Supported Model"}
                  </button>
                );
              })}
            </div>

            {model === 50 ? (
              <ul className="mt-6 grid gap-2 text-sm text-muted-foreground max-w-md">
                <li className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[var(--brand-azure)]" />
                  Supported opportunities where available
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[var(--brand-azure)]" />
                  CRM tools and sales resources
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[var(--brand-azure)]" />
                  Performance-based lead assignment
                </li>
              </ul>
            ) : (
              <ul className="mt-6 grid gap-2 text-sm text-muted-foreground max-w-md">
                <li className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[var(--brand-lime)]" />
                  Bring your own leads and network
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[var(--brand-lime)]" />
                  Highest revenue share tier
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[var(--brand-lime)]" />
                  Own the customer relationship
                </li>
              </ul>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="gradient" size="lg" className="cta-earn rounded-full" asChild>
                <Link to="/earn">
                  <Sparkles className="size-4" />
                  <span className="relative z-10">{partnerEarningsCopy.cta.primary}</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link
                  to={
                    model === 70
                      ? "/70-revenue-model"
                      : "/50-supported-model"
                  }
                >
                  See the {model}% model <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — dimensional revenue block + mini calculator */}
          <div className="persp-scene">
            <div
              className="preserve-3d relative rounded-[32px] border border-border/60 bg-surface p-6 md:p-8"
              style={{
                boxShadow:
                  "0 40px 100px -40px oklch(0.62 0.19 245 / 0.35), 0 20px 60px -30px oklch(0.82 0.22 140 / 0.25)",
                transform: reduced ? undefined : "rotateX(6deg) rotateY(-4deg)",
              }}
            >
              {/* Revenue core */}
              <div className="relative">
                <div className="text-xs font-semibold tracking-wider text-muted-foreground">
                  ELIGIBLE REVENUE
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <BadgeIndianRupee className="size-6 text-primary" />
                  <div className="font-display text-4xl md:text-5xl font-bold tabular-nums">
                    {formatINR(amount)}
                  </div>
                </div>

                {/* Amount presets */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {AMOUNT_PRESETS.map((v) => {
                    const active = v === amount;
                    return (
                      <button
                        key={v}
                        onClick={() => setAmount(v)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/70 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {formatINR(v)}
                      </button>
                    );
                  })}
                </div>

                {/* Slider */}
                <label className="mt-5 block">
                  <span className="sr-only">Choose eligible revenue amount</span>
                  <input
                    type="range"
                    min={10000}
                    max={1000000}
                    step={5000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full accent-[var(--brand-azure)]"
                    aria-label="Eligible revenue amount"
                  />
                </label>
              </div>

              {/* Split rails */}
              <div className="relative mt-8 h-4 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
                  style={{
                    width: `${model}%`,
                    background:
                      model === 70
                        ? "linear-gradient(90deg, var(--brand-lime), color-mix(in oklab, var(--brand-lime) 65%, white))"
                        : "linear-gradient(90deg, var(--brand-azure), color-mix(in oklab, var(--brand-azure) 65%, white))",
                  }}
                />
                <div
                  aria-hidden
                  className="absolute inset-y-0 right-0 transition-all duration-500 ease-out"
                  style={{
                    width: `${100 - model}%`,
                    background:
                      "linear-gradient(90deg, oklch(0.9 0.02 240), oklch(0.82 0.03 240))",
                  }}
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <RevenuePlane
                  label="Partner share"
                  percent={model}
                  amount={partner}
                  accent={
                    model === 70 ? "var(--brand-lime)" : "var(--brand-azure)"
                  }
                  featured
                />
                <RevenuePlane
                  label="Glintr share"
                  percent={100 - model}
                  amount={glintr}
                  accent="oklch(0.75 0.02 240)"
                />
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                Illustrative revenue-share calculation. Actual earnings depend
                on successful eligible sales and applicable policies.
                {model === 50
                  ? " Lead assignment on the 50% Supported model depends on applicable performance, qualification, eligibility and lead availability. No leads are guaranteed."
                  : ""}
              </p>

              <div className="mt-6">
                <Button variant="ghost" className="px-0" asChild>
                  <Link to="/income-calculator">
                    Explore full income calculator{" "}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              {/* Floating dimensional percentage badge */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-6 -right-6 hidden md:block"
                style={{ transform: reduced ? undefined : "translateZ(60px)" }}
              >
                <div
                  className="grid size-28 place-items-center rounded-3xl border border-border/60 bg-background/95 shadow-2xl"
                  style={{
                    boxShadow:
                      "0 30px 80px -20px color-mix(in oklab, var(--brand-azure) 40%, transparent)",
                  }}
                >
                  <div
                    className="font-display text-5xl font-black leading-none tabular-nums"
                    style={{
                      background:
                        model === 70
                          ? "linear-gradient(135deg, var(--brand-lime), var(--brand-cyan))"
                          : "linear-gradient(135deg, var(--brand-azure), var(--brand-violet))",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {model}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function RevenuePlane({
  label,
  percent,
  amount,
  accent,
  featured,
}: {
  label: string;
  percent: number;
  amount: number;
  accent: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 md:p-5 transition-all",
        featured
          ? "border-transparent"
          : "border-border/60 bg-background/60",
      )}
      style={
        featured
          ? {
              background: `linear-gradient(160deg, color-mix(in oklab, ${accent} 18%, oklch(0.99 0.01 240)), oklch(0.99 0.01 240))`,
              boxShadow: `0 20px 50px -25px color-mix(in oklab, ${accent} 60%, transparent)`,
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted-foreground">
        <span>{label.toUpperCase()}</span>
        <span style={{ color: featured ? accent : undefined }}>
          {percent}%
        </span>
      </div>
      <div className="mt-2 font-display text-2xl md:text-3xl font-bold tabular-nums">
        {formatINR(amount)}
      </div>
      {featured ? (
        <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-foreground/80">
          <TrendingUp className="size-3.5" style={{ color: accent }} /> Yours
        </div>
      ) : (
        <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
          <Target className="size-3.5" /> Platform
        </div>
      )}
    </div>
  );
}
