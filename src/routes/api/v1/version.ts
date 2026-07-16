import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/version")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          apiVersion: "v1",
          release: process.env.LOVABLE_RELEASE ?? "dev",
          commit: process.env.LOVABLE_COMMIT ?? null,
          buildAt: process.env.LOVABLE_BUILD_AT ?? null,
        }),
    },
  },
});
