import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PremiumHomepage } from "@/components/home/premium-homepage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glintr | Learn Skills, Explore Programs & Start Earning" },
      {
        name: "description",
        content:
          "Explore practical programs in AI, technology, engineering and management with Glintr. Build skills, discover learning paths, explore partner earning models and launch your own EdTech brand.",
      },
      { property: "og:title", content: "Glintr | Learn Skills, Explore Programs & Start Earning" },
      {
        property: "og:description",
        content:
          "Practical programs in AI, technology, engineering and management. Learn, earn as a sales partner, or launch your own EdTech brand.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Glintr | Learn Skills, Explore Programs & Start Earning" },
      {
        name: "twitter:description",
        content: "Practical programs in AI, technology, engineering and management — plus partner earnings and white-label EdTech.",
      },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com" }],
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
