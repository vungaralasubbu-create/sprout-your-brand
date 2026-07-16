import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

import { ctaForPath, useIntent, track } from "@/lib/intent";
import { cn } from "@/lib/utils";

/**
 * Smart sticky action bar.
 *  - Desktop: compact rail top-right, visible after 480px scroll.
 *  - Mobile: bottom bar with safe-area padding. Hides on scroll down, shows on scroll up.
 *  - Never on auth, dashboards, or /find-your-program itself.
 */
export function StickyActionBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const intent = useIntent();
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y > 480);
      const dy = y - lastY.current;
      if (Math.abs(dy) > 12) {
        // hide on scroll-down, show on scroll-up (mobile behaviour)
        setHidden(dy > 0 && y > 240);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const suppress =
    pathname === "/find-your-program" ||
    pathname === "/auth" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/partner-support") ||
    pathname.startsWith("/student-support") ||
    pathname === "/book-consultation" ||
    pathname.startsWith("/partner.apply") ||
    pathname.startsWith("/partner.signup");

  if (suppress) return null;

  const cta = ctaForPath(pathname, intent);
  if (cta.to.startsWith("#")) return null; // anchor CTAs handled in-page

  return (
    <>
      {/* Desktop compact rail */}
      <div
        aria-hidden={!visible || hidden}
        className={cn(
          "pointer-events-none fixed right-6 top-24 z-40 hidden lg:block",
          "transition-all duration-300",
          visible && !hidden ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
        )}
      >
        <Link
          to={cta.to}
          onClick={() => track("sticky_cta_clicked", { where: "desktop", to: cta.to })}
          className={cn(
            "pointer-events-auto inline-flex items-center gap-2 rounded-full",
            "border border-border/70 bg-card/95 px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur",
            "hover:-translate-y-0.5 transition-transform",
          )}
        >
          <span className="text-foreground">{cta.label}</span>
          <ArrowRight className="size-3.5 text-primary" />
        </Link>
      </div>

      {/* Mobile bottom bar */}
      <div
        aria-hidden={hidden}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 lg:hidden",
          "transition-transform duration-300",
          hidden ? "translate-y-full" : "translate-y-0",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <div className="mx-3 mb-3 rounded-2xl border border-border/70 bg-card/95 p-2 shadow-lg backdrop-blur">
          <Link
            to={cta.to}
            onClick={() => track("sticky_cta_clicked", { where: "mobile", to: cta.to })}
            className="flex items-center justify-between gap-3 rounded-xl bg-gradient-brand px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            <span className="truncate">{cta.label}</span>
            <ArrowRight className="size-4 shrink-0" />
          </Link>
        </div>
      </div>
    </>
  );
}
