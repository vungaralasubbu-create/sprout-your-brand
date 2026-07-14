import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";

export const Route = createFileRoute("/_authenticated/ambassador")({
  component: () => (
    <AmbassadorShell>
      <Outlet />
    </AmbassadorShell>
  ),
});
