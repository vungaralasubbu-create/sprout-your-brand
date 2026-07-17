import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  Rocket,
  Wand2,
  Palette,
  Type as TypeIcon,
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  MessageCircle,
  FileText,
  Presentation,
  Users,
  Target,
  BookOpen,
  Mail,
  Phone,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics/client";
import {
  generateBrandNames,
  generateBrandKit,
  type BrandNameSuggestion,
  type BrandKit,
} from "@/lib/brand/ai-brand-builder.functions";

export const Route = createFileRoute("/launch-your-brand/start")({
  head: () => ({
    meta: [
      { title: "AI Brand Builder — Launch your academy in 5 minutes | Glintr" },
      {
        name: "description",
        content:
          "The AI Brand Builder turns a few answers into a full education brand — name, logo, colors, copy, and marketing kit. Built with you in real time.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BrandBuilderWizard,
});

const STORAGE_KEY = "glintr.brand-builder.v2";
const TOTAL_STEPS = 10;

const TEACH_OPTIONS = [
  "AI & Machine Learning",
  "Python & Programming",
  "Mechanical Engineering",
  "Digital Marketing",
  "Finance & Investing",
  "Cyber Security",
  "Medical Coding",
  "Data Science",
  "UI/UX Design",
  "Business & Entrepreneurship",
];

const AUDIENCE_OPTIONS = [
  { key: "students", label: "Students", desc: "College & school learners" },
  { key: "professionals", label: "Working Professionals", desc: "Career upgrade & mastery" },
  { key: "internship", label: "College Internships", desc: "First job & experience" },
  { key: "switchers", label: "Career Switchers", desc: "Move into a new field" },
  { key: "companies", label: "Companies", desc: "B2B training & workshops" },
];

const GOAL_OPTIONS = [
  { key: "sell", label: "Earn from selling courses", icon: Target },
  { key: "brand", label: "Launch your own brand", icon: Rocket },
  { key: "educator", label: "Become an educator", icon: BookOpen },
  { key: "institute", label: "Create an institute", icon: Users },
];

type Draft = {
  step: number;
  founder: string;
  email: string;
  phone: string;
  brandName: string;
  brandNameSeed: string;
  nameOptions: BrandNameSuggestion[];
  teach: string[];
  audience: string;
  goal: string;
  kit: BrandKit | null;
  leadCaptured: boolean;
  createdAt: string;
};

const INITIAL: Draft = {
  step: 1,
  founder: "",
  email: "",
  phone: "",
  brandName: "",
  brandNameSeed: "",
  nameOptions: [],
  teach: [],
  audience: "",
  goal: "",
  kit: null,
  leadCaptured: false,
  createdAt: new Date().toISOString(),
};

function loadDraft(): Draft {
  if (typeof window === "undefined") return INITIAL;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    return { ...INITIAL, ...JSON.parse(raw) };
  } catch {
    return INITIAL;
  }
}
function saveDraft(d: Draft) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* noop */
  }
}

// ---- SVG brand assets rendered inline from kit + name -----------------------

function BrandLogo({ name, kit, size = 96 }: { name: string; kit: BrandKit | null; size?: number }) {
  const initial = (name || "G").trim().charAt(0).toUpperCase();
  const primary = kit?.colors.primary || "#0EA5E9";
  const accent = kit?.colors.accent || "#84CC16";
  const secondary = kit?.colors.secondary || "#6366F1";
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={`lg-${initial}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="60%" stopColor={secondary} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="88" height="88" rx="20" fill={`url(#lg-${initial})`} />
      <text
        x="50%"
        y="54%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={kit?.typography.heading || "Space Grotesk, sans-serif"}
        fontSize={44}
        fontWeight={800}
        fill="#0B1220"
      >
        {initial}
      </text>
    </svg>
  );
}

function BrandFavicon({ name, kit }: { name: string; kit: BrandKit | null }) {
  return <BrandLogo name={name} kit={kit} size={32} />;
}

function BrandHero({ name, kit }: { name: string; kit: BrandKit | null }) {
  if (!kit) return null;
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-8"
      style={{
        background: `linear-gradient(135deg, ${kit.colors.primary}22, ${kit.colors.secondary}18, ${kit.colors.accent}22)`,
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <BrandLogo name={name} kit={kit} size={48} />
        <div className="font-display text-lg font-bold">{name}</div>
      </div>
      <h3 className="font-display text-3xl font-bold leading-tight">{kit.homepageHero.headline}</h3>
      <p className="mt-2 text-muted-foreground">{kit.homepageHero.sub}</p>
      <div className="mt-4 flex gap-2">
        <span
          className="rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ background: kit.colors.primary }}
        >
          {kit.homepageHero.cta}
        </span>
        <span className="rounded-full border px-4 py-2 text-sm font-medium">Explore Programs</span>
      </div>
    </div>
  );
}

function BrandCard({ name, kit }: { name: string; kit: BrandKit | null }) {
  if (!kit) return null;
  return (
    <div
      className="rounded-xl border p-5 text-white"
      style={{ background: `linear-gradient(135deg, ${kit.colors.primary}, ${kit.colors.secondary})` }}
    >
      <div className="flex items-start justify-between">
        <BrandLogo name={name} kit={kit} size={40} />
        <span className="text-xs opacity-80">Founder</span>
      </div>
      <div className="mt-6 font-display text-lg font-bold">{name}</div>
      <div className="text-xs opacity-80">{kit.tagline}</div>
    </div>
  );
}

// ---- Little chat bubble ----------------------------------------------------

function AiBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="size-4" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border bg-card px-4 py-3 text-sm shadow-sm">{children}</div>
    </div>
  );
}

// ---- Main component --------------------------------------------------------

function BrandBuilderWizard() {
  const navigate = useNavigate();
  const namesFn = useServerFn(generateBrandNames);
  const kitFn = useServerFn(generateBrandKit);

  const [draft, setDraft] = React.useState<Draft>(INITIAL);
  const [hydrated, setHydrated] = React.useState(false);
  const [loadingNames, setLoadingNames] = React.useState(false);
  const [loadingKit, setLoadingKit] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setDraft(loadDraft());
    setHydrated(true);
  }, []);
  React.useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  const update = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const next = () => {
    update({ step: Math.min(TOTAL_STEPS, draft.step + 1) });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const prev = () => update({ step: Math.max(1, draft.step - 1) });

  const progress = Math.round(((draft.step - 1) / (TOTAL_STEPS - 1)) * 100);

  const captureLead = React.useCallback(() => {
    if (draft.leadCaptured) return;
    update({ leadCaptured: true });
    trackEvent("lead_capture", {
      source: "ai_brand_builder",
      email: draft.email,
      dedupe_key: `bb:${draft.email || draft.phone}`,
    });
  }, [draft.leadCaptured, draft.email, draft.phone]);

  const fetchNames = async (seed: string) => {
    setLoadingNames(true);
    try {
      const list = await namesFn({ data: { seed, teach: draft.teach.join(", "), audience: draft.audience } });
      update({ nameOptions: list, brandNameSeed: seed });
    } catch {
      toast.error("Couldn't generate names — try again");
    } finally {
      setLoadingNames(false);
    }
  };

  const buildKit = React.useCallback(
    async (nameOverride?: string) => {
      const name = nameOverride || draft.brandName;
      if (!name) return;
      setLoadingKit(true);
      try {
        const kit = await kitFn({
          data: {
            brandName: name,
            teach: draft.teach.join(", "),
            audience: draft.audience,
            goal: draft.goal,
            founder: draft.founder,
          },
        });
        update({ kit });
      } catch {
        toast.error("Couldn't generate brand kit — try again");
      } finally {
        setLoadingKit(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft.brandName, draft.teach, draft.audience, draft.goal, draft.founder],
  );

  // Auto-rebuild kit whenever audience/goal/teach change AFTER we have a name
  const kitDeps = `${draft.brandName}|${draft.teach.join(",")}|${draft.audience}|${draft.goal}`;
  const lastKitRef = React.useRef<string>("");
  React.useEffect(() => {
    if (!draft.brandName || draft.step < 3) return;
    if (lastKitRef.current === kitDeps) return;
    lastKitRef.current = kitDeps;
    void buildKit();
  }, [kitDeps, draft.brandName, draft.step, buildKit]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData.user;
      if (!user) {
        toast.success("Your brand is ready. Sign in to save it and go live.");
        navigate({ to: "/auth", search: { redirect: "/launch-your-brand/start" } as never });
        return;
      }
      const { error } = await supabase.from("brand_applications").insert({
        user_id: user.id,
        status: "submitted",
        preferred_brand_name: draft.brandName,
        target_audience: draft.audience ? [draft.audience] : [],
        brand_vision: draft.kit?.vision ?? null,
        brand_personality: [],
        brand_colors: draft.kit?.colors ?? {},
        tagline: draft.kit?.tagline ?? null,
        business_email: draft.email,
        business_mobile: draft.phone,
        consent_confirmed: true,
        current_step: 10,
        submitted_at: new Date().toISOString(),
      });
      if (error) throw error;
      trackEvent("brand_application", { source: "ai_brand_builder", dedupe_key: `brand:${user.id}` });
      toast.success("🚀 Your brand has been submitted for launch!");
      localStorage.removeItem(STORAGE_KEY);
      navigate({ to: "/launch-your-brand" });
    } catch (e) {
      console.error(e);
      toast.error("Submission failed. Your brand is safely stored — please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/launch-your-brand" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Exit
          </Link>
          <div className="flex-1 max-w-xl">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-medium">AI Brand Builder</span>
              <span>Step {draft.step} of {TOTAL_STEPS} · ~{Math.max(1, TOTAL_STEPS - draft.step)} min left</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
          <Badge variant="muted" className="hidden md:inline-flex gap-1">
            <Sparkles className="size-3" /> AI-Powered
          </Badge>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* STEP 1 — Welcome + early lead capture */}
        {draft.step === 1 && (
          <Step1
            draft={draft}
            update={update}
            onContinue={() => {
              captureLead();
              next();
            }}
          />
        )}

        {/* STEP 2 — Academy name */}
        {draft.step === 2 && (
          <Step2
            draft={draft}
            update={update}
            loading={loadingNames}
            fetchNames={fetchNames}
            onPick={(n) => {
              update({ brandName: n });
              next();
            }}
          />
        )}

        {/* STEP 3 — Instant brand kit */}
        {draft.step === 3 && <Step3 draft={draft} loading={loadingKit} onNext={next} />}

        {/* STEP 4 — What to teach */}
        {draft.step === 4 && <Step4 draft={draft} update={update} onNext={next} />}

        {/* STEP 5 — Audience */}
        {draft.step === 5 && <Step5 draft={draft} update={update} onNext={next} />}

        {/* STEP 6 — Goal */}
        {draft.step === 6 && <Step6 draft={draft} update={update} onNext={next} />}

        {/* STEP 7 — Confirm contact (already captured) */}
        {draft.step === 7 && <Step7 draft={draft} update={update} onNext={next} />}

        {/* STEP 8 — Auto-generated copy */}
        {draft.step === 8 && <Step8 draft={draft} loading={loadingKit} onNext={next} />}

        {/* STEP 9 — Marketing kit */}
        {draft.step === 9 && <Step9 draft={draft} onNext={next} />}

        {/* STEP 10 — Launch */}
        {draft.step === 10 && <StepLaunch draft={draft} onSubmit={submit} submitting={submitting} />}

        {/* Nav footer */}
        {draft.step > 1 && draft.step < 10 && (
          <div className="mt-10 flex justify-between">
            <Button variant="ghost" onClick={prev}>
              <ArrowLeft className="mr-1 size-4" /> Back
            </Button>
            <span className="text-xs text-muted-foreground">
              Progress is saved automatically ✓
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

// ---- Individual step components -------------------------------------------

function Step1({ draft, update, onContinue }: { draft: Draft; update: (p: Partial<Draft>) => void; onContinue: () => void }) {
  const canContinue = draft.founder.trim().length >= 2 && /\S+@\S+\.\S+/.test(draft.email) && draft.phone.trim().length >= 6;
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
          <Rocket className="size-7" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold md:text-5xl">Let's build your own education brand.</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          The AI Brand Builder turns a few answers into a complete academy — name, logo, colors, copy, and marketing.
          <br /> Estimated time: <span className="font-semibold text-foreground">3–5 minutes</span>.
        </p>
      </div>

      <div className="mx-auto max-w-lg space-y-4">
        <AiBubble>Hi! I'm your AI brand builder. First — what should I call you?</AiBubble>
        <div>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <UserIcon className="size-3.5" /> Your name
          </label>
          <Input
            placeholder="e.g. Rahul Sharma"
            value={draft.founder}
            onChange={(e) => update({ founder: e.target.value })}
            className="h-12 text-base"
            autoFocus
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Mail className="size-3.5" /> Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={draft.email}
              onChange={(e) => update({ email: e.target.value })}
              className="h-12 text-base"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Phone className="size-3.5" /> Phone
            </label>
            <Input
              placeholder="+91 98xxxxxx"
              value={draft.phone}
              onChange={(e) => update({ phone: e.target.value })}
              className="h-12 text-base"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          We save your progress instantly. You can come back any time and pick up where you left off.
        </p>
        <Button size="lg" disabled={!canContinue} onClick={onContinue} className="w-full">
          Start building <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function Step2({
  draft,
  update,
  loading,
  fetchNames,
  onPick,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  loading: boolean;
  fetchNames: (seed: string) => Promise<void>;
  onPick: (n: string) => void;
}) {
  const [typed, setTyped] = React.useState(draft.brandNameSeed || "");
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!typed.trim()) return;
    await fetchNames(typed.trim());
  };
  return (
    <div className="space-y-6">
      <AiBubble>
        Nice to meet you{draft.founder ? `, ${draft.founder.split(" ")[0]}` : ""}. What would you like your academy to be called?
      </AiBubble>
      <form onSubmit={submit} className="mx-auto max-w-lg space-y-3">
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Type any name — AI Masters, Skillverse, whatever comes to mind"
          className="h-12 text-base"
          autoFocus
        />
        <Button type="submit" size="lg" disabled={!typed.trim() || loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Generating 10 better names…
            </>
          ) : (
            <>
              <Wand2 className="mr-2 size-4" /> Generate 10 better names
            </>
          )}
        </Button>
      </form>

      {draft.nameOptions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {draft.nameOptions.map((n) => (
            <button
              key={n.name}
              onClick={() => onPick(n.name)}
              className="group rounded-xl border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-lg font-bold group-hover:text-primary">{n.name}</span>
                <Badge
                  variant="muted"
                  className={cn(
                    "text-[10px]",
                    n.tag === "Recommended" && "bg-primary/15 text-primary",
                    n.tag === "Most Brandable" && "bg-accent/20 text-accent-foreground",
                    n.tag === "Premium" && "bg-purple-500/15 text-purple-500",
                  )}
                >
                  {n.tag}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{n.reason}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 className="size-3" /> Available
                </span>
                <span className="text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Choose <ArrowRight className="ml-0.5 inline size-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => onPick(typed.trim())}
          disabled={!typed.trim()}
          className="text-xs text-muted-foreground underline underline-offset-2 disabled:opacity-40"
        >
          Or keep my typed name "{typed}"
        </button>
      </div>
    </div>
  );
}

function Step3({ draft, loading, onNext }: { draft: Draft; loading: boolean; onNext: () => void }) {
  const kit = draft.kit;
  return (
    <div className="space-y-6">
      <AiBubble>
        Building <span className="font-semibold">{draft.brandName}</span>'s visual identity right now — logo, colors, typography, and hero assets.
      </AiBubble>

      {loading && !kit ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Generating your brand kit — this only takes a few seconds…</p>
        </div>
      ) : kit ? (
        <div className="grid gap-4 md:grid-cols-2">
          <AssetTile label="Logo" icon={<Sparkles className="size-4" />}>
            <div className="flex flex-col items-center gap-3">
              <BrandLogo name={draft.brandName} kit={kit} size={96} />
              <div className="font-display text-lg font-bold">{draft.brandName}</div>
              <div className="text-xs text-muted-foreground italic">"{kit.tagline}"</div>
            </div>
          </AssetTile>

          <AssetTile label="Brand Colors" icon={<Palette className="size-4" />}>
            <div className="space-y-2">
              {(["primary", "secondary", "accent", "background", "foreground"] as const).map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <div className="size-10 rounded-lg border shadow-inner" style={{ background: kit.colors[k] }} />
                  <div className="flex-1">
                    <div className="text-xs font-medium capitalize">{k}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{kit.colors[k]}</div>
                  </div>
                </div>
              ))}
            </div>
          </AssetTile>

          <AssetTile label="Typography" icon={<TypeIcon className="size-4" />}>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Heading · {kit.typography.heading}</div>
                <div className="text-2xl font-bold" style={{ fontFamily: kit.typography.heading }}>
                  {draft.brandName}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Body · {kit.typography.body}</div>
                <div className="text-sm" style={{ fontFamily: kit.typography.body }}>
                  The quick fox trained a neural network before dawn.
                </div>
              </div>
            </div>
          </AssetTile>

          <AssetTile label="Favicon + Social Avatar" icon={<Sparkles className="size-4" />}>
            <div className="flex items-center gap-4">
              <BrandFavicon name={draft.brandName} kit={kit} />
              <BrandLogo name={draft.brandName} kit={kit} size={64} />
              <div className="text-xs text-muted-foreground">
                Ready for browser tabs, Instagram, LinkedIn & YouTube.
              </div>
            </div>
          </AssetTile>

          <AssetTile label="Email Signature" icon={<Mail className="size-4" />} className="md:col-span-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <BrandLogo name={draft.brandName} kit={kit} size={48} />
                <div>
                  <div className="font-semibold">{draft.founder || "Your Name"}</div>
                  <div className="text-xs text-muted-foreground">Founder · {draft.brandName}</div>
                  <div className="mt-1 text-xs" style={{ color: kit.colors.primary }}>
                    {kit.tagline}
                  </div>
                </div>
              </div>
            </div>
          </AssetTile>

          <AssetTile label="Business Card" icon={<FileText className="size-4" />}>
            <BrandCard name={draft.brandName} kit={kit} />
          </AssetTile>

          <AssetTile label="Website Hero" icon={<Sparkles className="size-4" />}>
            <BrandHero name={draft.brandName} kit={kit} />
          </AssetTile>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button size="lg" onClick={onNext} disabled={loading || !kit}>
          Looks great — continue <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function AssetTile({
  label,
  icon,
  children,
  className,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-sm", className)}>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Step4({ draft, update, onNext }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void }) {
  const toggle = (t: string) => {
    const has = draft.teach.includes(t);
    update({ teach: has ? draft.teach.filter((x) => x !== t) : [...draft.teach, t] });
  };
  return (
    <div className="space-y-6">
      <AiBubble>Perfect. What do you want to teach at {draft.brandName}? Pick anything that fits — I'll build programs, categories, and paths.</AiBubble>
      <div className="grid gap-2 sm:grid-cols-2">
        {TEACH_OPTIONS.map((t) => {
          const active = draft.teach.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={cn(
                "rounded-xl border bg-card p-4 text-left transition-all",
                active ? "border-primary ring-2 ring-primary/25" : "hover:border-primary/50",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{t}</span>
                {active && <Check className="size-4 text-primary" />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button size="lg" onClick={onNext} disabled={draft.teach.length === 0}>
          Continue <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function Step5({ draft, update, onNext }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <AiBubble>Who's your audience? I'll rewrite the website copy to match how they talk and buy.</AiBubble>
      <div className="grid gap-3 sm:grid-cols-2">
        {AUDIENCE_OPTIONS.map((a) => {
          const active = draft.audience === a.key;
          return (
            <button
              key={a.key}
              onClick={() => update({ audience: a.key })}
              className={cn(
                "rounded-xl border bg-card p-5 text-left transition-all",
                active ? "border-primary ring-2 ring-primary/25" : "hover:border-primary/50",
              )}
            >
              <div className="font-semibold">{a.label}</div>
              <div className="text-xs text-muted-foreground">{a.desc}</div>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button size="lg" onClick={onNext} disabled={!draft.audience}>
          Continue <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function Step6({ draft, update, onNext }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <AiBubble>What's your biggest goal? This unlocks the right playbook — pricing, tools, and team setup.</AiBubble>
      <div className="grid gap-3 sm:grid-cols-2">
        {GOAL_OPTIONS.map((g) => {
          const active = draft.goal === g.key;
          const Icon = g.icon;
          return (
            <button
              key={g.key}
              onClick={() => update({ goal: g.key })}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card p-5 text-left transition-all",
                active ? "border-primary ring-2 ring-primary/25" : "hover:border-primary/50",
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="font-semibold">{g.label}</span>
              {active && <Check className="ml-auto size-4 text-primary" />}
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button size="lg" onClick={onNext} disabled={!draft.goal}>
          Continue <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function Step7({ draft, update, onNext }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <AiBubble>
        Almost done. Confirm your contact details — this is where we'll send your launch kit.
      </AiBubble>
      <div className="mx-auto max-w-lg space-y-4 rounded-2xl border bg-card p-6">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
          <Input value={draft.email} onChange={(e) => update({ email: e.target.value })} type="email" className="h-11" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
          <Input value={draft.phone} onChange={(e) => update({ phone: e.target.value })} className="h-11" />
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" /> Contact captured. You'll receive your brand kit even if you close this tab.
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="lg" onClick={onNext}>
          Continue <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function Step8({ draft, loading, onNext }: { draft: Draft; loading: boolean; onNext: () => void }) {
  const kit = draft.kit;
  return (
    <div className="space-y-6">
      <AiBubble>Writing your entire website — mission, about, homepage, programs, FAQs, and policies. No manual typing.</AiBubble>
      {loading || !kit ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Personalizing every page…</p>
        </div>
      ) : (
        <div className="space-y-4">
          <CopyTile title="Mission">{kit.mission}</CopyTile>
          <CopyTile title="Vision">{kit.vision}</CopyTile>
          <CopyTile title="About Us">{kit.about}</CopyTile>
          <CopyTile title="Homepage Hero">
            <div className="font-display text-xl font-bold">{kit.homepageHero.headline}</div>
            <div className="mt-1 text-sm text-muted-foreground">{kit.homepageHero.sub}</div>
          </CopyTile>
          <CopyTile title="Programs">
            <div className="grid gap-3 sm:grid-cols-2">
              {kit.programs.map((p, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="font-semibold text-sm">{p.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.description}</div>
                  <div className="mt-2 text-xs font-medium text-primary">Outcome: {p.outcome}</div>
                </div>
              ))}
            </div>
          </CopyTile>
          <CopyTile title="Website Menu">
            <div className="flex flex-wrap gap-2">
              {kit.menu.map((m) => (
                <Badge key={m} variant="muted">{m}</Badge>
              ))}
            </div>
          </CopyTile>
          <CopyTile title="FAQs">
            <div className="space-y-3">
              {kit.faqs.map((f, i) => (
                <div key={i}>
                  <div className="font-semibold text-sm">{f.q}</div>
                  <div className="text-xs text-muted-foreground">{f.a}</div>
                </div>
              ))}
            </div>
          </CopyTile>
          <div className="grid gap-3 sm:grid-cols-3">
            <CopyTile title="Privacy Policy" compact>{kit.policies.privacy}</CopyTile>
            <CopyTile title="Terms of Use" compact>{kit.policies.terms}</CopyTile>
            <CopyTile title="Refund Policy" compact>{kit.policies.refund}</CopyTile>
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <Button size="lg" onClick={onNext} disabled={loading || !kit}>
          Continue <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function CopyTile({ title, children, compact }: { title: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-sm", compact && "p-4")}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className={cn("text-sm", compact && "text-xs text-muted-foreground")}>{children}</div>
    </div>
  );
}

function Step9({ draft, onNext }: { draft: Draft; onNext: () => void }) {
  const kit = draft.kit;
  if (!kit) return null;
  return (
    <div className="space-y-6">
      <AiBubble>And here's your launch-day marketing kit — ready to post today.</AiBubble>
      <div className="grid gap-4 md:grid-cols-2">
        <MarketingCard icon={<Instagram className="size-4" />} title="Instagram Posts" items={kit.marketing.instagram} />
        <MarketingCard icon={<Linkedin className="size-4" />} title="LinkedIn Posts" items={kit.marketing.linkedin} />
        <MarketingCard icon={<Facebook className="size-4" />} title="Facebook Post" items={kit.marketing.facebook} />
        <MarketingCard icon={<Youtube className="size-4" />} title="YouTube Banner" items={[kit.marketing.youtubeBanner]} />
        <MarketingCard icon={<MessageCircle className="size-4" />} title="WhatsApp Banner" items={[kit.marketing.whatsappBanner]} />
        <MarketingCard icon={<FileText className="size-4" />} title="Brochure Intro" items={[kit.marketing.brochureIntro]} />
        <MarketingCard icon={<Presentation className="size-4" />} title="Business Presentation" items={[kit.marketing.businessPresentation]} className="md:col-span-2" />
      </div>
      <div className="flex justify-end">
        <Button size="lg" onClick={onNext}>
          Continue to launch <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function MarketingCard({
  icon,
  title,
  items,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-sm", className)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        {title}
      </div>
      <div className="space-y-2">
        {items.map((t, i) => (
          <div key={i} className="rounded-lg border bg-background p-3 text-xs leading-relaxed">
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepLaunch({ draft, onSubmit, submitting }: { draft: Draft; onSubmit: () => void; submitting: boolean }) {
  const kit = draft.kit;
  return (
    <div className="relative space-y-8 py-8 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
      </div>
      <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-purple-500 to-accent text-white shadow-2xl">
        <Rocket className="size-10" />
      </div>
      <div>
        <h2 className="font-display text-4xl font-bold md:text-5xl">🎉 Congratulations!</h2>
        <p className="mt-3 text-2xl font-semibold" style={{ color: kit?.colors.primary }}>
          {draft.brandName} is ready.
        </p>
        <p className="mt-2 text-muted-foreground">
          Your complete brand kit — identity, copy, and marketing — has been generated.
        </p>
      </div>

      {kit && (
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-6 shadow-xl">
          <BrandLogo name={draft.brandName} kit={kit} size={80} />
          <div className="mt-3 font-display text-2xl font-bold">{draft.brandName}</div>
          <div className="text-sm text-muted-foreground italic">"{kit.tagline}"</div>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {(["primary", "secondary", "accent"] as const).map((k) => (
              <div key={k} className="size-4 rounded-full border" style={{ background: kit.colors[k] }} />
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-md flex-col gap-2">
        <Button size="lg" onClick={onSubmit} disabled={submitting} className="h-14 text-base">
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Launching…
            </>
          ) : (
            <>
              🚀 Launch my brand
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          We'll set up your dashboard, domain, and academy backend within 24 hours.
        </p>
      </div>
    </div>
  );
}
