import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Handshake, ShieldCheck, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  validateReferralCode,
  checkExistingAccount,
  finalizePartnerSignup,
} from "@/lib/partner/signup.functions";
import { trackEvent } from "@/lib/analytics/client";

export const Route = createFileRoute("/partner/signup")({
  head: () => ({
    meta: [
      { title: "Join Glintr as a Sales Partner" },
      {
        name: "description",
        content:
          "Create your Glintr Sales Partner account to build a sales network, manage leads, and track earnings.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnerSignupPage,
});

type FormState = {
  full_name: string;
  mobile: string;
  email: string;
  password: string;
  confirm: string;
  city: string;
  state: string;
  referral: string;
  agreed: boolean;
};

const empty: FormState = {
  full_name: "",
  mobile: "",
  email: "",
  password: "",
  confirm: "",
  city: "",
  state: "",
  referral: "",
  agreed: false,
};

function PartnerSignupPage() {
  const navigate = useNavigate();
  const validateRef = useServerFn(validateReferralCode);
  const checkExisting = useServerFn(checkExistingAccount);
  const finalize = useServerFn(finalizePartnerSignup);

  const [data, setData] = React.useState<FormState>(empty);
  const [submitting, setSubmitting] = React.useState(false);
  const [refLocked, setRefLocked] = React.useState(false);
  const [refStatus, setRefStatus] = React.useState<{
    valid: boolean;
    name?: string;
    checked: boolean;
  }>({ valid: false, checked: false });

  // Capture ?ref= referral code
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref")?.trim().toUpperCase();
      if (ref) {
        setData((d) => ({ ...d, referral: ref }));
        setRefLocked(true);
        validateRef({ data: { code: ref } }).then((res) => {
          setRefStatus({ valid: res.valid, name: res.valid ? res.referrerName : undefined, checked: true });
        });
      }
    } catch {}
  }, [validateRef]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const validate = (): string | null => {
    if (data.full_name.trim().length < 2) return "Please enter your full name.";
    if (!/^\+?\d{10,15}$/.test(data.mobile.replace(/\s+/g, "")))
      return "Enter a valid mobile number.";
    if (!/^\S+@\S+\.\S+$/.test(data.email)) return "Enter a valid email.";
    if (data.password.length < 8) return "Password must be at least 8 characters.";
    if (data.password !== data.confirm) return "Passwords do not match.";
    if (!data.city.trim()) return "Enter your city.";
    if (!data.state.trim()) return "Enter your state.";
    if (!data.agreed) return "Please agree to the Sales Partner terms.";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) return toast.error(err);
    setSubmitting(true);
    try {
      // 1. Check duplicates
      const exists = await checkExisting({
        data: { email: data.email, mobile: data.mobile.replace(/\s+/g, "") },
      });
      if (exists.exists) {
        toast.error("An account already exists with these details.");
        setSubmitting(false);
        return;
      }

      // 2. Validate referral if provided
      let referral = data.referral.trim().toUpperCase();
      if (referral) {
        const check = await validateRef({ data: { code: referral } });
        if (!check.valid) {
          if (refLocked) {
            toast.error("Referral link is invalid.");
            setSubmitting(false);
            return;
          }
          // manually typed — allow removing
          referral = "";
        }
      }

      // 3. Create auth user
      const redirectTo = `${window.location.origin}/auth`;
      const { data: sign, error: sErr } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          emailRedirectTo: redirectTo,
          data: { mobile: data.mobile.replace(/\s+/g, ""), full_name: data.full_name.trim() },
        },
      });
      if (sErr) {
        toast.error(sErr.message);
        setSubmitting(false);
        return;
      }

      // Ensure session
      let userId = sign.user?.id;
      if (!sign.session) {
        const { data: signIn, error: siErr } = await supabase.auth.signInWithPassword({
          email: data.email.trim(),
          password: data.password,
        });
        if (siErr) {
          toast.error(siErr.message);
          setSubmitting(false);
          return;
        }
        userId = signIn.user?.id;
      }
      if (!userId) {
        toast.error("Could not sign you in. Please try signing in manually.");
        setSubmitting(false);
        return;
      }

      // 4. Provision partner records + role
      const result = await finalize({
        data: {
          full_name: data.full_name.trim(),
          mobile: data.mobile.replace(/\s+/g, ""),
          city: data.city.trim(),
          state: data.state.trim(),
          referralCode: referral || null,
        },
      });

      trackEvent("partner_signup", {
        source: "partner_signup_page",
        dedupe_key: `signup:${data.email}`,
        require_approval: result.requireApproval,
      });

      toast.success("Sales Partner account created!");
      navigate({ to: "/partner/quick-start" as any });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Section padding="sm" tone="surface">
          <Container size="lg">
            <div className="flex flex-col items-center text-center gap-4">
              <Badge variant="info">
                <Handshake className="mr-1.5 h-3.5 w-3.5" /> Sales Partner signup
              </Badge>
              <h1 className="text-hero text-balance">Join Glintr as a Sales Partner</h1>
              <p className="text-subheading text-muted-foreground max-w-2xl">
                Build your sales network, manage leads and track your earnings
                through the Glintr Sales Partner platform.
              </p>
            </div>
          </Container>
        </Section>

        <Section padding="md">
          <Container size="md">
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <Card>
                <CardContent className="p-6 md:p-8 space-y-5">
                  {refStatus.checked && refStatus.valid && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      <Sparkles className="h-4 w-4" />
                      Referred by <b>{refStatus.name}</b> — a Glintr Sales Partner
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Full name" required>
                      <Input
                        value={data.full_name}
                        onChange={(e) => update("full_name", e.target.value)}
                        placeholder="Priya Sharma"
                        autoComplete="name"
                      />
                    </Field>
                    <Field label="Mobile number" required>
                      <Input
                        type="tel"
                        value={data.mobile}
                        onChange={(e) => update("mobile", e.target.value)}
                        placeholder="+91 98xxxxxxxx"
                        autoComplete="tel"
                      />
                    </Field>
                    <Field label="Email address" required className="md:col-span-2">
                      <Input
                        type="email"
                        value={data.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </Field>
                    <Field label="Password" required>
                      <Input
                        type="password"
                        value={data.password}
                        onChange={(e) => update("password", e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field label="Confirm password" required>
                      <Input
                        type="password"
                        value={data.confirm}
                        onChange={(e) => update("confirm", e.target.value)}
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field label="City" required>
                      <Input
                        value={data.city}
                        onChange={(e) => update("city", e.target.value)}
                        placeholder="Bengaluru"
                      />
                    </Field>
                    <Field label="State" required>
                      <Input
                        value={data.state}
                        onChange={(e) => update("state", e.target.value)}
                        placeholder="Karnataka"
                      />
                    </Field>
                    <Field label="Referral code (optional)" className="md:col-span-2">
                      <Input
                        value={data.referral}
                        onChange={(e) => update("referral", e.target.value.toUpperCase())}
                        disabled={refLocked}
                        placeholder="GLINTR-XXXXX-1234"
                      />
                      {refLocked && (
                        <p className="text-caption text-muted-foreground mt-1">
                          Captured from your referral link — cannot be changed.
                        </p>
                      )}
                    </Field>
                  </div>

                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={data.agreed}
                      onCheckedChange={(v) => update("agreed", Boolean(v))}
                      className="mt-0.5"
                    />
                    <span>
                      I agree to the applicable{" "}
                      <a className="underline" href="/legal/partner-terms" target="_blank" rel="noreferrer">
                        Sales Partner terms
                      </a>{" "}
                      and platform policies.
                    </span>
                  </label>

                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    onClick={submit}
                    disabled={submitting}
                  >
                    {submitting ? "Creating account…" : "Create Sales Partner Account"}
                  </Button>

                  <p className="text-caption text-muted-foreground text-center">
                    Already have an account?{" "}
                    <Link to="/auth" className="underline text-primary">
                      Sign in
                    </Link>
                  </p>
                </CardContent>
              </Card>

              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-4">
                  <Card className="bg-muted/30">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4 text-primary" /> What happens next
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <Item>Verify your email &amp; mobile</Item>
                        <Item>Complete a short 4-step onboarding</Item>
                        <Item>Choose your work &amp; selling model</Item>
                        <Item>Start selling on Glintr</Item>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Sales Partners only</p>
                      Looking to enrol in a course?{" "}
                      <Link to="/auth" className="underline">
                        Learner signup
                      </Link>{" "}
                      is separate.
                    </CardContent>
                  </Card>
                </div>
              </aside>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
