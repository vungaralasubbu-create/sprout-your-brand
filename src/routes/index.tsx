import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PremiumHomepage } from "@/components/home/premium-homepage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glintr | Learn. Earn. Build. AI, Technology & Career Platform" },
      {
        name: "description",
        content:
          "Glintr is the AI, technology and career platform to learn in-demand skills, earn as a sales partner with 70% revenue share, and launch your own EdTech brand.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Glintr | Learn. Earn. Build. AI, Technology & Career Platform" },
      {
        property: "og:description",
        content:
          "Learn AI and technology, earn as a sales partner with 70% revenue share, or launch your own white-label EdTech brand with Glintr.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://glintr.com" },
      { property: "og:site_name", content: "Glintr" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Glintr | Learn. Earn. Build." },
      {
        name: "twitter:description",
        content:
          "AI, technology & career platform. Learn skills, earn as a partner, or launch your EdTech brand.",
      },
    ],
    links: [{ rel: "canonical", href: "https://glintr.com" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Glintr",
          url: "https://glintr.com",
          logo: "https://glintr.com/__l5e/assets-v1/d12f985f-d4a9-44a8-ae66-6ea6d0a3b725/glintr-mark.png",
          description:
            "AI, technology and career platform. Learn skills, earn as a partner, launch your EdTech brand.",
          sameAs: [
            "https://www.linkedin.com/company/glintr",
            "https://www.instagram.com/glintr",
            "https://x.com/glintr",
            "https://www.youtube.com/@glintr",
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://glintr.com/" },
          ],
        }),
      },
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
