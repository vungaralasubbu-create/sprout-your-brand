import * as React from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Briefcase, Building2, CheckCircle2, Layers, User } from "lucide-react";

import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getPartnerSignupState,
  saveQuickStartOnboarding,
} from "@/lib/partner/signup.functions";

export const Route = createFileRoute("/_authenticated/partner/quick-start")({
  head: () => ({ meta: [{ title: "Partner onboarding — Glintr" }, { name: "robots", content: "noindex" }] }),
  component: QuickStart,
});

const STEPS = ["Profile", "Work Model", "Selling Identity", "Review"] as const;

type WorkModel = "flexible" | "full_time";
type SellingModel = "glintr" | "own" | "partnered" | "multiple";

function QuickStart() {
  const navigate = useNavigate();
  const stateFn = useServerFn(getPartnerSignupState);
  const saveFn = useServerFn(saveQuickStartOnboarding);

  const { data: state, isLoading } = useQuery({
    queryKey: ["partner-signup-state"],
    queryFn: () => stateFn(),
  });

  const [step, setStep] = React.useState(0);
  const [profile, setProfile] = React.useState({
    full_name: "",
    mobile: "",
    email: "",
    city: "",
    state: "",
  });
  const [workModel, setWorkModel] = React.useState<WorkModel | "">("");
  const [sellingModel, setSellingModel] = React.useState<SellingModel | "">("");

  React.useEffect(() => {
    if (state?.partner) {
      setProfile({
        full_name: state.partner.display_name ?? "",
        mobile: state.partner.mobile ?? "",
        email: state.partner.email ?? "",
        city: state.partner.city ?? "",
        state: state.partner.state ?? "",
      });
      if (state.partner.work_model) setWorkModel(state.partner.work_model as WorkModel);
      if (state.partner.brand_selling_model)
        setSellingModel(state.partner.brand_selling_model as SellingModel);

      // If already completed onboarding, bounce to correct destination
      if (state.partner.onboarding_status === "completed") {
        if (state.partner.account_status === "pending_review") {
          navigate({ to: "/partner/application-status" as any });
        } else if (state.partner.account_status === "active") {
          navigate({ to: "/partner/dashboard" as any });
        }
      }
    }
  }, [state, navigate]);

  const save = useMutation({
    mutationFn: (v: {
      full_name: string;
      mobile: string;
      city: string;
      state: string;
      work_model: WorkModel;
      selling_model: SellingModel;
    }) => saveFn({ data: v }),
    onSuccess: (res) => {
      toast.success("Onboarding complete!");
      if (res.accountStatus === "pending_review") {
        navigate({ to: "/partner/application-status" as any });
      } else {
        navigate({ to: "/partner/dashboard" as any });
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!profile.full_name.trim()) return "Full name is required.";
      if (!profile.mobile.trim()) return "Mobile is required.";
      if (!profile.city.trim()) return "City is required.";
      if (!profile.state.trim()) return "State is required.";
    }
    if (step === 1 && !workModel) return "Select a work model.";
    if (step === 2 && !sellingModel) return "Select a selling identity.";
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) return toast.error(err);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = () => {
    if (!workModel || !sellingModel) return toast.error("Complete all steps first.");
    save.mutate({
      full_name: profile.full_name,
      mobile: profile.mobile,
      city: profile.city,
      state: profile.state,
      work_model: workModel,
      selling_model: sellingModel,
    });
  };

  if (isLoading) {
    return (
      <Section padding="lg">
        <Container size="md">
          <p className="text-muted-foreground text-center">Loading onboarding…</p>
        </Container>
      </Section>
    );
  }

  return (
    <Section padding="md">
      <Container size="md">
        <div className="mb-6 flex flex-col items-center text-center gap-2">
          <Badge variant="info">Sales Partner onboarding</Badge>
          <h1 className="text-hero">Welcome to Glintr</h1>
          <p className="text-muted-foreground">A few quick steps to get you started.</p>
        </div>

        <ProgressBar step={step} />

        <Card className="mt-6">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div>
              <p className="text-caption text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="font-display text-2xl font-semibold mt-1">{STEPS[step]}</h2>
            </div>

            {step === 0 && (
              <ProfileStep value={profile} onChange={setProfile} />
            )}
            {step === 1 && (
              <WorkModelStep value={workModel} onChange={setWorkModel} />
            )}
            {step === 2 && (
              <SellingIdentityStep value={sellingModel} onChange={setSellingModel} />
            )}
            {step === 3 && (
              <ReviewStep
                profile={profile}
                workModel={workModel as WorkModel}
                sellingModel={sellingModel as SellingModel}
                referral={state?.application?.referred_by_code ?? null}
                onEdit={() => setStep(0)}
              />
            )}

            <div className="flex items-center justify-between border-t pt-5">
              <Button variant="ghost" onClick={back} disabled={step === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="gradient" onClick={next}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button variant="gradient" onClick={submit} disabled={save.isPending}>
                  {save.isPending ? "Submitting…" : "Complete Onboarding"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex flex-col gap-1.5">
          <div
            className={cn(
              "h-1.5 rounded-full",
              i <= step ? "bg-gradient-brand" : "bg-muted",
            )}
          />
          <p
            className={cn(
              "text-caption",
              i === step ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {i + 1}. {label}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProfileStep({
  value,
  onChange,
}: {
  value: { full_name: string; mobile: string; email: string; city: string; state: string };
  onChange: (v: typeof value) => void;
}) {
  const upd = (k: keyof typeof value, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label className="mb-1.5 block text-sm">Full name</Label>
        <Input value={value.full_name} onChange={(e) => upd("full_name", e.target.value)} />
      </div>
      <div>
        <Label className="mb-1.5 block text-sm">Mobile number</Label>
        <Input value={value.mobile} onChange={(e) => upd("mobile", e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <Label className="mb-1.5 block text-sm">Email</Label>
        <Input value={value.email} disabled />
        <p className="text-caption text-muted-foreground mt-1">
          Email is linked to your login and cannot be changed here.
        </p>
      </div>
      <div>
        <Label className="mb-1.5 block text-sm">City</Label>
        <Input value={value.city} onChange={(e) => upd("city", e.target.value)} />
      </div>
      <div>
        <Label className="mb-1.5 block text-sm">State</Label>
        <Input value={value.state} onChange={(e) => upd("state", e.target.value)} />
      </div>
    </div>
  );
}

function WorkModelStep({
  value,
  onChange,
}: {
  value: WorkModel | "";
  onChange: (v: WorkModel) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">How would you like to work with Glintr?</p>
      <OptionCard
        selected={value === "flexible"}
        onClick={() => onChange("flexible")}
        icon={<Briefcase className="h-5 w-5" />}
        title="Flexible Sales Partner"
        description="Work flexibly and earn revenue share from eligible verified sales."
        bullets={[
          "70% revenue share on eligible own leads",
          "50% revenue share on eligible Glintr-provided leads",
          "Approved earnings tracked for payout processing",
        ]}
      />
      <OptionCard
        selected={value === "full_time"}
        onClick={() => onChange("full_time")}
        icon={<Building2 className="h-5 w-5" />}
        title="Full-Time Sales Professional"
        description="Apply for a structured full-time sales work model with attendance and employment workflows where approved."
        bullets={[
          "Structured sales work model",
          "Attendance tracking",
          "Monthly payroll documentation where applicable",
          "Admin approval required",
        ]}
      />
    </div>
  );
}

function SellingIdentityStep({
  value,
  onChange,
}: {
  value: SellingModel | "";
  onChange: (v: SellingModel) => void;
}) {
  const opts: { id: SellingModel; title: string; desc: string }[] = [
    { id: "glintr", title: "Using Glintr Brand", desc: "Sell Glintr programs under the Glintr brand." },
    { id: "own", title: "Using My Own Brand", desc: "White-label. Complete your brand profile later." },
    { id: "partnered", title: "Using a Partnered Brand", desc: "Sell under a partnered brand you'll add later." },
    { id: "multiple", title: "Using Multiple Brands", desc: "Mix of Glintr, own, or partnered brands." },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">How will you sell programs?</p>
      <div className="grid gap-3 md:grid-cols-2">
        {opts.map((o) => (
          <OptionCard
            key={o.id}
            compact
            selected={value === o.id}
            onClick={() => onChange(o.id)}
            icon={<Layers className="h-5 w-5" />}
            title={o.title}
            description={o.desc}
          />
        ))}
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  icon,
  title,
  description,
  bullets,
  compact,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets?: string[];
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left w-full rounded-xl border p-4 transition-all",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          <p className={cn("text-muted-foreground", compact ? "text-caption" : "text-sm mt-0.5")}>
            {description}
          </p>
          {bullets && (
            <ul className="mt-3 space-y-1.5 text-sm">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </button>
  );
}

function ReviewStep({
  profile,
  workModel,
  sellingModel,
  referral,
  onEdit,
}: {
  profile: { full_name: string; mobile: string; email: string; city: string; state: string };
  workModel: WorkModel;
  sellingModel: SellingModel;
  referral: string | null;
  onEdit: () => void;
}) {
  const wmLabel = workModel === "flexible" ? "Flexible Sales Partner" : "Full-Time Sales Professional";
  const smLabel = {
    glintr: "Using Glintr Brand",
    own: "Using My Own Brand",
    partnered: "Using a Partnered Brand",
    multiple: "Using Multiple Brands",
  }[sellingModel];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border divide-y">
        <Row k="Name" v={profile.full_name} />
        <Row k="Email" v={profile.email} />
        <Row k="Mobile number" v={profile.mobile} />
        <Row k="City & State" v={`${profile.city}, ${profile.state}`} />
        <Row k="Work model" v={wmLabel} />
        <Row k="Selling model" v={smLabel} />
        {referral && <Row k="Referral code" v={referral} />}
      </div>
      <div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit Details
        </Button>
      </div>
      {workModel === "full_time" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Your Full-Time application will be submitted for admin review. You can still use the
          Sales Partner dashboard as a Flexible partner while it's pending.
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between p-3 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
