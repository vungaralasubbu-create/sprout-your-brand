import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/content/glossary")({
  component: () => <Navigate to={"/admin/content/articles" as any} search={{ type: "glossary", status: "", q: "", category: "" } as any} />,
});
