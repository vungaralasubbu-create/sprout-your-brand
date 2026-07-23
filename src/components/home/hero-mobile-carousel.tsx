import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Wallet,
  Brain,
  GraduationCap,
  Rocket,
  LayoutDashboard,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile-only hero carousel.
 * Replaces the desktop <GlintrDimension /> 3D stack with an accessible,
 * swipeable carousel of six product surfaces. Autoplay every 2s, pauses
 * on user interaction and resumes 2s after interaction ends. Peek layout
 * shows the next card partially. Seamless infinite loop via a clone slide.
 */

type Slide = {
  key: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string }>;
  Visual: React.FC;
};

const AUTOPLAY_MS = 2000;
const RESUME_MS = 2000;
const REVENUE_TARGET_PCT = 70;

/* --------------------------------- Visuals -------------------------------- */

function RevenueVisual() {
  // Animate 0 → REVENUE_TARGET_PCT once on mount, then hold.
  const [pct, setPct] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setPct(Math.round(eased * REVENUE_TARGET_PCT));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-5xl font-bold tracking-tight text-gradient-brand leading-none tabular-nums">
          {pct}%
        </span>
        <span className="text-xs font-semibold text-muted-foreground">Revenue Share</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-brand transition-[width] duration-[1400ms] ease-out"
          style={{ width: `${(pct / REVENUE_TARGET_PCT) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[
          { l: "Own Leads", v: "70%" },
          { l: "Supported", v: "50%" },
          { l: "Payout", v: "48h" },
        ].map((m) => (
          <div key={m.l} className="rounded-lg bg-surface-1 px-2 py-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{m.l}</div>
            <div className="font-display text-base font-semibold">{m.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AILearningVisual() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {["Generative AI", "Prompting", "ML Ops", "Agents", "LangChain", "RAG"].map((t) => (
          <span
            key={t}
            className="rounded-full border border-[color:var(--brand-cyan)]/30 bg-[color:var(--brand-cyan)]/5 px-2.5 py-1 text-[11px] font-medium text-foreground/85"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-surface-1 p-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-[var(--brand-cyan)] cat-pulse" />
          Live path
        </div>
        <div className="mt-2 space-y-1.5">
          {["Foundations", "Applied AI Projects", "Portfolio & Certification"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-sm">
              <span className="grid size-5 place-items-center rounded-md bg-primary/10 text-primary text-[10px] font-bold">{i + 1}</span>
              <span className="text-foreground/85">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CareerVisual() {
  const items = [
    { name: "Full-Stack AI", count: 11, tone: "var(--brand-cyan)" },
    { name: "VLSI & Embedded", count: 4, tone: "var(--brand-azure)" },
    { name: "Mechanical Design", count: 6, tone: "var(--brand-lime)" },
    { name: "Management", count: 8, tone: "var(--brand-violet)" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((c) => (
        <div key={c.name} className="rounded-xl border border-border bg-surface-1 p-3">
          <div className="size-2 rounded-full" style={{ background: c.tone }} />
          <div className="mt-2 text-sm font-semibold leading-tight">{c.name}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{c.count} programs</div>
        </div>
      ))}
    </div>
  );
}

function BrandVisual() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-border bg-surface-1 p-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Your Brand</div>
        <div className="mt-1 flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-brand text-white font-display font-bold">A</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">academy.yoursite.com</div>
            <div className="text-[11px] text-muted-foreground">White-label ready</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["LMS", "Payments", "CRM"].map((m) => (
          <div key={m} className="rounded-lg border border-border bg-white/60 px-2 py-2 text-center text-[11px] font-semibold">
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardVisual() {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Courses", v: 4 },
          { l: "Streak", v: "12d" },
          { l: "Score", v: 92 },
        ].map((k) => (
          <div key={k.l} className="rounded-lg bg-surface-1 px-2 py-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{k.l}</div>
            <div className="font-display text-base font-semibold">{k.v}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-surface-1 p-3 space-y-2">
        {[
          { t: "Generative AI · Module 3", p: 62 },
          { t: "Data Foundations · Module 2", p: 45 },
        ].map((c) => (
          <div key={c.t}>
            <div className="flex justify-between text-[11px]">
              <span className="truncate">{c.t}</span>
              <span className="text-muted-foreground">{c.p}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${c.p}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlacementVisual() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Hiring", v: "450+" },
          { l: "Offers", v: "3.2K" },
          { l: "Avg CTC", v: "8.4L" },
        ].map((m) => (
          <div key={m.l} className="rounded-lg bg-surface-1 px-2 py-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{m.l}</div>
            <div className="font-display text-base font-semibold">{m.v}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-surface-1 p-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Recent placement</div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">RS</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Rahul S. → AI Engineer</div>
            <div className="text-[11px] text-muted-foreground">Placed via Glintr · Bengaluru</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SLIDES: Slide[] = [
  {
    key: "revenue",
    eyebrow: "REVENUE MODEL",
    title: "Earn 70% Revenue Share",
    subtitle: "Sell programs. Get paid within 48 hours.",
    href: "/earn",
    accent: "var(--brand-azure)",
    Icon: Wallet,
    Visual: RevenueVisual,
  },
  {
    key: "ai",
    eyebrow: "AI LEARNING",
    title: "Learn what's shaping work",
    subtitle: "Applied AI programs with live projects.",
    href: "/programs",
    accent: "var(--brand-cyan)",
    Icon: Brain,
    Visual: AILearningVisual,
  },
  {
    key: "career",
    eyebrow: "CAREER PROGRAMS",
    title: "Choose your field",
    subtitle: "Tech, engineering, management — one platform.",
    href: "/programs",
    accent: "var(--brand-violet)",
    Icon: GraduationCap,
    Visual: CareerVisual,
  },
  {
    key: "brand",
    eyebrow: "BRAND BUILDER",
    title: "Launch your academy",
    subtitle: "White-label LMS with your domain in minutes.",
    href: "/launch-your-brand",
    accent: "var(--brand-lime)",
    Icon: Rocket,
    Visual: BrandVisual,
  },
  {
    key: "dashboard",
    eyebrow: "STUDENT DASHBOARD",
    title: "Your learning workspace",
    subtitle: "Track courses, streaks and certifications.",
    href: "/student/dashboard",
    accent: "var(--brand-cyan)",
    Icon: LayoutDashboard,
    Visual: DashboardVisual,
  },
  {
    key: "placement",
    eyebrow: "PLACEMENT",
    title: "Career outcomes",
    subtitle: "450+ hiring partners across roles.",
    href: "/for-companies",
    accent: "var(--brand-azure)",
    Icon: Briefcase,
    Visual: PlacementVisual,
  },
];

export function HeroMobileCarousel() {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const resumeTimerRef = React.useRef<number | null>(null);
  const suppressScrollSyncRef = React.useRef(false);

  // Render one extra clone of slide 0 at the end for seamless looping.
  const rendered = React.useMemo(() => [...SLIDES, SLIDES[0]], []);

  // Measured stride (slide width + gap) via first two children.
  const getStride = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.children.length < 2) return el?.clientWidth ?? 1;
    const a = el.children[0] as HTMLElement;
    const b = el.children[1] as HTMLElement;
    const s = b.offsetLeft - a.offsetLeft;
    return s > 0 ? s : el.clientWidth;
  }, []);

  // Sync index from scroll position (touch + programmatic scrolls).
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (suppressScrollSyncRef.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const stride = getStride();
        if (stride <= 0) return;
        const i = Math.round(el.scrollLeft / stride);
        setIndex(Math.max(0, Math.min(rendered.length - 1, i)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [getStride, rendered.length]);

  // Seamless loop: when we land on the clone (index === SLIDES.length),
  // jump back to slide 0 with an instant scroll after the smooth transition.
  React.useEffect(() => {
    if (index !== SLIDES.length) return;
    const t = window.setTimeout(() => {
      const el = scrollerRef.current;
      if (!el) return;
      suppressScrollSyncRef.current = true;
      el.scrollTo({ left: 0, behavior: "auto" });
      setIndex(0);
      window.setTimeout(() => {
        suppressScrollSyncRef.current = false;
      }, 60);
    }, 550);
    return () => window.clearTimeout(t);
  }, [index]);

  // Autoplay every 2s while not paused.
  React.useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const stride = getStride();
      if (stride <= 0) return;
      const current = Math.round(el.scrollLeft / stride);
      const next = current + 1; // may land on the clone; loop effect resets it
      el.scrollTo({ left: next * stride, behavior: "smooth" });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, getStride]);

  const pause = React.useCallback(() => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    setPaused(true);
  }, []);

  const scheduleResume = React.useCallback(() => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      setPaused(false);
      resumeTimerRef.current = null;
    }, RESUME_MS);
  }, []);

  React.useEffect(
    () => () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    },
    [],
  );

  const goTo = React.useCallback(
    (i: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      pause();
      const stride = getStride();
      el.scrollTo({ left: i * stride, behavior: "smooth" });
      scheduleResume();
    },
    [pause, scheduleResume, getStride],
  );

  const activeDot = index % SLIDES.length;

  return (
    <div
      className="relative w-full"
      role="region"
      aria-roledescription="carousel"
      aria-label="Glintr experience highlights"
      onPointerDown={pause}
      onTouchStart={pause}
      onPointerUp={scheduleResume}
      onPointerCancel={scheduleResume}
      onTouchEnd={scheduleResume}
      onTouchCancel={scheduleResume}
    >
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {rendered.map((s, i) => (
          <SlideCard
            key={`${s.key}-${i}`}
            slide={s}
            active={i === index}
            index={i % SLIDES.length}
            total={SLIDES.length}
            isLast={i === rendered.length - 1}
          />
        ))}
      </div>

      {/* Dots */}
      <div className="mt-4 flex items-center justify-center gap-1.5" role="tablist" aria-label="Carousel navigation">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={i === activeDot}
            aria-label={`Show ${s.title}`}
            onClick={() => goTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === activeDot
                ? "w-6 bg-gradient-brand"
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function SlideCard({
  slide,
  active,
  index,
  total,
  isLast,
}: {
  slide: Slide;
  active: boolean;
  index: number;
  total: number;
  isLast: boolean;
}) {
  const { Icon, Visual } = slide;
  return (
    <div
      className={cn(
        // 88% viewport width leaves ~12% peek of the next card on the right.
        "w-[88%] shrink-0 snap-start",
        isLast ? "pr-0" : "pr-3",
      )}
      role="tabpanel"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${slide.title}`}
      aria-hidden={!active}
    >
      <article
        className={cn(
          "relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition-transform duration-500 will-change-transform",
          active ? "scale-100" : "scale-[0.97]",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full blur-3xl opacity-40"
          style={{ background: slide.accent }}
        />
        <div className="relative flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary">
            <span
              className="size-1.5 rounded-full cat-pulse"
              style={{ background: slide.accent }}
            />
            {slide.eyebrow}
          </div>
          <span
            className="grid size-8 place-items-center rounded-lg text-white"
            style={{ background: `linear-gradient(135deg, ${slide.accent}, color-mix(in oklab, ${slide.accent} 60%, black))` }}
          >
            <Icon className="size-4" />
          </span>
        </div>

        <h3 className="relative mt-3 font-display text-2xl font-semibold tracking-tight leading-tight">
          {slide.title}
        </h3>
        <p className="relative mt-1 text-sm text-muted-foreground">
          {slide.subtitle}
        </p>

        <div className="relative mt-4">
          <Visual />
        </div>

        <Link
          to={slide.href}
          className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/90 story-link"
        >
          Explore <ArrowUpRight className="size-4" />
        </Link>
      </article>
    </div>
  );
}
