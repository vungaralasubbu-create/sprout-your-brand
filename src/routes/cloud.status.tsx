import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/marketing-cloud/stub-page";

export const Route = createFileRoute("/cloud/status")({
  component: () => (
    <StubPage eyebrow="Status" title="All systems operational" description="Realtime uptime and incident reports." />
  ),
});
