import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Info,
  LayoutDashboard,
  Save,
  Sparkles,
} from "lucide-react";
import {
  acceptAgreements,
  completeOnboarding,
  getOnboarding,
  savePayoutDetails,
  saveProgramInterests,
  saveOnboardingStep,
  selectSalesModel,
  skipPayoutDetails,
} from "@/lib/partner/onboarding.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/partner/onboarding")({
  component: OnboardingPage,
});

const STEP_TITLES = [
  "About You",
  "Sales Experience",
  "Choose Your Model",
  "Program Interests",
  "Payout Setup",
  "Partner Terms",
  "Complete",
];

const ROLE_OPTIONS = [
  "EdTech Sales Executive",
  "Sales Professional",
  "Business Development Executive",
  "Career Counsellor",
  "Freelancer",
  "Trainer",
  "Student Community Leader",
  "Entrepreneur",
  "Currently Between Roles",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  "No Experience",
  "Less Than 1 Year",
  "1–2 Years",
  "2–5 Years",
  "5+ Years",
];

const DOMAIN_OPTIONS = [
  "EdTech",
  "Education",
  "Inside Sales",
  "Field Sales",
  "Business Development",
  "Admissions",
  "Career Counselling",
  "B2B Sales",
  "B2C Sales",
  "Real Estate",
  "Financial Services",
  "Technology",
  "Retail",
  "Other",
];

const TARGET_OPTIONS = [
  "No Target",
  "Below ₹50,000",
  "₹50,000 – ₹1 Lakh",
  "₹1 Lakh – ₹3 Lakh",
  "₹3 Lakh – ₹5 Lakh",
  "Above ₹5 Lakh",
  "Prefer Not To Say",
];

const INCOME_OPTIONS = [
  "Fixed Salary",
  "Fixed + Incentives",
  "Commission Based",
  "Freelance Income",
  "Business Income",
  "Currently Not Earning",
  "Prefer Not To Say",
];

const LEAD_SOURCE_OPTIONS = [
  "Personal Network",
  "WhatsApp",
  "Instagram",
  "LinkedIn",
  "Existing Enquiries",
  "College Network",
  "Student Network",
  "Professional Network",
  "Referral Network",
  "Community",
  "Other",
];

const LEAD_REACH_OPTIONS = [
  "1–25",
  "26–50",
  "51–100",
  "101–250",
  "251–500",
  "500+",
  "Not Sure",
];

type Partner = {
  id: string;
  first_name: string | null;
  display_name: string;
  mobile: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  role_title: string | null;
  role_title_other: string | null;
  sales_experience: string | null;
  sold_education_before: boolean | null;
  sales_domains: string[];
  monthly_sales_target: string | null;
  income_situation: string | null;
  lead_sources: string[];
  lead_reach_range: string | null;
  sales_model_selection: string | null;
  sales_model_approval_status: string;
  approved_sales_model: string | null;
  onboarding_status: string;
  onboarding_current_step: number;
  onboarding_completed_at: string | null;
  payout_profile_status: string;
  agreement_status: string;
  dual_model_enabled: boolean;
};

function OnboardingPage() {
  const fetchOnboarding = useServerFn(getOnboarding);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["partner-onboarding"],
    queryFn: () => fetchOnboarding(),
  });

  const partner = data?.partner as Partner | undefined;
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    if (partner) setStep(Math.max(1, Math.min(7, partner.onboarding_current_step ?? 1)));
  }, [partner?.id]);

  if (isLoading || !data || !partner) {
    return (
      <div className="p-10 text-muted-foreground">Loading onboarding…</div>
    );
  }

  // Completed state
  if (partner.onboarding_status === "completed") {
    return <CompletedView partner={partner} data={data} />;
  }

  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const goNext = () => {
    qc.invalidateQueries({ queryKey: ["partner-onboarding"] });
    setStep((s) => Math.min(7, s + 1));
  };

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.005_240)]">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
        <TopBar step={step} />

        <div className="mt-8 rounded-2xl bg-white border shadow-sm p-6 lg:p-10">
          {step === 1 && <StepAbout partner={partner} onNext={goNext} />}
          {step === 2 && <StepExperience partner={partner} onBack={goBack} onNext={goNext} />}
          {step === 3 && <StepModel partner={partner} onBack={goBack} onNext={goNext} />}
          {step === 4 && (
            <StepInterests
              partner={partner}
              categories={data.categories}
              courses={data.courses}
              interests={data.interests}
              onBack={goBack}
              onNext={goNext}
            />
          )}
          {step === 5 && (
            <StepPayout
              partner={partner}
              existing={data.payout}
              onBack={goBack}
              onNext={goNext}
            />
          )}
          {step === 6 && (
            <StepTerms
              partner={partner}
              agreements={data.agreements}
              acceptedIds={data.acceptedAgreementIds}
              onBack={goBack}
              onNext={goNext}
            />
          )}
          {step === 7 && <StepComplete partner={partner} data={data} />}
        </div>
      </div>
    </div>
  );
}

