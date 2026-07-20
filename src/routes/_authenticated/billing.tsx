import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BillingShell } from "@/components/billing/billing-shell";

export const Route = createFileRoute("/_authenticated/billing")({
  component: () => (
    <BillingShell>
      <Outlet />
    </BillingShell>
  ),
});
