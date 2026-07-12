import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Handshake,
  ShieldCheck,
  User2,
  Users,
} from "lucide-react";

import { Section, Container } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/partner/apply")({
  head: () => ({
    meta: [
      { title: "Apply as a Glintr Sales Partner" },
      {
        name: "description",
        content:
          "Apply to become a Glintr Sales Partner. Earn up to 70% revenue share, get weekly payouts, and sell career programs full-time or part-time.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnerApplyPage,
});

// ---------------- Form types ----------------

type FormState = {
  full_name: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  country: string;

  current_role_title: string;
  industry: string;
  years_experience: string;
  current_monthly_target: string;
  current_income_range: string;
  previous_experience: string;

  has_own_leads: "" | "yes" | "no" | "some";
  lead_sources: string[];
  estimated_lead_count: string;

  working_preference: "" | "part_time" | "full_time" | "freelance" | "launch_brand";
  hours_per_day: string;
  preferred_days: string[];
  preferred_categories: string[];

  preferred_model: "" | "own_leads" | "supported" | "not_sure";
};

const empty: FormState = {
  full_name: "",
  email: "",
  mobile: "",
  city: "",
  state: "",
  country: "India",
  current_role_title: "",
  industry: "",
  years_experience: "",
  current_monthly_target: "",
  current_income_range: "",
  previous_experience: "",
  has_own_leads: "",
  lead_sources: [],
  estimated_lead_count: "",
  working_preference: "",
  hours_per_day: "",
  preferred_days: [],
  preferred_categories: [],
  preferred_model: "",
};

const STORAGE_KEY = "glintr:partner-application:draft";
const stepTitles = [
  "About you",
  "Sales experience",
  "Your network",
  "How you'll work",
  "Pick your model",
  "Review & submit",
];

// ---------------- Page ----------------

function PartnerApplyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <ApplyHero />
        <ApplyForm />
      </main>
      <SiteFooter />
    </div>
  );
}

function ApplyHero() {
  return (
    <Section padding="sm" tone="surface">
      <Container size="lg">
        <div className="flex flex-col items-center text-center gap-4">
          <Badge variant="info">
            <Handshake className="mr-1.5 h-3.5 w-3.5" /> Sales Partner application
          </Badge>
          <h1 className="text-hero text-balance">
            Let's see if Glintr is your next move
          </h1>
          <p className="text-subheading text-muted-foreground max-w-2xl">
            6 quick steps, ~5 minutes. Everything is saved as you go. Our team
            reviews every application within 48 hours.
          </p>
        </div>
      </Container>
    </Section>
  );
}

