import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AgencyShell } from "@/components/agency/agency-shell";

export const Route = createFileRoute("/_authenticated/agency")({
  component: () => (
    <AgencyShell>
      <Outlet />
    </AgencyShell>
  ),
});
