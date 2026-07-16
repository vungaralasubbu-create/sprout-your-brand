import { createFileRoute } from "@tanstack/react-router";
import { AcademyGate } from "@/components/partner/academy-gate";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Rocket,
  ArrowRight,
  ArrowLeft,
  RefreshCcw,
  Check,
  Globe,
  Palette,
  Image as ImageIcon,
  BookOpen,
  GraduationCap,
  FileText,
  Megaphone,
  ClipboardCheck,
  Wand2,
  Loader2,
  Send,
} from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/partner/brand-studio")({
  head: () => ({
    meta: [
      { title: "Brand Launch Studio — Glintr Academy" },
      { name: "description", content: "Launch your education brand in under 30 minutes with an AI-guided studio." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AcademyGate>
      <BrandStudio />
    </AcademyGate>
  ),
});

/* ------------------------------------------------------------------ */
/* Types & draft store                                                */
/* ------------------------------------------------------------------ */

type QAKey =
  | "academyName"
  | "seed"
  | "subjects"
  | "country"
  | "teachingMode"
  | "style"
  | "audience";

type Draft = {
  qa: Partial<Record<QAKey, string>>;
  brand?: any;
  logos: Record<string, string>;
  managedSlug?: string;
  website?: any;
  programs: any[];
  courses: any[];
  blogs?: any;
  marketing?: any;
  heroImages: Record<string, string>;
  approved: Record<string, boolean>;
};

const DRAFT_KEY = "glintr.partner.brand-studio.draft.v1";

function loadDraft(): Draft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    return { ...emptyDraft(), ...JSON.parse(raw) };
  } catch {
    return emptyDraft();
  }
}
function emptyDraft(): Draft {
  return {
    qa: {},
    logos: {},
    programs: [],
    courses: [],
    heroImages: {},
    approved: {},
  };
}
function saveDraft(d: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* noop */
  }
}

/* ------------------------------------------------------------------ */
/* Question flow                                                       */
/* ------------------------------------------------------------------ */

