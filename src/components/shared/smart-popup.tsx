import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { track } from "@/lib/intent";
import {
  canShowPopup,
  loadPopupConfig,
  markPopupDismissed,
  markPopupShown,
  type PopupConfig,
} from "@/lib/smart-popup";
import { cn } from "@/lib/utils";

type Trigger = "time" | "scroll" | "exit";

/**
 * Non-intrusive conversion popup. Fires ONCE per session via the first of:
 *   • time on site (default 45s)
 *   • scroll depth (default 50%)
 *   • desktop exit-intent (optional)
 *
 * Dismissed state persists in localStorage for `reshowDays` (default 7).
 * Form submission suppresses the popup permanently for that browser.
 */
export function SmartPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const shownRef = useRef(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const suppress =
      pathname === "/find-your-program" ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin");
    if (suppress) return;

    const cfg: PopupConfig = loadPopupConfig();
    if (!canShowPopup(cfg)) return;

    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);
    if (mobile && cfg.mobileBehavior === "disabled") return;

    const fire = (t: Trigger) => {
      if (shownRef.current) return;
      shownRef.current = true;
      setTrigger(t);
      setOpen(true);
      markPopupShown();
      track("exit_intent_shown", { path: pathname, trigger: t });
    };

    // Time trigger
    const timeId = window.setTimeout(() => fire("time"), cfg.delaySeconds * 1000);

    // Scroll trigger
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop + window.innerHeight;
      const pct = (scrolled / doc.scrollHeight) * 100;
      if (pct >= cfg.scrollPercent) fire("scroll");
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Exit intent (desktop only)
    let armId = 0;
    let armed = false;
    const onLeave = (e: MouseEvent) => {
      if (!armed) return;
      if (e.clientY <= 4 && !e.relatedTarget) fire("exit");
    };
    if (!mobile && cfg.exitIntent) {
      armId = window.setTimeout(() => {
        armed = true;
      }, 12_000);
      document.addEventListener("mouseout", onLeave);
    }

    return () => {
      window.clearTimeout(timeId);
      window.clearTimeout(armId);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [pathname]);

  // Focus management + ESC
  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close("esc");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close(reason: string) {
    if (!open) return;
    setOpen(false);
    markPopupDismissed();
    track("exit_intent_action", { reason, trigger: trigger ?? "unknown" });
  }

  if (!open) return null;

  const Card = (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "relative border border-border bg-card shadow-2xl",
        isMobile
          ? "w-full rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom-4 fade-in duration-300"
          : "w-[min(520px,92vw)] rounded-3xl p-8 animate-in fade-in zoom-in-95 duration-300",
      )}
    >
      <button
        ref={closeBtnRef}
        type="button"
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => close("close")}
      >
        <X className="size-4" />
      </button>
      <p className="text-label">Before you go</p>
      <h2 id="smart-popup-title" className="mt-2 text-2xl font-black text-foreground">
        Not sure where to start?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Take a short 60-second guide and we'll point you to the right program, revenue model,
        or brand path — no signup needed.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <Link
          to="/find-your-program"
          onClick={() => {
            track("exit_intent_action", { to: "/find-your-program", trigger: trigger ?? "unknown" });
            setOpen(false);
          }}
          className="rounded-xl bg-gradient-brand px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
        >
          Find your path
        </Link>
        <Link
          to="/programs"
          onClick={() => {
            track("exit_intent_action", { to: "/programs", trigger: trigger ?? "unknown" });
            setOpen(false);
          }}
          className="rounded-xl border border-border bg-background px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-accent"
        >
          Browse programs
        </Link>
        <Link
          to="/book-consultation"
          onClick={() => {
            track("exit_intent_action", { to: "/book-consultation", trigger: trigger ?? "unknown" });
            setOpen(false);
          }}
          className="rounded-xl border border-border bg-background px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-accent"
        >
          Talk to advisor
        </Link>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => close("maybe_later")}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          Maybe later
        </button>
        <button
          type="button"
          onClick={() => close("continue_browsing")}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          Continue browsing
        </button>
      </div>
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-popup-title"
      className={cn(
        "fixed inset-0 z-50 flex bg-background/60 backdrop-blur-sm animate-in fade-in duration-300",
        isMobile ? "items-end justify-center" : "items-center justify-center",
      )}
      onClick={() => close("backdrop")}
    >
      {Card}
    </div>
  );
}
