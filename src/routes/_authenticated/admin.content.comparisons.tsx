import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/content/comparisons")({
  component: () => <Navigate to={"/admin/content/articles" as any} search={{ type: "comparison", status: "", q: "", category: "" } as any} />,
});
