import { lazy, Suspense, useEffect, useState } from "react";

// Client-only lazy overlays. These render below-the-fold or after user
// interaction on every page, so keeping them out of the initial bundle
// (and out of SSR) is a big win for every route's TTI.
const SalesAgentWidget = lazy(() =>
  import("@/components/sales-agent/sales-agent-widget").then((m) => ({
    default: m.SalesAgentWidget,
  })),
);
const GlobalPalette = lazy(() =>
  import("@/components/command-center/global-palette").then((m) => ({
    default: m.GlobalPalette,
  })),
);
const SmartLeadCard = lazy(() =>
  import("@/components/leads/smart-lead-card").then((m) => ({
    default: m.SmartLeadCard,
  })),
);
const LeadFormDialog = lazy(() =>
  import("@/components/leads/lead-form-dialog").then((m) => ({
    default: m.LeadFormDialog,
  })),
);
const StickyActionBar = lazy(() =>
  import("@/components/shared/sticky-action-bar").then((m) => ({
    default: m.StickyActionBar,
  })),
);

export function RootOverlays() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // Defer overlays until after first paint so they never delay LCP.
    const idle = (cb: () => void) => {
      const w = window as unknown as {
        requestIdleCallback?: (cb: () => void) => number;
      };
      if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(cb);
      else setTimeout(cb, 200);
    };
    idle(() => setHydrated(true));
  }, []);

  if (!hydrated) return null;
  return (
    <Suspense fallback={null}>
      <StickyActionBar />
      <SmartLeadCard />
      <LeadFormDialog />
      <GlobalPalette />
      <SalesAgentWidget />
    </Suspense>
  );
}
