/**
 * Premium slide-in lead-capture card. Non-blocking, glassmorphism, dismissible.
 * Owns four triggers per spec:
 *   1. Time on page (~40s)           — headline: "Need help choosing…?"
 *   2. Scroll depth ≥ 70%             — headline: "Download FREE Career Roadmap"
 *   3. Desktop exit-intent            — headline: "Wait! Before you leave…"
 *   5. Returning visitor (>=2 visits) — headline: "Welcome back!"
 *
 * At most ONE card per session. Respects the shared popup gate:
 *   `canShowPopup` / `markPopupShown` / `markPopupDismissed`.
 * Clicking the CTA opens the shared <LeadFormDialog />.
 */
import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  canShowPopup,
  loadPopupConfig,
  markPopupDismissed,
  markPopupShown,
} from "@/lib/smart-popup";
import { logLeadEvent, type LeadSource } from "@/lib/leads/client";
import { openLeadForm } from "@/lib/leads/open-lead-form";

type Trigger = "time" | "scroll" | "exit" | "returning";

interface CardCopy {
  eyebrow: string;
  title: string;
  body: string;
  primary: string;
  source: LeadSource;
}

const COPY: Record<Trigger, CardCopy> = {
  time: {
    eyebrow: "Free · 15 min",
    title: "Need help choosing the right program?",
    body: "Book a FREE career consultation with a Glintr counsellor.",
    primary: "Book Now",
    source: "consultation",
  },
  scroll: {
    eyebrow: "FREE Career Roadmap",
    title: "Download your personalised roadmap",
    body: "Curriculum · Salary Guide · Learning Path · Career Opportunities — instantly.",
    primary: "Get it free",
    source: "roadmap",
  },
  exit: {
    eyebrow: "Wait! Before you leave…",
    title: "Free AI Career Roadmap — worth ₹999",
    body: "Delivered to your inbox instantly. No spam, unsubscribe anytime.",
    primary: "Send my free roadmap",
    source: "exit_intent",
  },
  returning: {
    eyebrow: "Welcome back",
    title: "Still deciding? Talk to a Glintr counsellor",
    body: "Book a FREE 15-minute career consultation and we'll help you pick.",
    primary: "Book my slot",
    source: "returning_visitor",
  },
};

const VISIT_KEY = "glintr_visits_v1";

function bumpVisitCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const key = "glintr_visits_bumped_v1";
    const bumped = sessionStorage.getItem(key);
    let n = Number(localStorage.getItem(VISIT_KEY) || 0);
    if (!bumped) {
      n = n + 1;
      localStorage.setItem(VISIT_KEY, String(n));
      sessionStorage.setItem(key, "1");
    }
    return n;
  } catch {
    return 0;
  }
}

export function SmartLeadCard() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = React.useState(false);
  const [trigger, setTrigger] = React.useState<Trigger | null>(null);
  const shownRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip on admin, auth, dashboards (owner surfaces).
    const suppress =
      pathname === "/find-your-program" ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/partner") ||
      pathname.startsWith("/student") ||
      pathname.startsWith("/hq") ||
      pathname.startsWith("/dashboard");
    if (suppress) return;

    const cfg = loadPopupConfig();
    if (!canShowPopup(cfg)) return;
    const visits = bumpVisitCount();
    const isMobile = window.innerWidth < 768;

    const fire = (t: Trigger) => {
      if (shownRef.current) return;
      shownRef.current = true;
      setTrigger(t);
      setOpen(true);
      markPopupShown();
      void logLeadEvent({
        event_type: "popup_view",
        source: COPY[t].source,
        metadata: { trigger: t, path: pathname },
      });
    };

    // Returning visitor takes priority — fire quickly, after 6s.
    let returningId = 0;
    if (visits >= 2) {
      returningId = window.setTimeout(() => fire("returning"), 6_000);
    }

    // 1. Time trigger (40s)
    const timeId = window.setTimeout(() => fire("time"), 40_000);

    // 2. Scroll 70%
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop + window.innerHeight;
      const pct = doc.scrollHeight > 0 ? (scrolled / doc.scrollHeight) * 100 : 0;
      if (pct >= 70) fire("scroll");
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // 3. Exit intent (desktop only)
    let armId = 0;
    let armed = false;
    const onLeave = (e: MouseEvent) => {
      if (!armed) return;
      if (e.clientY <= 4 && !e.relatedTarget) fire("exit");
    };
    if (!isMobile) {
      armId = window.setTimeout(() => {
        armed = true;
      }, 15_000);
      document.addEventListener("mouseout", onLeave);
    }

    return () => {
      window.clearTimeout(timeId);
      window.clearTimeout(armId);
      window.clearTimeout(returningId);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [pathname]);

  function dismiss() {
    setOpen(false);
    markPopupDismissed();
    if (trigger) {
      void logLeadEvent({
        event_type: "popup_close",
        source: COPY[trigger].source,
        metadata: { trigger },
      });
    }
  }

  function accept() {
    if (!trigger) return;
    const c = COPY[trigger];
    setOpen(false);
    openLeadForm({
      source: c.source,
      headline: c.title,
      subheadline: c.body,
      cta: c.primary,
      source_detail: trigger,
      metadata: { trigger, path: pathname },
    });
  }

  if (!open || !trigger) return null;
  const c = COPY[trigger];

  return (
    <div
      role="dialog"
      aria-labelledby="lead-card-title"
      className={cn(
        "fixed z-40 animate-in fade-in duration-300",
        // Desktop: bottom-right slide-in card.
        "hidden md:flex md:right-6 md:bottom-6 md:w-[380px] slide-in-from-right-4",
        // Mobile: bottom sheet-lite.
        "flex md:!hidden left-3 right-3 bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] slide-in-from-bottom-4",
      )}
    >
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-5 text-white shadow-2xl backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(163,230,53,0.14),transparent_55%)]" />
        <button
          aria-label="Dismiss"
          onClick={dismiss}
          className="absolute right-2 top-2 rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
            <Sparkles className="size-3" /> {c.eyebrow}
          </div>
          <h3 id="lead-card-title" className="mt-2 text-base font-black leading-snug">
            {c.title}
          </h3>
          <p className="mt-1.5 text-xs text-white/70">{c.body}</p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={accept}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 via-sky-400 to-lime-300 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:opacity-95"
            >
              {c.primary}
            </button>
            <button
              onClick={dismiss}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
