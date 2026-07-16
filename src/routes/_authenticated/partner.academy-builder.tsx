import { createFileRoute } from "@tanstack/react-router";
import { AcademyGate } from "@/components/partner/academy-gate";

import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Check,
  Sparkles,
  Globe,
  Palette,
  BookOpen,
  GraduationCap,
  FileText,
  Megaphone,
  Image as ImageIcon,
  Loader2,
  Wand2,
  Rocket,
  ArrowRight,
  ArrowLeft,
  RefreshCcw,
  Download,
  ClipboardCheck,
} from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";
import {
  generateBrandIdentity,
  generateLogo,
  generateWebsiteContent,
  generateProgram,
  generateCourse,
  generateBlogIdeas,
  generateMarketingKit,
  generateHeroImage,
  publishAcademyDraft,
} from "@/lib/admin/academy-builder.functions";

export const Route = createFileRoute("/_authenticated/partner/academy-builder")({
  ssr: false,
  head: () =>
    buildPageHead({
      path: "/partner/academy-builder",
      title: "AI Academy Builder — Glintr",
      description:
        "Launch a complete education academy with AI. Brand, website, programs, courses, blogs, marketing — all reviewed before publishing.",
      noindex: true,
    }),
  component: GatedAcademyBuilder,
});

/* ------------------------------------------------------------------ */
/* Draft model + localStorage persistence                             */
/* ------------------------------------------------------------------ */

type Draft = {
  step: number;
  basics: {
    build: string; // Personal Brand / Coaching / etc.
    academyName: string;
    industry: string;
    audience: string;
    country: string;
    language: string;
    style: string;
    teachingMode: "online" | "offline" | "hybrid";
    seed: string;
  };
  brand?: any;
  chosenName?: string;
  managedSlug?: string;
  logos: Record<string, string>; // variant -> data url
  website?: any;
  programs: any[];
  courses: any[];
  blogs?: any;
  marketing?: any;
  heroImages: { label: string; url: string }[];
  publishedAt?: string;
};

const EMPTY: Draft = {
  step: 1,
  basics: {
    build: "Online Course Platform",
    academyName: "",
    industry: "",
    audience: "",
    country: "India",
    language: "English",
    style: "premium modern",
    teachingMode: "hybrid",
    seed: "",
  },
  
  logos: {},
  programs: [],
  courses: [],
  heroImages: [],
};

const LS_KEY = "glintr.academy-builder.v1";

function loadDraft(): Draft {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}
function saveDraft(d: Draft) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(d));
  } catch {
    /* quota */
  }
}

/* ------------------------------------------------------------------ */
/* Top-level component                                                */
/* ------------------------------------------------------------------ */

const STEPS = [
  { key: "welcome", label: "Welcome", icon: Sparkles },
  { key: "basics", label: "Basics", icon: BookOpen },
  { key: "brand", label: "Brand & Logo", icon: Palette },
  { key: "managed", label: "Managed URL", icon: Globe },
  { key: "website", label: "Website", icon: FileText },
  { key: "programs", label: "Programs", icon: GraduationCap },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "blogs", label: "Blogs", icon: FileText },
  { key: "marketing", label: "Marketing", icon: Megaphone },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "review", label: "Review", icon: ClipboardCheck },
  { key: "publish", label: "Publish", icon: Rocket },
];

