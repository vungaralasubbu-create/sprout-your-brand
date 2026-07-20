import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/marketing-cloud/stub-page";

export const Route = createFileRoute("/cloud/customers")({
  head: () => ({
    meta: [
      { title: "Customers — AI Marketing Cloud" },
      { name: "description", content: "See how teams use AI Marketing Cloud to replace their entire marketing stack." },
    ],
  }),
  component: () => (
    <StubPage
      eyebrow="Customers"
      title="Loved by modern marketing teams"
      description="Case studies and stories from the teams shipping campaigns 10× faster with AI Marketing Cloud."
    />
  ),
});
