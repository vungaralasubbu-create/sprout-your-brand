import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, Phone } from "lucide-react";

import { ctaForPath, useIntent, track } from "@/lib/intent";
import { CounsellorForm } from "@/components/shared/counsellor-form";
import { GLINTR_AI_OPEN_EVENT } from "@/lib/glintr-ai";
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

  const suppressDesktop =
    pathname === "/find-your-program" ||
    pathname === "/auth" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/partner-support") ||
    pathname.startsWith("/student-support") ||
    pathname === "/book-consultation" ||
    pathname.startsWith("/partner.apply") ||
    pathname.startsWith("/partner.signup");

  // Mobile bar shows globally except on auth screens.
  const suppressMobile = pathname === "/auth";

  if (suppressDesktop && suppressMobile) return null;

  const cta = ctaForPath(pathname, intent);
  const desktopCtaValid = !cta.to.startsWith("#");


  return (
    <>
      {/* Desktop compact rail */}
      {!suppressDesktop && desktopCtaValid && (
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
      )}

      {/* Mobile bottom action bar — always visible on mobile with 2 equal buttons */}
      {!suppressMobile && (
      <div
        aria-hidden={hidden}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 lg:hidden",
          "transition-transform duration-300",
          hidden ? "translate-y-[calc(100%-8px)]" : "translate-y-0",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <div className="mx-3 mb-3 flex items-stretch gap-2 rounded-2xl border border-border/70 bg-card/95 p-2 shadow-lg backdrop-blur">
          <CounsellorForm
            label="Talk To Counsellor"
            trigger={
              <button
                type="button"
                onClick={() => track("sticky_cta_clicked", { where: "mobile", to: "counsellor" })}
                className="flex-1 basis-0 min-w-0 inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-3 text-sm font-semibold text-foreground"
              >
                <Phone className="size-4 shrink-0 text-primary" />
                <span className="truncate">Talk To Counsellor</span>
              </button>
            }
          />
          <button
            type="button"
            onClick={() => {
              track("sticky_cta_clicked", { where: "mobile", to: "glintr-ai" });
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent(GLINTR_AI_OPEN_EVENT));
              }
            }}
            className="flex-1 basis-0 min-w-0 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-3 py-3 text-sm font-semibold text-primary-foreground shadow-md"
          >
            <Bot className="size-4 shrink-0" />
            <span className="truncate">Ask GlintrAI</span>
          </button>
        </div>
      </div>
      )}
    </>

  );
}