// ---------- Shared Bits -----------------------------------------------------

function TopBar({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <Link
          to="/partner/dashboard"
          className="text-caption font-mono uppercase tracking-widest text-primary hover:underline inline-flex items-center gap-1.5"
        >
          <LayoutDashboard className="size-3.5" /> Partner Onboarding
        </Link>
        <h1 className="mt-1 text-heading-lg lg:text-heading-xl font-display font-semibold tracking-tight">
          Step {String(step).padStart(2, "0")} of 07 — {STEP_TITLES[step - 1]}
        </h1>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/partner/dashboard">
          <Save className="size-4" /> Save & Exit
        </Link>
      </Button>

      {/* Desktop progress bar */}
      <div className="w-full">
        <div className="hidden md:flex items-center gap-2">
          {STEP_TITLES.map((title, i) => {
            const idx = i + 1;
            const done = idx < step;
            const active = idx === step;
            return (
              <div key={title} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    "size-7 shrink-0 rounded-full grid place-items-center text-xs font-semibold border",
                    done
                      ? "bg-primary text-primary-foreground border-primary"
                      : active
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : idx}
                </div>
                {i < STEP_TITLES.length - 1 && (
                  <div className={cn("h-0.5 flex-1", done ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>
        <div className="md:hidden text-sm text-muted-foreground mt-2">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-display-sm font-display font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-body-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm font-medium">
        {label}
        {required && <span className="text-primary"> *</span>}
      </div>
      {children}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, "pr-10", props.className)} />;
}

function ChipGroup({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: string[];
  value: string | string[] | null;
  onChange: (v: string | string[]) => void;
  multi?: boolean;
}) {
  const arr = Array.isArray(value) ? value : [];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = multi ? arr.includes(opt) : value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => {
              if (multi) {
                const next = arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt];
                onChange(next);
              } else {
                onChange(opt);
              }
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm border transition",
              selected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white border-border hover:border-primary/50 text-foreground",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Step 1 — About You ---------------------------------------------

function StepAbout({ partner, onNext }: { partner: Partner; onNext: () => void }) {
  const [fullName, setFullName] = useState(partner.display_name === partner.first_name ? partner.first_name ?? "" : partner.display_name ?? "");
  const [mobile, setMobile] = useState(partner.mobile ?? "");
  const [city, setCity] = useState(partner.city ?? "");
  const [state, setState] = useState(partner.state ?? "");
  const [country, setCountry] = useState(partner.country ?? "India");
  const [role, setRole] = useState(partner.role_title ?? "");
  const [roleOther, setRoleOther] = useState(partner.role_title_other ?? "");

  const save = useServerFn(saveOnboardingStep);
  const m = useMutation({
    mutationFn: async () =>
      save({
        data: {
          step: 1,
          patch: {
            display_name: fullName.trim(),
            first_name: fullName.trim().split(" ")[0] ?? "",
            mobile: mobile.trim(),
            city: city.trim(),
            state: state.trim(),
            country: country.trim(),
            role_title: role,
            role_title_other: role === "Other" ? roleOther.trim() : null,
          },
        },
      }),
    onSuccess: () => onNext(),
    onError: (e: Error) => toast.error(e.message),
  });

  const valid = fullName.trim().length > 1 && mobile.replace(/\D/g, "").length >= 8 && city.trim() && role;

  return (
    <div>
      <SectionHead
        title="Let's set up your partner workspace."
        subtitle="Tell us a little about yourself so we can personalise your Glintr sales workspace."
      />
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Full Name" required>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
        </Field>
        <Field label="Mobile Number" required>
          <Input value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" placeholder="+91 ••••• •••••" />
        </Field>
        <Field label="City" required>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bengaluru" />
        </Field>
        <Field label="State">
          <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Karnataka" />
        </Field>
        <Field label="Country" required>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} />
        </Field>
        <Field label="Current Role" required>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select a role…</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </Field>
        {role === "Other" && (
          <div className="md:col-span-2">
            <Field label="Please describe your current role" required>
              <Input value={roleOther} onChange={(e) => setRoleOther(e.target.value)} />
            </Field>
          </div>
        )}
      </div>
      <FooterNav
        onBack={undefined}
        onNext={() => m.mutate()}
        nextDisabled={!valid || m.isPending}
        nextLabel={m.isPending ? "Saving…" : "Continue"}
      />
    </div>
  );
}

// ---------- Step 2 — Sales Experience --------------------------------------

function StepExperience({ partner, onBack, onNext }: { partner: Partner; onBack: () => void; onNext: () => void }) {
  const [exp, setExp] = useState(partner.sales_experience ?? "");
  const [soldBefore, setSoldBefore] = useState<boolean | null>(partner.sold_education_before);
  const [domains, setDomains] = useState<string[]>(partner.sales_domains ?? []);
  const [target, setTarget] = useState(partner.monthly_sales_target ?? "");
  const [income, setIncome] = useState(partner.income_situation ?? "");

  const save = useServerFn(saveOnboardingStep);
  const m = useMutation({
    mutationFn: async () =>
      save({
        data: {
          step: 2,
          patch: {
            sales_experience: exp,
            sold_education_before: soldBefore,
            sales_domains: domains,
            monthly_sales_target: target,
            income_situation: income,
          },
        },
      }),
    onSuccess: () => onNext(),
    onError: (e: Error) => toast.error(e.message),
  });

  const valid = exp && soldBefore !== null && domains.length > 0 && target && income;

  return (
    <div>
      <SectionHead title="Tell us about your sales experience." />
      <div className="space-y-8">
        <div>
          <div className="mb-2 text-sm font-medium">How much sales experience do you have?</div>
          <ChipGroup options={EXPERIENCE_OPTIONS} value={exp} onChange={(v) => setExp(v as string)} />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium">Have you sold education or career programs before?</div>
          <ChipGroup
            options={["Yes", "No"]}
            value={soldBefore === true ? "Yes" : soldBefore === false ? "No" : null}
            onChange={(v) => setSoldBefore(v === "Yes")}
          />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium">Which areas have you worked in? <span className="text-muted-foreground">(select all that apply)</span></div>
          <ChipGroup options={DOMAIN_OPTIONS} value={domains} onChange={(v) => setDomains(v as string[])} multi />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium">Current or most recent monthly sales target</div>
          <ChipGroup options={TARGET_OPTIONS} value={target} onChange={(v) => setTarget(v as string)} />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium">Which best describes your current income situation?</div>
          <ChipGroup options={INCOME_OPTIONS} value={income} onChange={(v) => setIncome(v as string)} />
        </div>
        <div className="text-xs text-muted-foreground flex items-start gap-2">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          This information is used only for your partner profile and authorised internal review. It is not publicly displayed.
        </div>
      </div>
      <FooterNav onBack={onBack} onNext={() => m.mutate()} nextDisabled={!valid || m.isPending} nextLabel={m.isPending ? "Saving…" : "Continue"} />
    </div>
  );
}

// ---------- Step 3 — Choose Model ------------------------------------------

function StepModel({ partner, onBack, onNext }: { partner: Partner; onBack: () => void; onNext: () => void }) {
  const [selected, setSelected] = useState<"own_leads" | "supported_sales" | "dual_model" | null>(
    (partner.sales_model_selection as never) ?? null,
  );
  const [leadSources, setLeadSources] = useState<string[]>(partner.lead_sources ?? []);
  const [leadReach, setLeadReach] = useState(partner.lead_reach_range ?? "");

  const saveMeta = useServerFn(saveOnboardingStep);
  const saveModel = useServerFn(selectSalesModel);

  const m = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      // Persist lead source metadata if own/dual
      if (selected === "own_leads" || selected === "dual_model") {
        await saveMeta({ data: { step: 2, patch: { lead_sources: leadSources, lead_reach_range: leadReach } } });
      }
      await saveModel({ data: { model: selected } });
    },
    onSuccess: () => onNext(),
    onError: (e: Error) => toast.error(e.message),
  });

  const needsOwnLeadMeta = selected === "own_leads" || selected === "dual_model";
  const ownMetaValid = !needsOwnLeadMeta || (leadSources.length > 0 && !!leadReach);
  const valid = !!selected && ownMetaValid;

  return (
    <div>
      <SectionHead
        title="Choose how you want to earn."
        subtitle="Your sales experience is yours. Choose the working model that fits your network, time and selling style."
      />

      <div className="space-y-5">
        <ModelCard
          selected={selected === "own_leads"}
          onSelect={() => setSelected("own_leads")}
          headline="I have my own leads"
          highlight="UP TO 70%"
          highlightLabel="Revenue Share"
          tone="own"
          description="Bring your own eligible leads, professional network or independently sourced enquiries and sell eligible Glintr career programs."
          benefits={[
            "Choose eligible programs",
            "Add and manage your own leads",
            "Generate tracked program links",
            "Use approved sales resources",
            "Track applications",
            "Track eligible sales",
            "Track revenue share",
            "Fast payout processing workflow",
          ]}
        />
        <ModelCard
          selected={selected === "supported_sales"}
          onSelect={() => setSelected("supported_sales")}
          headline="I need sales opportunities"
          highlight="UP TO 50%"
          highlightLabel="Revenue Share"
          tone="supported"
          description="Work on eligible sales opportunities allocated through Glintr's supported sales workflow where opportunities are available."
          benefits={[
            "Eligible assigned opportunities",
            "CRM workspace",
            "Program information",
            "Approved sales resources",
            "Follow-up tracking",
            "Application tracking",
            "Sales activity visibility",
            "Eligible revenue share tracking",
          ]}
          disclaimer="Lead availability is not guaranteed. Supported sales opportunities depend on program demand, campaign availability, location, lead eligibility, operational capacity and allocation rules."
        />
        {partner.dual_model_enabled && (
          <ModelCard
            selected={selected === "dual_model"}
            onSelect={() => setSelected("dual_model")}
            headline="I want to use both"
            highlight="OWN · SUPPORTED"
            highlightLabel="Up to 70% / Up to 50%"
            tone="dual"
            description="Manage your own leads while also working on eligible Glintr-supported sales opportunities where available."
            benefits={[
              "Own Leads — up to 70% revenue share",
              "Supported Opportunities — up to 50% revenue share",
              "Unified CRM and follow-up workspace",
              "Combined earnings visibility",
            ]}
          />
        )}
      </div>

      {needsOwnLeadMeta && (
        <div className="mt-8 rounded-xl border p-5 bg-muted/30 space-y-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4 text-primary" />
            Tell us about your lead network
          </div>
          <div>
            <div className="mb-2 text-sm">Where do your leads usually come from? <span className="text-muted-foreground">(select all that apply)</span></div>
            <ChipGroup options={LEAD_SOURCE_OPTIONS} value={leadSources} onChange={(v) => setLeadSources(v as string[])} multi />
          </div>
          <div>
            <div className="mb-2 text-sm">Approximately how many potential leads can you currently reach?</div>
            <ChipGroup options={LEAD_REACH_OPTIONS} value={leadReach} onChange={(v) => setLeadReach(v as string)} />
          </div>
        </div>
      )}

      <FooterNav
        onBack={onBack}
        onNext={() => m.mutate()}
        nextDisabled={!valid || m.isPending}
        nextLabel={
          m.isPending
            ? "Saving…"
            : selected === "own_leads"
            ? "Choose Own Leads"
            : selected === "supported_sales"
            ? "Choose Supported Sales"
            : selected === "dual_model"
            ? "Use Both Models"
            : "Choose a model to continue"
        }
      />
    </div>
  );
}

function ModelCard({
  selected,
  onSelect,
  headline,
  highlight,
  highlightLabel,
  description,
  benefits,
  disclaimer,
  tone,
}: {
  selected: boolean;
  onSelect: () => void;
  headline: string;
  highlight: string;
  highlightLabel: string;
  description: string;
  benefits: string[];
  disclaimer?: string;
  tone: "own" | "supported" | "dual";
}) {
  const toneClasses =
    tone === "own"
      ? "from-primary/[0.08] to-accent/[0.05]"
      : tone === "supported"
      ? "from-[oklch(0.95_0.05_240)] to-[oklch(0.97_0.03_240)]"
      : "from-primary/[0.06] via-accent/[0.05] to-[oklch(0.96_0.08_150)]";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-2xl border-2 p-6 lg:p-8 transition bg-gradient-to-br",
        toneClasses,
        selected
          ? "border-primary shadow-[0_0_0_4px_oklch(0.65_0.16_220/0.15)]"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <div className="text-caption font-mono uppercase tracking-widest text-primary">
            {tone === "own" ? "Model 1" : tone === "supported" ? "Model 2" : "Dual Model"}
          </div>
          <h3 className="mt-1 text-heading-lg lg:text-heading-xl font-display font-semibold tracking-tight uppercase">
            {headline}
          </h3>
          <p className="mt-3 text-body text-muted-foreground max-w-xl">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-display-lg lg:text-display-xl font-display font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            {highlight}
          </div>
          <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground mt-1">
            {highlightLabel}
          </div>
        </div>
      </div>

      <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm">
            <Check className="size-4 text-primary shrink-0 mt-0.5" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {disclaimer && (
        <div className="mt-5 flex items-start gap-2 text-xs text-muted-foreground border-t pt-4">
          <CircleAlert className="size-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{disclaimer}</span>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 text-sm font-medium">
        <div
          className={cn(
            "size-5 rounded-full border-2 grid place-items-center",
            selected ? "border-primary bg-primary" : "border-border",
          )}
        >
          {selected && <Check className="size-3 text-primary-foreground" />}
        </div>
        {selected ? "Selected" : "Tap to select"}
      </div>
    </button>
  );
}

// ---------- Step 4 — Program Interests -------------------------------------

type Cat = { id: string; name: string; slug: string; short_description: string | null };
type Course = { id: string; category_id: string | null; name: string; slug: string; short_description: string | null; duration: string | null; level: string | null };

function StepInterests({
  categories,
  courses,
  interests,
  onBack,
  onNext,
}: {
  partner: Partner;
  categories: Cat[];
  courses: Course[];
  interests: { course_id: string | null; category_id: string | null }[];
  onBack: () => void;
  onNext: () => void;
}) {
  const initialCategoryIds = interests.filter((i) => i.category_id && !i.course_id).map((i) => i.category_id!) ;
  const initialCourseIds = interests.filter((i) => i.course_id).map((i) => i.course_id!);

  const [categoryIds, setCategoryIds] = useState<string[]>(initialCategoryIds);
  const [courseIds, setCourseIds] = useState<string[]>(initialCourseIds);
  const [openCat, setOpenCat] = useState<string | null>(categories[0]?.id ?? null);

  const save = useServerFn(saveProgramInterests);
  const m = useMutation({
    mutationFn: async () => save({ data: { categoryIds, courseIds } }),
    onSuccess: () => onNext(),
    onError: (e: Error) => toast.error(e.message),
  });

  const coursesByCategory = useMemo(() => {
    const map = new Map<string, Course[]>();
    for (const c of courses) {
      if (!c.category_id) continue;
      const list = map.get(c.category_id) ?? [];
      list.push(c);
      map.set(c.category_id, list);
    }
    return map;
  }, [courses]);

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };
  const toggleCourse = (id: string) => {
    setCourseIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };
  const selectAllInCategory = (id: string) => {
    const catCourses = coursesByCategory.get(id) ?? [];
    setCourseIds((prev) => Array.from(new Set([...prev, ...catCourses.map((c) => c.id)])));
  };
  const clearCategory = (id: string) => {
    const catCourseIds = new Set((coursesByCategory.get(id) ?? []).map((c) => c.id));
    setCourseIds((prev) => prev.filter((cid) => !catCourseIds.has(cid)));
  };

  return (
    <div>
      <SectionHead
        title="What would you like to sell?"
        subtitle="Choose the program categories and career programs you are most interested in. Your interest is separate from selling eligibility, which is granted after approval."
      />

      {categories.length === 0 && (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          No published categories yet. You can continue and update interests later.
        </div>
      )}

      <div className="space-y-3">
        {categories.map((cat) => {
          const catCourses = coursesByCategory.get(cat.id) ?? [];
          const selectedCourseCount = catCourses.filter((c) => courseIds.includes(c.id)).length;
          const categorySelected = categoryIds.includes(cat.id);
          const isOpen = openCat === cat.id;
          return (
            <div key={cat.id} className="rounded-xl border bg-white overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "size-5 rounded border-2 grid place-items-center shrink-0",
                    categorySelected ? "bg-primary border-primary" : "border-border",
                  )}
                >
                  {categorySelected && <Check className="size-3 text-primary-foreground" />}
                </button>
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => setOpenCat(isOpen ? null : cat.id)}
                >
                  <div className="font-medium">{cat.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {catCourses.length} programs · {selectedCourseCount} selected
                  </div>
                </button>
                <ChevronDown className={cn("size-4 text-muted-foreground transition", isOpen && "rotate-180")} />
              </div>
              {isOpen && catCourses.length > 0 && (
                <div className="border-t p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => selectAllInCategory(cat.id)}>
                      Select all in category
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => clearCategory(cat.id)}>
                      Clear selection
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {catCourses.map((course) => {
                      const on = courseIds.includes(course.id);
                      return (
                        <button
                          type="button"
                          key={course.id}
                          onClick={() => toggleCourse(course.id)}
                          className={cn(
                            "text-left rounded-lg border p-3 transition flex items-start gap-3",
                            on
                              ? "border-primary bg-primary/5"
                              : "border-border bg-white hover:border-primary/40",
                          )}
                        >
                          <div
                            className={cn(
                              "size-4 rounded border-2 grid place-items-center mt-0.5 shrink-0",
                              on ? "bg-primary border-primary" : "border-border",
                            )}
                          >
                            {on && <Check className="size-2.5 text-primary-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{course.name}</div>
                            {(course.duration || course.level) && (
                              <div className="text-xs text-muted-foreground truncate">
                                {[course.duration, course.level].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <FooterNav
        onBack={onBack}
        onNext={() => m.mutate()}
        nextDisabled={m.isPending}
        nextLabel={m.isPending ? "Saving…" : "Continue"}
        summary={`${categoryIds.length} categories · ${courseIds.length} programs`}
      />
    </div>
  );
}

// ---------- Step 5 — Payout Setup ------------------------------------------

function StepPayout({
  existing,
  onBack,
  onNext,
}: {
  partner: Partner;
  existing: {
    legal_name: string | null;
    account_holder_name: string | null;
    ifsc_code: string | null;
    bank_name: string | null;
    upi_id: string | null;
    account_last4: string | null;
    tax_status: string | null;
  } | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const [legalName, setLegalName] = useState(existing?.legal_name ?? "");
  const [holderName, setHolderName] = useState(existing?.account_holder_name ?? "");
  const [account, setAccount] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState(existing?.ifsc_code ?? "");
  const [bankName, setBankName] = useState(existing?.bank_name ?? "");
  const [upi, setUpi] = useState(existing?.upi_id ?? "");
  const [pan, setPan] = useState("");

  const save = useServerFn(savePayoutDetails);
  const skip = useServerFn(skipPayoutDetails);

  const saveM = useMutation({
    mutationFn: async () =>
      save({
        data: {
          legal_name: legalName,
          account_holder_name: holderName,
          bank_account_number: account,
          ifsc_code: ifsc,
          bank_name: bankName,
          upi_id: upi || null,
          pan: pan || null,
        },
      }),
    onSuccess: () => {
      toast.success("Payout details saved securely.");
      onNext();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const skipM = useMutation({
    mutationFn: async () => skip(),
    onSuccess: () => onNext(),
    onError: (e: Error) => toast.error(e.message),
  });

  const digitsMatch = account && account === confirmAccount;
  const valid = legalName.trim() && holderName.trim() && account.length >= 6 && digitsMatch && /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc) && bankName.trim();

  return (
    <div>
      <SectionHead
        title="Prepare your payout profile."
        subtitle="Add your payout information so eligible approved revenue share can be processed when available."
      />

      {existing?.account_last4 && (
        <div className="mb-6 rounded-xl bg-muted/40 border p-4 text-sm flex items-center gap-3">
          <Info className="size-4 text-primary" />
          Existing payout profile on file · account ending <span className="font-mono">•••• {existing.account_last4}</span>. Fill the form to update it.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Full Legal Name" required>
          <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
        </Field>
        <Field label="Bank Account Holder Name" required>
          <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} />
        </Field>
        <Field label="Bank Account Number" required>
          <Input
            value={account}
            onChange={(e) => setAccount(e.target.value.replace(/\s+/g, ""))}
            autoComplete="off"
            inputMode="numeric"
          />
        </Field>
        <Field label="Confirm Bank Account Number" required>
          <Input
            value={confirmAccount}
            onChange={(e) => setConfirmAccount(e.target.value.replace(/\s+/g, ""))}
            autoComplete="off"
            inputMode="numeric"
          />
          {confirmAccount && !digitsMatch && (
            <div className="mt-1 text-xs text-destructive">Account numbers don't match.</div>
          )}
        </Field>
        <Field label="IFSC Code" required>
          <Input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="ABCD0123456" />
        </Field>
        <Field label="Bank Name" required>
          <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
        </Field>
        <Field label="UPI ID" hint="Optional">
          <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" />
        </Field>
        <Field label="PAN" hint="Optional. May be required based on payout & tax rules.">
          <Input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
        </Field>
      </div>

      <div className="mt-5 text-xs text-muted-foreground flex items-start gap-2">
        <Info className="size-3.5 shrink-0 mt-0.5" />
        Payout details are stored securely. Your full bank account number is never displayed after saving — only the last 4 digits will be visible on your dashboard.
      </div>

      <FooterNav
        onBack={onBack}
        onNext={() => saveM.mutate()}
        nextDisabled={!valid || saveM.isPending}
        nextLabel={saveM.isPending ? "Saving…" : "Save & Continue"}
        secondary={{
          label: skipM.isPending ? "Skipping…" : "Set up later",
          onClick: () => skipM.mutate(),
          disabled: skipM.isPending,
        }}
      />
    </div>
  );
}

// ---------- Step 6 — Terms --------------------------------------------------

type Agreement = { id: string; kind: string; version: string; title: string; body_markdown: string; effective_from: string };

function StepTerms({
  agreements,
  onBack,
  onNext,
}: {
  partner: Partner;
  agreements: Agreement[];
  acceptedIds: string[];
  onBack: () => void;
  onNext: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [consents, setConsents] = useState({
    terms: false,
    eligibility: false,
    leadAvailability: false,
    compliance: false,
  });

  const accept = useServerFn(acceptAgreements);
  const m = useMutation({
    mutationFn: async () => accept({ data: { agreementIds: agreements.map((a) => a.id) } }),
    onSuccess: () => onNext(),
    onError: (e: Error) => toast.error(e.message),
  });

  const allConsented = Object.values(consents).every(Boolean);
  const allOpened = agreements.every((a) => opened[a.id]);

  return (
    <div>
      <SectionHead
        title="Review your partner terms."
        subtitle="Please open each agreement, then confirm the consent statements below to activate your partner workspace."
      />

      <div className="space-y-3">
        {agreements.map((a) => (
          <div key={a.id} className="rounded-xl border bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setExpanded((p) => ({ ...p, [a.id]: !p[a.id] }));
                setOpened((p) => ({ ...p, [a.id]: true }));
              }}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              <div className="flex-1">
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">
                  Version {a.version} · Effective {new Date(a.effective_from).toLocaleDateString()}
                </div>
              </div>
              {opened[a.id] && <Badge variant="muted">Reviewed</Badge>}
              <ChevronDown className={cn("size-4 transition", expanded[a.id] && "rotate-180")} />
            </button>
            {expanded[a.id] && (
              <div className="border-t p-5 bg-muted/20">
                <pre className="whitespace-pre-wrap text-sm text-foreground/85 font-sans">
                  {a.body_markdown}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <ConsentRow
          checked={consents.terms}
          onChange={(v) => setConsents((c) => ({ ...c, terms: v }))}
          label="I have read and agree to the Glintr Partner Terms."
        />
        <ConsentRow
          checked={consents.eligibility}
          onChange={(v) => setConsents((c) => ({ ...c, eligibility: v }))}
          label="I understand that revenue share applies only to eligible verified sales according to applicable program and partner rules."
        />
        <ConsentRow
          checked={consents.leadAvailability}
          onChange={(v) => setConsents((c) => ({ ...c, leadAvailability: v }))}
          label="I understand that lead availability is not guaranteed under the Supported Sales model."
        />
        <ConsentRow
          checked={consents.compliance}
          onChange={(v) => setConsents((c) => ({ ...c, compliance: v }))}
          label="I agree to follow Glintr lead handling, privacy and anti-spam requirements."
        />
      </div>

      {!allOpened && (
        <div className="mt-4 text-xs text-muted-foreground flex items-start gap-2">
          <CircleAlert className="size-3.5 mt-0.5 shrink-0" />
          Please open each agreement above before continuing.
        </div>
      )}

      <FooterNav
        onBack={onBack}
        onNext={() => m.mutate()}
        nextDisabled={!allConsented || !allOpened || m.isPending}
        nextLabel={m.isPending ? "Saving…" : "Accept & Continue"}
      />
    </div>
  );
}

function ConsentRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-border accent-primary"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

// ---------- Step 7 — Complete ----------------------------------------------

function StepComplete({
  partner,
  data,
}: {
  partner: Partner;
  data: {
    categories: Cat[];
    courses: Course[];
    interests: { course_id: string | null; category_id: string | null }[];
    payout: { account_last4: string | null } | null;
    agreements: Agreement[];
    acceptedAgreementIds: string[];
  };
}) {
  const complete = useServerFn(completeOnboarding);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async () => complete(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["partner-onboarding"] });
      await qc.invalidateQueries({ queryKey: ["partner-context"] });
      navigate({ to: "/partner/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const modelLabel =
    partner.sales_model_selection === "own_leads"
      ? "Own Leads (Up to 70%)"
      : partner.sales_model_selection === "supported_sales"
      ? "Supported Sales (Up to 50%)"
      : partner.sales_model_selection === "dual_model"
      ? "Dual — Own + Supported"
      : "—";

  const approvalLabel = titleCase(partner.sales_model_approval_status.replace(/_/g, " "));
  const categoryCount = data.interests.filter((i) => i.category_id && !i.course_id).length;
  const courseCount = data.interests.filter((i) => i.course_id).length;

  return (
    <div>
      <div className="mx-auto max-w-2xl text-center py-4">
        <div className="mx-auto size-16 rounded-full bg-primary/10 text-primary grid place-items-center">
          <Sparkles className="size-8" />
        </div>
        <h2 className="mt-6 text-display-md font-display font-semibold tracking-tight">
          Your partner workspace is ready.
        </h2>
        <p className="mt-3 text-body-lg text-muted-foreground">
          Explore eligible programs, understand your active sales model and start building your Glintr sales workflow.
        </p>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        <SummaryRow label="Partner" value={partner.display_name} />
        <SummaryRow label="Selected Model" value={modelLabel} />
        <SummaryRow label="Model Approval" value={approvalLabel} />
        <SummaryRow label="Program Categories" value={String(categoryCount)} />
        <SummaryRow label="Selected Programs" value={String(courseCount)} />
        <SummaryRow
          label="Payout Profile"
          value={titleCase(partner.payout_profile_status.replace(/_/g, " "))}
        />
        <SummaryRow label="Agreements" value={titleCase(partner.agreement_status)} />
      </div>

      <div className="mt-10 flex flex-wrap gap-3 justify-center">
        <Button variant="gradient" size="lg" onClick={() => m.mutate()} disabled={m.isPending}>
          {m.isPending ? "Finalising…" : "Go To My Dashboard"} <ArrowRight className="size-4" />
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/programs">Browse Programs</Link>
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value || "—"}</div>
    </div>
  );
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------- Completed View --------------------------------------------------

function CompletedView({
  partner,
  data,
}: {
  partner: Partner;
  data: {
    categories: Cat[];
    interests: { course_id: string | null; category_id: string | null }[];
    payout: { account_last4: string | null } | null;
  };
}) {
  const modelLabel =
    partner.sales_model_selection === "own_leads"
      ? "Own Leads"
      : partner.sales_model_selection === "supported_sales"
      ? "Supported Sales"
      : partner.sales_model_selection === "dual_model"
      ? "Dual — Own + Supported"
      : "—";

  const rate =
    partner.sales_model_selection === "own_leads"
      ? "Up to 70%"
      : partner.sales_model_selection === "supported_sales"
      ? "Up to 50%"
      : partner.sales_model_selection === "dual_model"
      ? "Up to 70% (Own) · Up to 50% (Supported)"
      : "—";

  const categoryCount = data.interests.filter((i) => i.category_id && !i.course_id).length;
  const courseCount = data.interests.filter((i) => i.course_id).length;

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.005_240)]">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10 lg:py-16">
        <Badge variant="primary" className="mb-4">Onboarding Complete</Badge>
        <h1 className="text-display-md font-display font-semibold tracking-tight">
          Your partner setup is complete.
        </h1>
        <p className="mt-3 text-body-lg text-muted-foreground max-w-xl">
          Review your saved partner profile below or head to your dashboard to start building your sales workflow.
        </p>

        <div className="mt-8 rounded-2xl border bg-white p-6 lg:p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <SummaryRow label="Partner" value={partner.display_name} />
            <SummaryRow label="Mobile" value={partner.mobile ?? "—"} />
            <SummaryRow label="City" value={[partner.city, partner.state].filter(Boolean).join(", ")} />
            <SummaryRow label="Country" value={partner.country ?? "—"} />
            <SummaryRow label="Current Role" value={partner.role_title === "Other" ? partner.role_title_other ?? "Other" : partner.role_title ?? "—"} />
            <SummaryRow label="Sales Experience" value={partner.sales_experience ?? "—"} />
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-primary/[0.06] to-accent/[0.05] p-5">
            <div className="text-caption font-mono uppercase tracking-widest text-primary">Active Sales Model</div>
            <div className="mt-1 flex items-baseline gap-3 flex-wrap">
              <div className="text-heading-lg font-display font-semibold">{modelLabel}</div>
              <div className="text-sm text-muted-foreground">Eligible revenue share {rate}</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Model approval status: <span className="font-medium">{titleCase(partner.sales_model_approval_status.replace(/_/g, " "))}</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <SummaryRow label="Program Categories" value={String(categoryCount)} />
            <SummaryRow label="Selected Programs" value={String(courseCount)} />
            <SummaryRow label="Payout Profile" value={titleCase(partner.payout_profile_status.replace(/_/g, " "))} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="gradient" size="lg">
            <Link to="/partner/dashboard">
              Go To Dashboard <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/partner/onboarding" search={{}}>Review My Partner Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Footer Nav ------------------------------------------------------

function FooterNav({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  summary,
  secondary,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  summary?: string;
  secondary?: { label: string; onClick: () => void; disabled?: boolean };
}) {
  return (
    <div className="mt-10 pt-6 border-t flex flex-wrap items-center gap-3 justify-between">
      <div className="flex items-center gap-2">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        )}
        <Button variant="ghost" asChild>
          <Link to="/partner/dashboard">Save & Exit</Link>
        </Button>
      </div>
      <div className="flex items-center gap-3 ml-auto">
        {summary && <span className="text-xs text-muted-foreground">{summary}</span>}
        {secondary && (
          <Button variant="outline" onClick={secondary.onClick} disabled={secondary.disabled}>
            {secondary.label}
          </Button>
        )}
        <Button variant="gradient" onClick={onNext} disabled={nextDisabled}>
          {nextLabel} <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
