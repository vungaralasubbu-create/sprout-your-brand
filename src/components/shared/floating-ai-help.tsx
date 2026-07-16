import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { track } from "@/lib/intent";
import { cn } from "@/lib/utils";

/**
 * Subtle floating AI assistant entry-point. Never intrusive: appears after
 * 800px of scroll and can be dismissed for the session.
 */
export function FloatingAiHelp() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem("glintr_ai_help_dismissed") === "1");
    const onScroll = () => setShow(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const suppress =
    pathname === "/find-your-program" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/partner-support") ||
    pathname.startsWith("/student-support");

  if (suppress || dismissed) return null;

  return (
    <div
      aria-hidden={!show}
      className={cn(
        "fixed left-4 z-30 hidden md:block",
        "bottom-6 transition-all duration-300",
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none",
      )}
    >
      <div className="group relative flex items-center gap-2 rounded-full border border-border/70 bg-card/95 py-2 pl-3 pr-2 shadow-lg backdrop-blur">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <span className="text-xs font-medium text-foreground">Need help choosing?</span>
        <Link
          to="/find-your-program"
          onClick={() => track("ai_help_opened", { path: pathname })}
          className="ml-1 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground"
        >
          Ask Glintr AI →
        </Link>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            try {
              sessionStorage.setItem("glintr_ai_help_dismissed", "1");
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
          className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-accent"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
