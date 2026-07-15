import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PremiumHomepage } from "@/components/home/premium-homepage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Glintr — Learn. Build. Grow. A Premium Learning Ecosystem.",
      },
      {
        name: "description",
        content:
          "Explore practical programs across AI, engineering, electronics and management. Discover the Glintr learning ecosystem — learn, earn as a partner, or launch your own EdTech brand.",
      },
      { property: "og:title", content: "Glintr — Learn. Build. Grow." },
      {
        property: "og:description",
        content:
          "A premium learning ecosystem for modern skills. Programs, partner earnings and white-label EdTech — one platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <PremiumHomepage />
      </main>
      <SiteFooter />
    </div>
  );
}