function AcademyBuilder() {
  const [d, setD] = useState<Draft>(EMPTY);
  useEffect(() => setD(loadDraft()), []);
  useEffect(() => saveDraft(d), [d]);

  const update = (fn: (x: Draft) => void) =>
    setD((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const go = (n: number) => update((x) => { x.step = Math.max(1, Math.min(STEPS.length, n)); });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-cyan-600">
          <Wand2 className="size-4" /> AI ACADEMY BUILDER
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-900">
          Launch your entire academy in under 30 minutes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Answer a handful of simple questions. Glintr AI drafts the brand, website, programs,
          courses, blogs and marketing kit. Nothing goes live until you review and confirm.
        </p>
      </header>

      <Stepper current={d.step} onJump={go} />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {d.step === 1 && <StepWelcome d={d} update={update} onNext={() => go(2)} />}
        {d.step === 2 && <StepBasics d={d} update={update} onNext={() => go(3)} onBack={() => go(1)} />}
        {d.step === 3 && <StepBrand d={d} update={update} onNext={() => go(4)} onBack={() => go(2)} />}
        {d.step === 4 && <StepManaged d={d} update={update} onNext={() => go(5)} onBack={() => go(3)} />}
        {d.step === 5 && <StepWebsite d={d} update={update} onNext={() => go(6)} onBack={() => go(4)} />}
        {d.step === 6 && <StepPrograms d={d} update={update} onNext={() => go(7)} onBack={() => go(5)} />}
        {d.step === 7 && <StepCourses d={d} update={update} onNext={() => go(8)} onBack={() => go(6)} />}
        {d.step === 8 && <StepBlogs d={d} update={update} onNext={() => go(9)} onBack={() => go(7)} />}
        {d.step === 9 && <StepMarketing d={d} update={update} onNext={() => go(10)} onBack={() => go(8)} />}
        {d.step === 10 && <StepMedia d={d} update={update} onNext={() => go(11)} onBack={() => go(9)} />}
        {d.step === 11 && <StepReview d={d} update={update} onNext={() => go(12)} onBack={() => go(10)} />}
        {d.step === 12 && <StepPublish d={d} update={update} onBack={() => go(11)} />}
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("Reset the entire draft? This cannot be undone.")) setD(EMPTY);
          }}
        >
          Reset draft
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper                                                            */
/* ------------------------------------------------------------------ */

