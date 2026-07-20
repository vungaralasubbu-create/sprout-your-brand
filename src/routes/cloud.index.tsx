import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  ArrowRight,
  Play,
  Wand2,
  Layers,
  Mail,
  Image as ImageIcon,
  Calendar,
  BarChart3,
  Check,
  Zap,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/cloud/")({
  head: () => ({
    meta: [
      { title: "AI Marketing Cloud — Generate Complete Campaigns with AI" },
      {
        name: "description",
        content:
          "Describe your business. AI creates your marketing strategy, content, images, emails, landing pages and publishing calendar automatically.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <>
      <Hero />
      <TrustedBy />
      <HowItWorks />
      <FeaturesGrid />
      <TemplatesTeaser />
      <Testimonials />
      <PricingTeaser />
      <FAQ />
      <FinalCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-lime-500/20 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="muted" className="mb-6">
            <Sparkles className="mr-1.5 h-3 w-3" /> Now with GPT-5 & Gemini 3
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Generate Complete Marketing
            <br />
            Campaigns with{" "}
            <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-lime-500 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Describe your business. AI creates your complete marketing strategy, content, images,
            emails, landing pages and publishing calendar automatically.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/cloud/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <Play className="mr-2 h-4 w-4" /> Watch demo
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · 14-day free trial
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl border bg-card/70 p-2 shadow-2xl shadow-sky-500/10 backdrop-blur">
            <div className="rounded-xl border bg-gradient-to-br from-background to-muted/40 p-8">
              <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <div className="ml-2">app.marketing.yourdomain.com</div>
              </div>
              <div className="rounded-xl border bg-background p-6">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Prompt
                </label>
                <div className="mt-2 text-lg">
                  "Launch a 30-day campaign for our new SaaS to acquire 500 sign-ups from
                  founders."
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Strategy",
                    "24 posts",
                    "12 creatives",
                    "3 emails",
                    "Landing page",
                    "Calendar",
                  ].map((c) => (
                    <span
                      key={c}
                      className="rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="border-y bg-muted/20 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted by teams at
        </p>
        <div className="mt-6 grid grid-cols-2 items-center justify-items-center gap-6 opacity-60 sm:grid-cols-3 md:grid-cols-6">
          {["Northwind", "Acme", "Circular", "Lumen", "Vertex", "Halcyon"].map((n) => (
            <div key={n} className="text-lg font-semibold tracking-tight">
              {n}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Wand2, title: "Describe your goal", body: "One prompt — no templates required." },
    { icon: Sparkles, title: "AI generates everything", body: "Strategy, content, images, emails, landing page." },
    { icon: Layers, title: "Review & approve", body: "Unified review center with per-asset approvals." },
    { icon: Calendar, title: "Publish & measure", body: "Schedule across channels and track results." },
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader kicker="How it works" title="From prompt to published — in minutes" />
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-2xl border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-medium text-muted-foreground">Step {i + 1}</div>
                <div className="mt-1 text-lg font-semibold">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    { icon: Wand2, title: "AI Strategy", body: "Positioning, audience, channels, KPIs — generated for your brand." },
    { icon: Layers, title: "Content at scale", body: "Posts for LinkedIn, X, Instagram, Facebook — on brand." },
    { icon: ImageIcon, title: "On-brand creatives", body: "Generated images and posters that match your visual identity." },
    { icon: Mail, title: "Email sequences", body: "Full drip campaigns, ready to send from your domain." },
    { icon: Calendar, title: "Publishing calendar", body: "Schedule and publish across every channel from one place." },
    { icon: BarChart3, title: "Analytics", body: "Attribution, conversions and AI recommendations built in." },
  ];
  return (
    <section className="border-t bg-muted/20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Features"
          title="Everything a marketing team needs — automated"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border bg-card p-6 transition hover:shadow-lg"
              >
                <Icon className="h-6 w-6 text-primary" />
                <div className="mt-4 text-lg font-semibold">{f.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TemplatesTeaser() {
  const templates = [
    "SaaS product launch",
    "Webinar promotion",
    "30-day LinkedIn campaign",
    "Ecommerce sale",
    "Course launch",
    "Investor announcement",
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader kicker="Templates" title="Start from a proven playbook" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Link
              key={t}
              to="/cloud/templates"
              className="group flex items-center justify-between rounded-xl border bg-card p-5 transition hover:border-primary hover:bg-primary/5"
            >
              <span className="font-medium">{t}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      q: "We shipped a full campaign in 47 minutes. That used to take our team a week.",
      a: "Priya Menon",
      r: "Head of Growth, Northwind",
    },
    {
      q: "The best part — everything is on-brand. Not a single fix needed on our brand voice.",
      a: "Diego Alvarez",
      r: "CMO, Circular",
    },
    {
      q: "Analytics and publishing in the same tool made our team 3x faster.",
      a: "Aisha Rahman",
      r: "Marketing Lead, Vertex",
    },
  ];
  return (
    <section className="border-t bg-muted/20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader kicker="Testimonials" title="Loved by modern marketing teams" />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {items.map((t) => (
            <div key={t.a} className="rounded-2xl border bg-card p-6">
              <p className="text-base leading-relaxed">"{t.q}"</p>
              <div className="mt-4 text-sm font-medium">{t.a}</div>
              <div className="text-xs text-muted-foreground">{t.r}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader kicker="Pricing" title="Start free. Scale when you're ready." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { name: "Free", price: "$0", body: "For solo marketers exploring the platform.", cta: "Start free" },
            { name: "Professional", price: "$49", body: "For growing teams shipping weekly.", cta: "Start Pro trial", featured: true },
            { name: "Enterprise", price: "Custom", body: "For agencies and larger teams.", cta: "Contact sales" },
          ].map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border bg-card p-8 ${
                p.featured ? "border-primary shadow-xl shadow-primary/10" : ""
              }`}
            >
              <div className="text-sm font-medium text-muted-foreground">{p.name}</div>
              <div className="mt-2 text-4xl font-semibold">{p.price}</div>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              <Link to="/cloud/pricing">
                <Button
                  className="mt-6 w-full"
                  variant={p.featured ? "primary" : "outline"}
                >
                  {p.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/cloud/pricing" className="text-sm text-primary hover:underline">
            See full pricing →
          </Link>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    ["Can I try it for free?", "Yes — every new workspace gets 14 days on the Professional plan, no credit card."],
    ["Does the AI stay on brand?", "Yes. Onboarding captures your brand voice, colors, and fonts — every asset uses them."],
    ["Can I publish to Instagram, LinkedIn and email?", "Yes. Connect accounts once — schedule and publish from the calendar."],
    ["Can teams collaborate?", "Yes. Invite teammates with Owner, Admin, Editor or Viewer roles."],
  ];
  return (
    <section className="border-t bg-muted/20 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader kicker="FAQ" title="Frequently asked questions" />
        <dl className="mt-10 space-y-4">
          {items.map(([q, a]) => (
            <details key={q} className="group rounded-xl border bg-card p-5 open:shadow">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {q}
                <span className="text-muted-foreground transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-cyan-500/10 via-sky-500/10 to-lime-500/10 p-10 text-center sm:p-16">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Your next campaign is one prompt away.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start free. Generate a full campaign in under an hour.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/cloud/signup">
              <Button size="lg">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/cloud/contact">
              <Button size="lg" variant="outline">
                Talk to sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">{kicker}</div>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
    </div>
  );
}
