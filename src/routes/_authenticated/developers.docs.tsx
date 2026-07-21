import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DeveloperShell } from "@/components/developers/developer-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/developers/docs")({ component: DocsPage });

const SECTIONS: Record<string, { title: string; body: React.ReactNode }> = {
  auth: { title: "Authentication",
    body: <>
      <p>All requests require a Bearer token in the <code>Authorization</code> header.</p>
      <pre className="mt-3 rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">Authorization: Bearer gk_live_••••••••••••••</pre>
      <p className="mt-3">Keys are scoped per workspace and environment. Rotate anytime from the API Keys page.</p>
    </>,
  },
  quickstart: { title: "Quick Start",
    body: <>
      <ol className="ml-5 list-decimal space-y-1 text-sm">
        <li>Create an API key in <b>/developers/api</b>.</li>
        <li>Install the SDK: <code>npm i @glintr/sdk</code>.</li>
        <li>Send your first request.</li>
      </ol>
      <pre className="mt-3 rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">{`import { Glintr } from "@glintr/sdk";\nconst gl = new Glintr(process.env.GLINTR_KEY);\nawait gl.projects.create({ name: "Q4 Launch" });`}</pre>
    </>,
  },
  projects: { title: "Projects API", body: <ApiRef routes={[
    { m: "GET", p: "/v1/projects", d: "List all projects" },
    { m: "POST", p: "/v1/projects", d: "Create a project" },
    { m: "GET", p: "/v1/projects/:id", d: "Retrieve a project" },
    { m: "PATCH", p: "/v1/projects/:id", d: "Update a project" },
    { m: "DELETE", p: "/v1/projects/:id", d: "Delete a project" },
  ]} /> },
  ai: { title: "AI API", body: <ApiRef routes={[
    { m: "POST", p: "/v1/ai/chat", d: "Chat completion" },
    { m: "POST", p: "/v1/ai/generate", d: "Content generation" },
    { m: "POST", p: "/v1/ai/images", d: "Image generation" },
    { m: "POST", p: "/v1/ai/videos", d: "Video generation" },
    { m: "POST", p: "/v1/ai/embed", d: "Embeddings" },
  ]} /> },
  templates: { title: "Templates API", body: <ApiRef routes={[
    { m: "GET", p: "/v1/templates", d: "List marketplace templates" },
    { m: "POST", p: "/v1/templates", d: "Publish a template" },
    { m: "POST", p: "/v1/templates/:id/install", d: "Install a template" },
  ]} /> },
  knowledge: { title: "Knowledge API", body: <ApiRef routes={[
    { m: "GET", p: "/v1/knowledge", d: "List documents" },
    { m: "POST", p: "/v1/knowledge", d: "Ingest a document" },
    { m: "POST", p: "/v1/knowledge/search", d: "Semantic search" },
  ]} /> },
  analytics: { title: "Analytics API", body: <ApiRef routes={[
    { m: "GET", p: "/v1/analytics/overview", d: "Workspace overview" },
    { m: "GET", p: "/v1/analytics/campaigns/:id", d: "Campaign metrics" },
  ]} /> },
  integrations: { title: "Integrations API", body: <ApiRef routes={[
    { m: "GET", p: "/v1/integrations", d: "List connected integrations" },
    { m: "POST", p: "/v1/integrations/:provider/connect", d: "Connect a provider" },
  ]} /> },
  billing: { title: "Billing API", body: <ApiRef routes={[
    { m: "GET", p: "/v1/billing/usage", d: "Current usage" },
    { m: "GET", p: "/v1/billing/invoices", d: "List invoices" },
  ]} /> },
  errors: { title: "Errors", body: <>
    <table className="mt-2 w-full text-sm"><tbody>
      {[[400,"Bad request"],[401,"Missing or invalid API key"],[403,"Insufficient scope"],[404,"Resource not found"],[429,"Rate limit exceeded"],[500,"Server error"]].map(([c,d]) => (
        <tr key={c} className="border-t"><td className="py-2 font-mono">{c}</td><td className="py-2 text-muted-foreground">{d}</td></tr>
      ))}
    </tbody></table>
  </> },
  ratelimits: { title: "Rate Limits", body: <>
    <p>Rate limits scale with your plan. Every response includes <code>X-RateLimit-Remaining</code> and <code>X-RateLimit-Reset</code> headers.</p>
    <ul className="mt-3 ml-5 list-disc text-sm space-y-1">
      <li>Free — 60 req/min</li><li>Starter — 600 req/min</li><li>Professional — 3,000 req/min</li>
      <li>Agency — 10,000 req/min</li><li>Enterprise — Custom</li>
    </ul>
  </> },
  examples: { title: "Examples", body: <>
    <p>Sample projects in every SDK on <b>github.com/glintr/examples</b>.</p>
  </> },
};

function ApiRef({ routes }: { routes: { m: string; p: string; d: string }[] }) {
  return (
    <div className="space-y-2">
      {routes.map((r) => (
        <div key={r.m + r.p} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
          <Badge variant="secondary" className="font-mono text-[10px]">{r.m}</Badge>
          <code className="font-mono text-xs">{r.p}</code>
          <span className="ml-auto text-xs text-muted-foreground">{r.d}</span>
        </div>
      ))}
    </div>
  );
}

const KEYS = Object.keys(SECTIONS);

function DocsPage() {
  const [active, setActive] = useState("auth");
  const sec = SECTIONS[active];
  return (
    <DeveloperShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Documentation</h2>
          <p className="text-sm text-muted-foreground">REST, GraphQL, event streams, and OpenAPI spec.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline"><Download className="mr-2 h-3.5 w-3.5" />openapi.json</Button>
          <Button size="sm" variant="outline"><Download className="mr-2 h-3.5 w-3.5" />openapi.yaml</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit p-2">
          <nav className="flex flex-col text-sm">
            {KEYS.map((k) => (
              <button
                key={k}
                onClick={() => setActive(k)}
                className={cn("rounded-md px-3 py-1.5 text-left", active === k ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}
              >
                {SECTIONS[k].title}
              </button>
            ))}
          </nav>
        </Card>
        <Card className="p-6">
          <h3 className="text-xl font-semibold">{sec.title}</h3>
          <div className="prose prose-sm mt-4 max-w-none dark:prose-invert">{sec.body}</div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="text-sm font-semibold">GraphQL</div>
        <p className="mt-1 text-sm text-muted-foreground">Explore the schema at <code>https://api.glintr.com/graphql</code>. Autocomplete, queries, mutations and subscriptions supported.</p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">
{`query {
  projects(first: 10) {
    id name status createdAt
    campaigns { id title }
  }
}`}
        </pre>
      </Card>
    </DeveloperShell>
  );
}
