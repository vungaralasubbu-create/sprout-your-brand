import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "./cloud.login";

export const Route = createFileRoute("/cloud/signup")({
  head: () => ({
    meta: [
      { title: "Create your workspace — AI Marketing Cloud" },
      { name: "description", content: "Free forever plan. No credit card required." },
    ],
  }),
  component: () => <AuthCard mode="signup" />,
});
