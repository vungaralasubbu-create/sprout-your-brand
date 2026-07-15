import * as React from "react";
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  FileUp,
  Loader2,
  MapPin,
  Upload,
  X,
} from "lucide-react";
import { z } from "zod";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Section, Container } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  getRoleBySlug,
  listDepartments,
  listRelatedRoles,
  formatWorkType,
  formatLocationType,
  formatExperienceLevel,
  type DbDepartment,
  type DbRole,
} from "@/lib/careers/careers";
import { submitCareerApplication } from "@/lib/careers/careers.functions";

export const Route = createFileRoute("/careers/$roleSlug")({
  head: ({ params }) => ({
    meta: [
      { title: `${toTitle(params.roleSlug)} Careers | Glintr` },
      { name: "description", content: "Explore this career opportunity at Glintr." },
      { property: "og:title", content: `${toTitle(params.roleSlug)} — Careers at Glintr` },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `https://glintr.com/careers/${params.roleSlug}` },
    ],
    links: [{ rel: "canonical", href: `https://glintr.com/careers/${params.roleSlug}` }],
  }),
  component: RoleDetailPage,
  notFoundComponent: RoleNotFound,
  errorComponent: () => <RoleErrorState />,
});

function toTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function RoleDetailPage() {
  const { roleSlug } = Route.useParams();
  const [role, setRole] = React.useState<DbRole | null>(null);
  const [department, setDepartment] = React.useState<DbDepartment | null>(null);
  const [related, setRelated] = React.useState<DbRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [applyOpen, setApplyOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await getRoleBySlug(roleSlug);
        if (!alive) return;
        setRole(r);
        if (r) {
          const [depts, rel] = await Promise.all([listDepartments(), listRelatedRoles(r)]);
          if (!alive) return;
          setDepartment(depts.find((d) => d.id === r.department_id) ?? null);
          setRelated(rel);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [roleSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <Section padding="lg">
          <Container>
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Container>
        </Section>
        <SiteFooter />
      </div>
    );
  }

  if (!role) return <RoleNotFound />;

  const isClosed = role.status !== "open";
  const closingSoon =
    role.application_close_at &&
    new Date(role.application_close_at) > new Date() &&
    role.status === "open";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <Section tone="surface" padding="lg">
        <Container>
          <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
            <Link to="/careers">
              <ArrowLeft className="size-4 mr-2" />
              Back To Careers
            </Link>
          </Button>

          <div className="flex flex-col gap-4 max-w-3xl">
            {department ? (
              <Badge variant="muted" className="w-fit font-normal">
                {department.name}
              </Badge>
            ) : null}
            <h1 className="text-hero text-balance">{role.title}</h1>
            {role.short_summary ? (
              <p className="text-subheading text-muted-foreground text-pretty">
                {role.short_summary}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-normal">
                <Briefcase className="size-3 mr-1" />
                {formatWorkType(role.work_type)}
              </Badge>
              <Badge variant="outline" className="font-normal">
                <MapPin className="size-3 mr-1" />
                {formatLocationType(role.location_type)}
              </Badge>
              {role.experience_level ? (
                <Badge variant="outline" className="font-normal">
                  {formatExperienceLevel(role.experience_level)}
                </Badge>
              ) : null}
              {role.location_display ? (
                <span className="text-sm text-muted-foreground">· {role.location_display}</span>
              ) : null}
            </div>

            {closingSoon ? (
              <div className="text-xs text-muted-foreground">
                Applications close by{" "}
                {new Date(role.application_close_at!).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            ) : null}

            <div className="mt-4">
              {isClosed ? (
                <div className="rounded-2xl border bg-card p-5">
                  <div className="font-semibold">This Role Is No Longer Accepting Applications</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Explore other open opportunities across Glintr teams.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link to="/careers">View Open Roles</Link>
                  </Button>
                </div>
              ) : (
                <Button size="lg" onClick={() => setApplyOpen(true)}>
                  Apply For This Role <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* CONTENT */}
      <Section padding="lg">
        <Container size="md">
          <article className="prose-editorial max-w-none space-y-14">
            {role.overview ? (
              <section>
                <h2 className="text-2xl font-semibold mb-4">About The Role</h2>
                <p className="text-body text-muted-foreground whitespace-pre-line">{role.overview}</p>
              </section>
            ) : null}

            {role.responsibilities.length > 0 ? (
              <section>
                <h2 className="text-2xl font-semibold mb-4">What You May Work On</h2>
                <ul className="space-y-3">
                  {role.responsibilities.map((r, i) => (
                    <li key={i} className="flex gap-3">
                      <Check className="size-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-body text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {role.requirements.length > 0 ? (
              <section>
                <h2 className="text-2xl font-semibold mb-4">What We're Looking For</h2>
                <ul className="space-y-3">
                  {role.requirements.map((r, i) => (
                    <li key={i} className="flex gap-3">
                      <Check className="size-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-body text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {role.preferred_qualifications.length > 0 ? (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Helpful, But Not Always Required</h2>
                <ul className="space-y-3">
                  {role.preferred_qualifications.map((r, i) => (
                    <li key={i} className="flex gap-3">
                      <Check className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-body text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {role.skills.length > 0 ? (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {role.skills.map((s) => (
                    <Badge key={s} variant="muted" className="font-normal">
                      {s}
                    </Badge>
                  ))}
                </div>
              </section>
            ) : null}

            {!isClosed ? (
              <section className="rounded-3xl border bg-card p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">Ready to apply?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Submit your application and our hiring team will review it.
                </p>
                <Button size="lg" onClick={() => setApplyOpen(true)}>
                  Apply For This Role
                </Button>
              </section>
            ) : null}
          </article>
        </Container>
      </Section>

      {/* RELATED */}
      {related.length > 0 ? (
        <Section tone="surface" padding="lg">
          <Container>
            <h2 className="text-section mb-8">Explore Similar Opportunities</h2>
            <div className="grid gap-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to="/careers/$roleSlug"
                  params={{ roleSlug: r.slug }}
                  className="group flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 hover:border-primary/40"
                >
                  <div>
                    <div className="text-xs text-muted-foreground">{formatWorkType(r.work_type)} · {formatLocationType(r.location_type)}</div>
                    <div className="font-semibold">{r.title}</div>
                  </div>
                  <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <SiteFooter />

      {applyOpen && role ? (
        <ApplyModal role={role} onClose={() => setApplyOpen(false)} />
      ) : null}
    </div>
  );
}

/* =============================================================
 * APPLICATION MODAL
 * ============================================================= */

const applySchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(255),
  mobile: z.string().trim().min(6, "Please enter a valid mobile number.").max(20),
  current_location: z.string().trim().max(120).optional(),
  linkedin_url: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), "Enter a full URL starting with http(s)://"),
  portfolio_url: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), "Enter a full URL starting with http(s)://"),
  cover_note: z.string().trim().max(4000).optional(),
  experience_summary: z.string().trim().max(2000).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Please confirm consent to submit." }) }),
});

type ApplyForm = z.infer<typeof applySchema>;
type ResumeState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "uploaded"; path: string; name: string }
  | { status: "error"; message: string };

const RESUME_ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const RESUME_MAX = 8 * 1024 * 1024; // 8MB

function ApplyModal({ role, onClose }: { role: DbRole; onClose: () => void }) {
  const submit = useServerFn(submitCareerApplication);
  const [form, setForm] = React.useState<Partial<ApplyForm>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [resume, setResume] = React.useState<ResumeState>({ status: "idle" });
  const [consent, setConsent] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<{ code: string | null } | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = <K extends keyof ApplyForm>(k: K, v: ApplyForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  async function handleResume(file: File | null) {
    if (!file) return;
    if (file.size > RESUME_MAX) {
      setResume({ status: "error", message: "File is larger than 8MB." });
      return;
    }
    const okType =
      /\.(pdf|docx?|)$/i.test(file.name) ||
      ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
        file.type,
      );
    if (!okType) {
      setResume({ status: "error", message: "Please upload a PDF, DOC or DOCX file." });
      return;
    }
    setResume({ status: "uploading" });
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${role.slug}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from("career-resumes").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) {
      setResume({ status: "error", message: "Unable to upload resume." });
      return;
    }
    setResume({ status: "uploaded", path, name: file.name });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);

    const parsed = applySchema.safeParse({ ...form, consent });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        map[i.path.join(".")] = i.message;
      });
      setErrors(map);
      return;
    }
    if (resume.status === "uploading") {
      setSubmitError("Please wait for resume upload to finish.");
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await submit({
        data: {
          role_id: role.id,
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          mobile: parsed.data.mobile,
          current_location: parsed.data.current_location || null,
          linkedin_url: parsed.data.linkedin_url || null,
          portfolio_url: parsed.data.portfolio_url || null,
          resume_path: resume.status === "uploaded" ? resume.path : null,
          cover_note: parsed.data.cover_note || null,
          experience_summary: parsed.data.experience_summary || null,
          consent_status: true,
          website: "",
        },
      });
      if (!res.ok) {
        setSubmitError(res.error);
      } else {
        setSuccess({ code: res.application_code });
      }
    } catch {
      setSubmitError("Unable to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl bg-background rounded-t-3xl sm:rounded-3xl border shadow-2xl max-h-[95vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b bg-background/95 backdrop-blur">
          <div>
            <div className="text-xs text-muted-foreground">Apply For</div>
            <div id="apply-title" className="font-semibold">{role.title}</div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="mx-auto size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <CheckCircle2 className="size-7" />
            </div>
            <h3 className="text-2xl font-semibold">Application Submitted</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Thank you for your interest in Glintr. Your application has been received for review.
            </p>
            {success.code ? (
              <div className="mt-4 text-xs text-muted-foreground">
                Reference: <span className="font-mono">{success.code}</span>
              </div>
            ) : null}
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Back To Careers
              </Button>
              <Button asChild>
                <Link to="/about">Explore Glintr</Link>
              </Button>
            </div>
          </div>
        ) : (
          <form className="p-6 grid gap-4" onSubmit={onSubmit} noValidate>
            <Field label="Full Name" required error={errors.full_name}>
              <Input
                autoComplete="name"
                value={form.full_name ?? ""}
                onChange={(e) => set("full_name", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email Address" required error={errors.email}>
                <Input
                  type="email"
                  autoComplete="email"
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Mobile Number" required error={errors.mobile}>
                <Input
                  type="tel"
                  autoComplete="tel"
                  value={form.mobile ?? ""}
                  onChange={(e) => set("mobile", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Current Location" error={errors.current_location} optional>
              <Input
                autoComplete="address-level2"
                value={form.current_location ?? ""}
                onChange={(e) => set("current_location", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="LinkedIn Profile" optional error={errors.linkedin_url}>
                <Input
                  placeholder="https://linkedin.com/in/…"
                  value={form.linkedin_url ?? ""}
                  onChange={(e) => set("linkedin_url", e.target.value)}
                />
              </Field>
              <Field label="Portfolio Or Website" optional error={errors.portfolio_url}>
                <Input
                  placeholder="https://…"
                  value={form.portfolio_url ?? ""}
                  onChange={(e) => set("portfolio_url", e.target.value)}
                />
              </Field>
            </div>

            <div>
              <Label className="text-sm font-medium">Resume <span className="text-muted-foreground font-normal">(Optional — PDF, DOC, DOCX up to 8MB)</span></Label>
              <div className="mt-2 rounded-xl border-2 border-dashed border-border p-4 flex items-center gap-3">
                {resume.status === "uploaded" ? (
                  <>
                    <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">Resume Uploaded</div>
                      <div className="text-xs text-muted-foreground truncate">{resume.name}</div>
                    </div>
                    <label className="text-sm text-primary cursor-pointer">
                      Replace Resume
                      <input
                        type="file"
                        accept={RESUME_ACCEPT}
                        className="sr-only"
                        onChange={(e) => handleResume(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </>
                ) : resume.status === "uploading" ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="text-sm">Uploading Resume…</span>
                  </>
                ) : (
                  <>
                    <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                      <FileUp className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-sm text-muted-foreground">
                      {resume.status === "error" ? resume.message : "Upload your resume"}
                    </div>
                    <label className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border cursor-pointer hover:bg-muted">
                      <Upload className="size-4" />
                      Choose File
                      <input
                        type="file"
                        accept={RESUME_ACCEPT}
                        className="sr-only"
                        onChange={(e) => handleResume(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            <Field label="Experience Summary" optional>
              <Textarea
                rows={3}
                placeholder="A short summary of your recent experience."
                value={form.experience_summary ?? ""}
                onChange={(e) => set("experience_summary", e.target.value)}
              />
            </Field>
            <Field label="Cover Note" optional>
              <Textarea
                rows={4}
                placeholder="Anything you'd like the hiring team to know."
                value={form.cover_note ?? ""}
                onChange={(e) => set("cover_note", e.target.value)}
              />
            </Field>

            <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
              />
              <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed">
                I confirm that the information provided in this application is accurate and I agree that
                Glintr may use this information to review my application according to the applicable{" "}
                <a href="/privacy" className="text-primary underline">
                  Privacy Policy
                </a>
                .
              </label>
            </div>
            {errors.consent ? <p className="text-xs text-destructive">{errors.consent}</p> : null}

            {submitError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !consent}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Submitting Application…
                  </>
                ) : (
                  <>Submit Application</>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
        {optional ? <span className="text-muted-foreground font-normal"> (Optional)</span> : null}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="text-xs text-destructive mt-1">{error}</p> : null}
    </div>
  );
}

function RoleNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Section padding="lg">
        <Container size="md" className="text-center">
          <h1 className="text-hero">Role Not Available</h1>
          <p className="text-muted-foreground mt-3">
            This career opportunity is not available. It may have closed or been unpublished.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/careers">Back To Careers</Link>
          </Button>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}

function RoleErrorState() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Section padding="lg">
        <Container size="md" className="text-center">
          <h1 className="text-hero">Role Not Available</h1>
          <p className="text-muted-foreground mt-3">
            We couldn't load this role right now.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/careers">Back To Careers</Link>
          </Button>
        </Container>
      </Section>
      <SiteFooter />
    </div>
  );
}
