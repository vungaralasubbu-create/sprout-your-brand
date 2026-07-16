import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Palette,
  Globe,
  BookOpen,
  Megaphone,
  Search,
  Users,
  Wallet,
  Target,
  ShieldCheck,
  Server,
  Zap,
  Gauge,
  Rss,
  LayoutTemplate,
  Instagram,
  Mail,
  Award,
  LifeBuoy,
  BarChart3,
  Bot,
  Sparkles,
  ArrowRight,
  Check,
  Clock,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { AcademyGate } from "@/components/partner/academy-gate";

export const Route = createFileRoute("/_authenticated/partner/academy/workspace")({
  head: () => ({
    meta: [
      { title: "Academy Workspace — Glintr Managed" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AcademyGate>
      <Workspace />
    </AcademyGate>
  ),
});

const ONBOARDING_KEY = "glintr.partner.academy.onboarding.v1";

type Answers = Record<string, string> & { done?: boolean };

function useAnswers(): Answers {
  const [a, setA] = useState<Answers>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setA({ ...(p.answers ?? {}), done: !!p.done });
      }
    } catch { /* noop */ }
  }, []);
  return a;
}

type ProgressCard = {
  key: string;
  label: string;
  icon: LucideIcon;
  pct: number;
  detail: string;
};

const PROGRESS: ProgressCard[] = [
  { key: "brand", label: "Brand", icon: Palette, pct: 92, detail: "Logo, palette, voice ready" },
  { key: "website", label: "Website", icon: Globe, pct: 78, detail: "12 pages drafted, awaiting review" },
  { key: "course", label: "Courses", icon: BookOpen, pct: 45, detail: "3 programs, 12 modules drafted" },
  { key: "marketing", label: "Marketing", icon: Megaphone, pct: 60, detail: "Campaign calendar prepared" },
  { key: "seo", label: "SEO", icon: Search, pct: 70, detail: "Schema, sitemap, 40 keywords indexed" },
  { key: "students", label: "Student Growth", icon: Users, pct: 22, detail: "Portal live, first cohort onboarding" },
  { key: "revenue", label: "Revenue", icon: Wallet, pct: 18, detail: "Pricing, checkout, refunds configured" },
  { key: "leads", label: "Lead Generation", icon: Target, pct: 34, detail: "Forms + CRM routing active" },
];

const MANAGED: { label: string; icon: LucideIcon }[] = [
  { label: "Website Management", icon: Globe },
  { label: "Hosting", icon: Server },
  { label: "Security", icon: ShieldCheck },
  { label: "Performance", icon: Gauge },
  { label: "SEO", icon: Search },
  { label: "Blog Publishing", icon: Rss },
  { label: "Landing Pages", icon: LayoutTemplate },
  { label: "Social Media", icon: Instagram },
  { label: "Email Marketing", icon: Mail },
  { label: "Certificates", icon: Award },
  { label: "Student Support", icon: LifeBuoy },
  { label: "Analytics", icon: BarChart3 },
  { label: "CRM", icon: Users },
  { label: "AI Automation", icon: Zap },
];

function Workspace() {
  const answers = useAnswers();
  const academyName = answers.name || "Your Academy";
  const subjects = answers.subjects || "your programs";
  const audience = answers.audience || "your ideal students";

  const priorities = [
    `Record intro video for the flagship program on ${subjects.split(",")[0] || "your subject"}.`,
    `Approve 3 new blog drafts prepared by AI Content Writer.`,
    `Reply to 5 hot leads from ${audience}.`,
  ];
  const marketingRecs = [
    `Run a 7-day awareness campaign targeting ${audience}.`,
    `Launch a lead magnet: "Free starter kit for ${subjects.split(",")[0] || "sales professionals"}".`,
  ];
  const seoRecs = [
    "Add FAQ schema to 6 course pages to lift SERP CTR.",
    "Publish 2 comparison articles targeting long-tail queries.",
  ];
  const leadRecs = [
    "Follow up with 3 warm leads that opened brochures twice.",
    "Send a re-engagement email to 24 inactive leads.",
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-caption font-mono uppercase tracking-widest text-primary">Academy Workspace</div>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">{academyName}</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Focus on teaching and growth. Glintr is running your technology, marketing, SEO, design, content and operations behind the scenes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/partner/ai-employees" className="rounded-xl border bg-white px-3 py-2 text-sm hover:border-primary/40 inline-flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> AI Employees
          </Link>
          <Link to="/partner/brand-studio" className="rounded-xl border bg-white px-3 py-2 text-sm hover:border-primary/40">
            Brand Studio
          </Link>
        </div>
      </header>

      {/* Progress */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">Live progress</h2>
          <span className="text-xs text-muted-foreground">Updated continuously by AI Operations</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PROGRESS.map((p) => (
            <div key={p.key} className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <p.icon className="size-4 text-primary" />
                <div className="text-sm font-medium">{p.label}</div>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${p.pct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{p.detail}</span>
                <span className="font-mono">{p.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Business Manager */}
      <section className="rounded-3xl border bg-gradient-to-br from-primary/5 via-white to-emerald-50 p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-5">
          <div className="inline-flex size-11 items-center justify-center rounded-xl bg-white shadow-sm">
            <Bot className="size-5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">AI Business Manager · Today</div>
            <h3 className="font-display text-xl font-semibold tracking-tight">
              Good morning. Here's what your Glintr team recommends today.
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BriefingCard title="Today's priorities" icon={ListChecks} items={priorities} />
          <BriefingCard title="Marketing recommendations" icon={Megaphone} items={marketingRecs} />
          <BriefingCard title="SEO recommendations" icon={Search} items={seoRecs} />
          <BriefingCard title="Lead recommendations" icon={Target} items={leadRecs} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/partner/ai-employees/$slug"
            params={{ slug: "ai-ceo" }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border px-3 py-1.5 text-xs hover:border-primary/40"
          >
            Full briefing from AI CEO <ArrowRight className="size-3.5" />
          </Link>
          <Link
            to="/partner/ai-employees/$slug"
            params={{ slug: "ai-analytics-manager" }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border px-3 py-1.5 text-xs hover:border-primary/40"
          >
            Weekly analytics <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* Managed by Glintr */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-700">Managed Services</div>
            <h2 className="font-display text-lg font-semibold tracking-tight">Managed by Glintr</h2>
          </div>
          <span className="text-xs text-muted-foreground">Included with your revenue-share partnership</span>
        </div>
        <div className="rounded-3xl border bg-white p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {MANAGED.map((m) => (
              <div key={m.label} className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <m.icon className="size-4 text-muted-foreground" />
                  <span>{m.label}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                  <Check className="size-3.5" /> Managed
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            No DNS, no hosting, no plugins. Your Glintr team owns infrastructure, publishing, and operations —
            you own teaching, selling, and student experience.
          </p>
        </div>
      </section>

      {/* Approval queue teaser */}
      <section className="rounded-2xl border bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="size-5" />
          </div>
          <div>
            <div className="font-medium">Nothing publishes without your approval</div>
            <p className="text-sm text-muted-foreground">
              All drafts sit in your review queue until you or a Glintr admin approves.
            </p>
          </div>
        </div>
        <Link to="/partner/ai-employees" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          View AI Employees & drafts <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}

function BriefingCard({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4 text-primary" />
        <div className="text-sm font-medium">{title}</div>
      </div>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-2 size-1 rounded-full bg-primary/60 shrink-0" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
