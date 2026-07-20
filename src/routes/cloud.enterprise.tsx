import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/marketing-cloud/stub-page";

export const Route = createFileRoute("/cloud/enterprise")({
  head: () => ({
    meta: [
      { title: "Enterprise — AI Marketing Cloud" },
      { name: "description", content: "SSO, audit logs, private models, dedicated success — AI Marketing Cloud for enterprise." },
    ],
  }),
  component: () => (
    <StubPage
      eyebrow="Enterprise"
      title="AI marketing at enterprise scale"
      description="SAML SSO, audit logs, private model routing, dedicated success — built for the biggest teams."
    />
  ),
});
