import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/content/interviews")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/content/articles", search: { type: "interview_guide", status: "", q: "", category: "" } });
  },
});
