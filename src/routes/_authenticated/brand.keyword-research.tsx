import { createFileRoute } from "@tanstack/react-router";
import { Route as AdminRoute } from "./admin.keyword-research";

// Brand partners get the same Keyword Research workspace as admins.
// RLS scopes projects to their owner (partner) automatically.
export const Route = createFileRoute("/_authenticated/brand/keyword-research")({
  component: (AdminRoute.options as any).component,
});
