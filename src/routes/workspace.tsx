import { createFileRoute, Outlet } from "@tanstack/react-router";
import { HubShell } from "@/components/workspace/hub-shell";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/workspace")({
  ssr: false,
  head: () =>
    buildPageHead({
      path: "/workspace",
      title: "Workspace — Your AI Learning Second Brain | Glintr",
      description:
        "Personal AI learning workspace: notebooks, smart notes, highlights, AI summaries, flashcards, revision, calendar and a context-aware mentor.",
      noindex: true,
    }),
  component: () => (
    <HubShell>
      <Outlet />
    </HubShell>
  ),
});
