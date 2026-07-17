import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ShoppingBag, Rocket, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container, Section } from "@/components/shared/section";
import { usePrefersReducedMotion } from "@/hooks/use-motion";

/* ================================================================
 * 1. GLINTR WORLD — three dimensional environments (LEARN / EARN / LAUNCH)
 * ================================================================ */

type WorldKey = "learn" | "earn" | "launch";

const WORLD_ORDER: WorldKey[] = ["earn", "learn", "launch"];

const LEARN_PROGRAMS = [
  { name: "ChatGPT", tag: "AI · Prompt Systems", tint: "var(--brand-cyan)" },
  { name: "Artificial Intelligence", tag: "AI · Foundations", tint: "var(--brand-azure)" },
  { name: "VLSI", tag: "Electronics · Chip Design", tint: "var(--brand-violet)" },
  { name: "Gemini AI", tag: "AI · Multimodal", tint: "var(--brand-lime)" },
  { name: "Claude AI", tag: "AI · Context & Analysis", tint: "var(--brand-cyan)" },
  { name: "Embedded Systems", tag: "Electronics · Firmware", tint: "var(--brand-azure)" },
  { name: "Digital Marketing", tag: "Management · Growth", tint: "var(--brand-violet)" },
];

export function GlintrWorld() {
  const reduced = usePrefersReducedMotion();
  const [focus, setFocus] = React.useState<WorldKey>("earn");
  const [manual, setManual] = React.useState(false);

  React.useEffect(() => {
    if (reduced) return;
    if (manual) {
      const t = window.setTimeout(() => setManual(false), 5000);
      return () => window.clearTimeout(t);
    }
    const id = window.setInterval(() => {
      setFocus((f) => {
        const i = WORLD_ORDER.indexOf(f);
        return WORLD_ORDER[(i + 1) % WORLD_ORDER.length];
      });
    }, 4200);
    return () => window.clearInterval(id);
  }, [reduced, manual]);

  const hoverFocus = (k: WorldKey) => {
    setFocus(k);
    setManual(true);
  };

  return (
    <Section tone="surface2" padding="md" className="relative overflow-hidden">
      <Container>
        <div className="max-w-3xl mb-8">
          <div className="text-label text-primary mb-3">GLINTR PLATFORM</div>
          <h2 className="text-section text-balance">
            One ecosystem. Multiple journeys.
          </h2>
          <p className="text-subheading mt-4 max-w-2xl">
            Explore the three ways to move with Glintr — build career-ready
            skills, earn revenue share, or launch your own EdTech brand.
          </p>
        </div>

        {/* Mobile selector */}
        <div className="flex md:hidden gap-2 mb-4">
          {WORLD_ORDER.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setFocus(k); setManual(true); }}
              className={cn(
                "flex-1 rounded-full border px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all",
                focus === k
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-background text-foreground/70",
              )}
            >{k}</button>
          ))}
        </div>

        <div
          className="grid gap-4 md:grid-cols-3 md:gap-5"
          style={{ perspective: "1400px" }}
        >
          {/* On mobile only show the focused one. Desktop shows all three. */}
          <WorldPanel
            k="learn"
            focus={focus}
            onFocus={hoverFocus}
            title="LEARN"
            tagline="Build career-ready skills."
            cta="Explore Programs"
            href="/programs"
          >
            <LearnStage focus={focus === "learn"} />
          </WorldPanel>

          <WorldPanel
            k="earn"
            focus={focus}
            onFocus={hoverFocus}
            title="EARN"
            tagline="Sell programs and earn revenue share."
            cta="Start Earning"
            href="/earn"
            hero
          >
            <EarnStage focus={focus === "earn"} />
          </WorldPanel>

          <WorldPanel
            k="launch"
            focus={focus}
            onFocus={hoverFocus}
            title="LAUNCH"
            tagline="Build your own EdTech brand."
            cta="Launch Your Brand"
            href="/launch-your-brand"
          >
            <LaunchStage focus={focus === "launch"} />
          </WorldPanel>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          {WORLD_ORDER.map((k) => (
            <button
              key={k}
              type="button"
              aria-label={`Focus ${k}`}
              onClick={() => { setFocus(k); setManual(true); }}
              className={cn(
                "h-1.5 rounded-full transition-all",
                focus === k
                  ? "w-8 bg-[color:var(--brand-azure)]"
                  : "w-1.5 bg-foreground/25",
              )}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function WorldPanel({
  k, focus, onFocus, title, tagline, cta, href, hero, children,
}: {
  k: WorldKey;
  focus: WorldKey;
  onFocus: (k: WorldKey) => void;
  title: string;
  tagline: string;
  cta: string;
  href: string;
  hero?: boolean;
  children: React.ReactNode;
}) {
  const isFocus = focus === k;
  const isMobileHidden = !isFocus; // md:show anyway
  return (
    <div
      onMouseEnter={() => onFocus(k)}
      className={cn(
        "relative rounded-3xl border overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,0.9,0.25,1)]",
        "flex flex-col",
        isMobileHidden ? "hidden md:flex" : "flex",
        isFocus
          ? "border-white bg-background shadow-[0_30px_80px_-30px_rgba(15,60,120,0.35),0_10px_30px_-10px_rgba(15,60,120,0.2)]"
          : "border-border/60 bg-surface shadow-sm",
        hero && "md:col-span-1",
      )}
      style={{
        transform: `translate3d(0, ${isFocus ? -6 : 0}px, ${isFocus ? (hero ? 30 : 20) : 0}px) scale(${isFocus ? (hero ? 1.03 : 1.02) : 0.97})`,
        opacity: isFocus ? 1 : 0.86,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 transition-opacity duration-700"
        style={{
          background:
            k === "learn"
              ? "radial-gradient(70% 60% at 0% 0%, oklch(0.78 0.16 175 / 0.14), transparent 60%)"
              : k === "earn"
              ? "radial-gradient(70% 60% at 50% 0%, oklch(0.82 0.22 140 / 0.14), transparent 60%), radial-gradient(70% 60% at 50% 100%, oklch(0.62 0.19 245 / 0.12), transparent 60%)"
              : "radial-gradient(70% 60% at 100% 0%, oklch(0.58 0.22 295 / 0.14), transparent 60%)",
          opacity: isFocus ? 1 : 0.5,
        }}
      />

      <div className="relative p-5 md:p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-[0.28em] font-bold text-[color:var(--brand-azure)]">
            {k === "learn" ? "JOURNEY 01" : k === "earn" ? "JOURNEY 02" : "JOURNEY 03"}
          </div>
          {isFocus && (
            <span className="text-[9px] tracking-widest font-bold text-[color:var(--brand-azure)] uppercase animate-fade-in">
              Focused
            </span>
          )}
        </div>
        <div className="mt-1 font-display font-bold leading-none tracking-tight text-4xl md:text-5xl text-foreground">
          {title}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">{tagline}</div>

        <div className="relative mt-4 flex-1 min-h-[240px]">
          {children}
        </div>

        <Link
          to={href}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-[color:var(--brand-azure)] transition-colors self-start"
        >
          {cta} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

/* --------- LEARN stage: rotating program surfaces --------- */
function LearnStage({ focus }: { focus: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (reduced || !focus) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % LEARN_PROGRAMS.length);
    }, 1800);
    return () => window.clearInterval(t);
  }, [reduced, focus]);
  return (
    <div className="relative h-full min-h-[240px]" style={{ perspective: "900px" }}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {LEARN_PROGRAMS.map((p, i) => {
          const offset = ((i - idx) + LEARN_PROGRAMS.length) % LEARN_PROGRAMS.length;
          // show top 3 clearly, others recede
          const visible = offset < 3;
          const z = offset === 0 ? 40 : offset === 1 ? 10 : offset === 2 ? -20 : -60;
          const y = offset * 14;
          const scale = offset === 0 ? 1 : offset === 1 ? 0.95 : offset === 2 ? 0.9 : 0.85;
          const opacity = offset === 0 ? 1 : offset === 1 ? 0.7 : offset === 2 ? 0.4 : 0;
          return (
            <div
              key={p.name}
              className="absolute inset-x-2 rounded-2xl border bg-background/95 backdrop-blur px-4 py-3.5 shadow-lg transition-all duration-700 ease-[cubic-bezier(0.22,0.9,0.25,1)]"
              style={{
                top: `${8 + y}px`,
                transform: `translateZ(${z}px) scale(${scale})`,
                opacity,
                borderColor: offset === 0 ? p.tint : "var(--border)",
                boxShadow: offset === 0 ? `0 20px 40px -20px ${p.tint}` : undefined,
                zIndex: 10 - offset,
                pointerEvents: visible ? "auto" : "none",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] tracking-[0.2em] font-bold" style={{ color: p.tint }}>
                    PROGRAM
                  </div>
                  <div className="text-base font-bold tracking-tight text-foreground truncate">
                    {p.name}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground text-right">{p.tag}</div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((s) => (
                  <span
                    key={s}
                    className="h-1 flex-1 rounded-full transition-all"
                    style={{
                      background: offset === 0
                        ? `linear-gradient(90deg, ${p.tint}, transparent)`
                        : "oklch(0.9 0 0)",
                      opacity: offset === 0 ? (s < 3 ? 1 : 0.3) : 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-1 left-2 text-[9px] tracking-[0.24em] font-bold text-muted-foreground/70">
        EXPLORE PROGRAMS
      </div>
    </div>
  );
}

/* --------- EARN stage: revenue split animation --------- */
function EarnStage({ focus }: { focus: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [model, setModel] = React.useState<70 | 50>(70);

  React.useEffect(() => {
    if (reduced || !focus) return;
    const t = window.setInterval(() => {
      setModel((m) => (m === 70 ? 50 : 70));
    }, 3600);
    return () => window.clearInterval(t);
  }, [reduced, focus]);

  const partnerShare = model === 70 ? 70000 : 50000;
  const glintrShare = 100000 - partnerShare;

  return (
    <div className="relative h-full min-h-[240px] flex flex-col">
      {/* Eligible sale bar */}
      <div className="rounded-xl border border-border/60 bg-background/80 backdrop-blur px-3 py-2">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-[9px] tracking-[0.24em] font-bold text-muted-foreground">
            ELIGIBLE PROGRAM SALE
          </div>
          <div className="font-display text-lg md:text-xl font-bold tabular-nums">
            ₹1,00,000
          </div>
        </div>
      </div>

      {/* Model switch */}
      <div className="mt-3 flex gap-2">
        {([70, 50] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModel(m)}
            className={cn(
              "flex-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-all",
              model === m
                ? "border-transparent bg-gradient-to-r from-[color:var(--brand-cyan)] to-[color:var(--brand-azure)] text-white shadow-[0_10px_20px_-10px_rgba(15,60,120,0.5)]"
                : "border-border bg-background text-foreground/70",
            )}
          >
            {m === 70 ? "70% REVENUE MODEL" : "50% SUPPORTED MODEL"}
          </button>
        ))}
      </div>

      {/* Split visualisation */}
      <div className="mt-3 rounded-2xl border border-border/60 bg-background/90 backdrop-blur p-3">
        <div
          className="relative h-3 w-full overflow-hidden rounded-full bg-black/[0.05]"
          aria-hidden
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,0.9,0.25,1)]"
            style={{
              width: `${model}%`,
              background: "linear-gradient(90deg, var(--brand-cyan), var(--brand-azure))",
            }}
          />
          <div
            className="absolute inset-y-0 rounded-full transition-[width,left] duration-[900ms] ease-[cubic-bezier(0.22,0.9,0.25,1)]"
            style={{
              left: `${model}%`,
              width: `${100 - model}%`,
              background: "oklch(0.85 0.02 240)",
            }}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-background border border-[color:var(--brand-azure)] shadow-[0_10px_24px_-14px_rgba(15,60,120,0.4)] p-2.5">
            <div className="text-[9px] tracking-[0.22em] font-bold text-[color:var(--brand-azure)]">
              PARTNER
            </div>
            <div className="font-display text-xl md:text-2xl font-bold tabular-nums leading-none mt-1">
              ₹{partnerShare.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {model}% share
            </div>
          </div>
          <div className="rounded-xl bg-surface border border-border/60 p-2.5">
            <div className="text-[9px] tracking-[0.22em] font-bold text-muted-foreground">
              GLINTR
            </div>
            <div className="font-display text-xl md:text-2xl font-bold tabular-nums leading-none mt-1">
              ₹{glintrShare.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {100 - model}% share
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-muted-foreground leading-snug">
        {model === 70
          ? "Own eligible sales. Full revenue share on every successful sale."
          : "Supported opportunities may be assigned based on performance and qualification criteria."}
      </div>
    </div>
  );
}

/* --------- LAUNCH stage: assembling EdTech stack --------- */
const LAUNCH_LAYERS = [
  "YOUR BRAND",
  "WEBSITE",
  "PROGRAM CATALOGUE",
  "LMS",
  "MARKETING SUPPORT",
  "SALES SYSTEM",
];

function LaunchStage({ focus }: { focus: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = React.useState(reduced ? LAUNCH_LAYERS.length : 0);
  React.useEffect(() => {
    if (reduced) return;
    if (!focus) { setStep(0); return; }
    setStep(0);
    const timers = LAUNCH_LAYERS.map((_, i) =>
      window.setTimeout(() => setStep(i + 1), 300 + i * 350),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduced, focus]);
  return (
    <div className="relative h-full min-h-[240px] flex flex-col gap-1.5" style={{ perspective: "800px" }}>
      {LAUNCH_LAYERS.map((l, i) => {
        const assembled = step > i;
        return (
          <div
            key={l}
            className={cn(
              "rounded-xl border px-3 py-2 flex items-center justify-between text-[11px] font-bold tracking-wide transition-all duration-700 ease-[cubic-bezier(0.22,0.9,0.25,1)]",
              assembled
                ? "bg-background border-white shadow-[0_10px_24px_-14px_rgba(15,60,120,0.3)] text-foreground"
                : "bg-surface/60 border-border/40 text-foreground/50",
            )}
            style={{
              transform: assembled
                ? `translate3d(0, 0, ${(LAUNCH_LAYERS.length - i) * 3}px)`
                : `translate3d(${i % 2 === 0 ? -30 : 30}px, 0, -40px)`,
              opacity: assembled ? 1 : 0.35,
            }}
          >
            <span>{l}</span>
            <span className="text-[9px] font-mono tabular-nums text-muted-foreground">0{i + 1}</span>
          </div>
        );
      })}
      <div
        className={cn(
          "mt-1 rounded-xl text-center py-1.5 transition-all duration-500",
          step >= LAUNCH_LAYERS.length
            ? "bg-gradient-to-r from-[color:var(--brand-lime)]/15 to-[color:var(--brand-violet)]/15 opacity-100"
            : "opacity-0",
        )}
      >
        <div className="text-[9px] tracking-[0.24em] font-bold text-[color:var(--brand-violet)]">
          YOUR EDTECH BRAND
        </div>
        <div className="text-[11px] font-semibold text-foreground">Ready to launch</div>
      </div>
    </div>
  );
}

/* ================================================================
 * 2. CERTIFICATION & TECHNOLOGY ECOSYSTEM (visible wordmarks)
 * ================================================================ */

type Category = "all" | "technology" | "cloud" | "ai" | "creative" | "marketing" | "enterprise";

const BRANDS: Array<{
  name: string;
  short: string;
  color: string;
  relationship: string;
  cats: Category[];
}> = [
  { name: "Microsoft", short: "Microsoft", color: "oklch(0.55 0.18 255)", relationship: "Technology & Certification Ecosystem", cats: ["technology", "cloud", "ai", "enterprise"] },
  { name: "Google", short: "Google", color: "oklch(0.65 0.19 30)", relationship: "Technology Learning Ecosystem", cats: ["technology", "cloud", "ai"] },
  { name: "Meta", short: "Meta", color: "oklch(0.55 0.22 255)", relationship: "Digital & Marketing Ecosystem", cats: ["marketing", "technology"] },
  { name: "Amazon Web Services", short: "AWS", color: "oklch(0.55 0.17 55)", relationship: "Cloud Learning Ecosystem", cats: ["cloud", "technology"] },
  { name: "Adobe", short: "Adobe", color: "oklch(0.55 0.24 25)", relationship: "Creative Technology Ecosystem", cats: ["creative"] },
  { name: "Oracle", short: "Oracle", color: "oklch(0.55 0.24 25)", relationship: "Enterprise Data Ecosystem", cats: ["cloud", "enterprise"] },
  { name: "IBM", short: "IBM", color: "oklch(0.5 0.17 260)", relationship: "Enterprise Technology Ecosystem", cats: ["enterprise", "cloud", "ai"] },
  { name: "Cisco", short: "Cisco", color: "oklch(0.55 0.16 235)", relationship: "Networking Ecosystem", cats: ["technology", "enterprise"] },
  { name: "Intel", short: "Intel", color: "oklch(0.55 0.17 245)", relationship: "Silicon & Compute Ecosystem", cats: ["technology"] },
  { name: "NVIDIA", short: "NVIDIA", color: "oklch(0.7 0.22 140)", relationship: "AI Compute Ecosystem", cats: ["ai", "technology"] },
  { name: "Salesforce", short: "Salesforce", color: "oklch(0.6 0.18 240)", relationship: "CRM & Growth Ecosystem", cats: ["marketing", "enterprise"] },
  { name: "ServiceNow", short: "ServiceNow", color: "oklch(0.55 0.17 165)", relationship: "Digital Workflow Ecosystem", cats: ["enterprise"] },
  { name: "Accenture", short: "Accenture", color: "oklch(0.55 0.22 320)", relationship: "Consulting & Delivery Ecosystem", cats: ["enterprise"] },
  { name: "Docker", short: "Docker", color: "oklch(0.6 0.16 235)", relationship: "Containers & DevOps Ecosystem", cats: ["technology", "cloud"] },
  { name: "VMware", short: "VMware", color: "oklch(0.55 0.13 235)", relationship: "Virtualization Ecosystem", cats: ["cloud", "enterprise"] },
  { name: "Red Hat", short: "Red Hat", color: "oklch(0.55 0.24 25)", relationship: "Open Source Enterprise Ecosystem", cats: ["enterprise", "cloud"] },
  { name: "Autodesk", short: "Autodesk", color: "oklch(0.55 0.14 240)", relationship: "Design & Engineering Ecosystem", cats: ["creative", "technology"] },
  { name: "Dell Technologies", short: "Dell", color: "oklch(0.5 0.16 245)", relationship: "Enterprise Infrastructure Ecosystem", cats: ["enterprise"] },
  { name: "Hewlett Packard Enterprise", short: "HPE", color: "oklch(0.6 0.15 170)", relationship: "Hybrid Infrastructure Ecosystem", cats: ["enterprise", "cloud"] },
  { name: "Fortinet", short: "Fortinet", color: "oklch(0.55 0.22 25)", relationship: "Cybersecurity Ecosystem", cats: ["technology", "enterprise"] },
  { name: "Cloudflare", short: "Cloudflare", color: "oklch(0.7 0.19 55)", relationship: "Edge & Network Ecosystem", cats: ["cloud", "technology"] },
  { name: "MongoDB", short: "MongoDB", color: "oklch(0.6 0.17 145)", relationship: "Modern Data Ecosystem", cats: ["technology", "cloud"] },
  { name: "Databricks", short: "Databricks", color: "oklch(0.55 0.22 25)", relationship: "Data & AI Ecosystem", cats: ["ai", "cloud"] },
  { name: "Snowflake", short: "Snowflake", color: "oklch(0.7 0.15 220)", relationship: "Data Cloud Ecosystem", cats: ["cloud", "enterprise"] },
  { name: "Atlassian", short: "Atlassian", color: "oklch(0.55 0.18 245)", relationship: "Team Collaboration Ecosystem", cats: ["enterprise", "technology"] },
  { name: "GitHub", short: "GitHub", color: "oklch(0.35 0.02 260)", relationship: "Developer Ecosystem", cats: ["technology"] },
  { name: "GitLab", short: "GitLab", color: "oklch(0.6 0.2 40)", relationship: "DevSecOps Ecosystem", cats: ["technology"] },
  { name: "HashiCorp", short: "HashiCorp", color: "oklch(0.5 0.2 300)", relationship: "Cloud Infrastructure Ecosystem", cats: ["cloud", "technology"] },
  { name: "Palo Alto Networks", short: "Palo Alto", color: "oklch(0.55 0.22 30)", relationship: "Cybersecurity Ecosystem", cats: ["enterprise", "technology"] },
  { name: "CrowdStrike", short: "CrowdStrike", color: "oklch(0.55 0.2 25)", relationship: "Threat Intelligence Ecosystem", cats: ["enterprise", "technology"] },
  { name: "Synopsys", short: "Synopsys", color: "oklch(0.5 0.16 255)", relationship: "Semiconductor Design Ecosystem", cats: ["technology"] },
  { name: "Cadence", short: "Cadence", color: "oklch(0.5 0.2 20)", relationship: "EDA & VLSI Ecosystem", cats: ["technology"] },
  { name: "Siemens", short: "Siemens", color: "oklch(0.6 0.13 200)", relationship: "Industrial Technology Ecosystem", cats: ["enterprise", "technology"] },
  { name: "Ansys", short: "Ansys", color: "oklch(0.55 0.22 25)", relationship: "Simulation Ecosystem", cats: ["technology"] },
  { name: "PTC", short: "PTC", color: "oklch(0.55 0.16 250)", relationship: "Digital Engineering Ecosystem", cats: ["technology"] },
  { name: "SAP", short: "SAP", color: "oklch(0.65 0.17 235)", relationship: "Enterprise Applications Ecosystem", cats: ["enterprise"] },
  { name: "Zoho", short: "Zoho", color: "oklch(0.55 0.2 25)", relationship: "Business Software Ecosystem", cats: ["enterprise", "marketing"] },
  { name: "Freshworks", short: "Freshworks", color: "oklch(0.6 0.18 155)", relationship: "Customer Experience Ecosystem", cats: ["marketing", "enterprise"] },
  { name: "MuleSoft", short: "MuleSoft", color: "oklch(0.55 0.18 305)", relationship: "Integration Ecosystem", cats: ["enterprise"] },
  { name: "UiPath", short: "UiPath", color: "oklch(0.55 0.2 25)", relationship: "Automation Ecosystem", cats: ["enterprise", "ai"] },
  { name: "Automation Anywhere", short: "AutoAnywhere", color: "oklch(0.55 0.18 250)", relationship: "Intelligent Automation Ecosystem", cats: ["enterprise", "ai"] },
  { name: "Blue Prism", short: "Blue Prism", color: "oklch(0.5 0.18 245)", relationship: "RPA Ecosystem", cats: ["enterprise"] },
  { name: "Unity", short: "Unity", color: "oklch(0.4 0.02 260)", relationship: "Real-Time 3D Ecosystem", cats: ["creative", "technology"] },
  { name: "Unreal Engine", short: "Unreal", color: "oklch(0.45 0.03 260)", relationship: "Realtime Graphics Ecosystem", cats: ["creative", "technology"] },
  { name: "Flutter", short: "Flutter", color: "oklch(0.65 0.16 220)", relationship: "Cross-Platform App Ecosystem", cats: ["technology"] },
  { name: "Android", short: "Android", color: "oklch(0.75 0.16 145)", relationship: "Mobile Platform Ecosystem", cats: ["technology"] },
  { name: "Kubernetes", short: "Kubernetes", color: "oklch(0.55 0.16 250)", relationship: "Container Orchestration Ecosystem", cats: ["cloud", "technology"] },
  { name: "TensorFlow", short: "TensorFlow", color: "oklch(0.65 0.19 55)", relationship: "Machine Learning Ecosystem", cats: ["ai"] },
  { name: "PyTorch", short: "PyTorch", color: "oklch(0.6 0.22 25)", relationship: "Deep Learning Ecosystem", cats: ["ai"] },
];


const CATEGORY_LABELS: Array<{ key: Category; label: string }> = [
  { key: "all", label: "ALL" },
  { key: "technology", label: "TECHNOLOGY" },
  { key: "cloud", label: "CLOUD" },
  { key: "ai", label: "AI" },
  { key: "creative", label: "CREATIVE" },
  { key: "marketing", label: "MARKETING" },
  { key: "enterprise", label: "ENTERPRISE" },
];

export function CertificationEcosystem() {
  const [expanded, setExpanded] = React.useState(false);
  const [cat, setCat] = React.useState<Category>("all");
  const rail1 = BRANDS;
  const rail2 = [...BRANDS].reverse();

  const isHighlighted = (b: typeof BRANDS[number]) => cat === "all" || b.cats.includes(cat);

  return (
    <Section tone="default" padding="md" className="relative overflow-hidden">
      <Container>
        <div className="max-w-3xl mb-8">
          <div className="text-label text-primary mb-3">
            CERTIFICATION & TECHNOLOGY ECOSYSTEM
          </div>
          <h2 className="text-section text-balance">
            Learn Across Industry-Relevant Technology Ecosystems.
          </h2>
          <p className="text-subheading mt-4 max-w-2xl">
            Explore learning paths and certification-aligned opportunities
            across leading technology platforms available through Glintr's
            program ecosystem.
          </p>
        </div>
      </Container>

      {/* Two rails */}
      <div className="relative flex flex-col gap-3 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
        <BrandRail items={rail1} speed={55} isHighlighted={isHighlighted} />
        <BrandRail items={rail2} speed={45} reverse isHighlighted={isHighlighted} />
      </div>

      <Container>
        <div className="mt-6 flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-[color:var(--brand-azure)] transition-colors"
          >
            EXPLORE THE ECOSYSTEM
            <ArrowRight className={cn("size-4 transition-transform", expanded && "rotate-90")} />
          </button>

          {expanded && (
            <div className="w-full rounded-2xl border border-border/60 bg-surface p-4 animate-fade-in">
              <div className="flex flex-wrap gap-2">
                {CATEGORY_LABELS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCat(c.key)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider transition-all",
                      cat === c.key
                        ? "border-transparent bg-foreground text-background"
                        : "border-border bg-background text-foreground/70 hover:border-foreground/40",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {BRANDS.filter((b) => cat === "all" || b.cats.includes(cat)).map((b) => (
                  <div
                    key={b.name}
                    className="rounded-xl border border-border/60 bg-background px-3 py-1.5 text-sm font-bold tracking-tight"
                    style={{ color: b.color }}
                  >
                    {b.short}
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground max-w-2xl">
            Third-party names and marks belong to their respective owners.
            References describe learning ecosystem context and do not imply
            endorsement, affiliation, or official partnership.
          </p>
        </div>
      </Container>
    </Section>
  );
}

function BrandRail({
  items, speed = 50, reverse, isHighlighted,
}: {
  items: typeof BRANDS;
  speed?: number;
  reverse?: boolean;
  isHighlighted: (b: typeof BRANDS[number]) => boolean;
}) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden group">
      <div
        className="flex gap-3 md:gap-4 py-2 will-change-transform"
        style={{
          animation: `marquee-${reverse ? "right" : "left"} ${speed}s linear infinite`,
        }}
      >
        {doubled.map((b, i) => {
          const hot = isHighlighted(b);
          return (
            <div
              key={`${b.name}-${i}`}
              className={cn(
                "shrink-0 rounded-2xl border bg-background px-5 py-3 md:px-6 md:py-3.5 transition-all duration-300",
                "hover:scale-[1.04] hover:-translate-y-0.5 group-hover:[animation-play-state:paused]",
                hot ? "border-border/70 opacity-100" : "border-border/40 opacity-40",
              )}
              style={{ minWidth: 180 }}
            >
              <div
                className="font-display text-xl md:text-2xl font-bold tracking-tight leading-none"
                style={{ color: b.color }}
              >
                {b.short}
              </div>
              <div className="mt-1 text-[10px] tracking-wider font-semibold text-muted-foreground uppercase">
                {b.relationship}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes marquee-left { from { transform: translateX(0);} to { transform: translateX(-50%);} }
        @keyframes marquee-right { from { transform: translateX(-50%);} to { transform: translateX(0);} }
        @media (prefers-reduced-motion: reduce) {
          [style*="marquee-left"], [style*="marquee-right"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ================================================================
 * 3. LEARNER INSTITUTIONS — monogram marquee
 * ================================================================ */

const INSTITUTIONS: Array<{ mono: string; sub: string; full: string }> = [
  { mono: "IIT", sub: "BOMBAY", full: "IIT Bombay" },
  { mono: "IIT", sub: "DELHI", full: "IIT Delhi" },
  { mono: "IIT", sub: "MADRAS", full: "IIT Madras" },
  { mono: "IIT", sub: "KHARAGPUR", full: "IIT Kharagpur" },
  { mono: "IIT", sub: "KANPUR", full: "IIT Kanpur" },
  { mono: "IIT", sub: "HYDERABAD", full: "IIT Hyderabad" },
  { mono: "NIT", sub: "TRICHY", full: "NIT Trichy" },
  { mono: "NIT", sub: "WARANGAL", full: "NIT Warangal" },
  { mono: "NIT", sub: "SURATHKAL", full: "NIT Surathkal" },
  { mono: "NIT", sub: "CALICUT", full: "NIT Calicut" },
  { mono: "BITS", sub: "PILANI", full: "BITS Pilani" },
  { mono: "VIT", sub: "VELLORE", full: "VIT" },
  { mono: "SRM", sub: "INSTITUTE", full: "SRM Institute of Science and Technology" },
  { mono: "MAHE", sub: "MANIPAL", full: "Manipal Academy of Higher Education" },
  { mono: "AMITY", sub: "UNIVERSITY", full: "Amity University" },
];

const BG_WORDS = ["IIT", "NIT", "BITS", "ENGINEERING", "TECHNOLOGY", "MANAGEMENT", "AI"];

export function LearnerInstitutions() {
  const doubled = [...INSTITUTIONS, ...INSTITUTIONS];
  return (
    <Section tone="surface" padding="md" className="relative overflow-hidden">
      {/* Background typography field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 overflow-hidden select-none"
        style={{ maskImage: "linear-gradient(180deg, transparent, black 30%, black 70%, transparent)" }}
      >
        <div
          className="absolute inset-0 flex items-center gap-16 whitespace-nowrap will-change-transform"
          style={{ animation: "campus-bg 60s linear infinite" }}
        >
          {[...BG_WORDS, ...BG_WORDS, ...BG_WORDS].map((w, i) => (
            <span
              key={i}
              className="font-display font-black tracking-tight text-foreground/[0.04]"
              style={{ fontSize: "9rem", lineHeight: 1 }}
            >{w}</span>
          ))}
        </div>
        <style>{`@keyframes campus-bg { from { transform: translateX(0);} to { transform: translateX(-33%);} }`}</style>
      </div>

      <Container>
        <div className="relative max-w-3xl mb-8">
          <div className="text-label text-primary mb-3">LEARNER COMMUNITY</div>
          <h2 className="text-section text-balance">
            Learners From Leading Campuses Explore Glintr Programs.
          </h2>
          <p className="text-subheading mt-4 max-w-2xl">
            Glintr programs are explored by students and independent learners
            from diverse academic institutions across India.
          </p>
        </div>
      </Container>

      <div className="relative [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
        <div
          className="flex gap-3 md:gap-4 py-3 will-change-transform"
          style={{ animation: "campus-rail 40s linear infinite" }}
        >
          {doubled.map((inst, i) => (
            <div
              key={`${inst.full}-${i}`}
              className="shrink-0 flex items-center gap-3 rounded-2xl border border-border/60 bg-background/95 backdrop-blur px-4 py-3 shadow-sm"
              style={{ minWidth: 260 }}
            >
              <div
                className="grid place-items-center rounded-xl border border-[color:var(--brand-azure)]/30 px-3 py-2 text-center"
                style={{
                  minWidth: 56,
                  background: "linear-gradient(135deg, oklch(0.97 0.02 240), oklch(1 0 0))",
                }}
              >
                <div className="font-display font-black tracking-tight text-[color:var(--brand-azure)] leading-none text-base">
                  {inst.mono}
                </div>
                <div className="mt-0.5 text-[8px] tracking-widest font-bold text-foreground/60">
                  {inst.sub}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-foreground leading-tight">
                  {inst.full}
                </div>
                <div className="text-[9px] tracking-[0.2em] font-bold text-muted-foreground uppercase mt-0.5">
                  Learner Institution
                </div>
              </div>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes campus-rail { from { transform: translateX(0);} to { transform: translateX(-50%);} }
          @media (prefers-reduced-motion: reduce) {
            [style*="campus-rail"], [style*="campus-bg"] { animation: none !important; }
          }
        `}</style>
      </div>

      <Container>
        <p className="relative mt-6 text-xs text-muted-foreground max-w-2xl">
          Institution names describe the academic background of learners who
          have explored Glintr programs. References do not imply university
          partnership, academic collaboration, or official endorsement.
        </p>
      </Container>
    </Section>
  );
}
