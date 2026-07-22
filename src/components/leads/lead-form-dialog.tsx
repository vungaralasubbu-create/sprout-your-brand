/**
 * Premium lead-capture form. Mounts once globally; listens to the
 * `glintr:open-lead-form` event so any surface can open it with contextual
 * copy (brochure, consultation, roadmap, AI hand-off …).
 *
 * Desktop: centered glass dialog.
 * Mobile:  bottom sheet.
 * Post-submit: shows the "Thank you" confirmation and never re-opens for
 * this browser.
 */
import * as React from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { submitLead, LeadStatuses, type LeadSource } from "@/lib/leads/client";
import { LEAD_OPEN_EVENT, type OpenLeadFormPayload } from "@/lib/leads/open-lead-form";
import { markPopupDismissed, markPopupShown } from "@/lib/smart-popup";
import { trackFunnel } from "@/lib/conversion-intelligence/track";

const DEFAULT_COPY: Record<
  LeadSource | "default",
  { headline: string; sub: string; cta: string }
> = {
  default: {
    headline: "Talk to a career counsellor",
    sub: "Share your details — we'll send your personalised program plan and roadmap in minutes.",
    cta: "Get my roadmap",
  },
  homepage: {
    headline: "Book a free career consultation",
    sub: "15 minutes with a Glintr counsellor — programs, salaries, timelines, everything.",
    cta: "Book Now",
  },
  ai: {
    headline: "Send me my personalised roadmap",
    sub: "GlintrAI will prepare a learning path, salary guide and next-step plan just for you.",
    cta: "Send my roadmap",
  },
  popup: {
    headline: "Need help choosing the right program?",
    sub: "Book a FREE 15-minute career consultation with a Glintr advisor.",
    cta: "Book my slot",
  },
  brochure: {
    headline: "Download your free brochure",
    sub: "Curriculum · Salary guide · Learning path · Career opportunities — emailed instantly.",
    cta: "Send the brochure",
  },
  consultation: {
    headline: "Book a FREE career consultation",
    sub: "Talk to a real Glintr counsellor — no obligation, no fluff.",
    cta: "Book my consultation",
  },
  exit_intent: {
    headline: "Wait — grab your FREE AI Career Roadmap",
    sub: "Worth ₹999. Curriculum, salary guide, and next steps — delivered instantly to your inbox.",
    cta: "Send my free roadmap",
  },
  scroll: {
    headline: "Download your FREE career roadmap",
    sub: "Curriculum · Salary Guide · Learning Path · Course Brochure · Career Opportunities.",
    cta: "Email me the roadmap",
  },
  returning_visitor: {
    headline: "Welcome back — still deciding?",
    sub: "Book a FREE 15-minute career consultation and we'll help you pick the perfect program.",
    cta: "Book my slot",
  },
  demo: {
    headline: "Reserve your free demo class",
    sub: "Attend a live session before you enrol. Meet the mentors, see the curriculum in action.",
    cta: "Reserve my seat",
  },
  roadmap: {
    headline: "Get your FREE AI Career Roadmap",
    sub: "Curriculum, salary guide, top-hiring companies and a step-by-step plan.",
    cta: "Send my roadmap",
  },
  cta: {
    headline: "Just one step away",
    sub: "Enter your details and we'll send everything to your inbox.",
    cta: "Continue",
  },
  course_page: {
    headline: "Get the full course brochure",
    sub: "Curriculum, projects, mentors, salary outcomes — sent to your inbox.",
    cta: "Send it to me",
  },
  unknown: {
    headline: "Talk to a Glintr counsellor",
    sub: "Share your details and we'll reach out with your personalised roadmap.",
    cta: "Continue",
  },
};

interface FormState {
  name: string;
  email: string;
  phone: string;
  interested_course: string;
  qualification: string;
  current_status: "" | (typeof LeadStatuses)[number];
}

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  interested_course: "",
  qualification: "",
  current_status: "",
};

