import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/authors")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/content/authors" });
  },
});
