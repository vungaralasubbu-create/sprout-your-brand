import { createFileRoute, redirect } from "@tanstack/react-router";
import { createWorkflowFromTemplate } from "@/lib/automation/store";

export const Route = createFileRoute("/_authenticated/workflows/new")({
  beforeLoad: () => {
    if (typeof window === "undefined") throw redirect({ to: "/workflows" });
    const wf = createWorkflowFromTemplate("__blank__");
    throw redirect({ to: "/workflows/$id", params: { id: wf.id } });
  },
});
