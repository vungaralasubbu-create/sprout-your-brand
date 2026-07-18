import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/instructor/")({
  beforeLoad: () => {
    throw redirect({ to: "/instructor/dashboard" });
  },
});
