import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/partner/signup")({
  beforeLoad: ({ search }) => {
    const ref = (search as any)?.ref;
    throw redirect({
      to: "/partner/apply",
      search: ref ? { ref } : undefined,
    } as any);
  },
});
