import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  Palette,
  Share2,
  Globe,
  Target,
  Wand2,
  CheckCircle2,
  Rocket,
  BarChart3,
  Loader2,
  ChevronRight,
  Check,
} from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { createMarketingProject } from "@/lib/marketing-os/projects.functions";

export const Route = createFileRoute("/marketing-cloud")({
  head: () => ({
    meta: [
      { title: "AI Marketing Cloud — Launch a Full Campaign in Minutes | Glintr" },
      {
        name: "description",
        content:
          "Sign up, connect your brand and channels, describe your goal, and let Glintr AI create, review, publish, and measure your entire marketing campaign.",
      },
      { property: "og:title", content: "AI Marketing Cloud | Glintr" },
      {
        property: "og:description",
        content:
          "One prompt. A full campaign — content, creatives, landing page, emails, calendar, and analytics.",
      },
    ],
  }),
  component: MarketingCloudOnboarding,
});

const STORAGE_KEY = "glintr_mc_onboarding_v1";

type OnboardingState = {
  workspace: string;
  brandName: string;
  brandTagline: string;
  brandColor: string;
  website: string;
  socials: { instagram: boolean; facebook: boolean; linkedin: boolean; x: boolean };
  goal: string;
};

const DEFAULT_STATE: OnboardingState = {
  workspace: "",
  brandName: "",
  brandTagline: "",
  brandColor: "#22D3EE",
  website: "",
  socials: { instagram: false, facebook: false, linkedin: false, x: false },
  goal: "",
};

