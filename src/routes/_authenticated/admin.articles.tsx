import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/articles")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/content/articles", search: { type: "", status: "", q: "", category: "" } });
  },
});
