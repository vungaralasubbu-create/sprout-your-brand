import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/media")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/content/media" });
  },
});
