import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/marketing-cloud/stub-page";

export const Route = createFileRoute("/cloud/resources")({
  head: () => ({
    meta: [
      { title: "Resources — AI Marketing Cloud" },
      { name: "description", content: "Guides, docs, API reference, and changelog for AI Marketing Cloud." },
    ],
  }),
  component: () => (
    <StubPage
      eyebrow="Resources"
      title="Everything you need to go live"
      description="Guides, API reference, developer docs, and product changelog."
    />
  ),
});
