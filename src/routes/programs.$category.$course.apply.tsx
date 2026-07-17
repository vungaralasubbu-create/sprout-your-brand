import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronRight, ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Briefcase } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getCourseBySlug } from "@/lib/programs";
import { supabase } from "@/integrations/supabase/client";
import { getMyStudentProfile, upsertMyStudentProfile } from "@/lib/student/profile.functions";

export const Route = createFileRoute("/programs/$category/$course/apply")({
  head: () => ({ meta: [{ title: "Apply — Glintr" }, { name: "robots", content: "noindex" }] }),
  component: ApplyPage,
});

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "You" },
  { n: 2, label: "Contact" },
  { n: 3, label: "Background" },
  { n: 4, label: "Preferences" },
  { n: 5, label: "Confirm" },
];

function ApplyPage() {
  const { category, course } = Route.useParams();
  const navigate = useNavigate();
  const getProfile = useServerFn(getMyStudentProfile);
  const saveProfile = useServerFn(upsertMyStudentProfile);

  const { data: c, isLoading: courseLoading } = useQuery({
    queryKey: ["course", category, course],
    queryFn: () => getCourseBySlug(category, course),
  });

  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const has = !!data.session?.user;
      setAuthed(has);
      setAuthChecked(true);
      if (!has) {
        const next = encodeURIComponent(`/programs/${category}/${course}/apply`);
        navigate({ to: `/auth?mode=signup&next=${next}` as any });
      }
    });
  }, [category, course, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-student-profile"],
    queryFn: () => getProfile(),
    enabled: authed,
  });

  const [step, setStep] = useState<Step>(1);
  const [full_name, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [learner_type, setLearnerType] = useState<"student" | "working_professional">("student");
  const [education, setEducation] = useState("");
  const [graduation_year, setGraduationYear] = useState<string>("");
  const [current_role_title, setCurrentRole] = useState("");
  const [work_experience, setWorkExperience] = useState("");
  const [preferred_mode, setPreferredMode] = useState<string>("");
  const [start_timeline, setStartTimeline] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill from profile once loaded.
  useEffect(() => {
    if (!profile) return;
    if (profile.full_name) setFullName(profile.full_name);
    if (profile.mobile) setMobile(profile.mobile);
    if (profile.email) setEmail(profile.email);
    if (profile.city) setCity(profile.city);
    if (profile.state) setState(profile.state);
    if (profile.learner_type) setLearnerType(profile.learner_type);
    if (profile.education) setEducation(profile.education);
    if (profile.graduation_year) setGraduationYear(String(profile.graduation_year));
    if (profile.current_role_title) setCurrentRole(profile.current_role_title);
    if (profile.work_experience) setWorkExperience(profile.work_experience);
    if (profile.preferred_mode) setPreferredMode(profile.preferred_mode);
  }, [profile]);

  if (!authChecked || courseLoading) return <Shell><div className="p-24 text-center text-muted-foreground">Loading…</div></Shell>;
  if (!authed) return <Shell><div className="p-24 text-center text-muted-foreground">Redirecting to sign up…</div></Shell>;
  if (!c) return <Shell><div className="p-24 text-center">Program not found.</div></Shell>;

  function next() {
    // Per-step validation
    if (step === 1) {
      if (!full_name.trim() || full_name.trim().length < 2) return toast.error("Enter your full name");
      if (!/^\d{10}$|^\+?\d{10,15}$/.test(mobile.trim())) return toast.error("Enter a valid mobile number");
    }
    if (step === 2) {
      const ok = z.string().email().safeParse(email.trim()).success;
      if (!ok) return toast.error("Enter a valid email");
    }
    if (step === 3) {
      if (learner_type === "student" && !education.trim()) return toast.error("Enter your current education");
      if (learner_type === "working_professional" && !current_role_title.trim()) return toast.error("Enter your current role");
    }
    if (step === 4) {
      if (!preferred_mode) return toast.error("Choose a learning mode");
    }
    setStep((s) => Math.min(5, (s + 1)) as Step);
  }
  function back() { setStep((s) => Math.max(1, (s - 1)) as Step); }

  async function handleSubmit() {
    if (!c) return;
    setSubmitting(true);
    // Save profile
    try {
      await saveProfile({
        data: {
          full_name: full_name.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          city: city.trim(),
          state: state.trim(),
          learner_type,
          education: education.trim(),
          graduation_year: graduation_year ? parseInt(graduation_year, 10) : null,
          current_role_title: current_role_title.trim(),
          work_experience: work_experience.trim(),
          preferred_mode,
          mark_onboarded: true,
        },
      });
    } catch (e) {
      console.warn("[apply] profile save failed", e);
    }

    const partnerRef = (typeof window !== "undefined" && sessionStorage.getItem("glintr_ref")) || null;
    const { error } = await supabase.from("course_applications").insert({
      course_id: c.id,
      full_name: full_name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      city: city.trim() || null,
      state: state.trim() || null,
      education: education.trim() || null,
      graduation_year: graduation_year ? parseInt(graduation_year, 10) : null,
      current_role_title: current_role_title.trim() || null,
      work_experience: work_experience.trim() || null,
      preferred_mode: preferred_mode || null,
      start_timeline: start_timeline || null,
      consent: true,
      partner_ref: partnerRef,
    });
    setSubmitting(false);
    if (error) return toast.error("Could not submit. Please try again.");
    if (partnerRef) {
      supabase.from("partner_referral_events").insert({ partner_ref: partnerRef, course_id: c.id, event_type: "application" }).then(() => {});
    }
    toast.success("Application received. Redirecting to your dashboard…");
    navigate({ to: "/student/dashboard" as any });
  }

  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Shell>
      <Section className="pt-14 pb-6 bg-gradient-to-b from-primary/5 to-transparent">
        <Container>
          <nav className="text-caption mb-4 flex items-center gap-1.5 flex-wrap">
            <Link to="/programs" className="hover:text-foreground">Programs</Link>
            <ChevronRight className="size-3.5" />
            <Link to="/programs/$category/$course" params={{ category, course }} className="hover:text-foreground">{c.name}</Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">Apply</span>
          </nav>
          <h1 className="text-display-md font-display font-semibold tracking-tight">Enroll in {c.name}</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">Takes under 60 seconds. Your details are saved to your dashboard so you never fill them again.</p>
        </Container>
      </Section>

      <Section className="py-8">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {STEPS.map((s) => (
                  <div key={s.n} className={cn("text-caption font-mono uppercase tracking-widest", step >= s.n ? "text-primary" : "text-muted-foreground")}>
                    {s.n}. {s.label}
                  </div>
                ))}
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>

            <Card className="p-6 md:p-8">
              {profileLoading ? (
                <div className="text-sm text-muted-foreground">Loading your details…</div>
              ) : (
                <>
                  {step === 1 && (
                    <StepShell title="Let's start with you" subtitle="We'll prefill this next time.">
                      <Row label="Full name" required>
                        <Input value={full_name} onChange={(e) => setFullName(e.target.value)} placeholder="Rahul Sharma" />
                      </Row>
                      <Row label="Mobile number" required>
                        <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" inputMode="tel" />
                      </Row>
                    </StepShell>
                  )}
                  {step === 2 && (
                    <StepShell title="How can we reach you?" subtitle="For enrollment updates and receipts.">
                      <Row label="Email" required>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                      </Row>
                      <div className="grid grid-cols-2 gap-4">
                        <Row label="City">
                          <Input value={city} onChange={(e) => setCity(e.target.value)} />
                        </Row>
                        <Row label="State">
                          <Input value={state} onChange={(e) => setState(e.target.value)} />
                        </Row>
                      </div>
                    </StepShell>
                  )}
                  {step === 3 && (
                    <StepShell title="Tell us about your background" subtitle="Pick what fits you today.">
                      <div className="grid grid-cols-2 gap-3">
                        <LearnerCard active={learner_type === "student"} onClick={() => setLearnerType("student")} icon={GraduationCap} title="Student" desc="Currently studying" />
                        <LearnerCard active={learner_type === "working_professional"} onClick={() => setLearnerType("working_professional")} icon={Briefcase} title="Working Professional" desc="Employed / freelancing" />
                      </div>
                      {learner_type === "student" ? (
                        <>
                          <Row label="Current education" required>
                            <Input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="B.Tech Computer Science" />
                          </Row>
                          <Row label="Graduation year">
                            <Input type="number" value={graduation_year} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2026" />
                          </Row>
                        </>
                      ) : (
                        <>
                          <Row label="Current role" required>
                            <Input value={current_role_title} onChange={(e) => setCurrentRole(e.target.value)} placeholder="Sales Executive at Acme" />
                          </Row>
                          <Row label="Years of experience & context">
                            <Textarea value={work_experience} onChange={(e) => setWorkExperience(e.target.value)} placeholder="3 years in B2B sales, currently leading a small team." rows={3} />
                          </Row>
                        </>
                      )}
                    </StepShell>
                  )}
                  {step === 4 && (
                    <StepShell title="Learning preferences" subtitle="Helps us plan your onboarding.">
                      <Row label="Preferred learning mode" required>
                        <Select value={preferred_mode} onValueChange={setPreferredMode}>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Select mode" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Online">Online (self-paced + live)</SelectItem>
                            <SelectItem value="Live">Live cohort</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </Row>
                      <Row label="When do you want to start?">
                        <Select value={start_timeline} onValueChange={setStartTimeline}>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Immediately">Immediately</SelectItem>
                            <SelectItem value="Within 7 Days">Within 7 days</SelectItem>
                            <SelectItem value="Within 30 Days">Within 30 days</SelectItem>
                            <SelectItem value="Just Exploring">Just exploring</SelectItem>
                          </SelectContent>
                        </Select>
                      </Row>
                    </StepShell>
                  )}
                  {step === 5 && (
                    <StepShell title="Confirm & submit" subtitle="Everything ready?">
                      <div className="grid gap-3 text-sm">
                        <ConfirmRow k="Name" v={full_name} />
                        <ConfirmRow k="Mobile" v={mobile} />
                        <ConfirmRow k="Email" v={email} />
                        <ConfirmRow k="Background" v={learner_type === "student" ? `Student · ${education}` : `Professional · ${current_role_title}`} />
                        <ConfirmRow k="Learning mode" v={preferred_mode || "—"} />
                        <ConfirmRow k="Start" v={start_timeline || "—"} />
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">By submitting you agree to be contacted by Glintr about this program.</p>
                    </StepShell>
                  )}
                </>
              )}

              <div className="mt-8 flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={back} disabled={step === 1 || submitting}>
                  <ArrowLeft className="size-4 mr-1" /> Back
                </Button>
                {step < 5 ? (
                  <Button type="button" onClick={next}>
                    Continue <ArrowRight className="size-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="button" variant="gradient" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting…" : (<><CheckCircle2 className="size-4 mr-1" /> Submit enrollment</>)}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </Shell>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-display font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block">{label}{required && <span className="text-primary"> *</span>}</Label>
      {children}
    </div>
  );
}

function LearnerCard({ active, onClick, icon: Icon, title, desc }: { active: boolean; onClick: () => void; icon: any; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("text-left p-4 rounded-xl border-2 transition-all", active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
      <Icon className={cn("size-5 mb-2", active ? "text-primary" : "text-muted-foreground")} />
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
    </button>
  );
}

function ConfirmRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/60 last:border-0">
      <div className="text-muted-foreground">{k}</div>
      <div className="font-medium text-right">{v || "—"}</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (<><SiteHeader /><main>{children}</main><SiteFooter /></>);
}
