import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Wand2,
  Layers,
  ImageIcon,
  Video,
  Globe,
  Mail,
  Workflow,
  BarChart3,
  Send,
  Palette,
  Search,
  Bot,
  Check,
  Play,
  Star,
  Rocket,
  Building2,
  GraduationCap,
  Utensils,
  Heart,
  Dumbbell,
  Home,
  ShoppingBag,
  Briefcase,
  Users,
  Camera,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cloud/")({
  head: () => ({
    meta: [
      { title: "AI Marketing Cloud — Your Entire Marketing Team, Powered by AI" },
      {
        name: "description",
        content:
          "Generate strategies, social posts, blogs, videos, ads, emails, landing pages and complete campaigns from a single prompt. The AI marketing platform replacing your entire stack.",
      },
      { property: "og:title", content: "AI Marketing Cloud — Your Entire Marketing Team, Powered by AI" },
      {
        property: "og:description",
        content: "One prompt. Complete marketing campaign. Strategy, content, images, video, landing pages, emails, publishing and analytics — generated and orchestrated by AI.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com/cloud" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/cloud" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AI Marketing Cloud",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "1200" },
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative overflow-x-clip bg-background text-foreground">
      <AmbientBackground />
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <ProductShowcase />
      <UseCases />
      <AIAgents />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </div>
  );
}

/* ─────────────────────────  BACKGROUND  ───────────────────────── */

function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[140px]" />
      <div className="absolute top-[30%] -right-40 h-[500px] w-[700px] rounded-full bg-sky-500/20 blur-[140px]" />
      <div className="absolute top-[70%] -left-40 h-[500px] w-[700px] rounded-full bg-lime-400/15 blur-[140px]" />
      <div
        className="absolute inset-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(148 163 184 / 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

/* ─────────────────────────  HERO  ───────────────────────── */

function Hero() {
  return (
    <section className="relative pt-16 sm:pt-24 lg:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-lime-400">
                <Sparkles className="h-3 w-3 text-white" />
              </span>
              New — GPT-5.5 & Claude 3.7 available
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            >
              Your Entire
              <br />
              Marketing Team.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-500 to-lime-400 bg-clip-text text-transparent">
                Powered by AI.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground sm:text-xl"
            >
              Generate strategies, social media, blogs, videos, ads, emails, landing pages and complete
              marketing campaigns from a single prompt.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/cloud/signup">
                <Button
                  size="lg"
                  className="h-12 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-lime-500 px-6 text-base text-white shadow-xl shadow-sky-500/30 hover:opacity-90"
                >
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/cloud/contact">
                <Button size="lg" variant="outline" className="h-12 rounded-xl px-6 text-base">
                  Book Demo
                </Button>
              </Link>
              <button className="inline-flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-medium text-muted-foreground hover:text-foreground">
                <span className="grid h-9 w-9 place-items-center rounded-full border">
                  <Play className="ml-0.5 h-4 w-4" />
                </span>
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> No credit card
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> 5 min setup
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> SOC 2 & GDPR
              </div>
            </motion.div>
          </div>

          <AIInterface />
        </div>
      </div>
    </section>
  );
}

function AIInterface() {
  const steps = [
    { label: "Strategy", icon: Sparkles },
    { label: "Campaign", icon: Rocket },
    { label: "Posts", icon: Layers },
    { label: "Images", icon: ImageIcon },
    { label: "Landing Page", icon: Globe },
    { label: "Emails", icon: Mail },
    { label: "Analytics", icon: BarChart3 },
  ];
  const promptText = "Launch my AI SaaS";
  const [typed, setTyped] = useState("");
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyped(promptText.slice(0, i));
      if (i >= promptText.length) clearInterval(iv);
    }, 90);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (typed.length < promptText.length) return;
    let s = -1;
    const iv = setInterval(() => {
      s++;
      setActiveStep(s);
      if (s >= steps.length - 1) {
        setTimeout(() => {
          setActiveStep(-1);
          s = -1;
        }, 2000);
      }
    }, 700);
    return () => clearInterval(iv);
  }, [typed, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="relative"
    >
      <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-cyan-400/20 via-sky-500/10 to-lime-400/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border bg-card/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="ml-3 flex-1 truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            marketing.cloud/new-project
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="rounded-2xl border bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-lime-500/5 p-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
              You
            </div>
            <div className="min-h-[28px] font-mono text-base sm:text-lg">
              {typed}
              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary align-middle" />
            </div>
          </div>

          <div className="rounded-2xl border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <Bot className="h-3 w-3" />
              AI Marketing Cloud
            </div>
            <ul className="mt-3 grid gap-2">
              {steps.map((s, i) => {
                const done = activeStep > i || activeStep === -1 && typed.length >= promptText.length ? activeStep > i : false;
                const active = activeStep === i;
                const Icon = s.icon;
                return (
                  <li
                    key={s.label}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm transition",
                      active && "border-primary shadow-md shadow-primary/10",
                      done && "opacity-80",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-md border",
                        active && "border-primary bg-primary/10 text-primary",
                        done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <span className="flex-1 font-medium">{s.label}</span>
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1 text-xs text-primary"
                        >
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                          Generating
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────  SOCIAL PROOF  ───────────────────────── */

function SocialProof() {
  const industries = [
    "Student Startups",
    "Agencies",
    "SaaS",
    "Healthcare",
    "Education",
    "Real Estate",
    "Technology",
    "Ecommerce",
  ];
  const stats = [
    { value: 100000, suffix: "+", label: "Campaigns Generated" },
    { value: 1000000, suffix: "+", label: "Assets Created", format: "M" },
    { value: 200, suffix: "+", label: "Countries" },
    { value: 98, suffix: "%", label: "Customer Satisfaction" },
  ];
  return (
    <section className="mt-32 border-y bg-background/60 py-16 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted by teams across every industry
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg font-semibold text-muted-foreground/70">
          {industries.map((i) => (
            <span key={i} className="transition hover:text-foreground">
              {i}
            </span>
          ))}
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Counter key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({
  value,
  suffix,
  label,
  format,
}: {
  value: number;
  suffix: string;
  label: string;
  format?: "M";
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setStarted(true)),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    const duration = 1400;
    const start = performance.now();
    let raf: number;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, value]);
  const display =
    format === "M" ? `${(n / 1_000_000).toFixed(n >= 1_000_000 ? 0 : 1)}M` : n.toLocaleString();
  return (
    <div ref={ref} className="rounded-2xl border bg-card p-6 text-center">
      <div className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {display}
        <span className="bg-gradient-to-r from-cyan-500 to-lime-500 bg-clip-text text-transparent">
          {suffix}
        </span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

/* ─────────────────────────  FEATURES  ───────────────────────── */

function Features() {
  const features = [
    { icon: Sparkles, name: "AI Strategy", d: "Positioning, ICP, messaging, funnel — auto-drafted." },
    { icon: Layers, name: "AI Content", d: "Blogs, posts, ads and long-form in your brand voice." },
    { icon: ImageIcon, name: "AI Image Generation", d: "On-brand images at scale, in seconds." },
    { icon: Video, name: "AI Video Generation", d: "Reels, ads and explainers from a prompt." },
    { icon: Globe, name: "Landing Pages", d: "Conversion-optimized pages, fully editable." },
    { icon: Mail, name: "Email Marketing", d: "Sequences, campaigns and drip flows." },
    { icon: Workflow, name: "Automation", d: "Visual workflows that trigger themselves." },
    { icon: BarChart3, name: "Analytics", d: "Cross-channel reporting that just works." },
    { icon: Send, name: "Publishing", d: "One click to LinkedIn, IG, X, Facebook." },
    { icon: Palette, name: "Brand Kit", d: "Colors, fonts, voice locked across every asset." },
    { icon: Search, name: "SEO", d: "Keyword research, on-page and pSEO." },
    { icon: Bot, name: "AI Agents", d: "Specialist agents you can hire, fire, and manage." },
  ];
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Everything you need"
          title="One platform. Every marketing job."
          description="Replace 20+ tools with a single AI-native workspace. Everything shares brand, memory and analytics."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-400/10 to-lime-400/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
                <div className="grid h-11 w-11 place-items-center rounded-xl border bg-gradient-to-br from-cyan-500/10 via-sky-500/10 to-lime-500/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-5 text-lg font-semibold">{f.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  HOW IT WORKS  ───────────────────────── */

function HowItWorks() {
  const steps = [
    { n: "01", title: "Describe your business", d: "Tell the AI what you're building — one paragraph is enough." },
    { n: "02", title: "AI builds complete campaign", d: "Strategy, content, images, video, landing pages, emails." },
    { n: "03", title: "Review everything", d: "Edit anything in one workspace. Approve, tweak, iterate." },
    { n: "04", title: "Publish everywhere", d: "LinkedIn, X, IG, Facebook, email — one click, all channels." },
  ];
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="How it works" title="Four steps to a full campaign." />
        <div className="relative mt-16">
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block" />
          <div className="grid gap-8 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border bg-card p-6"
              >
                <div className="flex h-16 w-16 -translate-y-14 items-center justify-center rounded-2xl border bg-background text-lg font-semibold text-primary shadow-sm">
                  {s.n}
                </div>
                <div className="-mt-6 text-xl font-semibold">{s.title}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  PRODUCT SHOWCASE  ───────────────────────── */

function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1]);

  const tabs = ["Dashboard", "Project Workspace", "AI Chat", "Analytics", "Campaign Builder", "Landing Pages", "Calendar"];
  const [active, setActive] = useState(0);

  return (
    <section className="relative py-28" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Product tour"
          title="A workspace that feels alive."
          description="From prompt to publish — every surface built for marketers who ship."
        />

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setActive(i)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition",
                active === i
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <motion.div style={{ rotateX, scale, perspective: 1600 }} className="mt-14">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-cyan-400/25 via-sky-500/20 to-lime-400/25 blur-2xl" />
            {/* MacBook frame */}
            <div className="relative rounded-[28px] border bg-neutral-900/95 p-3 shadow-2xl">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
                <MockDashboard tab={tabs[active]} />
              </div>
            </div>
            {/* base */}
            <div className="mx-auto h-3 w-[70%] rounded-b-[24px] bg-gradient-to-b from-neutral-900 to-neutral-800/60" />
            <div className="mx-auto -mt-1 h-1 w-[40%] rounded-full bg-neutral-900/60" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MockDashboard({ tab }: { tab: string }) {
  return (
    <div className="grid h-[420px] grid-cols-[200px_1fr] bg-neutral-950 text-white sm:h-[520px]">
      <aside className="border-r border-white/5 bg-neutral-950/80 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-cyan-400 to-lime-400">
            <Sparkles className="h-3 w-3 text-white" />
          </span>
          <span className="text-xs font-semibold">Marketing Cloud</span>
        </div>
        <ul className="mt-6 space-y-1 text-xs text-white/60">
          {["Home", "Projects", "Content", "Campaigns", "Analytics", "Brand", "Settings"].map((i) => (
            <li key={i} className="rounded-md px-2 py-1.5 hover:bg-white/5">
              {i}
            </li>
          ))}
        </ul>
      </aside>
      <main className="relative p-5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
          {tab}
        </div>
        <div className="mt-1 text-lg font-semibold">Q1 Launch Campaign</div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { l: "Impressions", v: "128K" },
            { l: "CTR", v: "4.6%" },
            { l: "Signups", v: "1,284" },
            { l: "Revenue", v: "$42K" },
          ].map((k) => (
            <div key={k.l} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] text-white/50">{k.l}</div>
              <div className="mt-1 text-lg font-semibold">{k.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-cyan-500/30 via-sky-500/20 to-lime-500/30"
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur">
          <Bot className="h-4 w-4 text-cyan-300" />
          <div className="text-xs text-white/80">
            AI: "Your engagement is up 24% — want me to double the ad budget on LinkedIn?"
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────  USE CASES  ───────────────────────── */

function UseCases() {
  const cases = [
    { icon: Rocket, label: "Startup" },
    { icon: Briefcase, label: "Agency" },
    { icon: Camera, label: "Creator" },
    { icon: Users, label: "Coach" },
    { icon: GraduationCap, label: "University" },
    { icon: Utensils, label: "Restaurant" },
    { icon: Heart, label: "Hospital" },
    { icon: Dumbbell, label: "Gym" },
    { icon: Home, label: "Real Estate" },
    { icon: ShoppingBag, label: "Ecommerce" },
    { icon: Building2, label: "SaaS" },
  ];
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Use cases"
          title="A template for every industry."
          description="Click any card to open a curated set of AI campaigns tuned for that industry."
        />
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cases.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to="/cloud/templates"
                  className="group relative flex aspect-[5/4] flex-col justify-between overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:border-primary hover:shadow-xl"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl border bg-gradient-to-br from-cyan-500/10 to-lime-500/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold">{c.label}</div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  AI AGENTS  ───────────────────────── */

function AIAgents() {
  const agents = [
    { name: "Marketing Strategist", role: "Positioning, funnels & GTM plans", tint: "from-cyan-400 to-sky-500" },
    { name: "Content Writer", role: "Blogs, ads, posts in your brand voice", tint: "from-sky-500 to-indigo-500" },
    { name: "SEO Expert", role: "Keywords, on-page and pSEO", tint: "from-lime-400 to-emerald-500" },
    { name: "Designer", role: "Brand images, banners and covers", tint: "from-fuchsia-400 to-pink-500" },
    { name: "Video Creator", role: "Reels, ads and explainers", tint: "from-amber-400 to-orange-500" },
    { name: "Email Expert", role: "Sequences, campaigns and drips", tint: "from-rose-400 to-red-500" },
    { name: "Automation Expert", role: "Multi-step workflows on autopilot", tint: "from-teal-400 to-cyan-500" },
    { name: "Analytics Expert", role: "Cross-channel dashboards & insight", tint: "from-violet-400 to-purple-500" },
    { name: "Publisher", role: "Schedule & publish everywhere", tint: "from-blue-400 to-sky-500" },
  ];
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="AI Agents"
          title="Meet your specialist team."
          description="Nine AI specialists working in your workspace — each with their own memory, tools and skills."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.04 }}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition hover:border-primary"
            >
              <div className="flex items-center gap-4">
                <div className={cn("relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg", a.tint)}>
                  <Bot className="h-6 w-6" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                </div>
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.role}</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border bg-background/60 p-3 text-xs text-muted-foreground">
                <span className="mr-1 font-medium text-primary">Task:</span>
                Drafts, refines and iterates. Learns your brand voice. Coordinates with the other agents.
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  TESTIMONIALS  ───────────────────────── */

function Testimonials() {
  const items = [
    { name: "Priya Shah", role: "Founder, Nimbus SaaS", q: "Replaced our agency in a week. Campaigns ship the same day we imagine them." },
    { name: "Marcus Lee", role: "Growth, Stackline", q: "We closed 3 tools and moved everything to AI Marketing Cloud. Zero regret." },
    { name: "Ana Torres", role: "CMO, Vortex Health", q: "The agents feel like real teammates. Onboarding took an afternoon." },
    { name: "Devon Park", role: "Creator", q: "It's the first time posting daily didn't feel like a job." },
    { name: "Jules Werner", role: "Agency Owner", q: "Margins doubled. Client turnaround dropped from 3 weeks to 3 days." },
    { name: "Rina Kapoor", role: "Head of Marketing", q: "Enterprise-grade, but I can teach my intern to run it." },
  ];
  const row = [...items, ...items];
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Customers" title="Loved by modern marketing teams." />
      </div>
      <div className="mt-14 space-y-4 overflow-hidden">
        <Marquee items={row} direction="left" />
        <Marquee items={row.slice().reverse()} direction="right" />
      </div>
    </section>
  );
}

function Marquee({
  items,
  direction,
}: {
  items: { name: string; role: string; q: string }[];
  direction: "left" | "right";
}) {
  return (
    <div className="group relative">
      <div
        className={cn(
          "flex gap-4 will-change-transform",
          direction === "left" ? "animate-[marquee_40s_linear_infinite]" : "animate-[marquee-reverse_40s_linear_infinite]",
        )}
      >
        {items.map((it, i) => (
          <div key={i} className="w-[340px] shrink-0 rounded-2xl border bg-card p-5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-3 text-sm">"{it.q}"</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-lime-400 text-xs font-semibold text-white">
                {it.name[0]}
              </div>
              <div>
                <div className="text-xs font-medium">{it.name}</div>
                <div className="text-[10px] text-muted-foreground">{it.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes marquee-reverse { from { transform: translateX(-50%) } to { transform: translateX(0) } }
      `}</style>
    </div>
  );
}

/* ─────────────────────────  PRICING  ───────────────────────── */

function Pricing() {
  const [yearly, setYearly] = useState(true);
  const plans = [
    { name: "Free", price: 0, yPrice: 0, tag: "Get started", features: ["3 AI projects", "Basic templates", "Community support"] },
    { name: "Starter", price: 29, yPrice: 24, tag: "Solo & indie", features: ["25 projects / mo", "All templates", "Basic publishing"] },
    { name: "Professional", price: 79, yPrice: 66, tag: "Most popular", featured: true, features: ["Unlimited projects", "AI Agents", "Team roles", "Publishing everywhere"] },
    { name: "Agency", price: 199, yPrice: 166, tag: "For agencies", features: ["10 workspaces", "White-label", "Client portals", "Priority support"] },
    { name: "Enterprise", price: null, yPrice: null, tag: "Talk to us", features: ["SSO / SAML", "Audit logs", "Private models", "Dedicated success"] },
  ];
  return (
    <section id="pricing" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Pricing"
          title="Simple, flexible, and 40% cheaper than your current stack."
          description="Start free. Upgrade only when the AI is running your marketing for you."
        />

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={cn("text-sm", !yearly && "font-medium")}>Monthly</span>
          <button
            onClick={() => setYearly((y) => !y)}
            className="relative h-6 w-11 rounded-full bg-muted transition"
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-gradient-to-br from-cyan-400 to-lime-400 transition",
                yearly ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
          <span className={cn("text-sm", yearly && "font-medium")}>
            Yearly <span className="ml-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-500">Save 17%</span>
          </span>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-5">
          {plans.map((p) => {
            const price = yearly ? p.yPrice : p.price;
            return (
              <div
                key={p.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-6",
                  p.featured && "border-primary shadow-2xl shadow-primary/10 lg:scale-[1.03]",
                )}
              >
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-lime-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                    Popular
                  </div>
                )}
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.tag}</div>
                <div className="mt-6 flex items-end gap-1">
                  {price === null ? (
                    <span className="text-3xl font-semibold">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-semibold">${price}</span>
                      <span className="mb-1 text-xs text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={p.name === "Enterprise" ? "/cloud/contact" : "/cloud/signup"} className="mt-6">
                  <Button
                    className={cn(
                      "w-full",
                      p.featured && "bg-gradient-to-r from-cyan-500 via-sky-500 to-lime-500 text-white",
                    )}
                    variant={p.featured ? "default" : "outline"}
                  >
                    {p.name === "Enterprise" ? "Contact sales" : "Start free"}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  FAQ  ───────────────────────── */

function FAQ() {
  const items = [
    { q: "Do I need any marketing experience?", a: "No. Describe your business in plain language — the AI does the rest, and you can edit anything." },
    { q: "How is this different from ChatGPT?", a: "ChatGPT gives text. AI Marketing Cloud produces complete campaigns — content, images, video, landing pages, emails and publishing — all in one workspace." },
    { q: "Can I keep my current tools?", a: "Yes. We integrate with LinkedIn, Instagram, X, Facebook, Google, Meta, HubSpot, Resend and more." },
    { q: "Is my brand data private?", a: "Yes. Your workspace is fully isolated with row-level security, and enterprise plans support private model routing." },
    { q: "Can I invite my team?", a: "Yes. Professional and Agency plans include roles, permissions and approval workflows." },
    { q: "Is there a free plan?", a: "Yes — 3 AI projects a month with full access to templates. No credit card required." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="FAQ" title="Answers to the important questions." />
        <div className="mt-12 divide-y overflow-hidden rounded-2xl border bg-card">
          {items.map((it, i) => (
            <div key={it.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-medium">{it.q}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", open === i && "rotate-180 text-primary")}
                />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-muted-foreground">{it.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  FINAL CTA  ───────────────────────── */

function FinalCTA() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border bg-gradient-to-br from-cyan-500/10 via-sky-500/10 to-lime-500/10 p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15),transparent_60%)]" />
          <h2 className="relative text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Ready to replace your <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-500 to-lime-400 bg-clip-text text-transparent">
              marketing team?
            </span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Start free. Generate your first complete campaign in under 5 minutes.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/cloud/signup">
              <Button size="lg" className="h-12 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-lime-500 px-6 text-base text-white">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/cloud/contact">
              <Button size="lg" variant="outline" className="h-12 rounded-xl px-6 text-base">
                Book Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  SHARED  ───────────────────────── */

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary backdrop-blur">
        <Sparkles className="h-3 w-3" />
        {eyebrow}
      </div>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
      {description && <p className="mt-3 text-pretty text-lg text-muted-foreground">{description}</p>}
    </div>
  );
}