function Stepper({ current, onJump }: { current: number; onJump: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        const Icon = s.icon;
        return (
          <button
            key={s.key}
            onClick={() => onJump(n)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "border-cyan-500 bg-cyan-500 text-white shadow-sm"
                : done
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span
              className={`flex size-5 items-center justify-center rounded-full text-[10px] ${
                done ? "bg-emerald-600 text-white" : active ? "bg-white/25" : "bg-slate-100"
              }`}
            >
              {done ? <Check className="size-3" /> : <Icon className="size-3" />}
            </span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step navigation footer                                             */
/* ------------------------------------------------------------------ */

function NavRow({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
      {onBack ? (
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" /> Back
        </Button>
      ) : (
        <span />
      )}
      {onNext && (
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel} <ArrowRight className="ml-2 size-4" />
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Welcome                                                   */
/* ------------------------------------------------------------------ */

const BUILD_OPTIONS = [
  "Personal Brand",
  "Coaching Business",
  "College",
  "Training Institute",
  "Corporate Academy",
  "Online Course Platform",
  "White Label Academy",
];

function StepWelcome({
  d,
  update,
  onNext,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">What would you like to build?</h2>
      <p className="mt-1 text-sm text-slate-600">Pick one — we tune every step to your goal.</p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BUILD_OPTIONS.map((opt) => {
          const selected = d.basics.build === opt;
          return (
            <button
              key={opt}
              onClick={() => update((x) => { x.basics.build = opt; })}
              className={`rounded-xl border p-4 text-left transition ${
                selected
                  ? "border-cyan-500 bg-cyan-50/40 ring-2 ring-cyan-200"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-semibold text-slate-900">{opt}</div>
              <div className="mt-1 text-xs text-slate-500">
                {opt === "White Label Academy"
                  ? "Full brand + website + LMS, fully managed by Glintr."
                  : opt === "Personal Brand"
                  ? "Launch a solo educator brand fast."
                  : opt === "College" || opt === "Training Institute"
                  ? "Institutional presence with programs & courses."
                  : opt === "Corporate Academy"
                  ? "Internal L&D platform for your workforce."
                  : opt === "Coaching Business"
                  ? "Cohort or 1:1 coaching with course library."
                  : "Public course marketplace with checkout."}
              </div>
            </button>
          );
        })}
      </div>
      <NavRow onNext={onNext} nextDisabled={!d.basics.build} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Basics                                                    */
/* ------------------------------------------------------------------ */

function StepBasics({
  d,
  update,
  onNext,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const b = d.basics;
  const ready = b.seed.length > 4 || (b.academyName && b.industry);
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Tell us the essentials</h2>
      <p className="mt-1 text-sm text-slate-600">
        Fill what you know. The AI infers the rest — you can edit everything later.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Academy name (optional)">
          <Input
            value={b.academyName}
            onChange={(e) => update((x) => { x.basics.academyName = e.target.value; })}
            placeholder="Leave blank to get AI suggestions"
          />
        </Field>
        <Field label="Industry / focus">
          <Input
            value={b.industry}
            onChange={(e) => update((x) => { x.basics.industry = e.target.value; })}
            placeholder="e.g. AI & Data, Digital Marketing, Finance"
          />
        </Field>
        <Field label="Target audience">
          <Input
            value={b.audience}
            onChange={(e) => update((x) => { x.basics.audience = e.target.value; })}
            placeholder="e.g. Sales professionals, engineering students"
          />
        </Field>
        <Field label="Country">
          <Input
            value={b.country}
            onChange={(e) => update((x) => { x.basics.country = e.target.value; })}
          />
        </Field>
        <Field label="Primary language">
          <Input
            value={b.language}
            onChange={(e) => update((x) => { x.basics.language = e.target.value; })}
          />
        </Field>
        <Field label="Brand style">
          <Input
            value={b.style}
            onChange={(e) => update((x) => { x.basics.style = e.target.value; })}
            placeholder="premium modern / playful / editorial / minimalist"
          />
        </Field>
        <Field label="Teaching mode">
          <div className="flex gap-2">
            {(["online", "offline", "hybrid"] as const).map((m) => (
              <button
                key={m}
                onClick={() => update((x) => { x.basics.teachingMode = m; })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  b.teachingMode === m
                    ? "border-cyan-500 bg-cyan-500 text-white"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Describe your brand in one sentence" className="md:col-span-2">
          <Textarea
            rows={3}
            value={b.seed}
            onChange={(e) => update((x) => { x.basics.seed = e.target.value; })}
            placeholder="e.g. A futuristic AI education brand for career switchers in India."
          />
        </Field>
      </div>
      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!ready} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Brand + Logo                                              */
/* ------------------------------------------------------------------ */

function StepBrand({
  d,
  update,
  onNext,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const genBrand = useServerFn(generateBrandIdentity);
  const genLogo = useServerFn(generateLogo);
  const [loading, setLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState<string | null>(null);
  const brand = d.brand;
  const chosen = d.chosenName || d.basics.academyName || brand?.nameSuggestions?.[0]?.name || "";

  async function runBrand() {
    setLoading(true);
    try {
      const seed = d.basics.seed || `${d.basics.industry} academy for ${d.basics.audience}`;
      const res = await genBrand({
        data: {
          seed,
          academyName: d.basics.academyName || undefined,
          academyType: d.basics.build,
          industry: d.basics.industry || undefined,
          audience: d.basics.audience || undefined,
          country: d.basics.country || undefined,
          language: d.basics.language || undefined,
          style: d.basics.style || undefined,
          teachingMode: d.basics.teachingMode,
        },
      });
      update((x) => {
        x.brand = res;
        if (!x.chosenName)
          x.chosenName = x.basics.academyName || (res as any)?.nameSuggestions?.[0]?.name || "";
      });
      toast.success("Brand identity generated");
    } catch (e: any) {
      toast.error(e?.message ?? "Brand generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function runLogo(variant: string) {
    if (!chosen) return toast.error("Pick a brand name first");
    setLogoLoading(variant);
    try {
      const res = await genLogo({
        data: {
          brandName: chosen,
          tagline: brand?.tagline,
          primaryColor: brand?.colorPalette?.primary,
          secondaryColor: brand?.colorPalette?.secondary,
          style: d.basics.style,
          variant: variant as any,
        },
      });
      update((x) => {
        x.logos[variant] = (res as any).url;
      });
      toast.success(`${variant} logo ready`);
    } catch (e: any) {
      toast.error(e?.message ?? "Logo generation failed");
    } finally {
      setLogoLoading(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Brand identity</h2>
          <p className="mt-1 text-sm text-slate-600">
            Generate names, story, palette, typography, voice — then create logo variants.
          </p>
        </div>
        <Button onClick={runBrand} disabled={loading}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {brand ? "Regenerate" : "Generate brand"}
        </Button>
      </div>

      {brand && (
        <div className="mt-6 space-y-6">
          {/* Name suggestions */}
          <div>
            <div className="text-sm font-semibold text-slate-900">Name suggestions</div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(brand.nameSuggestions ?? []).map((n: any) => {
                const sel = chosen === n.name;
                return (
                  <button
                    key={n.name}
                    onClick={() => update((x) => { x.chosenName = n.name; })}
                    className={`rounded-lg border p-3 text-left text-sm ${
                      sel ? "border-cyan-500 bg-cyan-50/40 ring-1 ring-cyan-200" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{n.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{n.rationale}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">Color palette</div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {Object.entries(brand.colorPalette ?? {}).map(([k, v]) =>
                  typeof v === "string" && v.startsWith("#") ? (
                    <div key={k} className="rounded-lg border border-slate-200 p-2 text-center">
                      <div className="h-12 w-full rounded" style={{ background: v }} />
                      <div className="mt-1 text-[10px] uppercase text-slate-500">{k}</div>
                      <div className="text-[10px] text-slate-700">{v}</div>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Typography & voice</div>
              <div className="mt-2 space-y-2 text-sm">
                <div>
                  <span className="text-slate-500">Heading:</span> {brand.typography?.heading}
                </div>
                <div>
                  <span className="text-slate-500">Body:</span> {brand.typography?.body}
                </div>
                <div>
                  <span className="text-slate-500">Tone:</span> {brand.brandVoice?.tone}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(brand.brandVoice?.adjectives ?? []).map((a: string) => (
                    <Badge key={a} variant="muted">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Story + mission */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">Tagline</div>
            <div>{brand.tagline}</div>
            <div className="mt-3 font-semibold text-slate-900">Brand story</div>
            <p className="whitespace-pre-wrap">{brand.brandStory}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="font-semibold text-slate-900">Mission</div>
                <div>{brand.mission}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-900">Vision</div>
                <div>{brand.vision}</div>
              </div>
            </div>
          </div>

          {/* Logos */}
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Logo studio</div>
              <div className="text-xs text-slate-500">Brand: {chosen || "Pick a name above"}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[
                "primary",
                "icon",
                "monogram",
                "horizontal",
                "vertical",
                "favicon",
                "dark",
                "light",
                "social",
              ].map((v) => (
                <div key={v} className="rounded-lg border border-slate-200 p-2">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded bg-slate-50">
                    {d.logos[v] ? (
                      <img src={d.logos[v]} alt={v} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="text-xs text-slate-400">No {v}</div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="capitalize text-slate-700">{v}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => runLogo(v)}
                      disabled={!!logoLoading || !chosen}
                    >
                      {logoLoading === v ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : d.logos[v] ? (
                        <RefreshCcw className="size-3" />
                      ) : (
                        <Sparkles className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!brand || !chosen} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4 — Managed URL (Glintr Managed Infrastructure)               */
/* ------------------------------------------------------------------ */

function StepManaged({
  d,
  update,
  onNext,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const defaultSlug = useMemo(
    () =>
      (d.chosenName || d.basics.academyName || "brand")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40),
    [d.chosenName, d.basics.academyName],
  );
  const [slug, setSlug] = useState(d.managedSlug || defaultSlug);

  useEffect(() => {
    if (!d.managedSlug && defaultSlug) setSlug(defaultSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSlug]);

  const cleaned = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
  const managedUrl = cleaned ? `${cleaned}.glintr.com` : "your-brand.glintr.com";

  const managed = [
    "Website",
    "Hosting",
    "SSL certificate",
    "Global CDN",
    "Daily backups",
    "Security & DDoS",
    "Analytics",
    "SEO",
    "Blog engine",
    "LMS",
    "CRM",
    "Email delivery",
    "Certificates",
    "Performance monitoring",
    "Ongoing maintenance",
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Glintr Managed Infrastructure</h2>
      <p className="mt-1 text-sm text-slate-600">
        No domains to buy. No DNS. No hosting. Glintr provisions and manages every technical
        layer for you as part of the revenue-share partnership.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 p-4">
        <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
          Your managed academy URL
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onBlur={() => update((x) => { x.managedSlug = cleaned; })}
            placeholder="your-brand"
            className="flex-1 font-mono"
          />
          <div className="inline-flex items-center px-3 rounded-md border bg-slate-50 text-sm text-slate-600 font-mono">
            .glintr.com
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Live URL: <span className="font-mono text-slate-900">{managedUrl}</span>. If Glintr
          later purchases a dedicated domain for your academy, our team migrates you internally —
          you never touch DNS or SSL.
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
          Glintr manages, end-to-end
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {managed.map((m) => (
            <div
              key={m}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <Check className="size-4 text-emerald-600 shrink-0" />
              <span>{m}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600">
        <b className="text-slate-900">Your focus:</b> teaching, selling, creating courses,
        recording videos, engaging students and growing enrollments. Everything else is handled
        by Glintr.
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!cleaned} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 5 — Website content                                           */
/* ------------------------------------------------------------------ */

function StepWebsite({
  d,
  update,
  onNext,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const gen = useServerFn(generateWebsiteContent);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!d.chosenName) return toast.error("Pick a brand name first");
    setBusy(true);
    try {
      const res = await gen({
        data: {
          brandName: d.chosenName,
          tagline: d.brand?.tagline,
          brandStory: d.brand?.brandStory,
          audience: d.basics.audience,
          teachingMode: d.basics.teachingMode,
        },
      });
      update((x) => { x.website = res; });
      toast.success("Website content generated");
    } catch (e: any) {
      toast.error(e?.message ?? "Generation failed");
    } finally {
      setBusy(false);
    }
  }
  const w = d.website;
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Website</h2>
          <p className="mt-1 text-sm text-slate-600">
            Home, About, Programs, Blog, Career, Contact, FAQ, Privacy, Terms, Refund, Cookies, 404.
          </p>
        </div>
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {w ? "Regenerate" : "Generate all pages"}
        </Button>
      </div>
      {w && (
        <Tabs defaultValue="home" className="mt-6">
          <TabsList className="flex flex-wrap gap-1">
            {["home", "about", "faq", "legal", "misc"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="home" className="mt-4">
            <JsonBlock title="Hero" data={w.homepage?.hero} />
            <JsonBlock title="Value props" data={w.homepage?.valueProps} />
            <JsonBlock title="CTA banner" data={w.homepage?.ctaBanner} />
          </TabsContent>
          <TabsContent value="about" className="mt-4">
            <JsonBlock title="About" data={w.about} />
          </TabsContent>
          <TabsContent value="faq" className="mt-4">
            <JsonBlock title="FAQ" data={w.faq} />
          </TabsContent>
          <TabsContent value="legal" className="mt-4">
            <JsonBlock title="Privacy" data={w.privacy} />
            <JsonBlock title="Terms" data={w.terms} />
            <JsonBlock title="Refund" data={w.refund} />
            <JsonBlock title="Cookies" data={w.cookies} />
          </TabsContent>
          <TabsContent value="misc" className="mt-4">
            <JsonBlock title="Programs section" data={w.programs} />
            <JsonBlock title="Blog section" data={w.blog} />
            <JsonBlock title="Career section" data={w.career} />
            <JsonBlock title="Contact section" data={w.contact} />
            <JsonBlock title="404" data={w.notFound} />
          </TabsContent>
        </Tabs>
      )}
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 6 — Programs                                                  */
/* ------------------------------------------------------------------ */

function StepPrograms({
  d,
  update,
  onNext,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const gen = useServerFn(generateProgram);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!name.trim() || !d.chosenName) return;
    setBusy(true);
    try {
      const res = await gen({
        data: { brandName: d.chosenName, program: name.trim(), audience: d.basics.audience },
      });
      update((x) => { x.programs.push({ input: name.trim(), ...(res as any) }); });
      setName("");
      toast.success(`Program "${name.trim()}" ready`);
    } catch (e: any) {
      toast.error(e?.message ?? "Program failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Programs</h2>
      <p className="mt-1 text-sm text-slate-600">
        Type the program name — AI produces landing, outcomes, courses, curriculum, careers, FAQs, SEO.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Computer Science", "Mechanical", "Civil", "Electrical", "MBA", "Finance", "Healthcare"].map((p) => (
          <button
            key={p}
            onClick={() => setName(p)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            {p}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Computer Science" />
        <Button onClick={add} disabled={busy || !name.trim()}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          Add program
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {d.programs.map((p, i) => (
          <details key={i} className="rounded-lg border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              {p.input} — {(p.landingPage?.hero?.headline as string) ?? "Program"}
              <button
                className="ml-3 text-xs text-red-500"
                onClick={(e) => {
                  e.preventDefault();
                  update((x) => { x.programs.splice(i, 1); });
                }}
              >
                Remove
              </button>
            </summary>
            <div className="mt-3">
              <JsonBlock title="Landing" data={p.landingPage} />
            </div>
          </details>
        ))}
      </div>
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 7 — Courses                                                   */
/* ------------------------------------------------------------------ */

function StepCourses({
  d,
  update,
  onNext,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const gen = useServerFn(generateCourse);
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!name.trim() || !d.chosenName) return;
    setBusy(true);
    try {
      const res = await gen({
        data: { brandName: d.chosenName, courseName: name.trim(), programContext: context || undefined },
      });
      update((x) => { x.courses.push({ input: name.trim(), context, ...(res as any) }); });
      setName("");
      toast.success(`Course "${name.trim()}" ready`);
    } catch (e: any) {
      toast.error(e?.message ?? "Course failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Courses</h2>
      <p className="mt-1 text-sm text-slate-600">
        Type the course name — AI builds page, curriculum, projects, assignments, pricing, FAQs, SEO.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Python", "Machine Learning", "Data Science", "AI", "Embedded Systems", "Digital Marketing", "Finance"].map((c) => (
          <button
            key={c}
            onClick={() => setName(c)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-[2fr,2fr,auto]">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Course name" />
        <Input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Program (optional)" />
        <Button onClick={add} disabled={busy || !name.trim()}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          Add course
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {d.courses.map((c, i) => (
          <details key={i} className="rounded-lg border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              {c.input} — {(c.hero?.headline as string) ?? "Course"}
              <button
                className="ml-3 text-xs text-red-500"
                onClick={(e) => {
                  e.preventDefault();
                  update((x) => { x.courses.splice(i, 1); });
                }}
              >
                Remove
              </button>
            </summary>
            <div className="mt-3">
              <JsonBlock title="Course" data={c} />
            </div>
          </details>
        ))}
      </div>
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 8 — Blogs                                                     */
/* ------------------------------------------------------------------ */

function StepBlogs({
  d,
  update,
  onNext,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const gen = useServerFn(generateBlogIdeas);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(25);
  async function run() {
    if (!d.chosenName) return toast.error("Pick a brand name first");
    setBusy(true);
    try {
      const domains = d.programs.map((p) => p.input).filter(Boolean);
      const fallback = d.basics.industry ? [d.basics.industry] : ["General education"];
      const res = await gen({
        data: {
          brandName: d.chosenName,
          domains: domains.length ? domains : fallback,
          count,
        },
      });
      update((x) => { x.blogs = res; });
      toast.success(`${count} blog drafts ready`);
    } catch (e: any) {
      toast.error(e?.message ?? "Blog generation failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Blog drafts</h2>
          <p className="mt-1 text-sm text-slate-600">
            AI writes titles, outlines, SEO, hero-image prompts, FAQs — all saved as drafts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={5}
            max={30}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 25)}
            className="w-20"
          />
          <Button onClick={run} disabled={busy}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
            Generate drafts
          </Button>
        </div>
      </div>
      {d.blogs && (
        <div className="mt-4 space-y-2">
          {(d.blogs.articles ?? []).map((a: any, i: number) => (
            <details key={i} className="rounded-lg border border-slate-200 bg-white p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                {a.title}
                <span className="ml-2 text-xs font-normal text-slate-500">/{a.slug}</span>
              </summary>
              <div className="mt-2 text-xs text-slate-600">{a.excerpt}</div>
              <JsonBlock title="Article" data={a} />
            </details>
          ))}
        </div>
      )}
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 9 — Marketing                                                 */
/* ------------------------------------------------------------------ */

function StepMarketing({
  d,
  update,
  onNext,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const gen = useServerFn(generateMarketingKit);
  const [busy, setBusy] = useState(false);
  const [offer, setOffer] = useState("");
  async function run() {
    if (!d.chosenName) return toast.error("Pick a brand name first");
    setBusy(true);
    try {
      const res = await gen({
        data: {
          brandName: d.chosenName,
          offer: offer || undefined,
          audience: d.basics.audience,
          primaryCta: d.website?.homepage?.hero?.primaryCta,
        },
      });
      update((x) => { x.marketing = res; });
      toast.success("Marketing kit ready");
    } catch (e: any) {
      toast.error(e?.message ?? "Marketing failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Marketing kit</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ads, social posts, emails, WhatsApp, video scripts, flyer, brochure — one shot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Offer (optional)" />
          <Button onClick={run} disabled={busy}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
            Generate
          </Button>
        </div>
      </div>
      {d.marketing && (
        <Tabs defaultValue="ads" className="mt-6">
          <TabsList className="flex flex-wrap gap-1">
            {["ads", "social", "email", "video", "print"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="ads" className="mt-4">
            <JsonBlock title="Google Ads" data={d.marketing.googleAds} />
            <JsonBlock title="Meta Ads" data={d.marketing.metaAds} />
            <JsonBlock title="LinkedIn Ads" data={d.marketing.linkedinAds} />
          </TabsContent>
          <TabsContent value="social" className="mt-4">
            <JsonBlock title="Instagram" data={d.marketing.instagramPosts} />
            <JsonBlock title="Facebook" data={d.marketing.facebookPosts} />
            <JsonBlock title="X" data={d.marketing.xPosts} />
            <JsonBlock title="LinkedIn Posts" data={d.marketing.linkedinPosts} />
          </TabsContent>
          <TabsContent value="email" className="mt-4">
            <JsonBlock title="Email Campaigns" data={d.marketing.emailCampaigns} />
            <JsonBlock title="WhatsApp" data={d.marketing.whatsappMessages} />
          </TabsContent>
          <TabsContent value="video" className="mt-4">
            <JsonBlock title="Video scripts" data={d.marketing.videoScripts} />
          </TabsContent>
          <TabsContent value="print" className="mt-4">
            <JsonBlock title="Flyer" data={d.marketing.flyer} />
            <JsonBlock title="Brochure" data={d.marketing.brochure} />
            <JsonBlock title="Landing page outline" data={d.marketing.landingPageOutline} />
          </TabsContent>
        </Tabs>
      )}
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 10 — Media (heroes, covers)                                   */
/* ------------------------------------------------------------------ */

function StepMedia({
  d,
  update,
  onNext,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const gen = useServerFn(generateHeroImage);
  const [prompt, setPrompt] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!prompt.trim()) return;
    setBusy(true);
    try {
      const res = await gen({ data: { prompt, aspect: "16:9" } });
      update((x) => {
        x.heroImages.push({ label: label || prompt.slice(0, 40), url: (res as any).url });
      });
      setPrompt("");
      setLabel("");
      toast.success("Image ready");
    } catch (e: any) {
      toast.error(e?.message ?? "Image failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Media library</h2>
      <p className="mt-1 text-sm text-slate-600">
        Generate on-brand hero images, course covers, program banners, blog art.
      </p>
      <div className="mt-4 grid gap-2 md:grid-cols-[1fr,2fr,auto]">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" />
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt e.g. Hero for AI academy homepage" />
        <Button onClick={run} disabled={busy || !prompt.trim()}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ImageIcon className="mr-2 size-4" />}
          Generate
        </Button>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {d.heroImages.map((img, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-2">
            <img src={img.url} alt={img.label} className="w-full rounded object-cover" />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="truncate text-slate-700">{img.label}</span>
              <button
                className="text-red-500"
                onClick={() => update((x) => { x.heroImages.splice(i, 1); })}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 11 — Review                                                   */
/* ------------------------------------------------------------------ */

function StepReview({
  d,
  onNext,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const summary = [
    { label: "Brand", value: d.chosenName || "—" },
    { label: "Domain", value: d.chosenDomain || "—" },
    { label: "Tagline", value: d.brand?.tagline || "—" },
    { label: "Website pages", value: d.website ? "12 generated" : "not generated" },
    { label: "Programs", value: `${d.programs.length}` },
    { label: "Courses", value: `${d.courses.length}` },
    { label: "Blogs", value: `${d.blogs?.articles?.length ?? 0}` },
    { label: "Logo variants", value: `${Object.keys(d.logos).length}` },
    { label: "Marketing kit", value: d.marketing ? "ready" : "not generated" },
    { label: "Media items", value: `${d.heroImages.length}` },
  ];
  function downloadJson() {
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(d.chosenName || "academy").replace(/[^a-z0-9]/gi, "-").toLowerCase()}-draft.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Review everything</h2>
      <p className="mt-1 text-sm text-slate-600">
        Edit anywhere by jumping back to a previous step. Nothing is live until you confirm.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summary.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={downloadJson}>
          <Download className="mr-2 size-4" /> Export draft JSON
        </Button>
      </div>
      <NavRow onBack={onBack} onNext={onNext} nextLabel="Continue to publish" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 12 — Publish (gated)                                          */
/* ------------------------------------------------------------------ */

const CHECKLIST = [
  { key: "brand", label: "Brand identity reviewed (name, tagline, palette, voice)" },
  { key: "domain", label: "Domain selected and checked" },
  { key: "website", label: "Website pages reviewed (home, about, legal, FAQ, 404)" },
  { key: "programs", label: "Program pages reviewed" },
  { key: "courses", label: "Course pages reviewed (curriculum, pricing, FAQs)" },
  { key: "blogs", label: "Blog drafts reviewed — I understand they save as drafts, not published" },
  { key: "seo", label: "SEO / metadata reviewed for all key pages" },
  { key: "compliance", label: "Legal pages (Privacy, Terms, Refund, Cookies) reviewed" },
];

function StepPublish({
  d,
  update,
  onBack,
}: {
  d: Draft;
  update: (fn: (x: Draft) => void) => void;
  onBack: () => void;
}) {
  const publish = useServerFn(publishAcademyDraft);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [reviewer, setReviewer] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollTo = useRef<HTMLDivElement>(null);

  const allChecked = CHECKLIST.every((c) => checked[c.key]) && reviewer.trim().length > 1;

  async function confirmPublish() {
    setBusy(true);
    try {
      const res = await publish({
        data: {
          confirm: true,
          reviewerName: reviewer,
          draftSummary: {
            brandName: d.chosenName || "Untitled",
            domain: d.chosenDomain,
            programsCount: d.programs.length,
            coursesCount: d.courses.length,
            blogsCount: d.blogs?.articles?.length ?? 0,
          },
        },
      });
      update((x) => { x.publishedAt = res.queuedAt; });
      toast.success(res.message);
      setOpen(false);
      scrollTo.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e: any) {
      toast.error(e?.message ?? "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={scrollTo}>
      <h2 className="text-xl font-semibold text-slate-900">Publish</h2>
      <p className="mt-1 text-sm text-slate-600">
        One click publishes the academy. Nothing goes live without your explicit confirmation.
      </p>

      {d.publishedAt && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="font-semibold">Queued for publish {new Date(d.publishedAt).toLocaleString()}</div>
          <div className="mt-1">
            Your academy is being provisioned. You can continue editing — subsequent publishes will replace the
            current version.
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <div className="text-sm font-semibold text-slate-900">What will publish</div>
        <ul className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-700 sm:grid-cols-2">
          <li>• Website ({d.website ? "12 pages" : "skipped"})</li>
          <li>• {d.programs.length} program pages</li>
          <li>• {d.courses.length} course pages</li>
          <li>• {d.blogs?.articles?.length ?? 0} blog drafts (saved as drafts)</li>
          <li>• SEO, sitemap, robots, Open Graph tags</li>
          <li>• Marketing kit stored in workspace</li>
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={() => setOpen(true)}>
          <Rocket className="mr-2 size-4" /> Review & publish
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm publish</DialogTitle>
            <DialogDescription>
              Confirm each item below. Publishing is irreversible until you edit and re-publish.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {CHECKLIST.map((c) => (
              <label key={c.key} className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={!!checked[c.key]}
                  onCheckedChange={(v) => setChecked((prev) => ({ ...prev, [c.key]: !!v }))}
                />
                <span>{c.label}</span>
              </label>
            ))}
            <div className="mt-3">
              <Label>Reviewer name</Label>
              <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Your name for the audit log" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPublish} disabled={!allChecked || busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
              Confirm & publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                      */
/* ------------------------------------------------------------------ */

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-xs font-medium text-slate-700">{label}</Label>
      {children}
    </div>
  );
}

function JsonBlock({ title, data }: { title: string; data: unknown }) {
  if (!data) return null;
  return (
    <div className="mt-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <pre className="mt-1 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-800">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function GatedAcademyBuilder() {
  return (
    <AcademyGate>
      <AcademyBuilder />
    </AcademyGate>
  );
}
