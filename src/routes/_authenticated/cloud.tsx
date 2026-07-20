import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/marketing-cloud/app-shell";

export const Route = createFileRoute("/_authenticated/cloud")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
