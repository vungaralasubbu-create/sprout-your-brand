import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/marketing-cloud/stub-page";

export const Route = createFileRoute("/cloud/solutions")({
  head: () => ({
    meta: [
      { title: "Solutions — AI Marketing Cloud" },
      { name: "description", content: "AI marketing built for startups, agencies, creators, coaches, universities and enterprise teams." },
      { property: "og:title", content: "Solutions — AI Marketing Cloud" },
    ],
  }),
  component: () => (
    <StubPage
      eyebrow="Solutions"
      title="Built for every kind of team"
      description="From solo creators to enterprise marketing orgs — the AI Marketing Cloud adapts to your workflow."
    />
  ),
});
