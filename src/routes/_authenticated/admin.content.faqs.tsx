import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/content/faqs")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/content/articles", search: { type: "faq", status: "", q: "", category: "" } });
  },
});
