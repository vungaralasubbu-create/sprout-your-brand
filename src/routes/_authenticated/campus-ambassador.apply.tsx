import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  GraduationCap, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  getCampusAmbassadorContext,
  submitCampusAmbassadorApplication,
} from "@/lib/campus-ambassador/ca.functions";

export const Route = createFileRoute("/_authenticated/campus-ambassador/apply")({
  head: () => ({ meta: [{ title: "Apply — Glintr Campus Ambassador" }] }),
  component: ApplyPage,
});

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Postgraduate", "Recently Graduated"];
const NETWORK = ["Under 100", "100 – 500", "500 – 2,000", "2,000 – 10,000", "10,000+"];

const optionalUrl = (v: string) =>
  !v || /^(https?:\/\/)[^\s]+\.[^\s]+/i.test(v) || /^[a-z0-9_.]+$/i.test(v);

function ApplyPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const ctxFn = useServerFn(getCampusAmbassadorContext);
  const submitFn = useServerFn(submitCampusAmbassadorApplication);
  const ctxQ = useQuery({ queryKey: ["ca-context"], queryFn: () => ctxFn() });

  const [form, setForm] = useState({
    full_name: "", email: "", mobile: "",
    college_name: "", campus_city: "", state: "",
    degree_course: "", specialisation: "",
    current_year_of_study: "", expected_graduation_year: "",
    instagram_url: "", linkedin_url: "", other_social_url: "",
    campus_network_size: "",
    motivation: "", introduction_plan: "",
    previous_ambassador: false, previous_brand: "",
    acknowledged_commission_program: false,
    confirmed_information_accuracy: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ctxQ.data?.prefill && !form.full_name && !form.email && !form.mobile) {
      setForm((f) => ({
        ...f,
        full_name: ctxQ.data!.prefill.full_name || "",
        email: ctxQ.data!.prefill.email || "",
        mobile: ctxQ.data!.prefill.mobile || "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxQ.data?.prefill]);

  const submitMut = useMutation({
    mutationFn: (payload: any) => submitFn({ data: payload }),
    onSuccess: () => {
      toast.success("Application submitted");
      qc.invalidateQueries({ queryKey: ["ca-context"] });
      navigate({ to: "/campus-ambassador/status" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Unable to submit application"),
  });

  if (ctxQ.isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="h-8 w-56 bg-slate-100 rounded animate-pulse" />
        <div className="h-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-40 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  // If existing active application, redirect them to status
  if (ctxQ.data?.activeApp) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-6">
          <Info className="h-6 w-6 text-primary" />
          <h1 className="mt-3 font-display text-2xl font-semibold">
            You Already Have An Active Application
          </h1>
          <p className="mt-1 text-slate-600 text-sm">
            Please check your Campus Ambassador application status.
          </p>
          <Button asChild className="mt-4">
            <Link to="/campus-ambassador/status">View Application Status</Link>
          </Button>
        </Card>
      </div>
    );
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k as string]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2) e.full_name = "Enter your full name";
    if (!z.string().email().safeParse(form.email.trim()).success) e.email = "Enter a valid email";
    if (form.mobile.replace(/\D/g, "").length < 8) e.mobile = "Enter a valid mobile number";
    if (!form.college_name.trim()) e.college_name = "Required";
    if (!form.campus_city.trim()) e.campus_city = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!form.degree_course.trim()) e.degree_course = "Required";
    if (!form.current_year_of_study.trim()) e.current_year_of_study = "Required";
    if (form.motivation.trim().length < 20) e.motivation = "Please write at least 20 characters";
    if (!optionalUrl(form.instagram_url.trim())) e.instagram_url = "Enter a valid URL or handle";
    if (!optionalUrl(form.linkedin_url.trim())) e.linkedin_url = "Enter a valid URL or handle";
    if (!optionalUrl(form.other_social_url.trim())) e.other_social_url = "Enter a valid URL or handle";
    if (!form.acknowledged_commission_program) e.acknowledged_commission_program = "Required";
    if (!form.confirmed_information_accuracy) e.confirmed_information_accuracy = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    submitMut.mutate({
      ...form,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      college_name: form.college_name.trim(),
      campus_city: form.campus_city.trim(),
      state: form.state.trim(),
      degree_course: form.degree_course.trim(),
      specialisation: form.specialisation.trim() || null,
      current_year_of_study: form.current_year_of_study.trim(),
      expected_graduation_year: form.expected_graduation_year
        ? Number(form.expected_graduation_year)
        : null,
      instagram_url: form.instagram_url.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      other_social_url: form.other_social_url.trim() || null,
      campus_network_size: form.campus_network_size || null,
      motivation: form.motivation.trim(),
      introduction_plan: form.introduction_plan.trim() || null,
      previous_brand: form.previous_ambassador ? form.previous_brand.trim() || null : null,
    });
  }

  const FieldErr = ({ k }: { k: string }) =>
    errors[k] ? <div className="text-xs text-rose-600 mt-1">{errors[k]}</div> : null;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link to="/campus-ambassador" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to Program
      </Link>
      <div className="mt-4">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap className="h-5 w-5" />
          <div className="text-xs font-mono uppercase tracking-widest">Campus Ambassador</div>
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Application</h1>
        <p className="mt-2 text-slate-600 text-sm">
          Tell us about your campus and how you'd like to represent Glintr.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <Card className="p-5 space-y-4">
          <SectionTitle>Personal Details</SectionTitle>
          <Grid>
            <div>
              <Label>Full Name*</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              <FieldErr k="full_name" />
            </div>
            <div>
              <Label>Email Address*</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              <FieldErr k="email" />
            </div>
            <div>
              <Label>Mobile Number*</Label>
              <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="e.g. 98765 43210" />
              <FieldErr k="mobile" />
            </div>
          </Grid>
        </Card>

        <Card className="p-5 space-y-4">
          <SectionTitle>Campus Details</SectionTitle>
          <Grid>
            <div className="md:col-span-2">
              <Label>College / University Name*</Label>
              <Input value={form.college_name} onChange={(e) => set("college_name", e.target.value)} />
              <FieldErr k="college_name" />
            </div>
            <div>
              <Label>Campus City*</Label>
              <Input value={form.campus_city} onChange={(e) => set("campus_city", e.target.value)} />
              <FieldErr k="campus_city" />
            </div>
            <div>
              <Label>State*</Label>
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
              <FieldErr k="state" />
            </div>
            <div>
              <Label>Degree / Course*</Label>
              <Input value={form.degree_course} onChange={(e) => set("degree_course", e.target.value)} />
              <FieldErr k="degree_course" />
            </div>
            <div>
              <Label>Specialisation</Label>
              <Input value={form.specialisation} onChange={(e) => set("specialisation", e.target.value)} />
            </div>
            <div>
              <Label>Current Year Of Study*</Label>
              <Select value={form.current_year_of_study} onValueChange={(v) => set("current_year_of_study", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldErr k="current_year_of_study" />
            </div>
            <div>
              <Label>Expected Graduation Year</Label>
              <Input
                type="number" min={2020} max={2050}
                value={form.expected_graduation_year}
                onChange={(e) => set("expected_graduation_year", e.target.value)}
              />
            </div>
          </Grid>
        </Card>

        <Card className="p-5 space-y-4">
          <SectionTitle>Social & Network</SectionTitle>
          <div className="text-xs text-slate-500 -mt-1">All optional. Helps us understand your reach.</div>
          <Grid>
            <div>
              <Label>Instagram Profile</Label>
              <Input value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} placeholder="@handle or URL" />
              <FieldErr k="instagram_url" />
            </div>
            <div>
              <Label>LinkedIn Profile</Label>
              <Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="URL" />
              <FieldErr k="linkedin_url" />
            </div>
            <div>
              <Label>Other Social Profile</Label>
              <Input value={form.other_social_url} onChange={(e) => set("other_social_url", e.target.value)} />
              <FieldErr k="other_social_url" />
            </div>
            <div>
              <Label>Approximate Campus Network Size</Label>
              <Select value={form.campus_network_size} onValueChange={(v) => set("campus_network_size", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {NETWORK.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Grid>
        </Card>

        <Card className="p-5 space-y-4">
          <SectionTitle>Motivation</SectionTitle>
          <div>
            <Label>Why Do You Want To Become A Glintr Campus Ambassador?*</Label>
            <Textarea
              rows={4}
              value={form.motivation}
              onChange={(e) => set("motivation", e.target.value)}
              placeholder="Share your motivation, background and how Glintr fits into your campus role."
            />
            <FieldErr k="motivation" />
          </div>
          <div>
            <Label>How Would You Introduce Glintr Programs To Students?</Label>
            <Textarea
              rows={3}
              value={form.introduction_plan}
              onChange={(e) => set("introduction_plan", e.target.value)}
              placeholder="Campus activations, workshops, communities, social channels, referrals..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={form.previous_ambassador}
              onCheckedChange={(v) => set("previous_ambassador", Boolean(v))}
              id="prev-amb"
            />
            <Label htmlFor="prev-amb" className="cursor-pointer">
              Have You Previously Worked As A Campus Ambassador?
            </Label>
          </div>
          {form.previous_ambassador && (
            <div>
              <Label>Previous Brand / Organisation</Label>
              <Input value={form.previous_brand} onChange={(e) => set("previous_brand", e.target.value)} />
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-3 border-primary/20 bg-primary/[0.02]">
          <div className="flex items-start gap-2">
            <Checkbox
              id="ack-comm"
              checked={form.acknowledged_commission_program}
              onCheckedChange={(v) => set("acknowledged_commission_program", Boolean(v))}
            />
            <Label htmlFor="ack-comm" className="text-sm cursor-pointer leading-relaxed">
              I understand that the Glintr Campus Ambassador Program is commission-based and does
              not guarantee fixed earnings or employment.
            </Label>
          </div>
          <FieldErr k="acknowledged_commission_program" />
          <div className="flex items-start gap-2">
            <Checkbox
              id="ack-info"
              checked={form.confirmed_information_accuracy}
              onCheckedChange={(v) => set("confirmed_information_accuracy", Boolean(v))}
            />
            <Label htmlFor="ack-info" className="text-sm cursor-pointer leading-relaxed">
              I confirm that the information provided in this application is accurate.
            </Label>
          </div>
          <FieldErr k="confirmed_information_accuracy" />
        </Card>

        {submitMut.isError && (
          <Card className="p-4 flex items-start gap-2 border-rose-200 bg-rose-50">
            <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-rose-900">Unable To Submit Application</div>
              <div className="text-xs text-rose-700">
                Your application was not submitted. Please review your information and try again.
              </div>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="lg" disabled={submitMut.isPending}>
            {submitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Submit Application
          </Button>
          <Button asChild type="button" variant="outline" size="lg">
            <Link to="/campus-ambassador">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="font-semibold text-slate-900">{children}</div>;
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}
