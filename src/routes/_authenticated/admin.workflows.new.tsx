import { createFileRoute, redirect } from "@tanstack/react-router";
import { createWorkflowFromTemplate } from "@/lib/automation/store";

export const Route = createFileRoute("/_authenticated/admin/workflows/new")({
  beforeLoad: () => {
    if (typeof window === "undefined") throw redirect({ to: "/admin/workflows" });
    const wf = createWorkflowFromTemplate("__blank__");
    throw redirect({ to: "/admin/workflows/$id", params: { id: wf.id } });
  },
});
