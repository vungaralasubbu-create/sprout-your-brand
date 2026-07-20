import { createFileRoute, Outlet } from "@tanstack/react-router";
import { KnowledgeShell } from "@/components/knowledge/knowledge-shell";

export const Route = createFileRoute("/_authenticated/knowledge")({
  component: () => <KnowledgeShell><Outlet /></KnowledgeShell>,
});
