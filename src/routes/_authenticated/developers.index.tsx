import { createFileRoute, Link } from "@tanstack/react-router";
import { DeveloperShell } from "@/components/developers/developer-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Key,
  BookOpen,
  TerminalSquare,
  Webhook,
  ShieldCheck,
  Package,
  Boxes,
  ScrollText,
  Zap,
  Code2,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/developers/")({
  component: DeveloperHome,
});

function DeveloperHome() {
  return (
    <DeveloperShell>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 sm:p-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur">
            <Zap className="h-3.5 w-3.5 text-primary" />
            REST · GraphQL · Webhooks · OAuth 2.0
          </div>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Build with AI Marketing Cloud
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Use APIs, SDKs, Webhooks and OAuth to integrate AI Marketing into your own
            applications. Everything in the dashboard is available via the API.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/developers/api">
                <Key className="mr-2 h-4 w-4" />
                Create API Key
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/developers/docs">
                <BookOpen className="mr-2 h-4 w-4" />
                Read Documentation
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/developers/playground">
                <TerminalSquare className="mr-2 h-4 w-4" />
                API Playground
              </Link>
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Quick example */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Quick start</div>
            <div className="text-xs text-muted-foreground">cURL</div>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100">
{`curl https://api.glintr.com/v1/projects \\
  -H "Authorization: Bearer gk_live_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Q4 Launch","goal":"Generate 50 posts"}'`}
          </pre>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold">Rate limits</div>
          <div className="mt-3 space-y-2 text-sm">
            {[
              ["Free", "60 / min"],
              ["Starter", "600 / min"],
              ["Professional", "3,000 / min"],
              ["Agency", "10,000 / min"],
              ["Enterprise", "Custom"],
            ].map(([plan, limit]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-muted-foreground">{plan}</span>
                <span className="font-mono">{limit}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Feature cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: "/developers/api", icon: Key, title: "API Keys", desc: "Create, rotate, and scope keys per environment." },
          { to: "/developers/sdk", icon: Package, title: "Official SDKs", desc: "JS, Python, Go, PHP, Java, Ruby, Rust." },
          { to: "/developers/webhooks", icon: Webhook, title: "Webhooks", desc: "Real-time events with retries and replay." },
          { to: "/developers/oauth", icon: ShieldCheck, title: "OAuth Apps", desc: "Build integrations for other users." },
          { to: "/developers/apps", icon: Boxes, title: "Marketplace", desc: "Publish and install verified apps." },
          { to: "/developers/logs", icon: ScrollText, title: "Request Logs", desc: "Every request. Latency, cost, tokens." },
          { to: "/developers/playground", icon: TerminalSquare, title: "Playground", desc: "Test endpoints interactively." },
          { to: "/developers/docs", icon: BookOpen, title: "Docs", desc: "REST, GraphQL, examples in 10 languages." },
          { to: "/developers/api", icon: Code2, title: "CLI", desc: "Deploy, generate, and manage from terminal." },
        ].map((f) => (
          <Link key={f.to + f.title} to={f.to as any} className="group">
            <Card className="h-full p-5 transition hover:border-primary/50 hover:shadow-md">
              <f.icon className="h-6 w-6 text-primary" />
              <div className="mt-3 flex items-center justify-between">
                <div className="font-semibold">{f.title}</div>
                <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </DeveloperShell>
  );
}
