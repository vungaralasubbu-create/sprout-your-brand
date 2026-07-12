import { createFileRoute } from "@tanstack/react-router";
import { PartnerShell } from "@/components/partner/partner-shell";

export const Route = createFileRoute("/_authenticated/partner")({
  component: PartnerShell,
});
