import { createFileRoute } from "@tanstack/react-router";
import { SalesAiHub } from "@/components/sales-ai/hub";

export const Route = createFileRoute("/_authenticated/partner/sales-ai")({
  head: () => ({
    meta: [
      { title: "Sales AI Center · Glintr Partner" },
      { name: "description", content: "15 specialised AI agents that help sales partners close more admissions — qualification, conversation, follow-up, call coach, proposals and forecast." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SalesAiHub,
});
