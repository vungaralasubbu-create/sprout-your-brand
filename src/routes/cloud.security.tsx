import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/marketing-cloud/stub-page";

export const Route = createFileRoute("/cloud/security")({
  component: () => (
    <StubPage
      eyebrow="Security"
      title="Enterprise-grade security"
      description="SOC 2 Type II, GDPR, region-scoped data, and encrypted secrets by default."
    />
  ),
});
