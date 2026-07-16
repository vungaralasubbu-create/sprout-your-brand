import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/content/career")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/content/articles", search: { type: "career_guide", status: "", q: "", category: "" } });
  },
});