const QUESTIONS: { key: QAKey; prompt: string; placeholder: string; suggestions?: string[] }[] = [
  {
    key: "academyName",
    prompt: "What would you like to call your academy? (Skip if you want AI to suggest names.)",
    placeholder: "e.g. Aurora Learning · or leave blank for AI suggestions",
  },
  {
    key: "seed",
    prompt: "In one sentence, what is your academy about?",
    placeholder: "e.g. Practical AI & data careers for working professionals in India",
  },
  {
    key: "subjects",
    prompt: "What subjects or programs will you teach?",
    placeholder: "AI, Data Science, Digital Marketing…",
    suggestions: ["AI & Machine Learning", "Data Science", "Digital Marketing", "Design", "Finance", "Engineering"],
  },
  {
    key: "country",
    prompt: "Which country or region will you target?",
    placeholder: "India · Global · UAE…",
    suggestions: ["India", "Global", "UAE", "US", "UK", "Southeast Asia"],
  },
  {
    key: "teachingMode",
    prompt: "How will you deliver classes?",
    placeholder: "Online · Offline · Hybrid",
    suggestions: ["Online", "Offline", "Hybrid"],
  },
  {
    key: "style",
    prompt: "What brand style do you want?",
    placeholder: "Premium & modern · Bold & youthful · Corporate…",
    suggestions: ["Premium & modern", "Bold & youthful", "Corporate & trustworthy", "Minimal editorial"],
  },
  {
    key: "audience",
    prompt: "Who is the primary audience?",
    placeholder: "Working professionals · College students · Career switchers…",
    suggestions: ["Working professionals", "College students", "Career switchers", "School students"],
  },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const STEPS = [
  { id: 1, label: "Conversation", icon: Sparkles },
  { id: 2, label: "Brand Identity", icon: Palette },
  { id: 3, label: "Managed URL", icon: Globe },
  { id: 4, label: "Logo Studio", icon: ImageIcon },
  { id: 5, label: "Website", icon: FileText },
  { id: 6, label: "Programs", icon: GraduationCap },
  { id: 7, label: "Courses", icon: BookOpen },
  { id: 8, label: "Blog Engine", icon: FileText },
  { id: 9, label: "Marketing", icon: Megaphone },
  { id: 10, label: "Review", icon: ClipboardCheck },
  { id: 11, label: "Publish", icon: Rocket },
];

function BrandStudio() {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [step, setStep] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDraft(loadDraft());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const updateQa = (k: QAKey, v: string) =>
    setDraft((d) => ({ ...d, qa: { ...d.qa, [k]: v } }));

  const brandName =
    draft.brand?.chosenName ||
    draft.qa.academyName ||
    draft.brand?.nameSuggestions?.[0]?.name ||
    "Your Academy";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <Badge variant="outline" className="gap-1 mb-2">
              <Sparkles className="size-3" /> Academy Partner Studio
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Brand Launch Studio
            </h1>
            <p className="text-muted-foreground mt-1">
              Answer a few questions. AI builds your brand, website, programs, courses, blog and marketing kit — all as
              drafts you approve before publish.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">
              Step {step} of {STEPS.length}
            </div>
            <Progress value={(step / STEPS.length) * 100} className="w-64" />
          </div>
        </div>

        {/* Step nav */}
        <div className="flex gap-1 overflow-x-auto pb-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = s.id === step;
            const done = s.id < step;
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition inline-flex items-center gap-1.5 ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : done
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                {done ? <Check className="size-3" /> : <Icon className="size-3" />}
                {s.id}. {s.label}
              </button>
            );
          })}
        </div>

        {/* Step content */}
        <div className="rounded-2xl border bg-white shadow-sm p-5 sm:p-8">
          {step === 1 && <StepConversation draft={draft} onAnswer={updateQa} onDone={() => setStep(2)} />}
          {step === 2 && <StepBrand draft={draft} update={update} brandName={brandName} />}
          {step === 3 && <StepManagedUrl draft={draft} update={update} brandName={brandName} />}
          {step === 4 && <StepLogo draft={draft} update={update} brandName={brandName} />}
          {step === 5 && <StepWebsite draft={draft} update={update} brandName={brandName} />}
          {step === 6 && <StepPrograms draft={draft} update={update} brandName={brandName} />}
          {step === 7 && <StepCourses draft={draft} update={update} brandName={brandName} />}
          {step === 8 && <StepBlog draft={draft} update={update} brandName={brandName} />}
          {step === 9 && <StepMarketing draft={draft} update={update} brandName={brandName} />}
          {step === 10 && <StepReview draft={draft} update={update} brandName={brandName} />}
          {step === 11 && <StepPublish draft={draft} brandName={brandName} />}

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="ghost"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="gap-2"
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            <div className="text-xs text-muted-foreground">Draft auto-saved in this browser</div>
            <Button
              disabled={step === STEPS.length}
              onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
              className="gap-2"
            >
              Next <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   STEP 1 — Conversational Q&A
================================================================== */

