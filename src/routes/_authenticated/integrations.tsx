import { createFileRoute, Outlet } from "@tanstack/react-router";
import { IntegrationsShell } from "@/components/integrations/integrations-shell";

export const Route = createFileRoute("/_authenticated/integrations")({
  component: () => <IntegrationsShell><Outlet /></IntegrationsShell>,
});
