import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Container, Section } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
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

import { supabase } from "@/integrations/supabase/client";
import { BRAND_LAUNCH_TIMELINE, WHITE_LABEL_PROGRAMS } from "@/data/brand-cms";

export const Route = createFileRoute("/launch-your-brand/consultation")({
  head: () => ({
    meta: [
      { title: "Book a Brand Consultation — Glintr" },
      {
        name: "description",
        content:
          "Talk to Glintr's Brand Launch team. Share your goals and get a tailored plan for your white-label EdTech brand.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConsultationPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  mobile: z.string().trim().min(6, "Enter a valid mobile number").max(20),
  email: z.string().trim().email("Enter a valid email"),
  current_role_title: z.string().trim().max(120).optional().or(z.literal("")),
  sales_experience: z.string().trim().max(60).optional().or(z.literal("")),
  has_leads: z.string().max(20).optional().or(z.literal("")),
  lead_network_size: z.string().trim().max(60).optional().or(z.literal("")),
  preferred_brand_name: z.string().trim().max(80).optional().or(z.literal("")),
  programs_interested: z.array(z.string()).default([]),
  launch_timeline: z.string().min(1, "Choose a launch timeline"),
});

type Form = z.infer<typeof schema>;

const EMPTY: Form = {
  full_name: "",
  mobile: "",
  email: "",
  current_role_title: "",
  sales_experience: "",
  has_leads: "",
  lead_network_size: "",
  preferred_brand_name: "",
  programs_interested: [],
  launch_timeline: "",
};

function ConsultationPage() {
  const [form, setForm] = React.useState<Form>(EMPTY);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const update = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const toggleProgram = (id: string) => {
    const has = form.programs_interested.includes(id);
    update({
      programs_interested: has
        ? form.programs_interested.filter((x) => x !== id)
        : [...form.programs_interested, id],
    });
  };

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fix the form.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const { error } = await supabase.from("brand_consultations").insert({
        user_id: sessionData.user?.id ?? null,
        full_name: parsed.data.full_name,
        mobile: parsed.data.mobile,
        email: parsed.data.email,
        current_role_title: parsed.data.current_role_title || null,
        sales_experience: parsed.data.sales_experience || null,
        has_leads: parsed.data.has_leads || null,
        lead_network_size: parsed.data.lead_network_size || null,
        preferred_brand_name: parsed.data.preferred_brand_name || null,
        programs_interested: parsed.data.programs_interested,
        launch_timeline: parsed.data.launch_timeline,
      });
      if (error) throw error;
      setDone(true);
      toast.success("Thanks! Our Brand Launch team will reach out shortly.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <Section>
          <Container className="max-w-2xl">
            <Card className="border-primary/30 bg-primary-soft/40">
              <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                <div className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
                  <CheckCircle2 className="size-6" />
                </div>
                <h1 className="font-display text-2xl font-semibold">You're on the list.</h1>
                <p className="max-w-lg text-muted-foreground">
                  Our Brand Launch team will call you back to plan your launch. Meanwhile,
                  you can start filling in the interactive brand builder.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button variant="gradient" asChild><Link to="/launch-your-brand/start">Start Brand Setup</Link></Button>
                  <Button variant="outline" asChild><Link to="/launch-your-brand">Back to overview</Link></Button>
                </div>
              </CardContent>
            </Card>
          </Container>
        </Section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Section className="pt-8 pb-16">
        <Container className="max-w-3xl">
          <Link to="/launch-your-brand" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to Launch Your Brand
          </Link>
          <div className="mt-4">
            <h1 className="font-display text-3xl font-bold md:text-4xl">Book Brand Consultation</h1>
            <p className="mt-2 text-muted-foreground">
              Share a few quick details. Our Brand Launch team will call you back with a tailored plan.
            </p>
          </div>

          <Card className="mt-6 border-border/60">
            <CardContent className="grid gap-5 p-6 md:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full Name" required>
                  <Input value={form.full_name} onChange={(e) => update({ full_name: e.target.value })} />
                </Field>
                <Field label="Mobile Number" required>
                  <Input value={form.mobile} onChange={(e) => update({ mobile: e.target.value })} placeholder="+91 …" />
                </Field>
              </div>
              <Field label="Email" required>
                <Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Current Role">
                  <Input value={form.current_role_title} onChange={(e) => update({ current_role_title: e.target.value })} />
                </Field>
                <Field label="Sales Experience">
                  <Select value={form.sales_experience} onValueChange={(v) => update({ sales_experience: v })}>
                    <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Do You Have Leads?">
                  <Select value={form.has_leads} onValueChange={(v) => update({ has_leads: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes_strong">Yes, strong network</SelectItem>
                      <SelectItem value="yes_some">Some leads</SelectItem>
                      <SelectItem value="no">Not yet</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Estimated Lead Network">
                  <Input value={form.lead_network_size} onChange={(e) => update({ lead_network_size: e.target.value })} placeholder="e.g. 500 contacts" />
                </Field>
              </div>
              <Field label="Preferred Brand Name">
                <Input value={form.preferred_brand_name} onChange={(e) => update({ preferred_brand_name: e.target.value })} />
              </Field>
              <Field label="Programs Interested In">
                <div className="max-h-52 overflow-y-auto rounded-md border border-border p-2">
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {WHITE_LABEL_PROGRAMS.map((p) => {
                      const active = form.programs_interested.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProgram(p.id)}
                          className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${active ? "bg-primary-soft text-primary" : "hover:bg-muted"}`}
                        >
                          <span className={`grid size-4 place-items-center rounded border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                            {active ? "✓" : ""}
                          </span>
                          {p.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Field>
              <Field label="When Do You Want To Launch?" required>
                <Select value={form.launch_timeline} onValueChange={(v) => update({ launch_timeline: v })}>
                  <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                  <SelectContent>
                    {BRAND_LAUNCH_TIMELINE.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Button variant="gradient" size="lg" onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />}
                Book Brand Consultation
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By submitting, you agree to be contacted by the Glintr Brand Launch team.
              </p>
            </CardContent>
          </Card>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}{required ? <span className="ml-1 text-destructive">*</span> : null}</Label>
      {children}
    </div>
  );
}