function StepConversation({
  draft,
  onAnswer,
  onDone,
}: {
  draft: Draft;
  onAnswer: (k: QAKey, v: string) => void;
  onDone: () => void;
}) {
  const [idx, setIdx] = useState(() => {
    const first = QUESTIONS.findIndex((q) => !draft.qa[q.key]);
    return first === -1 ? QUESTIONS.length - 1 : first;
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [idx]);

  const answered = QUESTIONS.slice(0, idx).filter((q) => draft.qa[q.key]);
  const current = QUESTIONS[idx];

  const submit = (val: string) => {
    const v = val.trim();
    if (!v && current.key !== "academyName") {
      toast.error("Type a short answer to continue");
      return;
    }
    onAnswer(current.key, v);
    setInput("");
    if (idx < QUESTIONS.length - 1) setIdx(idx + 1);
  };

  const allDone = QUESTIONS.every((q) => draft.qa[q.key] !== undefined);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-1">Let's design your academy</h2>
      <p className="text-muted-foreground text-sm mb-6">
        I'll ask short questions one at a time. Answer naturally — you can skip the name and let me suggest options.
      </p>

      <div
        ref={scrollRef}
        className="rounded-xl border bg-slate-50/60 p-4 sm:p-6 max-h-[420px] overflow-y-auto space-y-4"
      >
        {answered.map((q) => (
          <div key={q.key} className="space-y-2">
            <ChatBubble role="ai">{q.prompt}</ChatBubble>
            <ChatBubble role="user">{draft.qa[q.key] || <em className="opacity-70">Skipped</em>}</ChatBubble>
          </div>
        ))}
        {!allDone && (
          <div className="space-y-2">
            <ChatBubble role="ai">{current.prompt}</ChatBubble>
            {current.suggestions && (
              <div className="flex flex-wrap gap-2 pl-1">
                {current.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="text-xs rounded-full border bg-white px-3 py-1 hover:bg-primary/5 hover:border-primary/30 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {allDone && (
          <div className="space-y-2">
            <ChatBubble role="ai">
              Perfect — I have everything I need. Let's move on to <b>Brand Identity</b> generation.
            </ChatBubble>
          </div>
        )}
      </div>

      {!allDone ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="mt-4 flex gap-2"
        >
          <Input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={current.placeholder}
            className="flex-1"
          />
          <Button type="submit" className="gap-2">
            <Send className="size-4" /> Send
          </Button>
        </form>
      ) : (
        <div className="mt-4 flex justify-end">
          <Button onClick={onDone} className="gap-2">
            Generate Brand Identity <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ChatBubble({ role, children }: { role: "ai" | "user"; children: React.ReactNode }) {
  const isAi = role === "ai";
  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
          isAi ? "bg-white border" : "bg-primary text-primary-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ==================================================================
   STEP 2 — Brand Identity
================================================================== */

function StepBrand({
  draft,
  update,
  brandName,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  brandName: string;
}) {
  const fn = useServerFn(generateBrandIdentity);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!draft.qa.seed) {
      toast.error("Complete the conversation first");
      return;
    }
    setLoading(true);
    try {
      const res = await fn({
        data: {
          seed: draft.qa.seed,
          academyName: draft.qa.academyName || undefined,
          industry: draft.qa.subjects,
          audience: draft.qa.audience,
          country: draft.qa.country,
          style: draft.qa.style,
          teachingMode: draft.qa.teachingMode,
        },
      } as any);
      update({ brand: { ...res, chosenName: draft.qa.academyName || res.nameSuggestions?.[0]?.name } });
      toast.success("Brand identity generated");
    } catch (e: any) {
      toast.error(e?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const b = draft.brand;

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Palette}
        title="Brand Identity"
        subtitle="Names, tagline, mission, vision, voice, colors and typography."
        action={
          <Button onClick={run} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {b ? "Regenerate" : "Generate"}
          </Button>
        }
      />

      {!b && <EmptyHint text="Click Generate to design your brand identity from your answers." />}

      {b && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Name Suggestions">
            <div className="space-y-2">
              {(b.nameSuggestions || []).map((n: any, i: number) => (
                <label key={i} className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="chosenName"
                    checked={b.chosenName === n.name}
                    onChange={() => update({ brand: { ...b, chosenName: n.name } })}
                    className="mt-1"
                  />
                  <span>
                    <b>{n.name}</b>
                    <span className="text-muted-foreground"> — {n.rationale}</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>
          <Card title="Tagline & Positioning">
            <p className="text-sm"><b>Tagline:</b> {b.tagline}</p>
            <p className="text-sm mt-2"><b>Positioning:</b> {b.positioning}</p>
          </Card>
          <Card title="Mission & Vision">
            <p className="text-sm"><b>Mission:</b> {b.mission}</p>
            <p className="text-sm mt-2"><b>Vision:</b> {b.vision}</p>
          </Card>
          <Card title="Brand Story"><p className="text-sm whitespace-pre-line">{b.brandStory}</p></Card>
          <Card title="Voice">
            <p className="text-sm"><b>Tone:</b> {b.brandVoice?.tone}</p>
            <p className="text-sm mt-1"><b>Adjectives:</b> {(b.brandVoice?.adjectives || []).join(", ")}</p>
            <p className="text-sm mt-1"><b>Do:</b> {(b.brandVoice?.doList || []).join(" · ")}</p>
            <p className="text-sm mt-1"><b>Don't:</b> {(b.brandVoice?.dontList || []).join(" · ")}</p>
          </Card>
          <Card title="Colors">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(b.colorPalette || {})
                .filter(([, v]) => typeof v === "string" && (v as string).startsWith("#"))
                .map(([k, v]) => (
                  <div key={k} className="text-xs">
                    <div className="h-12 rounded-md border" style={{ background: v as string }} />
                    <div className="mt-1 font-medium">{k}</div>
                    <div className="text-muted-foreground">{v as string}</div>
                  </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{b.colorPalette?.rationale}</p>
          </Card>
          <Card title="Typography">
            <p className="text-sm"><b>Heading:</b> {b.typography?.heading}</p>
            <p className="text-sm"><b>Body:</b> {b.typography?.body}</p>
            <p className="text-sm"><b>Mono:</b> {b.typography?.monospace}</p>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ==================================================================
   STEP 3 — Managed URL (Glintr Managed Infrastructure)
================================================================== */

function StepManagedUrl({
  draft,
  update,
  brandName,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  brandName: string;
}) {
  const defaultSlug = (brandName || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
  const [slug, setSlug] = useState(draft.managedSlug || defaultSlug);

  useEffect(() => {
    if (!draft.managedSlug && defaultSlug) {
      setSlug(defaultSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSlug]);

  const cleaned = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
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
    <div className="space-y-6">
      <SectionHeader
        icon={Globe}
        title="Glintr Managed Infrastructure"
        subtitle="You focus on teaching and selling. Glintr owns and runs everything technical."
      />

      <div className="rounded-xl border bg-white p-5 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Your managed academy URL</div>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onBlur={() => update({ managedSlug: cleaned })}
              placeholder="your-brand"
              className="flex-1 font-mono"
            />
            <div className="inline-flex items-center px-3 rounded-md border bg-slate-50 text-sm text-slate-600 font-mono">
              .glintr.com
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Live URL will be <span className="font-mono text-foreground">{managedUrl}</span>. Glintr provisions the site, SSL and CDN automatically after approval.
          </div>
        </div>

        <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-3 text-sm">
          <b>No domains to buy, no DNS, no hosting.</b> If Glintr later purchases a dedicated domain for your academy, our team migrates you internally — you never touch DNS or SSL.
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Glintr manages, end-to-end</div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {managed.map((m) => (
            <div key={m} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
              <Check className="size-4 text-emerald-600 shrink-0" />
              <span>{m}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <b className="text-foreground">Your job:</b> teaching, selling, creating courses, recording videos, engaging students and growing enrollments. Everything else is handled by Glintr as part of your revenue-share partnership.
      </div>
    </div>
  );
}

/* ==================================================================
   STEP 4 — Logo
================================================================== */

function StepLogo({
  draft,
  update,
  brandName,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  brandName: string;
}) {
  const fn = useServerFn(generateLogo);
  const [loading, setLoading] = useState<string | null>(null);
  const variants = ["primary", "icon", "monogram", "horizontal", "vertical", "favicon", "dark", "light", "social"] as const;

  const gen = async (variant: string) => {
    setLoading(variant);
    try {
      const res: any = await fn({
        data: {
          brandName,
          tagline: draft.brand?.tagline,
          primaryColor: draft.brand?.colorPalette?.primary,
          secondaryColor: draft.brand?.colorPalette?.secondary,
          style: draft.qa.style,
          variant: variant as any,
        },
      } as any);
      update({ logos: { ...draft.logos, [variant]: res.url } });
      toast.success(`${variant} logo generated`);
    } catch (e: any) {
      toast.error(e?.message || "Logo generation failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={ImageIcon}
        title="Logo Studio"
        subtitle={`Generate every logo variant for ${brandName}. Regenerate as many times as you like.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {variants.map((v) => (
          <div key={v} className="rounded-xl border bg-white p-3">
            <div className="aspect-square rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden mb-2">
              {draft.logos[v] ? (
                <img src={draft.logos[v]} alt={`${v} logo`} className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="size-6 text-slate-300" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium capitalize">{v}</div>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => gen(v)} disabled={loading === v}>
                {loading === v ? <Loader2 className="size-3 animate-spin" /> : <RefreshCcw className="size-3" />}
                {draft.logos[v] ? "Regen" : "Generate"}
              </Button>
            </div>
            {draft.logos[v] && (
              <a
                href={draft.logos[v]}
                download={`${brandName}-${v}.png`}
                className="text-xs text-primary mt-2 inline-block hover:underline"
              >
                Download PNG
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================================================================
   STEP 5 — Website
================================================================== */

function StepWebsite({
  draft,
  update,
  brandName,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  brandName: string;
}) {
  const fn = useServerFn(generateWebsiteContent);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res: any = await fn({
        data: {
          brandName,
          tagline: draft.brand?.tagline,
          brandStory: draft.brand?.brandStory,
          audience: draft.qa.audience,
          teachingMode: draft.qa.teachingMode,
        },
      } as any);
      update({ website: res });
      toast.success("Website drafted (all pages)");
    } catch (e: any) {
      toast.error(e?.message || "Website generation failed");
    } finally {
      setLoading(false);
    }
  };

  const pages = draft.website ? Object.keys(draft.website) : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={FileText}
        title="Website Builder"
        subtitle="Homepage, About, Programs, Blog, Contact, FAQ, Privacy, Terms, Refund, Careers — all drafts."
        action={
          <Button onClick={run} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {draft.website ? "Regenerate" : "Generate website"}
          </Button>
        }
      />
      {!draft.website && <EmptyHint text="One click generates every page as a draft. Nothing goes live yet." />}
      {draft.website && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <div key={p} className="rounded-lg border bg-white p-3">
              <div className="text-sm font-medium capitalize mb-1">{p}</div>
              <div className="text-xs text-muted-foreground">
                Draft ready · {JSON.stringify(draft.website[p]).length} chars
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================================================================
   STEP 6 — Programs
================================================================== */

function StepPrograms({
  draft,
  update,
  brandName,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  brandName: string;
}) {
  const fn = useServerFn(generateProgram);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res: any = await fn({
        data: { brandName, program: name.trim(), audience: draft.qa.audience },
      } as any);
      update({ programs: [...draft.programs, { name: name.trim(), ...res }] });
      setName("");
      toast.success(`Program "${name}" generated`);
    } catch (e: any) {
      toast.error(e?.message || "Program generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={GraduationCap} title="Program Builder" subtitle="Type a program name. AI builds the landing page, curriculum, career paths, FAQs and SEO." />
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Artificial Intelligence" className="flex-1" />
        <Button onClick={add} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          Add program
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Computer Science", "Artificial Intelligence", "Data Science", "Digital Marketing", "Finance", "Healthcare", "Management"].map((s) => (
          <button key={s} onClick={() => setName(s)} className="text-xs rounded-full border bg-white px-3 py-1 hover:bg-primary/5">
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {draft.programs.map((p, i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Program</div>
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {p.landingPage?.overview}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(p.landingPage?.coreSkills || []).slice(0, 5).map((s: string) => (
                <Badge key={s} variant="muted" className="text-[10px]">{s}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================================================================
   STEP 7 — Courses
================================================================== */

function StepCourses({
  draft,
  update,
  brandName,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  brandName: string;
}) {
  const fn = useServerFn(generateCourse);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res: any = await fn({
        data: { brandName, courseName: name.trim() },
      } as any);
      update({ courses: [...draft.courses, { name: name.trim(), ...res }] });
      setName("");
      toast.success(`Course "${name}" generated`);
    } catch (e: any) {
      toast.error(e?.message || "Course generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={BookOpen} title="Course Builder" subtitle="Type a course name. AI builds curriculum, projects, assignments, pricing, certificate and SEO." />
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Python for Data Science" className="flex-1" />
        <Button onClick={add} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          Add course
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Python", "Machine Learning", "AI", "VLSI", "Embedded Systems", "Digital Marketing", "Data Science"].map((s) => (
          <button key={s} onClick={() => setName(s)} className="text-xs rounded-full border bg-white px-3 py-1 hover:bg-primary/5">
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {draft.courses.map((c, i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Course</div>
            <div className="font-semibold">{c.name}</div>
            <div className="text-sm text-muted-foreground line-clamp-3 mt-1">{c.overview}</div>
            <div className="text-xs mt-2 text-muted-foreground">
              {c.duration?.weeks} weeks · {c.duration?.totalHours}h · ₹{c.pricing?.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================================================================
   STEP 8 — Blog Engine
================================================================== */

function StepBlog({
  draft,
  update,
  brandName,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  brandName: string;
}) {
  const fn = useServerFn(generateBlogIdeas);
  const [count, setCount] = useState(15);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const domains = (draft.qa.subjects || "AI, Data Science, Digital Marketing").split(",").map((s) => s.trim()).filter(Boolean);
      const res: any = await fn({
        data: { brandName, domains, count },
      } as any);
      update({ blogs: res });
      toast.success(`${res?.articles?.length || 0} blog drafts created`);
    } catch (e: any) {
      toast.error(e?.message || "Blog generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={FileText}
        title="Blog Engine"
        subtitle="Editorial calendar, drafts, SEO, schema and internal links — all as drafts."
        action={
          <div className="flex gap-2 items-center">
            <Input type="number" min={5} max={30} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-20" />
            <Button onClick={run} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              Generate
            </Button>
          </div>
        }
      />
      {draft.blogs?.articles && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {draft.blogs.articles.map((a: any, i: number) => (
            <div key={i} className="rounded-lg border bg-white p-4">
              <div className="text-xs text-muted-foreground">/{a.slug}</div>
              <div className="font-semibold text-sm mt-1">{a.title}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-3">{a.excerpt}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">{a.targetKeyword}</Badge>
                <Badge variant="muted" className="text-[10px]">{a.estimatedWordCount} words</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================================================================
   STEP 9 — Marketing
================================================================== */

function StepMarketing({
  draft,
  update,
  brandName,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  brandName: string;
}) {
  const fn = useServerFn(generateMarketingKit);
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState("");

  const run = async () => {
    setLoading(true);
    try {
      const res: any = await fn({
        data: { brandName, offer: offer || undefined, audience: draft.qa.audience, primaryCta: "Enroll now" },
      } as any);
      update({ marketing: res });
      toast.success("Marketing kit generated");
    } catch (e: any) {
      toast.error(e?.message || "Marketing generation failed");
    } finally {
      setLoading(false);
    }
  };

  const m = draft.marketing;
  const sections = m
    ? [
        ["Google Ads", m.googleAds?.length],
        ["Meta Ads", m.metaAds?.length],
        ["LinkedIn Ads", m.linkedinAds?.length],
        ["Instagram Posts", m.instagramPosts?.length],
        ["Facebook Posts", m.facebookPosts?.length],
        ["X Posts", m.xPosts?.length],
        ["Email Campaigns", m.emailCampaigns?.length],
        ["WhatsApp", m.whatsappMessages?.length],
        ["Brochure", m.brochure ? "1" : 0],
        ["Flyer", m.flyer ? "1" : 0],
        ["Video Scripts", m.videoScripts ? "1" : 0],
      ]
    : [];

  return (
    <div className="space-y-6">
      <SectionHeader icon={Megaphone} title="Marketing Studio" subtitle="Ads, social, email, WhatsApp, brochures and video scripts." />
      <div className="flex gap-2">
        <Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Launch offer (optional) — e.g. 30% off flagship AI program" className="flex-1" />
        <Button onClick={run} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          {m ? "Regenerate" : "Generate kit"}
        </Button>
      </div>
      {m && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {sections.map(([label, count]) => (
            <div key={label as string} className="rounded-lg border bg-white p-3 flex items-center justify-between">
              <div className="text-sm font-medium">{label as string}</div>
              <Badge variant="muted">{count || 0}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================================================================
   STEP 10 — Review
================================================================== */

function StepReview({
  draft,
  update,
  brandName,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  brandName: string;
}) {
  const items = [
    { key: "brand", label: "Brand identity", ready: !!draft.brand },
    { key: "managedUrl", label: "Managed URL set", ready: !!draft.managedSlug, optional: true },
    { key: "logos", label: "Logos", ready: Object.keys(draft.logos).length >= 3 },
    { key: "website", label: "Website pages", ready: !!draft.website },
    { key: "programs", label: `Programs (${draft.programs.length})`, ready: draft.programs.length >= 1 },
    { key: "courses", label: `Courses (${draft.courses.length})`, ready: draft.courses.length >= 1 },
    { key: "blogs", label: `Blog drafts (${draft.blogs?.articles?.length || 0})`, ready: !!draft.blogs },
    { key: "marketing", label: "Marketing kit", ready: !!draft.marketing },
  ];

  const toggleApprove = (k: string) =>
    update({ approved: { ...draft.approved, [k]: !draft.approved[k] } });

  return (
    <div className="space-y-6">
      <SectionHeader icon={ClipboardCheck} title="Review Workspace" subtitle="Approve each section. Nothing is published until you click Publish Academy." />
      <div className="grid gap-3">
        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between rounded-lg border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className={`size-8 rounded-full flex items-center justify-center ${it.ready ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {it.ready ? <Check className="size-4" /> : "—"}
              </div>
              <div>
                <div className="font-medium text-sm">{it.label}</div>
                <div className="text-xs text-muted-foreground">
                  {it.ready ? "Draft ready" : it.optional ? "Optional" : "Not generated yet"}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant={draft.approved[it.key] ? "primary" : "outline"}
              disabled={!it.ready}
              onClick={() => toggleApprove(it.key)}
              className="gap-1"
            >
              {draft.approved[it.key] ? <><Check className="size-3" /> Approved</> : "Approve"}
            </Button>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm">
        <b>Reminder:</b> Everything above lives only as a draft in your browser and in your workspace. It is not visible to the public. Publishing is a separate, explicit step.
      </div>
    </div>
  );
}

/* ==================================================================
   STEP 11 — Publish
================================================================== */

function StepPublish({ draft, brandName }: { draft: Draft; brandName: string }) {
  const fn = useServerFn(publishAcademyDraft);
  const [reviewer, setReviewer] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState<null | { queuedAt: string; message: string }>(null);

  const requiredApproved = ["brand", "logos", "website", "programs", "courses"];
  const missing = requiredApproved.filter((k) => !draft.approved[k]);

  const run = async () => {
    if (!reviewer.trim()) {
      toast.error("Add reviewer name");
      return;
    }
    if (missing.length) {
      toast.error(`Approve first: ${missing.join(", ")}`);
      return;
    }
    setPublishing(true);
    try {
      const res: any = await fn({
        data: {
          confirm: true,
          reviewerName: reviewer.trim(),
          draftSummary: {
            brandName,
            domain: draft.domain ? `${draft.domain.name}${draft.domain.ext}` : undefined,
            programsCount: draft.programs.length,
            coursesCount: draft.courses.length,
            blogsCount: draft.blogs?.articles?.length || 0,
          },
        },
      } as any);
      setDone({ queuedAt: res.queuedAt, message: res.message });
      toast.success("Academy queued for publish");
    } catch (e: any) {
      toast.error(e?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={Rocket} title="Publish Academy" subtitle="This will queue website, programs, courses, blogs, SEO, sitemap and robots for publish." />

      {done ? (
        <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-6">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <Check className="size-5" /> Academy queued for publish
          </div>
          <p className="text-sm mt-2">{done.message}</p>
          <p className="text-xs text-muted-foreground mt-1">Queued at {new Date(done.queuedAt).toLocaleString()}</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-white p-4 text-sm space-y-1">
            <div><b>Brand:</b> {brandName}</div>
            <div><b>Domain:</b> {draft.domain ? `${draft.domain.name}${draft.domain.ext}` : "—"}</div>
            <div><b>Programs:</b> {draft.programs.length}</div>
            <div><b>Courses:</b> {draft.courses.length}</div>
            <div><b>Blog drafts:</b> {draft.blogs?.articles?.length || 0}</div>
          </div>

          {missing.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
              Approve these in Review before publishing: <b>{missing.join(", ")}</b>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Reviewer name (yours)" className="flex-1" />
            <Button onClick={run} disabled={publishing || missing.length > 0} className="gap-2" size="lg">
              {publishing ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
              Publish Academy
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ==================================================================
   Shared UI
================================================================== */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
