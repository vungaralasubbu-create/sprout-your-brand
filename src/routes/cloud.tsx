import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicHeader, PublicFooter } from "@/components/marketing-cloud/public-shell";

export const Route = createFileRoute("/cloud")({
  head: () => ({
    meta: [
      { title: "AI Marketing Cloud — Generate Complete Campaigns with AI" },
      {
        name: "description",
        content:
          "Describe your business. AI creates your marketing strategy, content, images, emails, landing pages and publishing calendar automatically.",
      },
      { property: "og:title", content: "AI Marketing Cloud" },
      {
        property: "og:description",
        content: "Generate complete marketing campaigns with AI.",
      },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <Outlet />
      <PublicFooter />
    </div>
  ),
});
