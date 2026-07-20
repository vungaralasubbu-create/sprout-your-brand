import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cloud/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — AI Marketing Cloud" },
      { name: "description", content: "Simple pricing that scales with your team." },
    ],
  }),
  component: Pricing,
});

const PLANS = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    body: "Explore the platform.",
    features: ["1 workspace", "3 AI projects / month", "Basic templates", "Community support"],
    cta: "Start free",
  },
  {
    name: "Starter",
    monthly: 19,
    yearly: 190,
    body: "For solo marketers.",
    features: ["1 workspace", "25 AI projects / month", "All templates", "Email support"],
    cta: "Start Starter",
  },
  {
    name: "Professional",
    monthly: 49,
    yearly: 490,
    body: "For growing teams.",
    features: [
      "3 workspaces",
      "Unlimited AI projects",
      "Team roles (up to 5)",
      "Publish to all channels",
      "Priority support",
    ],
    cta: "Start Pro trial",
    featured: true,
  },
  {
    name: "Agency",
    monthly: 149,
    yearly: 1490,
    body: "For marketing agencies.",
    features: [
      "10 workspaces",
      "Client dashboards",
      "White-label review center",
      "SLA support",
    ],
    cta: "Start Agency",
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    body: "For larger orgs.",
    features: ["Unlimited workspaces", "SSO / SAML", "Dedicated CSM", "Custom contracts"],
    cta: "Contact sales",
  },
];

function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Simple pricing. Cancel anytime.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Start free. Upgrade when you're shipping campaigns weekly.
        </p>
        <div className="mt-8 inline-flex rounded-full border bg-card p-1">
          <button
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
            onClick={() => setYearly(false)}
          >
            Monthly
          </button>
          <button
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
            onClick={() => setYearly(true)}
          >
            Yearly · save 20%
          </button>
        </div>
      </div>
      <div className="mt-14 grid gap-4 lg:grid-cols-5">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-6",
              p.featured && "border-primary shadow-xl shadow-primary/10",
            )}
          >
            {p.featured && (
              <div className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" /> Most popular
              </div>
            )}
            <div className="text-sm font-semibold">{p.name}</div>
            <p className="mt-1 text-xs text-muted-foreground">{p.body}</p>
            <div className="mt-4 flex items-baseline gap-1">
              {p.monthly === null ? (
                <span className="text-3xl font-semibold">Custom</span>
              ) : (
                <>
                  <span className="text-3xl font-semibold">
                    ${yearly ? p.yearly : p.monthly}
                  </span>
                  <span className="text-xs text-muted-foreground">/{yearly ? "yr" : "mo"}</span>
                </>
              )}
            </div>
            <ul className="mt-5 flex-1 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/cloud/signup" className="mt-6">
              <Button className="w-full" variant={p.featured ? "primary" : "outline"}>
                {p.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
