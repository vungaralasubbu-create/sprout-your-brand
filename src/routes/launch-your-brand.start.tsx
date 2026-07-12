import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Container, Section } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import {
  BRAND_AUDIENCE_OPTIONS,
  BRAND_BUSINESS_TYPES,
  BRAND_PERSONALITIES,
  BRAND_SERVICES,
  BRAND_TYPES,
  WHITE_LABEL_PROGRAMS,
  type BrandServiceKey,
} from "@/data/brand-cms";

export const Route = createFileRoute("/launch-your-brand/start")({
  head: () => ({
    meta: [
      { title: "Start Your Brand Setup — Glintr" },
      {
        name: "description",
        content:
          "Interactive 8-step brand builder — choose your name, programs, infrastructure, style, and business details, then submit for launch.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BrandBuilderPage,
});

/* ---------------- Types & storage ---------------- */

type Colors = { primary?: string; secondary?: string; accent?: string };
type Social = { instagram?: string; facebook?: string; linkedin?: string; youtube?: string; other?: string };

interface Draft {
  step: number;
  preferred_brand_name: string;
  alternative_name_1: string;
  alternative_name_2: string;
  name_check_result: "unchecked" | "available" | "conflict";
  brand_type: string;
  target_audience: string[];
  brand_vision: string;
  selected_program_ids: string[];
  selected_services: BrandServiceKey[];
  setup_type: "select_all" | "recommended" | "custom" | "";
  brand_personality: string[];
  brand_colors: Colors;
  needs_logo_help: boolean;
  tagline: string;
  has_domain: "yes" | "no" | "not_sure" | "";
  domain_name: string;
  social_profiles: Social;
  business_type: string;
  country: string;
  state: string;
  city: string;
  business_email: string;
  business_mobile: string;
  consent_confirmed: boolean;
}

const EMPTY: Draft = {
  step: 1,
  preferred_brand_name: "",
  alternative_name_1: "",
  alternative_name_2: "",
  name_check_result: "unchecked",
  brand_type: "",
  target_audience: [],
  brand_vision: "",
  selected_program_ids: [],
  selected_services: [],
  setup_type: "",
  brand_personality: [],
  brand_colors: {},
  needs_logo_help: false,
  tagline: "",
  has_domain: "",
  domain_name: "",
  social_profiles: {},
  business_type: "",
  country: "",
  state: "",
  city: "",
  business_email: "",
  business_mobile: "",
  consent_confirmed: false,
};

const STORAGE_KEY = "glintr:brand-builder-draft:v1";
const TOTAL_STEPS = 8;

const STEP_TITLES = [
  "Brand Name",
  "About Your Brand",
  "Select Programs",
  "Infrastructure",
  "Brand Style",
  "Domain & Social",
  "Business Details",
  "Review & Submit",
];

/* ---------------- Root ---------------- */

function BrandBuilderPage() {
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [hydrated, setHydrated] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDraft({ ...EMPTY, ...JSON.parse(raw) });
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  }, [draft, hydrated]);

  const update = React.useCallback((patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const canNext = React.useMemo(() => validateStep(draft), [draft]);

  const goNext = () => {
    if (!canNext.ok) {
      toast.error(canNext.message);
      return;
    }
    update({ step: Math.min(TOTAL_STEPS, draft.step + 1) });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goPrev = () => {
    update({ step: Math.max(1, draft.step - 1) });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const jumpTo = (n: number) => update({ step: Math.min(Math.max(1, n), TOTAL_STEPS) });

  const onSubmit = async () => {
    if (!draft.consent_confirmed) {
      toast.error("Please confirm the consent statement to submit.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData.user;
      if (!user) {
        // No auth yet in the module — save locally and route to consultation.
        toast.success("Draft saved. Book a consultation and our team will pick this up.");
        navigate({ to: "/launch-your-brand/consultation" });
        return;
      }
      const payload = draftToRow(draft, user.id);
      const { error } = await supabase.from("brand_applications").insert(payload);
      if (error) throw error;
      toast.success("Brand launch request submitted! Our team will review shortly.");
      localStorage.removeItem(STORAGE_KEY);
      navigate({ to: "/launch-your-brand" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Your draft is safe — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = Math.round(((draft.step - 1) / (TOTAL_STEPS - 1)) * 100);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Section className="pt-8 pb-16">
        <Container className="max-w-4xl">
          <div className="mb-8">
            <Link to="/launch-your-brand" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" /> Back to Launch Your Brand
            </Link>
            <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Brand Builder</h1>
            <p className="mt-2 text-muted-foreground">
              Step {draft.step} of {TOTAL_STEPS} — {STEP_TITLES[draft.step - 1]}
            </p>
            <Progress value={progress} className="mt-4 h-1.5" />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {STEP_TITLES.map((t, i) => {
                const idx = i + 1;
                const done = idx < draft.step;
                const active = idx === draft.step;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => jumpTo(idx)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active && "border-primary bg-primary text-primary-foreground",
                      done && !active && "border-primary/30 bg-primary-soft text-primary",
                      !active && !done && "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {done ? <Check className="mr-1 inline size-3" /> : `${idx}. `}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="border-border/60">
            <CardContent className="p-6 md:p-8">
              {draft.step === 1 && <StepName draft={draft} update={update} />}
              {draft.step === 2 && <StepAbout draft={draft} update={update} />}
              {draft.step === 3 && <StepPrograms draft={draft} update={update} />}
              {draft.step === 4 && <StepInfra draft={draft} update={update} />}
              {draft.step === 5 && <StepStyle draft={draft} update={update} />}
              {draft.step === 6 && <StepDomain draft={draft} update={update} />}
              {draft.step === 7 && <StepBusiness draft={draft} update={update} />}
              {draft.step === 8 && <StepReview draft={draft} update={update} jumpTo={jumpTo} />}
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={goPrev} disabled={draft.step === 1}>
              <ArrowLeft className="size-4" /> Previous
            </Button>
            <p className="text-xs text-muted-foreground">Your progress is auto-saved.</p>
            {draft.step < TOTAL_STEPS ? (
              <Button variant="gradient" onClick={goNext}>
                Save & Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button variant="gradient" onClick={onSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Submit Brand Launch Request
              </Button>
            )}
          </div>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}

/* ---------------- Validation ---------------- */

function validateStep(d: Draft): { ok: boolean; message: string } {
  switch (d.step) {
    case 1:
      if (!d.preferred_brand_name.trim()) return { ok: false, message: "Enter a preferred brand name." };
      return { ok: true, message: "" };
    case 2:
      if (!d.brand_type) return { ok: false, message: "Select a brand type." };
      if (d.target_audience.length === 0) return { ok: false, message: "Pick at least one target audience." };
      return { ok: true, message: "" };
    case 3:
      if (d.selected_program_ids.length === 0) return { ok: false, message: "Select at least one program." };
      return { ok: true, message: "" };
    case 4:
      if (!d.setup_type) return { ok: false, message: "Choose a setup type." };
      if (d.selected_services.length === 0) return { ok: false, message: "Select at least one service." };
      return { ok: true, message: "" };
    case 5:
      return { ok: true, message: "" };
    case 6:
      if (!d.has_domain) return { ok: false, message: "Tell us about your domain." };
      return { ok: true, message: "" };
    case 7:
      if (!d.business_type) return { ok: false, message: "Select a business type." };
      if (!d.business_email.trim() || !d.business_mobile.trim()) return { ok: false, message: "Business email and mobile are required." };
      return { ok: true, message: "" };
    default:
      return { ok: true, message: "" };
  }
}

/* ---------------- Steps ---------------- */

function StepName({ draft, update }: StepProps) {
  const [checking, setChecking] = React.useState(false);

  const check = async () => {
    if (!draft.preferred_brand_name.trim()) {
      toast.error("Enter a preferred brand name first.");
      return;
    }
    setChecking(true);
    try {
      // Internal platform conflict check only.
      const { data, error } = await supabase
        .from("brands")
        .select("id")
        .ilike("brand_name", draft.preferred_brand_name.trim())
        .limit(1);
      if (error) throw error;
      const conflict = (data ?? []).length > 0;
      update({ name_check_result: conflict ? "conflict" : "available", name_availability_checked: true } as any);
      toast[conflict ? "error" : "success"](
        conflict ? "That name conflicts with an existing brand on Glintr." : "No conflicts on the Glintr platform.",
      );
    } catch {
      toast.error("Couldn't check availability right now. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <StepShell title="What do you want to call your education brand?" description="Pick a name that represents your business. You can propose two alternatives too.">
      <div className="grid gap-4">
        <Field label="Preferred Brand Name" required>
          <Input value={draft.preferred_brand_name} onChange={(e) => update({ preferred_brand_name: e.target.value, name_check_result: "unchecked" })} placeholder="e.g. NexaEdu" />
        </Field>
        <Field label="Alternative Brand Name 1">
          <Input value={draft.alternative_name_1} onChange={(e) => update({ alternative_name_1: e.target.value })} />
        </Field>
        <Field label="Alternative Brand Name 2">
          <Input value={draft.alternative_name_2} onChange={(e) => update({ alternative_name_2: e.target.value })} />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={check} disabled={checking}>
            {checking ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
            Check Platform Name Availability
          </Button>
          {draft.name_check_result === "available" ? (
            <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">Available on Glintr</Badge>
          ) : draft.name_check_result === "conflict" ? (
            <Badge variant="destructive">Conflict on Glintr</Badge>
          ) : null}
        </div>
        <p className="mt-2 flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          <span>
            Platform name availability checks internal Glintr conflicts only. It does not confirm
            trademark, domain, company registration, or legal name availability — those are
            separate processes.
          </span>
        </p>
      </div>
    </StepShell>
  );
}

function StepAbout({ draft, update }: StepProps) {
  const toggleAudience = (a: string) => {
    const has = draft.target_audience.includes(a);
    update({ target_audience: has ? draft.target_audience.filter((x) => x !== a) : [...draft.target_audience, a] });
  };
  return (
    <StepShell title="Tell us about your brand" description="This helps us configure the right programs, tone, and marketing.">
      <div className="grid gap-4">
        <Field label="What type of education brand are you building?" required>
          <Select value={draft.brand_type} onValueChange={(v) => update({ brand_type: v })}>
            <SelectTrigger><SelectValue placeholder="Choose brand type" /></SelectTrigger>
            <SelectContent>
              {BRAND_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Who is your target audience?" required>
          <div className="flex flex-wrap gap-2">
            {BRAND_AUDIENCE_OPTIONS.map((a) => {
              const active = draft.target_audience.includes(a);
              return (
                <button
                  type="button"
                  key={a}
                  onClick={() => toggleAudience(a)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                  )}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Describe your brand vision">
          <Textarea rows={4} value={draft.brand_vision} onChange={(e) => update({ brand_vision: e.target.value })} placeholder="What do you want your brand to stand for?" />
        </Field>
      </div>
    </StepShell>
  );
}

function StepPrograms({ draft, update }: StepProps) {
  const grouped = React.useMemo(() => {
    const g: Record<string, { name: string; items: typeof WHITE_LABEL_PROGRAMS }> = {};
    for (const p of WHITE_LABEL_PROGRAMS) {
      if (!g[p.categorySlug]) g[p.categorySlug] = { name: p.categoryName, items: [] };
      g[p.categorySlug].items.push(p);
    }
    return g;
  }, []);

  const toggle = (id: string) => {
    const has = draft.selected_program_ids.includes(id);
    update({ selected_program_ids: has ? draft.selected_program_ids.filter((x) => x !== id) : [...draft.selected_program_ids, id] });
  };

  return (
    <StepShell title="Select programs to launch under your brand" description="Loaded from Glintr's white-label eligible catalogue. Only approved programs are shown.">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{draft.selected_program_ids.length} selected</span>
        <button type="button" className="text-primary hover:underline" onClick={() => update({ selected_program_ids: [] })}>Clear all</button>
      </div>
      <div className="mt-4 flex flex-col gap-5">
        {Object.entries(grouped).map(([slug, cat]) => (
          <div key={slug}>
            <p className="text-label mb-2">{cat.name}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {cat.items.map((p) => {
                const active = draft.selected_program_ids.includes(p.id);
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                      active ? "border-primary bg-primary-soft" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded border", active ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                      {active ? <Check className="size-3" /> : null}
                    </span>
                    <span className="flex-1">{p.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </StepShell>
  );
}

function StepInfra({ draft, update }: StepProps) {
  const applySetup = (type: "select_all" | "recommended" | "custom") => {
    if (type === "select_all") {
      update({ setup_type: type, selected_services: BRAND_SERVICES.map((s) => s.key) });
    } else if (type === "recommended") {
      update({ setup_type: type, selected_services: BRAND_SERVICES.filter((s) => s.recommended).map((s) => s.key) });
    } else {
      update({ setup_type: type });
    }
  };
  const toggle = (k: BrandServiceKey) => {
    const has = draft.selected_services.includes(k);
    update({
      setup_type: "custom",
      selected_services: has ? draft.selected_services.filter((x) => x !== k) : [...draft.selected_services, k],
    });
  };
  return (
    <StepShell title="Choose your infrastructure" description="Select the services you want configured. You can adjust later from your dashboard.">
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { k: "select_all", label: "Select All" },
          { k: "recommended", label: "Recommended Setup" },
          { k: "custom", label: "Custom Setup" },
        ].map((o) => (
          <button
            key={o.k}
            type="button"
            onClick={() => applySetup(o.k as any)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              draft.setup_type === o.k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {BRAND_SERVICES.map((s) => {
          const active = draft.selected_services.includes(s.key);
          return (
            <button
              type="button"
              key={s.key}
              onClick={() => toggle(s.key)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors",
                active ? "border-primary bg-primary-soft" : "border-border hover:bg-muted/50",
              )}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-primary shadow-sm">
                <s.icon className="size-4" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{s.label}</p>
                  {s.recommended ? <Badge variant="outline" className="text-[10px]">Recommended</Badge> : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
              </div>
              <span className={cn("grid size-5 shrink-0 place-items-center rounded border", active ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {active ? <Check className="size-3" /> : null}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
        <Info className="size-3.5 mt-0.5 shrink-0" />
        Final pricing is confirmed after review. Public pricing packages are shown only when configured in the CMS.
      </p>
    </StepShell>
  );
}

function StepStyle({ draft, update }: StepProps) {
  const toggleP = (p: string) => {
    const has = draft.brand_personality.includes(p);
    update({ brand_personality: has ? draft.brand_personality.filter((x) => x !== p) : [...draft.brand_personality, p] });
  };
  return (
    <StepShell title="Choose your brand personality" description="Colours, tagline, and logo — optional but helpful.">
      <div className="grid gap-5">
        <Field label="Personality">
          <div className="flex flex-wrap gap-2">
            {BRAND_PERSONALITIES.map((p) => {
              const active = draft.brand_personality.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleP(p)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                  )}
                >{p}</button>
              );
            })}
          </div>
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Primary Colour">
            <Input type="color" value={draft.brand_colors.primary ?? "#2E9BFF"} onChange={(e) => update({ brand_colors: { ...draft.brand_colors, primary: e.target.value } })} />
          </Field>
          <Field label="Secondary Colour">
            <Input type="color" value={draft.brand_colors.secondary ?? "#22D3B8"} onChange={(e) => update({ brand_colors: { ...draft.brand_colors, secondary: e.target.value } })} />
          </Field>
          <Field label="Accent Colour">
            <Input type="color" value={draft.brand_colors.accent ?? "#3A5BFF"} onChange={(e) => update({ brand_colors: { ...draft.brand_colors, accent: e.target.value } })} />
          </Field>
        </div>
        <Field label="Tagline">
          <div className="flex gap-2">
            <Input value={draft.tagline} onChange={(e) => update({ tagline: e.target.value })} placeholder="e.g. Launch. Sell. Grow." />
            <Button variant="outline" type="button" onClick={() => toast.info("AI tagline suggestions activate when the AI service is connected.")}>
              <Sparkles className="size-4" /> Suggest
            </Button>
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={draft.needs_logo_help} onCheckedChange={(v) => update({ needs_logo_help: Boolean(v) })} />
          <span>I need Glintr to help with my logo.</span>
        </label>
      </div>
    </StepShell>
  );
}

function StepDomain({ draft, update }: StepProps) {
  return (
    <StepShell title="Domain & digital presence" description="If you already have a domain or social pages, share them — otherwise we'll guide you.">
      <div className="grid gap-5">
        <Field label="Do you already have a domain?" required>
          <RadioGroup value={draft.has_domain} onValueChange={(v) => update({ has_domain: v as Draft["has_domain"] })} className="flex flex-wrap gap-4">
            {(["yes", "no", "not_sure"] as const).map((v) => (
              <label key={v} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={v} id={`dom-${v}`} />
                <span className="capitalize">{v.replace("_", " ")}</span>
              </label>
            ))}
          </RadioGroup>
        </Field>
        {draft.has_domain === "yes" ? (
          <Field label="Domain Name">
            <Input value={draft.domain_name} onChange={(e) => update({ domain_name: e.target.value })} placeholder="yourbrand.com" />
          </Field>
        ) : null}
        <p className="text-label pt-2">Do you already have social media pages?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["instagram", "facebook", "linkedin", "youtube", "other"] as const).map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
              <Input
                type="url"
                value={draft.social_profiles[k] ?? ""}
                onChange={(e) => update({ social_profiles: { ...draft.social_profiles, [k]: e.target.value } })}
                placeholder={`https://${k}.com/yourbrand`}
              />
            </Field>
          ))}
        </div>
      </div>
    </StepShell>
  );
}

function StepBusiness({ draft, update }: StepProps) {
  return (
    <StepShell title="Business details" description="You don't need a registered company to start. Legal and payment requirements can be reviewed later.">
      <div className="grid gap-4">
        <Field label="Business Type" required>
          <Select value={draft.business_type} onValueChange={(v) => update({ business_type: v })}>
            <SelectTrigger><SelectValue placeholder="Choose business type" /></SelectTrigger>
            <SelectContent>
              {BRAND_BUSINESS_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Country"><Input value={draft.country} onChange={(e) => update({ country: e.target.value })} placeholder="India" /></Field>
          <Field label="State"><Input value={draft.state} onChange={(e) => update({ state: e.target.value })} /></Field>
          <Field label="City"><Input value={draft.city} onChange={(e) => update({ city: e.target.value })} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Business Email" required>
            <Input type="email" value={draft.business_email} onChange={(e) => update({ business_email: e.target.value })} />
          </Field>
          <Field label="Business Mobile Number" required>
            <Input value={draft.business_mobile} onChange={(e) => update({ business_mobile: e.target.value })} placeholder="+91 …" />
          </Field>
        </div>
      </div>
    </StepShell>
  );
}

function StepReview({ draft, update, jumpTo }: StepProps & { jumpTo: (n: number) => void }) {
  const rows: { label: string; value: React.ReactNode; step: number }[] = [
    { step: 1, label: "Brand Name", value: draft.preferred_brand_name || "—" },
    { step: 2, label: "Brand Type", value: BRAND_TYPES.find((t) => t.value === draft.brand_type)?.label || "—" },
    { step: 2, label: "Target Audience", value: draft.target_audience.join(", ") || "—" },
    { step: 3, label: "Selected Programs", value: `${draft.selected_program_ids.length} program${draft.selected_program_ids.length === 1 ? "" : "s"}` },
    { step: 4, label: "Infrastructure", value: `${draft.selected_services.length} service${draft.selected_services.length === 1 ? "" : "s"} (${draft.setup_type || "—"})` },
    { step: 5, label: "Brand Style", value: draft.brand_personality.join(", ") || "—" },
    { step: 6, label: "Domain", value: draft.has_domain === "yes" ? (draft.domain_name || "Yes") : draft.has_domain || "—" },
    { step: 6, label: "Social", value: Object.values(draft.social_profiles).filter(Boolean).length ? "Provided" : "—" },
    { step: 7, label: "Business", value: BRAND_BUSINESS_TYPES.find((t) => t.value === draft.business_type)?.label || "—" },
  ];
  return (
    <StepShell title="Review & submit" description="Confirm your details before sending your brand launch request to our team.">
      <div className="divide-y divide-border rounded-lg border border-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</p>
              <p className="text-sm font-medium">{r.value}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => jumpTo(r.step)}>Edit</Button>
          </div>
        ))}
      </div>
      <label className="mt-5 flex items-start gap-3 rounded-md bg-muted/60 p-3 text-sm">
        <Checkbox checked={draft.consent_confirmed} onCheckedChange={(v) => update({ consent_confirmed: Boolean(v) })} />
        <span className="text-muted-foreground">
          I confirm the information provided is accurate and understand that platform setup
          timelines depend on required information, approvals, third-party services, and
          selected configuration.
        </span>
      </label>
    </StepShell>
  );
}

/* ---------------- Primitives ---------------- */

type StepProps = { draft: Draft; update: (p: Partial<Draft>) => void };

function StepShell({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

/* ---------------- DB mapping ---------------- */

function draftToRow(d: Draft, user_id: string) {
  return {
    user_id,
    status: "submitted" as const,
    preferred_brand_name: d.preferred_brand_name || null,
    alternative_name_1: d.alternative_name_1 || null,
    alternative_name_2: d.alternative_name_2 || null,
    name_availability_checked: d.name_check_result !== "unchecked",
    brand_type: d.brand_type || null,
    target_audience: d.target_audience,
    brand_vision: d.brand_vision || null,
    selected_program_ids: d.selected_program_ids,
    selected_services: d.selected_services,
    setup_type: d.setup_type || null,
    brand_personality: d.brand_personality,
    brand_colors: d.brand_colors,
    needs_logo_help: d.needs_logo_help,
    tagline: d.tagline || null,
    has_domain: d.has_domain || null,
    domain_name: d.domain_name || null,
    social_profiles: d.social_profiles,
    business_type: d.business_type || null,
    country: d.country || null,
    state: d.state || null,
    city: d.city || null,
    business_email: d.business_email || null,
    business_mobile: d.business_mobile || null,
    consent_confirmed: d.consent_confirmed,
    current_step: 8,
    submitted_at: new Date().toISOString(),
  };
}