function ApplyForm() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState<FormState>(empty);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  // Load draft
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...empty, ...JSON.parse(raw) });
    } catch {}
  }, []);

  // Save draft
  React.useEffect(() => {
    if (submitted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data, submitted]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!data.full_name || data.full_name.trim().length < 2)
        return "Please share your full name.";
      if (!/^\S+@\S+\.\S+$/.test(data.email)) return "Please enter a valid email.";
      if (!data.mobile || data.mobile.replace(/\D/g, "").length < 7)
        return "Please enter a valid mobile number.";
      if (!data.city) return "Which city are you based in?";
    }
    if (step === 1) {
      if (!data.years_experience) return "Pick your years of sales experience.";
    }
    if (step === 2) {
      if (!data.has_own_leads) return "Let us know if you have your own leads.";
    }
    if (step === 3) {
      if (!data.working_preference) return "Pick a working preference.";
    }
    if (step === 4) {
      if (!data.preferred_model) return "Pick a partner model.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(stepTitles.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    const payload = {
      full_name: data.full_name.trim(),
      email: data.email.trim(),
      mobile: data.mobile.trim(),
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      current_role_title: data.current_role_title || null,
      industry: data.industry || null,
      years_experience: data.years_experience || null,
      current_monthly_target: data.current_monthly_target || null,
      current_income_range: data.current_income_range || null,
      previous_experience: data.previous_experience || null,
      has_own_leads: data.has_own_leads || null,
      lead_sources: data.lead_sources.length ? data.lead_sources : null,
      estimated_lead_count: data.estimated_lead_count || null,
      working_preference: data.working_preference || null,
      hours_per_day: data.hours_per_day || null,
      preferred_days: data.preferred_days.length ? data.preferred_days : null,
      preferred_categories: data.preferred_categories.length ? data.preferred_categories : null,
      preferred_model: data.preferred_model || null,
      status: "submitted" as const,
    };

    const { error } = await supabase.from("partner_applications").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit right now. " + error.message);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    setSubmitted(true);
    trackEvent("partner_signup", { source: "partner_apply", dedupe_key: `apply:${Date.now()}` });
    trackEvent("application_submitted", {
      application_type: "partner",
      dedupe_key: `partner_apply:${Date.now()}`,
    });
    toast.success("Application submitted!");
  };

  if (submitted) {
    return (
      <Section padding="lg">
        <Container size="sm">
          <Card className="text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-brand opacity-[0.05]" />
            <CardContent className="relative p-10 flex flex-col items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-section">Application received</h2>
              <p className="text-muted-foreground max-w-md">
                Thanks {data.full_name.split(" ")[0]}! We'll review your
                application and get back to you within 48 hours at{" "}
                <span className="font-medium">{data.email}</span>.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => navigate({ to: "/" })}>
                  Back to home
                </Button>
                <Button variant="gradient" onClick={() => navigate({ to: "/earn" })}>
                  Explore Earn With Glintr
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    );
  }

  return (
    <Section padding="md">
      <Container size="lg">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <StepSidebar step={step} />
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="text-caption text-muted-foreground">
                Step {step + 1} of {stepTitles.length}
              </div>
              <h2 className="font-display text-2xl font-semibold mt-1">
                {stepTitles[step]}
              </h2>
              <Progress step={step} total={stepTitles.length} />

              <div className="mt-8 space-y-6">
                {step === 0 && <Step0 data={data} update={update} />}
                {step === 1 && <Step1 data={data} update={update} />}
                {step === 2 && <Step2 data={data} update={update} />}
                {step === 3 && <Step3 data={data} update={update} />}
                {step === 4 && <Step4 data={data} update={update} />}
                {step === 5 && <StepReview data={data} />}
              </div>

              <div className="mt-8 flex items-center justify-between border-t pt-6">
                <div>
                  {step > 0 && (
                    <Button variant="ghost" onClick={back}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {step < stepTitles.length - 1 ? (
                    <Button variant="gradient" onClick={next}>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="gradient"
                      onClick={submit}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting…" : "Submit application"}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-caption text-muted-foreground text-center mt-4">
                Your progress is saved automatically.
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-brand transition-all duration-500"
        style={{ width: `${((step + 1) / total) * 100}%` }}
      />
    </div>
  );
}

function StepSidebar({ step }: { step: number }) {
  return (
    <div className="hidden lg:block">
      <div className="sticky top-24">
        <ol className="space-y-3">
          {stepTitles.map((t, i) => (
            <li
              key={t}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                i === step && "bg-primary/10 text-primary font-medium",
                i < step && "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "h-6 w-6 rounded-full border flex items-center justify-center text-xs font-medium",
                  i === step && "bg-primary text-primary-foreground border-primary",
                  i < step && "bg-primary/20 border-primary/20 text-primary",
                )}
              >
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {t}
            </li>
          ))}
        </ol>
        <div className="mt-8 rounded-xl border bg-muted/30 p-4 text-caption text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary mb-2" />
          Your information is encrypted at rest and only visible to your assigned
          partner manager.
        </div>
      </div>
    </div>
  );
}

// ---------------- Steps ----------------

type StepProps = {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
};

function Step0({ data, update }: StepProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" required>
          <Input
            value={data.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="Priya Sharma"
          />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Mobile number" required>
          <Input
            type="tel"
            value={data.mobile}
            onChange={(e) => update("mobile", e.target.value)}
            placeholder="+91 98xxxxxx"
          />
        </Field>
        <Field label="City" required>
          <Input
            value={data.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Bengaluru"
          />
        </Field>
        <Field label="State">
          <Input
            value={data.state}
            onChange={(e) => update("state", e.target.value)}
            placeholder="Karnataka"
          />
        </Field>
        <Field label="Country">
          <Input
            value={data.country}
            onChange={(e) => update("country", e.target.value)}
          />
        </Field>
      </div>
    </>
  );
}

function Step1({ data, update }: StepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Current role / title">
        <Input
          value={data.current_role_title}
          onChange={(e) => update("current_role_title", e.target.value)}
          placeholder="Business Development Manager"
        />
      </Field>
      <Field label="Industry">
        <Input
          value={data.industry}
          onChange={(e) => update("industry", e.target.value)}
          placeholder="EdTech, SaaS, Insurance…"
        />
      </Field>
      <Field label="Years of sales experience" required>
        <SelectField
          value={data.years_experience}
          onChange={(v) => update("years_experience", v)}
          placeholder="Select"
          options={["Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"]}
        />
      </Field>
      <Field label="Current monthly sales target">
        <SelectField
          value={data.current_monthly_target}
          onChange={(v) => update("current_monthly_target", v)}
          placeholder="Select"
          options={["No target", "Under ₹5L", "₹5–15L", "₹15–50L", "₹50L+"]}
        />
      </Field>
      <Field label="Current income range (per month)">
        <SelectField
          value={data.current_income_range}
          onChange={(v) => update("current_income_range", v)}
          placeholder="Select"
          options={["Under ₹40k", "₹40k–₹1L", "₹1–2L", "₹2–5L", "₹5L+"]}
        />
      </Field>
      <Field label="Previous EdTech / consulting experience" className="md:col-span-2">
        <Textarea
          value={data.previous_experience}
          onChange={(e) => update("previous_experience", e.target.value)}
          placeholder="Tell us briefly about your past sales roles, products you sold, and average deal size."
          rows={4}
        />
      </Field>
    </div>
  );
}

function Step2({ data, update }: StepProps) {
  const sources = ["LinkedIn network", "WhatsApp community", "Referrals", "Past clients", "Instagram / YouTube", "Cold outbound", "None yet"];
  return (
    <>
      <Field label="Do you already have your own leads?" required>
        <RadioGroup
          value={data.has_own_leads}
          onValueChange={(v) => update("has_own_leads", v as FormState["has_own_leads"])}
          className="grid gap-3 md:grid-cols-3"
        >
          {[
            { v: "yes", label: "Yes, strong network" },
            { v: "some", label: "Some, still building" },
            { v: "no", label: "Not yet" },
          ].map((o) => (
            <label
              key={o.v}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 cursor-pointer hover:border-primary"
            >
              <RadioGroupItem value={o.v} />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </RadioGroup>
      </Field>

      <Field label="Where do your leads come from?">
        <div className="grid gap-3 md:grid-cols-2">
          {sources.map((s) => (
            <label
              key={s}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 cursor-pointer hover:border-primary"
            >
              <Checkbox
                checked={data.lead_sources.includes(s)}
                onCheckedChange={(c) => {
                  const set = new Set(data.lead_sources);
                  if (c) set.add(s);
                  else set.delete(s);
                  update("lead_sources", Array.from(set));
                }}
              />
              <span className="text-sm">{s}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Estimated leads you can activate in month 1">
        <SelectField
          value={data.estimated_lead_count}
          onChange={(v) => update("estimated_lead_count", v)}
          placeholder="Select"
          options={["Under 20", "20–50", "50–150", "150–500", "500+"]}
        />
      </Field>
    </>
  );
}

function Step3({ data, update }: StepProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cats = [
    "Computer Science",
    "Electronics & Electrical",
    "Mechanical Engineering",
    "Management",
    "Design",
    "Data & AI",
  ];
  return (
    <>
      <Field label="How do you want to work with Glintr?" required>
        <RadioGroup
          value={data.working_preference}
          onValueChange={(v) => update("working_preference", v as FormState["working_preference"])}
          className="grid gap-3 md:grid-cols-2"
        >
          {[
            { v: "part_time", label: "Part-time", desc: "Alongside my current job" },
            { v: "full_time", label: "Full-time", desc: "This is my primary income" },
            { v: "freelance", label: "Freelance", desc: "Project-based" },
            { v: "launch_brand", label: "Launch my own brand", desc: "White-label EdTech" },
          ].map((o) => (
            <label
              key={o.v}
              className="rounded-xl border bg-card p-4 cursor-pointer hover:border-primary flex gap-3"
            >
              <RadioGroupItem value={o.v} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">{o.label}</div>
                <div className="text-caption text-muted-foreground">{o.desc}</div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Hours per day you can commit">
          <SelectField
            value={data.hours_per_day}
            onChange={(v) => update("hours_per_day", v)}
            placeholder="Select"
            options={["1–2 hrs", "2–4 hrs", "4–6 hrs", "6+ hrs"]}
          />
        </Field>
        <Field label="Preferred working days">
          <div className="flex flex-wrap gap-2">
            {days.map((d) => {
              const on = data.preferred_days.includes(d);
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => {
                    const set = new Set(data.preferred_days);
                    if (on) set.delete(d);
                    else set.add(d);
                    update("preferred_days", Array.from(set));
                  }}
                  className={cn(
                    "h-9 px-3 rounded-lg border text-sm",
                    on
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:border-primary",
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <Field label="Which categories do you want to sell?">
        <div className="grid gap-3 md:grid-cols-2">
          {cats.map((c) => (
            <label
              key={c}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 cursor-pointer hover:border-primary"
            >
              <Checkbox
                checked={data.preferred_categories.includes(c)}
                onCheckedChange={(chk) => {
                  const set = new Set(data.preferred_categories);
                  if (chk) set.add(c);
                  else set.delete(c);
                  update("preferred_categories", Array.from(set));
                }}
              />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </Field>
    </>
  );
}

function Step4({ data, update }: StepProps) {
  const options = [
    {
      v: "own_leads",
      icon: Handshake,
      title: "Own Leads · Up to 70%",
      desc: "I have a network. I'll bring the leads and close them.",
    },
    {
      v: "supported",
      icon: Users,
      title: "Company Leads · Up to 50%",
      desc: "Send me warm inbound leads. I want to focus on closing.",
    },
    {
      v: "not_sure",
      icon: Building2,
      title: "Let my partner manager suggest",
      desc: "I'd like help deciding based on my profile.",
    },
  ] as const;

  return (
    <RadioGroup
      value={data.preferred_model}
      onValueChange={(v) => update("preferred_model", v as FormState["preferred_model"])}
      className="grid gap-4"
    >
      {options.map((o) => (
        <label
          key={o.v}
          className={cn(
            "rounded-2xl border bg-card p-5 cursor-pointer flex gap-4 items-start hover:border-primary transition",
            data.preferred_model === o.v && "border-primary shadow-elevated",
          )}
        >
          <RadioGroupItem value={o.v} className="mt-1" />
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <o.icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display font-semibold">{o.title}</div>
            <div className="text-caption text-muted-foreground mt-1">{o.desc}</div>
          </div>
        </label>
      ))}
    </RadioGroup>
  );
}

function StepReview({ data }: { data: FormState }) {
  const rows: [string, string][] = [
    ["Name", data.full_name],
    ["Email", data.email],
    ["Mobile", data.mobile],
    ["Location", [data.city, data.state, data.country].filter(Boolean).join(", ")],
    ["Experience", data.years_experience || "—"],
    ["Own leads", data.has_own_leads || "—"],
    ["Preference", data.working_preference || "—"],
    ["Partner model", data.preferred_model || "—"],
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Please review your details. You can go back and edit any step.
      </p>
      <div className="rounded-2xl border bg-card divide-y">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-muted-foreground">{k}</span>
            <span className="font-medium text-sm text-right">{v || "—"}</span>
          </div>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">
        By submitting, you agree to the Glintr Partner Terms and consent to be
        contacted by our partner team.
      </p>
    </div>
  );
}

// ---------------- UI helpers ----------------

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Silence unused import in some builds
export const _icons = { User2 };
