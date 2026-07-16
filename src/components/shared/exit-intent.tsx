import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { markExitShown, track, wasExitShown } from "@/lib/intent";
import { cn } from "@/lib/utils";

/**
 * Desktop-only, subtle exit-intent card. Fires once per session when the
 * cursor leaves the top of the viewport. No countdowns, no fake urgency.
 */
export function ExitIntent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024) return;
    if (wasExitShown()) return;
    const suppress =
      pathname === "/find-your-program" ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin");
    if (suppress) return;

    let armed = false;
    const arm = window.setTimeout(() => {
      armed = true;
    }, 12_000);

    const onLeave = (e: MouseEvent) => {
      if (!armed) return;
      if (e.clientY <= 4 && !e.relatedTarget) {
        markExitShown();
        setOpen(true);
        track("exit_intent_shown", { path: pathname });
        document.removeEventListener("mouseout", onLeave);
      }
    };
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.clearTimeout(arm);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [pathname]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Before you leave"
      className={cn(
        "fixed inset-0 z-50 hidden items-center justify-center bg-background/60 backdrop-blur-sm lg:flex",
      )}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[min(520px,92vw)] rounded-3xl border border-border bg-card p-8 shadow-2xl"
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-accent"
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </button>
        <p className="text-label">Before you go</p>
        <h2 className="mt-2 text-2xl font-black text-foreground">
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
              track("exit_intent_action", { to: "/find-your-program" });
              setOpen(false);
            }}
            className="rounded-xl bg-gradient-brand px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
          >
            Find your path
          </Link>
          <Link
            to="/programs"
            onClick={() => {
              track("exit_intent_action", { to: "/programs" });
              setOpen(false);
            }}
            className="rounded-xl border border-border bg-background px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-accent"
          >
            Browse programs
          </Link>
          <Link
            to="/book-consultation"
            onClick={() => {
              track("exit_intent_action", { to: "/book-consultation" });
              setOpen(false);
            }}
            className="rounded-xl border border-border bg-background px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-accent"
          >
            Talk to advisor
          </Link>
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">
          You won't see this again in this session.
        </p>
      </div>
    </div>
  );
}
