import { createFileRoute } from "@tanstack/react-router";
import { DigitalEmployeesHub } from "@/components/partner/digital-employees/hub";

export const Route = createFileRoute("/_authenticated/partner/digital-employees")({
  head: () => ({
    meta: [
      { title: "Digital Employees — Glintr Academy OS" },
      { name: "description", content: "Manage your AI-first executive team: 13 specialists under an AI COO, task delegation, workflows, automations, and productivity dashboards." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DigitalEmployeesHub,
});
