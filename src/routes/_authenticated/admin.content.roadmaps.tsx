import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/content/roadmaps")({
  component: () => <Navigate to={"/admin/content/articles" as any} search={{ type: "roadmap", status: "", q: "", category: "" } as any} />,
});