export function LeadFormDialog() {
  const [payload, setPayload] = React.useState<OpenLeadFormPayload | null>(null);
  const [state, setState] = React.useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = (evt: Event) => {
      const detail = (evt as CustomEvent<OpenLeadFormPayload>).detail;
      setPayload(detail);
      setDone(false);
      setState((s) => ({
        ...EMPTY,
        interested_course: detail?.interested_course ?? s.interested_course ?? "",
      }));
      setIsMobile(window.innerWidth < 768);
      markPopupShown();
    };
    window.addEventListener(LEAD_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(LEAD_OPEN_EVENT, onOpen);
  }, []);

  React.useEffect(() => {
    if (!payload) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close("esc");
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  function close(reason: string) {
    if (!payload) return;
    if (!done) markPopupDismissed();
    setPayload(null);
    void reason;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payload) return;
    setSubmitting(true);
    void trackFunnel({ stage: "form_start", entityId: payload.source, metadata: { source_detail: payload.source_detail } });
    try {
      const lead = await submitLead({
        name: state.name,
        email: state.email,
        phone: state.phone || undefined,
        interested_course: state.interested_course || undefined,
        qualification: state.qualification || undefined,
        current_status: state.current_status || undefined,
        source: payload.source,
        source_detail: payload.source_detail,
        metadata: payload.metadata,
      });
      setDone(true);
      void trackFunnel({ stage: "form_submit", entityId: payload.source, leadId: lead.id, metadata: { source_detail: payload.source_detail } });
      payload.onSubmitted?.(lead.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!payload) return null;

  const copy = DEFAULT_COPY[payload.source] ?? DEFAULT_COPY.default;
  const headline = payload.headline ?? copy.headline;
  const sub = payload.subheadline ?? copy.sub;
  const cta = payload.cta ?? copy.cta;

  const containerCls = cn(
    "relative w-full overflow-hidden border border-white/10 bg-slate-900/95 text-white shadow-2xl backdrop-blur-2xl",
    "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(163,230,53,0.12),transparent_55%)]",
    isMobile
      ? "rounded-t-3xl px-5 pb-8 pt-6 animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto"
      : "w-[min(520px,94vw)] rounded-3xl p-8 animate-in fade-in zoom-in-95 duration-300",
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-form-title"
      className={cn(
        "fixed inset-0 z-[70] flex bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300",
        isMobile ? "items-end justify-center" : "items-center justify-center p-4",
      )}
      onClick={() => close("backdrop")}
    >
      <div className={containerCls} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Close"
          onClick={() => close("close")}
          className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>

        {done ? (
          <div className="relative flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-emerald-400/15 p-3">
              <CheckCircle2 className="size-8 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-black">Thank you!</h2>
            <p className="mt-2 max-w-sm text-sm text-white/70">
              Your details are with us. A Glintr counsellor will be in touch shortly — and your
              brochure/roadmap is on its way to your inbox.
            </p>
            <Button
              onClick={() => close("done")}
              className="mt-6 bg-white/10 text-white hover:bg-white/20"
            >
              Continue browsing
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="relative space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
                <Sparkles className="size-3" /> Glintr
              </div>
              <h2 id="lead-form-title" className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                {headline}
              </h2>
              <p className="mt-2 text-sm text-white/70">{sub}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" required>
                <Input
                  required
                  value={state.name}
                  onChange={(e) => setState({ ...state, name: e.target.value })}
                  placeholder="Priya Sharma"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </Field>
              <Field label="Email" required>
                <Input
                  required
                  type="email"
                  value={state.email}
                  onChange={(e) => setState({ ...state, email: e.target.value })}
                  placeholder="you@example.com"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </Field>
              <Field label={`Phone${payload.requirePhone ? "" : " (optional)"}`} required={!!payload.requirePhone}>
                <Input
                  required={!!payload.requirePhone}
                  type="tel"
                  value={state.phone}
                  onChange={(e) => setState({ ...state, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </Field>
              <Field label="Interested course">
                <Input
                  value={state.interested_course}
                  onChange={(e) => setState({ ...state, interested_course: e.target.value })}
                  placeholder="e.g. AI Business, Data Science"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </Field>
              <Field label="Current qualification">
                <Input
                  value={state.qualification}
                  onChange={(e) => setState({ ...state, qualification: e.target.value })}
                  placeholder="B.Tech, MBA, 12th…"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
              </Field>
              <Field label="I am a…">
                <Select
                  value={state.current_status}
                  onValueChange={(v) =>
                    setState({ ...state, current_status: v as FormState["current_status"] })
                  }
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="working">Working professional</SelectItem>
                    <SelectItem value="job_seeker">Job seeker</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full bg-gradient-to-r from-cyan-400 via-sky-400 to-lime-300 text-slate-950 font-semibold hover:opacity-95"
            >
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {submitting ? "Sending…" : cta}
            </Button>
            <p className="text-center text-[11px] text-white/50">
              By continuing you agree to Glintr's Privacy Policy. We'll never spam you.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-white/60">
        {label}
        {required ? <span className="ml-0.5 text-cyan-300">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
