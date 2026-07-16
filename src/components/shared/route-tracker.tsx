import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { recordVisit, track } from "@/lib/intent";

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
  }, [pathname]);
  return null;
}
