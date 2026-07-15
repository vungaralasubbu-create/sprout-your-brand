import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Container, Section, SectionHeader } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactEnquiry } from "@/lib/contact/contact-submit.functions";
import { useReveal } from "@/hooks/use-motion";

export const Route = createFileRoute("/book-consultation")({
  head: () => ({
    meta: [
      { title: "Book A Consultation | Glintr" },
      {
        name: "description",
        content: "Share your education brand, LMS or growth requirements with Glintr.",
      },
      { property: "og:title", content: "Book A Consultation | Glintr" },
      {
        property: "og:description",
        content: "Tell Glintr what you want to build across white-label EdTech, brand setup, LMS or marketing support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com/book-consultation" }],
  }),
  component: BookConsultationPage,
});

const TOPICS = [
  "White Label EdTech",
  "Brand Setup",
  "LMS",
  "Marketing Support",
  "Multiple Services",
  "Something Else",
] as const;

type Topic = (typeof TOPICS)[number];

type FormState = {
  name: string;
  email: string;
  organisation: string;
  topic: Topic;
  planning: string;
  discussion: string;
  website: string;
};

type FieldErrors = Partial<Record<"name" | "email" | "organisation" | "planning" | "discussion", string>>;

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  organisation: "",
  topic: "White Label EdTech",
  planning: "",
  discussion: "",
  website: "",
};

