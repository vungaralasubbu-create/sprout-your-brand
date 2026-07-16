import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/content/paths")({
  component: () => <Navigate to={"/admin/content/articles" as any} search={{ type: "learning_path", status: "", q: "", category: "" } as any} />,
});
