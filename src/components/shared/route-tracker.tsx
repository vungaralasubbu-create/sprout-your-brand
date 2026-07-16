import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { recordVisit, track } from "@/lib/intent";
import { inferKindFromPath, trackVisit } from "@/lib/mentor/storage";

/**
 * Records every route visit into the intent store and emits anonymous
 * page-view telemetry (session-scoped, no PII).
 */
export function RouteTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    recordVisit(pathname);
    if (/^\/programs\/[^/]+\/[^/]+/.test(pathname)) track("program_viewed");
    if (/^\/blog\/.+/.test(pathname)) track("blog_read");
    if (/^\/compare\/.+/.test(pathname)) track("comparison_opened");
    if (/consultation|book-consultation/.test(pathname)) track("consultation_clicked");

    // Skip suppressed / infra routes from Recently Viewed
    const skip =
      pathname === "/" ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/partner-support") ||
      pathname.startsWith("/student-support") ||
      pathname.startsWith("/api/");
    if (skip) return;

    // Wait a tick for document.title to update after route change
    const t = setTimeout(() => {
      const label = (typeof document !== "undefined" && document.title
        ? document.title.replace(/\s*[|·—-]\s*Glintr.*$/i, "").trim()
        : pathname) || pathname;
      trackVisit({ href: pathname, label, kind: inferKindFromPath(pathname) });
    }, 400);
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
}

