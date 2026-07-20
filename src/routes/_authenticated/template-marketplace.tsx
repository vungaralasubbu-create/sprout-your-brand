import { createFileRoute, Navigate } from "@tanstack/react-router";
// Alias route: /template-marketplace → /templates
export const Route = createFileRoute("/_authenticated/template-marketplace")({
  component: () => <Navigate to="/templates" replace />,
});