const STEPS = [
  { id: "signup", label: "Sign Up", icon: Sparkles },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "socials", label: "Social", icon: Share2 },
  { id: "website", label: "Website", icon: Globe },
  { id: "goal", label: "Goal", icon: Target },
  { id: "generate", label: "AI Creates", icon: Wand2 },
  { id: "review", label: "Review", icon: CheckCircle2 },
  { id: "publish", label: "Publish", icon: Rocket },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function MarketingCloudOnboarding() {
  const navigate = useNavigate();
  const createProject = useServerFn(createMarketingProject);

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [creating, setCreating] = useState(false);

  // Hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({ ...DEFAULT_STATE, ...parsed.state });
        if (typeof parsed.stepIdx === "number") setStepIdx(parsed.stepIdx);
      }
    } catch {}
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setUserEmail(data.user?.email ?? null);
      if (data.user && stepIdx === 0) setStepIdx(1);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session?.user);
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, stepIdx }));
    } catch {}
  }, [state, stepIdx]);

  const step = STEPS[stepIdx];
  const canBack = stepIdx > 0 && step.id !== "generate";
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  const canNext = useMemo(() => {
    switch (step.id) {
      case "signup":
        return authed === true;
      case "workspace":
        return state.workspace.trim().length >= 2;
      case "brand":
        return state.brandName.trim().length >= 2;
      case "socials":
        return true;
      case "website":
        return true;
      case "goal":
        return state.goal.trim().length >= 12;
      default:
        return true;
    }
  }, [step.id, authed, state]);

  const next = () => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  const handleGenerate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const compiledPrompt = [
        state.goal.trim(),
        "",
        `Brand: ${state.brandName}${state.brandTagline ? ` — ${state.brandTagline}` : ""}`,
        state.website ? `Website: ${state.website}` : null,
        `Workspace: ${state.workspace}`,
      ]
        .filter(Boolean)
        .join("\n");
      const res = await createProject({ data: { prompt: compiledPrompt } });
      toast.success("Project created. Glintr AI is generating your campaign.");
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      navigate({ to: "/workspace/project/$projectId", params: { projectId: res.project.id } as any });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create project");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Section className="pt-10 pb-24">
        <Container>
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <Badge variant="muted" className="mb-4">
                <Sparkles className="mr-1.5 h-3 w-3" /> AI Marketing Cloud
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                Launch a full campaign — in one prompt
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Sign up, connect your brand, describe your goal. Glintr AI creates content,
                creatives, landing pages, emails, and a calendar — you review, publish, and measure.
              </p>
            </div>

            <StepRail stepIdx={stepIdx} onJump={(i) => i < stepIdx && setStepIdx(i)} />

            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
              <StepContent
                stepId={step.id}
                state={state}
                setState={setState}
                authed={authed}
                userEmail={userEmail}
                creating={creating}
                onGenerate={handleGenerate}
              />

              {step.id !== "generate" && (
                <div className="mt-10 flex items-center justify-between border-t pt-6">
                  <Button variant="ghost" onClick={back} disabled={!canBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Step {stepIdx + 1} of {STEPS.length}
                  </div>
                  {stepIdx < STEPS.length - 1 ? (
                    <Button onClick={next} disabled={!canNext}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => navigate({ to: "/admin/marketing-os" as any })}>
                      Open Marketing OS
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}

function StepRail({ stepIdx, onJump }: { stepIdx: number; onJump: (i: number) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < stepIdx;
        const active = i === stepIdx;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(i)}
            disabled={i > stepIdx}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active && "border-primary bg-primary/10 text-primary",
              done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              !active && !done && "border-border text-muted-foreground opacity-70",
            )}
          >
            {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{s.label}</span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="ml-0.5 hidden h-3 w-3 opacity-40 sm:inline" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function StepContent(props: {
  stepId: StepId;
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
  authed: boolean | null;
  userEmail: string | null;
  creating: boolean;
  onGenerate: () => void;
}) {
  const { stepId, state, setState, authed, userEmail, creating, onGenerate } = props;

  const patch = (p: Partial<OnboardingState>) => setState((s) => ({ ...s, ...p }));

  switch (stepId) {
    case "signup":
      return (
        <StepShell
          eyebrow="Step 1"
          title="Create your account"
          subtitle="Anyone can sign up. Free to start — no credit card required."
        >
          {authed ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div className="text-sm">
                <div className="font-medium">Signed in as {userEmail}</div>
                <div className="text-muted-foreground">Continue to set up your workspace.</div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/auth"
                search={{ redirect: "/marketing-cloud" } as any}
                className="rounded-xl border bg-primary p-5 text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <div className="text-lg font-semibold">Sign up free</div>
                <div className="mt-1 text-sm opacity-90">Phone OTP or Google — 20 seconds.</div>
                <div className="mt-4 inline-flex items-center text-sm font-medium">
                  Get started <ArrowRight className="ml-1.5 h-4 w-4" />
                </div>
              </Link>
              <Link
                to="/auth"
                search={{ redirect: "/marketing-cloud" } as any}
                className="rounded-xl border bg-muted p-5 transition hover:bg-muted/70"
              >
                <div className="text-lg font-semibold">I already have an account</div>
                <div className="mt-1 text-sm text-muted-foreground">Sign in to continue.</div>
                <div className="mt-4 inline-flex items-center text-sm font-medium">
                  Sign in <ArrowRight className="ml-1.5 h-4 w-4" />
                </div>
              </Link>
            </div>
          )}
        </StepShell>
      );

    case "workspace":
      return (
        <StepShell
          eyebrow="Step 2"
          title="Name your workspace"
          subtitle="Your workspace is where projects, brand assets, and analytics live."
        >
          <div className="max-w-md">
            <Label htmlFor="ws">Workspace name</Label>
            <Input
              id="ws"
              autoFocus
              placeholder="Acme Marketing"
              value={state.workspace}
              onChange={(e) => patch({ workspace: e.target.value })}
              className="mt-2"
            />
          </div>
        </StepShell>
      );

    case "brand":
      return (
        <StepShell
          eyebrow="Step 3"
          title="Connect your brand"
          subtitle="AI uses this everywhere — content, creatives, emails, landing pages."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bn">Brand name *</Label>
              <Input
                id="bn"
                placeholder="Acme"
                value={state.brandName}
                onChange={(e) => patch({ brandName: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="bt">Tagline</Label>
              <Input
                id="bt"
                placeholder="Launch. Sell. Grow."
                value={state.brandTagline}
                onChange={(e) => patch({ brandTagline: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="bc">Primary color</Label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="bc"
                  type="color"
                  value={state.brandColor}
                  onChange={(e) => patch({ brandColor: e.target.value })}
                  className="h-10 w-14 cursor-pointer rounded-md border bg-transparent"
                />
                <Input
                  value={state.brandColor}
                  onChange={(e) => patch({ brandColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        </StepShell>
      );

    case "socials": {
      const platforms = [
        { key: "instagram", label: "Instagram" },
        { key: "facebook", label: "Facebook" },
        { key: "linkedin", label: "LinkedIn" },
        { key: "x", label: "X (Twitter)" },
      ] as const;
      return (
        <StepShell
          eyebrow="Step 4"
          title="Connect social accounts"
          subtitle="Publish to any channel later — pick which ones you'll use."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {platforms.map((p) => {
              const on = state.socials[p.key];
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() =>
                    patch({ socials: { ...state.socials, [p.key]: !on } })
                  }
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4 text-left transition",
                    on ? "border-primary bg-primary/5" : "hover:bg-muted",
                  )}
                >
                  <div>
                    <div className="font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {on ? "Selected" : "Tap to select"}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border",
                      on && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            You can OAuth-connect each account after your project is created from the workspace's
            Social Accounts panel.
          </p>
        </StepShell>
      );
    }

    case "website":
      return (
        <StepShell
          eyebrow="Step 5"
          title="Connect your website"
          subtitle="We'll use it for tone, keywords, and existing brand voice."
        >
          <div className="max-w-md">
            <Label htmlFor="site">Website URL</Label>
            <Input
              id="site"
              type="url"
              placeholder="https://yourbrand.com"
              value={state.website}
              onChange={(e) => patch({ website: e.target.value })}
              className="mt-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Optional — you can skip and add later.
            </p>
          </div>
        </StepShell>
      );

    case "goal":
      return (
        <StepShell
          eyebrow="Step 6"
          title="Describe your goal"
          subtitle="One sentence is enough. Glintr AI takes care of the rest."
        >
          <div>
            <Label htmlFor="goal">What do you want to launch?</Label>
            <Textarea
              id="goal"
              autoFocus
              placeholder="Launch a 4-week campaign to drive signups for our new AI onboarding course. Target working professionals in India."
              value={state.goal}
              onChange={(e) => patch({ goal: e.target.value })}
              rows={5}
              className="mt-2"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Announce a new product launch across all channels",
                "Grow Instagram followers for a coaching brand",
                "Run a 2-week lead-gen campaign for a webinar",
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => patch({ goal: p })}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button size="lg" onClick={onGenerate} disabled={state.goal.trim().length < 12}>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate campaign
            </Button>
          </div>
        </StepShell>
      );

    case "generate":
      return (
        <StepShell
          eyebrow="Step 7"
          title="Glintr AI is creating everything"
          subtitle="Content, creatives, landing page, emails, and calendar — all at once."
        >
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Setting up your project workspace…
            </p>
            {!creating && (
              <Button className="mt-6" onClick={onGenerate}>
                <Wand2 className="mr-2 h-4 w-4" />
                Start generation
              </Button>
            )}
          </div>
        </StepShell>
      );

    case "review":
      return (
        <StepShell
          eyebrow="Step 8"
          title="Review everything in one screen"
          subtitle="Approve posts, creatives, landing pages, and emails from a unified review center."
        >
          <PreviewCard
            title="Review & Publish Center"
            body="Aggregates every asset with per-item approve/reject, AI quality scores, and bulk actions — before anything goes live."
            cta="Open a demo project"
            to="/admin/marketing-os"
          />
        </StepShell>
      );

    case "publish":
      return (
        <StepShell
          eyebrow="Step 9"
          title="Publish across channels"
          subtitle="Sequenced publishing to Instagram, Facebook, LinkedIn, X, Email, and your landing page."
        >
          <PreviewCard
            title="Enterprise Publisher"
            body="A single click ships approved assets in the right order, at the right time, with retry + observability."
            cta="See publishing dashboard"
            to="/admin/marketing-os"
          />
        </StepShell>
      );

    case "analytics":
      return (
        <StepShell
          eyebrow="Step 10"
          title="Measure and optimize"
          subtitle="Live KPI dashboards, campaign health, and AI recommendations across every project."
        >
          <PreviewCard
            title="Marketing Analytics"
            body="Impressions, reach, conversions, revenue attribution, and AI-generated next-step suggestions per campaign."
            cta="Open Marketing OS"
            to="/admin/marketing-os"
          />
        </StepShell>
      );
  }
}

function StepShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-primary">{eyebrow}</div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function PreviewCard({
  title,
  body,
  cta,
  to,
}: {
  title: string;
  body: string;
  cta: string;
  to: string;
}) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-6">
      <div className="text-lg font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Link
        to={to as any}
        className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        {cta}
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Link>
    </div>
  );
}
