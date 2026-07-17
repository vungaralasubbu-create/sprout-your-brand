import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { RouteTracker } from "@/components/shared/route-tracker";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";

import { SmartLeadCard } from "@/components/leads/smart-lead-card";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { GlobalPalette } from "@/components/command-center/global-palette";
import { SalesAgentWidget } from "@/components/sales-agent/sales-agent-widget";

import { PreviewProvider } from "@/lib/preview/preview-context";
import { PreviewBanner } from "@/components/admin/preview-banner";
import { PartnerEarningsCopyProvider } from "@/data/partner-earnings-copy";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg text-center">
        <p className="text-label mb-3">Error 404</p>
        <h1 className="text-display text-gradient-brand">Page not found</h1>
        <p className="text-subheading mt-4">
          The page you're looking for doesn't exist or has been moved. Try one of these instead:
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Return home
          </Link>
          <Link
            to="/programs"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Explore programs
          </Link>
          <Link
            to="/blog"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Read the blog
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Still can't find it?{" "}
          <Link to="/contact" className="underline underline-offset-4 hover:text-foreground">
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-label mb-3 text-danger">Something broke</p>
        <h1 className="text-page-title">This page didn't load</h1>
        <p className="text-subheading mt-3">
          Something went wrong on our end. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Glintr — Launch. Sell. Grow. | EdTech Partner & White-Label Platform" },
      {
        name: "description",
        content:
          "Glintr helps sales professionals become entrepreneurs. Earn 70% revenue share as a partner, or launch your own EdTech brand in 24 hours — LMS, payments, CRM, and full backend included.",
      },
      { name: "author", content: "Glintr" },
      { name: "theme-color", content: "#05070E" },
      { property: "og:title", content: "Glintr — Launch. Sell. Grow." },
      {
        property: "og:description",
        content:
          "Earn 70% revenue share as a sales partner, or launch your own EdTech brand in 24 hours with Glintr's white-label platform.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Glintr" },
      { property: "og:url", content: "https://glintr.com" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Glintr — Launch. Sell. Grow." },
      {
        name: "twitter:description",
        content: "Premium EdTech partner and white-label platform. Payouts in 48h.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/__l5e/assets-v1/d12f985f-d4a9-44a8-ae66-6ea6d0a3b725/glintr-mark.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Glintr",
          url: "https://glintr.com",
          logo: "https://glintr.com/__l5e/assets-v1/d12f985f-d4a9-44a8-ae66-6ea6d0a3b725/glintr-mark.png",
          slogan: "Launch. Sell. Grow.",
          description:
            "Premium EdTech platform for sales professionals — become a revenue partner or launch your own white-label EdTech brand.",
          sameAs: [
            "https://www.linkedin.com/company/glintr",
            "https://www.instagram.com/glintr",
            "https://x.com/glintr",
            "https://www.youtube.com/@glintr",
            "https://www.facebook.com/glintr",
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Glintr",
          url: "https://glintr.com",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://glintr.com/search?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <PartnerEarningsCopyProvider>
        <PreviewProvider>
          <PreviewBanner />
          <AnalyticsProvider />
          <RouteTracker />
          <Outlet />
          <StickyActionBar />
          <SmartLeadCard />
          <LeadFormDialog />

          <GlobalPalette />
          <SalesAgentWidget />
          <Toaster richColors position="top-right" />
        </PreviewProvider>
      </PartnerEarningsCopyProvider>
    </QueryClientProvider>
  );
}
