import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCourseBySlug } from "@/lib/programs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/programs/$category/$course/apply")({
  head: () => ({ meta: [{ title: "Apply — Glintr" }, { name: "robots", content: "noindex" }] }),
  component: ApplyPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  mobile: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  education: z.string().trim().max(100).optional().or(z.literal("")),
  graduation_year: z.string().optional(),
  current_role_title: z.string().trim().max(100).optional().or(z.literal("")),
  work_experience: z.string().trim().max(500).optional().or(z.literal("")),
  preferred_mode: z.string().optional(),
  start_timeline: z.string().optional(),
  source: z.string().trim().max(100).optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Please accept terms to continue." }) }),
});

function ApplyPage() {
  const { category, course } = Route.useParams();
  const navigate = useNavigate();
  const { data: c, isLoading } = useQuery({ queryKey: ["course", category, course], queryFn: () => getCourseBySlug(category, course) });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!c) return;
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
    raw.consent = fd.get("consent") ? "true" : "false";
    const parsed = schema.safeParse({ ...raw, consent: raw.consent === "true" });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    const partnerRef = (typeof window !== "undefined" && sessionStorage.getItem("glintr_ref")) || null;
    const payload = {
      course_id: c.id,
      full_name: parsed.data.full_name,
      mobile: parsed.data.mobile,
      email: parsed.data.email,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      education: parsed.data.education || null,
      graduation_year: parsed.data.graduation_year ? parseInt(parsed.data.graduation_year, 10) : null,
      current_role_title: parsed.data.current_role_title || null,
      work_experience: parsed.data.work_experience || null,
      preferred_mode: parsed.data.preferred_mode || null,
      start_timeline: parsed.data.start_timeline || null,
      source: parsed.data.source || null,
      consent: true,
      partner_ref: partnerRef,
    };
    const { error } = await supabase.from("course_applications").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit. Please try again.");
      return;
    }
    if (partnerRef) {
      supabase.from("partner_referral_events").insert({ partner_ref: partnerRef, course_id: c.id, event_type: "application" }).then(() => {});
    }
    toast.success("Application received. Our team will reach out soon.");
    navigate({ to: "/programs/$category/$course", params: { category, course } });
  }

  if (isLoading) return <Shell><div className="p-24 text-center">Loading…</div></Shell>;
  if (!c) return <Shell><div className="p-24 text-center">Program not found.</div></Shell>;

  return (
    <Shell>
      <Section className="pt-14 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
        <Container>
          <nav className="text-caption mb-4 flex items-center gap-1.5 flex-wrap">
            <Link to="/programs" className="hover:text-foreground">Programs</Link>
            <ChevronRight className="size-3.5" />
            <Link to="/programs/$category/$course" params={{ category, course }} className="hover:text-foreground">{c.name}</Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">Apply</span>
          </nav>
          <h1 className="text-display-md font-display font-semibold tracking-tight">Apply for {c.name}</h1>
          <p className="mt-3 text-body-lg text-muted-foreground max-w-2xl">Share your details and our team will get in touch with next steps.</p>
        </Container>
      </Section>

      <Section className="py-10">
        <Container>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5 max-w-3xl">
            <Field label="Full name" name="full_name" required />
            <Field label="Mobile" name="mobile" required />
            <Field label="Email" name="email" type="email" required className="md:col-span-2" />
            <Field label="City" name="city" />
            <Field label="State" name="state" />
            <Field label="Current education" name="education" />
            <Field label="Graduation year" name="graduation_year" type="number" />
            <Field label="Current role" name="current_role_title" />
            <Field label="Work experience" name="work_experience" />
            <div>
              <Label>Preferred learning mode</Label>
              <Select name="preferred_mode">
                <SelectTrigger className="mt-2 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Live">Live</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="preferred_mode_hidden" />
            </div>
            <div>
              <Label>Preferred start</Label>
              <Select name="start_timeline">
                <SelectTrigger className="mt-2 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Immediately">Immediately</SelectItem>
                  <SelectItem value="Within 7 Days">Within 7 Days</SelectItem>
                  <SelectItem value="Within 30 Days">Within 30 Days</SelectItem>
                  <SelectItem value="Just Exploring">Just Exploring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="How did you hear about us?" name="source" className="md:col-span-2" />
            <div className="md:col-span-2">
              <label className="flex items-start gap-2 text-body">
                <Checkbox name="consent" value="true" required />
                <span className="text-muted-foreground">I agree to be contacted by Glintr about this program.</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <Button size="lg" variant="gradient" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit application"}</Button>
            </div>
          </form>
        </Container>
      </Section>
    </Shell>
  );
}

function Field({ label, name, type = "text", required, className }: { label: string; name: string; type?: string; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
      <Input id={name} name={name} type={type} required={required} className="mt-2 h-11" />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (<><SiteHeader /><main>{children}</main><SiteFooter /></>);
}
