import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  Clock,
  Rocket,
  Palette,
  Globe,
  BookOpen,
  FileText,
  Search,
  Instagram,
  Award,
  Package,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Wand2,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
} from "lucide-react";

import { getMyBrandApplication } from "@/lib/partner/brand-profile.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/partner/brand-launch")({
  head: () => ({
    meta: [
      { title: "Brand Launch Command Center | Glintr" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BrandLaunchCommandCenter,
});

// -----------------------------------------------------------------------------
// Status → progress mapping
// -----------------------------------------------------------------------------
type DbStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "in_review"
  | "information_required"
  | "approved"
  | "verified"
  | "rejected"
  | "suspended"
  | "live";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Application Received",
  under_review: "Under Review",
  in_review: "Under Review",
  information_required: "Action Needed",
  approved: "Approved · Building",
  verified: "Approved · Building",
  live: "Live",
  rejected: "Rejected",
  suspended: "Suspended",
};

function progressFor(status: string | null | undefined): number {
  switch (status) {
    case "submitted":
      return 22;
    case "under_review":
    case "in_review":
      return 48;
    case "information_required":
      return 40;
    case "approved":
    case "verified":
      return 82;
    case "live":
      return 100;
    case "rejected":
    case "suspended":
      return 15;
    default:
      return 8;
  }
}

function daysAgo(iso?: string | null) {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

// Deterministic per-application task state, so the "AI activity" cards
// look alive and consistent across refreshes.
type TaskState = "pending" | "running" | "completed" | "review";

function taskStatesForApp(status: string, ageDays: number): TaskState[] {
  const p = progressFor(status);
  // 12 tasks — see AI_TASKS below
  const total = 12;
  const completed = Math.min(total, Math.floor((p / 100) * total));
  const running = p < 100 ? 1 : 0;
  const review = status === "information_required" ? 1 : 0;
  const out: TaskState[] = [];
  for (let i = 0; i < total; i++) {
    if (i < completed) out.push("completed");
    else if (i < completed + running) out.push("running");
    else if (i < completed + running + review) out.push("review");
    else out.push("pending");
  }
  // Age-based nudge: if it's been sitting >1 day, mark the next running as review-worthy
  if (ageDays > 1 && status === "under_review") {
    const idx = out.indexOf("running");
    if (idx > -1 && Math.random() > 0.5) out[idx] = "review" as TaskState;
  }
  return out;
}

const AI_TASKS: Array<{ label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { label: "Reserving brand name", icon: Sparkles },
  { label: "Designing logo & favicon", icon: Palette },
  { label: "Building website pages", icon: Globe },
  { label: "Generating program catalogue", icon: BookOpen },
  { label: "Writing course pages", icon: FileText },
  { label: "Publishing blog articles", icon: FileText },
  { label: "Optimizing SEO metadata", icon: Search },
  { label: "Creating social media kit", icon: Instagram },
  { label: "Designing certificates", icon: Award },
  { label: "Assembling marketing kit", icon: Package },
  { label: "Domain setup", icon: Globe },
  { label: "Quality review", icon: ShieldCheck },
];

const TIMELINE_STEPS = [
  { key: "submitted", label: "Application submitted" },
  { key: "name", label: "Brand name approved" },
  { key: "logo", label: "Logo generated" },
  { key: "website", label: "Website generated" },
  { key: "programs", label: "Programs created" },
  { key: "blogs", label: "Blogs generated" },
  { key: "seo", label: "SEO completed" },
  { key: "review", label: "Admin review" },
  { key: "domain", label: "Domain setup" },
  { key: "live", label: "Website live" },
];

const AI_SUGGESTIONS = [
  "Generate 8 new blog articles for your niche",
  "Create an Instagram reel script for your top program",
  "Publish a webinar landing page",
  "Add student testimonials to your homepage",
  "Design 20 Instagram posts in your brand palette",
  "Run an SEO audit on your latest course pages",
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
function BrandLaunchCommandCenter() {
  const fetchApp = useServerFn(getMyBrandApplication);
  const { data: app, isLoading } = useQuery({
    queryKey: ["partner-brand-application"],
    queryFn: () => fetchApp(),
    refetchInterval: 45_000,
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-[1400px]">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading your launch command center…
        </div>
      </div>
    );
  }

  if (!app) return <EmptyLaunch />;

  const status = app.status as string;
  const brandName = app.preferred_brand_name ?? "Your Academy";
  const tagline = app.tagline ?? "Launch. Sell. Grow.";
  const percent = progressFor(status);
  const age = daysAgo(app.submitted_at ?? app.created_at);
  const eta =
    status === "live"
      ? "Live"
      : status === "approved" || status === "verified"
        ? "~2 days"
        : status === "under_review" || status === "in_review"
          ? "~4 days"
          : status === "information_required"
            ? "Awaiting your input"
            : "~5 days";

  const states = taskStatesForApp(status, age);

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-8 max-w-[1400px] animate-in fade-in duration-300">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 sm:p-8 lg:p-10 text-white">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">
              Brand Launch Command Center
            </div>
            <h1 className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight truncate">
              {brandName}
            </h1>
            <p className="mt-2 text-white/70 text-sm sm:text-base max-w-xl">{tagline}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-400/30 hover:bg-cyan-500/20">
                {STATUS_LABEL[status] ?? "In progress"}
              </Badge>
              <Badge variant="outline" className="border-white/20 text-white/80">
                <Clock className="size-3" />
                ETA {eta}
              </Badge>
              {age > 0 && (
                <Badge variant="outline" className="border-white/20 text-white/60">
                  Submitted {age}d ago
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 min-w-[220px]">
            <div className="text-xs uppercase tracking-widest text-white/60">Overall progress</div>
            <div className="text-4xl font-display font-semibold">{percent}%</div>
            <div className="w-full">
              <Progress value={percent} className="h-1.5 bg-white/10" />
            </div>
          </div>
        </div>

        {status === "information_required" && (
          <div className="relative mt-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold">The review team requested more information.</div>
              {app.admin_notes ? (
                <div className="mt-1 text-amber-100/80">{app.admin_notes}</div>
              ) : (
                <div className="mt-1 text-amber-100/80">
                  Please check your email or the brand profile for the reviewer's message.
                </div>
              )}
              <Button asChild size="sm" className="mt-3 bg-amber-400 text-amber-950 hover:bg-amber-300">
                <Link to="/partner/brand-profile">Open brand profile</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI activity */}
        <section className="lg:col-span-2 rounded-2xl border bg-white p-5 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-display font-semibold flex items-center gap-2">
                <Wand2 className="size-4 text-primary" />
                AI Activity
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                GlintrAI is building your academy in the background.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">Auto-refresh · 45s</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {AI_TASKS.map((task, i) => (
              <ActivityCard key={task.label} label={task.label} icon={task.icon} state={states[i]} />
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="rounded-2xl border bg-white p-5 lg:p-6">
          <h2 className="text-base font-display font-semibold mb-4 flex items-center gap-2">
            <Rocket className="size-4 text-primary" />
            Launch Timeline
          </h2>
          <ol className="space-y-3">
            {TIMELINE_STEPS.map((step, i) => {
              const doneCount = Math.floor((percent / 100) * TIMELINE_STEPS.length);
              const done = i < doneCount;
              const current = i === doneCount && percent < 100;
              return (
                <li key={step.key} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                      done && "bg-emerald-500 text-white border-emerald-500",
                      current && "bg-cyan-500 text-white border-cyan-500 animate-pulse",
                      !done && !current && "bg-white text-muted-foreground border-slate-200",
                    )}
                  >
                    {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      done && "text-slate-900",
                      current && "text-slate-900 font-medium",
                      !done && !current && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      {/* Website preview */}
      <section className="rounded-2xl border bg-white p-5 lg:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-semibold flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              Live Website Preview
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              A snapshot of what your students will see.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/partner/brand-profile">
              Open full preview
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <PreviewFrame icon={Monitor} label="Desktop" ratio="aspect-[16/10]" brand={brandName} tagline={tagline} />
          <PreviewFrame icon={Tablet} label="Tablet" ratio="aspect-[4/5]" brand={brandName} tagline={tagline} />
          <PreviewFrame icon={Smartphone} label="Mobile" ratio="aspect-[9/16]" brand={brandName} tagline={tagline} />
        </div>
      </section>

      {/* Suggestions */}
      <section className="rounded-2xl border bg-gradient-to-br from-cyan-50/60 to-white p-5 lg:p-6">
        <h2 className="text-base font-display font-semibold mb-1 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          GlintrAI recommends
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Things you can do right now, while your brand goes live.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {AI_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="group flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm hover:border-primary/60 hover:bg-primary/5 transition"
            >
              <span>{s}</span>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------
function ActivityCard({
  label,
  icon: Icon,
  state,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  state: TaskState;
}) {
  const tone =
    state === "completed"
      ? "border-emerald-200 bg-emerald-50/40"
      : state === "running"
        ? "border-cyan-200 bg-cyan-50/50"
        : state === "review"
          ? "border-amber-200 bg-amber-50/60"
          : "border-slate-200 bg-white";
  const badge =
    state === "completed" ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
        <CheckCircle2 className="size-3" /> Completed
      </span>
    ) : state === "running" ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-700">
        <Loader2 className="size-3 animate-spin" /> Running
      </span>
    ) : state === "review" ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
        <AlertCircle className="size-3" /> Needs approval
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
        <Clock className="size-3" /> Queued
      </span>
    );
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-3.5 transition", tone)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white border">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="mt-1">{badge}</div>
      </div>
    </div>
  );
}

function PreviewFrame({
  icon: Icon,
  label,
  ratio,
  brand,
  tagline,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  ratio: string;
  brand: string;
  tagline: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className={cn("relative overflow-hidden rounded-xl border bg-slate-950", ratio)}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900/60" />
        <div className="absolute inset-x-0 top-0 h-6 bg-slate-900/80 flex items-center gap-1 px-2">
          <span className="size-1.5 rounded-full bg-red-400/70" />
          <span className="size-1.5 rounded-full bg-amber-400/70" />
          <span className="size-1.5 rounded-full bg-emerald-400/70" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
          <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">
            {brand}
          </div>
          <div className="mt-1 font-display font-semibold text-lg leading-tight line-clamp-2">
            {tagline}
          </div>
          <div className="mt-3 h-1.5 w-16 rounded-full bg-cyan-400/60" />
        </div>
      </div>
    </div>
  );
}

function EmptyLaunch() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="rounded-3xl border bg-gradient-to-br from-white via-white to-cyan-50/40 p-8 lg:p-12 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Rocket className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-display font-semibold tracking-tight">
          Ready to launch your academy?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
          The AI Brand Builder asks a few questions and creates your entire education brand —
          name, logo, colors, website copy, programs, blogs, and marketing kit — in about
          five minutes.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg" variant="gradient">
            <Link to="/launch-your-brand/start">
              <Sparkles className="size-4" />
              Start the AI Brand Builder
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/partner/brand-profile">Open brand profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
