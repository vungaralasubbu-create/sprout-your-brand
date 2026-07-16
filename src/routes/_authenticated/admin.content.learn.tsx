import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/content/learn")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/content/articles", search: { type: "learn_guide", status: "", q: "", category: "" } });
  },
});