function BookConsultationPage() {
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [reviewed, setReviewed] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [reference, setReference] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [idempotencyKey, setIdempotencyKey] = React.useState(() => makeIdempotencyKey());
  const [formOpenedAt] = React.useState(() => Date.now());
  const reveal = useReveal<HTMLDivElement>();

  const reviewRef = React.useRef<HTMLDivElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const orgRef = React.useRef<HTMLInputElement>(null);
  const planningRef = React.useRef<HTMLTextAreaElement>(null);
  const discussionRef = React.useRef<HTMLTextAreaElement>(null);

  const submitFn = useServerFn(submitContactEnquiry);
  const submitMutation = useMutation({
    mutationFn: async () => {
      const title = `Consultation Request: ${form.topic}`;
      const summary = [
        `Consultation topic: ${form.topic}`,
        `Planning to build: ${form.planning}`,
        `Discussion request: ${form.discussion}`,
        form.organisation ? `Organisation or brand: ${form.organisation}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      return submitFn({
        data: {
          topic: form.topic === "Something Else" ? "general" : "business",
          name: form.name,
          email: form.email,
          organisation: form.organisation,
          title,
          summary,
          source: "contact_page",
          idempotencyKey,
          website: form.website,
          formOpenedAt,
        },
      });
    },
    onSuccess: (res) => {
      if (res.ok) {
        setReference(res.reference);
        toast.success("Consultation request sent");
        setTimeout(() => reviewRef.current?.focus(), 50);
        return;
      }

      if (res.kind === "validation") {
        const nextErrors: FieldErrors = {
          name: res.fieldErrors.name,
          email: res.fieldErrors.email,
          organisation: res.fieldErrors.organisation,
          planning: res.fieldErrors.summary,
          discussion: res.fieldErrors.summary,
        };
        setErrors(nextErrors);
        focusFirstError(nextErrors, { nameRef, emailRef, orgRef, planningRef, discussionRef });
        toast.error(res.message);
        return;
      }

      if (res.kind === "duplicate_recent") {
        setReference(res.reference);
        toast.message(res.message);
        return;
      }

      toast.error(res.message);
    },
    onError: () => toast.error("Your consultation request was not confirmed. Please try again."),
  });

  const update = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    setReviewed(false);
    setReference(null);
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (form.name.trim().length < 2) next.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email.";
    if (form.organisation.trim().length > 160) next.organisation = "Keep this under 160 characters.";
    if (form.planning.trim().length < 20) next.planning = "Tell us what you are planning to build.";
    if (form.discussion.trim().length < 20) next.discussion = "Tell us what you would like to discuss.";
    setErrors(next);
    return next;
  };

  const handleReview = () => {
    const next = validate();
    if (Object.keys(next).length > 0) {
      focusFirstError(next, { nameRef, emailRef, orgRef, planningRef, discussionRef });
      return;
    }
    setReviewed(true);
    setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleSend = () => {
    if (!reviewed) {
      handleReview();
      return;
    }
    submitMutation.mutate();
  };

  const handleNew = () => {
    setForm(EMPTY_FORM);
    setReviewed(false);
    setErrors({});
    setReference(null);
    setIdempotencyKey(makeIdempotencyKey());
    submitMutation.reset();
  };

  const copyReference = async () => {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      toast.success("Reference copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.message(`Copy manually: ${reference}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Section className="pt-16 pb-14 md:pt-20">
          <Container className="max-w-5xl text-center">
            <Badge variant="outline" className="mb-4 uppercase tracking-widest">
              BOOK A CONSULTATION
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              Tell Us What You Want To Build.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Share your education brand, LMS or growth requirements with Glintr.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="gradient" size="lg" asChild className="lift-card">
                <a href="#consultation-form">
                  Start Consultation Request <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild className="lift-card">
                <Link to="/white-label-edtech">Explore White Label EdTech</Link>
              </Button>
            </div>
          </Container>
        </Section>

        <Section className="bg-muted/30 py-16">
          <Container className="max-w-6xl">
            <SectionHeader
              eyebrow="Consultation Topics"
              title="Choose the area closest to what you want to discuss."
            />
            <div
              ref={reveal.ref}
              data-visible={reveal.dataVisible}
              className="reveal mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {TOPICS.map((topic) => {
                const active = form.topic === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ topic })}
                    className={`lift-card rounded-xl border p-4 text-left ${active ? "lift-card-selected border-primary bg-primary-soft" : "border-border/60 bg-card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`grid size-9 place-items-center rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {active ? <Check className="size-4" /> : <MessageSquare className="size-4" />}
                      </span>
                      <span className="font-medium">{topic}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Container>
        </Section>

        <Section id="consultation-form" className="py-16">
          <Container className="max-w-4xl">
            <SectionHeader
              eyebrow="Consultation Request"
              title="Review the request before sending."
              description="This form routes into the existing contact enquiry flow. It does not create fake calendar slots or a duplicate CRM."
            />
            <Card className="mt-8 border-border/60">
              <CardContent className="grid gap-5 p-5 md:p-8">
                <div className="hidden">
                  <Label htmlFor="consultation-website">Website</Label>
                  <Input
                    id="consultation-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(event) => update({ website: event.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Name" error={errors.name} required>
                    <Input
                      ref={nameRef}
                      value={form.name}
                      onChange={(event) => update({ name: event.target.value })}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Email" error={errors.email} required>
                    <Input
                      ref={emailRef}
                      type="email"
                      value={form.email}
                      onChange={(event) => update({ email: event.target.value })}
                      autoComplete="email"
                    />
                  </Field>
                </div>

                <Field label="Organisation Or Brand" error={errors.organisation}>
                  <Input
                    ref={orgRef}
                    value={form.organisation}
                    onChange={(event) => update({ organisation: event.target.value })}
                    placeholder="Your organisation, brand or working name"
                  />
                </Field>

                <Field label="Consultation Topic" required>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {TOPICS.map((topic) => {
                      const active = form.topic === topic;
                      return (
                        <button
                          key={topic}
                          type="button"
                          aria-pressed={active}
                          onClick={() => update({ topic })}
                          className={`lift-card rounded-lg border px-3 py-2 text-left text-sm ${active ? "lift-card-selected border-primary bg-primary-soft font-medium" : "border-border/60 bg-card"}`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="What Are You Planning To Build?" error={errors.planning} required>
                  <Textarea
                    ref={planningRef}
                    rows={5}
                    value={form.planning}
                    onChange={(event) => update({ planning: event.target.value })}
                    placeholder="Describe your education brand, LMS, student experience or growth requirement."
                    maxLength={1200}
                  />
                </Field>

                <Field label="What Would You Like To Discuss?" error={errors.discussion} required>
                  <Textarea
                    ref={discussionRef}
                    rows={5}
                    value={form.discussion}
                    onChange={(event) => update({ discussion: event.target.value })}
                    placeholder="Share the decisions, questions or next steps you want Glintr to help clarify."
                    maxLength={1200}
                  />
                </Field>

                <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" type="button" onClick={handleReview} className="lift-card">
                    Review Request
                  </Button>
                  <Button
                    variant="gradient"
                    type="button"
                    onClick={handleSend}
                    disabled={submitMutation.isPending}
                    aria-busy={submitMutation.isPending}
                    className="lift-card"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending Consultation Request…
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Send Consultation Request
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {(reviewed || reference) && (
              <Card
                ref={reviewRef}
                tabIndex={-1}
                className="mt-6 border-primary/30 bg-primary-soft/30 outline-none"
                role="status"
                aria-live="polite"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-primary" />
                    {reference ? "Consultation request sent" : "Request review"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm">
                  {reference ? (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Contact Reference
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <code className="rounded-md bg-background px-2 py-1 font-mono text-sm">{reference}</code>
                        <Button size="sm" variant="ghost" onClick={copyReference}>
                          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                          {copied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ReviewLine label="Topic" value={form.topic} />
                      <ReviewLine label="Planning" value={form.planning} />
                      <ReviewLine label="Discussion" value={form.discussion} />
                      <p className="text-xs text-muted-foreground">
                        Review complete. Use Send Consultation Request when you are ready.
                      </p>
                    </>
                  )}
                  {reference && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button variant="outline" onClick={handleNew}>Send Another Request</Button>
                      <Button variant="ghost" asChild><Link to="/white-label-edtech">Explore White Label EdTech</Link></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </Container>
        </Section>

        <Section className="bg-muted/30 py-16">
          <Container className="max-w-5xl text-center">
            <Sparkles className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              Not Sure Which Path Fits?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Explore the related pages first, then come back with a clearer request.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="outline" asChild className="lift-card"><Link to="/brand-setup">Brand Setup</Link></Button>
              <Button variant="outline" asChild className="lift-card"><Link to="/lms">LMS</Link></Button>
              <Button variant="outline" asChild className="lift-card"><Link to="/marketing-support">Marketing Support</Link></Button>
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
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required ? <span className="text-primary">*</span> : null}
      </Label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string; "aria-invalid"?: boolean }>, {
            id,
            "aria-invalid": Boolean(error),
          })
        : children}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <p className="mt-1 whitespace-pre-line text-sm">{value}</p>
    </div>
  );
}

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `consultation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function focusFirstError(
  errors: FieldErrors,
  refs: {
    nameRef: React.RefObject<HTMLInputElement | null>;
    emailRef: React.RefObject<HTMLInputElement | null>;
    orgRef: React.RefObject<HTMLInputElement | null>;
    planningRef: React.RefObject<HTMLTextAreaElement | null>;
    discussionRef: React.RefObject<HTMLTextAreaElement | null>;
  },
) {
  if (errors.name) refs.nameRef.current?.focus();
  else if (errors.email) refs.emailRef.current?.focus();
  else if (errors.organisation) refs.orgRef.current?.focus();
  else if (errors.planning) refs.planningRef.current?.focus();
  else if (errors.discussion) refs.discussionRef.current?.focus();
}