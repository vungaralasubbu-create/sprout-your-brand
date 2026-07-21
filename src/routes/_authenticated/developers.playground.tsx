import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DeveloperShell } from "@/components/developers/developer-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/developers/playground")({ component: PlaygroundPage });

const ENDPOINTS = [
  { m: "GET", p: "/v1/projects" },
  { m: "POST", p: "/v1/projects" },
  { m: "GET", p: "/v1/campaigns" },
  { m: "POST", p: "/v1/ai/chat" },
  { m: "POST", p: "/v1/ai/generate" },
  { m: "GET", p: "/v1/knowledge" },
  { m: "GET", p: "/v1/templates" },
  { m: "GET", p: "/v1/analytics" },
];

const LANGS = ["cURL","JavaScript","Python","PHP","Go","Java","C#","Node.js"];

function snippet(lang: string, method: string, path: string, body: string) {
  const url = `https://api.glintr.com${path}`;
  if (lang === "cURL") return `curl -X ${method} ${url} \\\n  -H "Authorization: Bearer $GLINTR_KEY" \\\n  -H "Content-Type: application/json"${body && method !== "GET" ? ` \\\n  -d '${body}'` : ""}`;
  if (lang === "JavaScript" || lang === "Node.js") return `const res = await fetch("${url}", {\n  method: "${method}",\n  headers: { Authorization: \`Bearer \${process.env.GLINTR_KEY}\`, "Content-Type": "application/json" }${method !== "GET" ? `,\n  body: JSON.stringify(${body || "{}"})` : ""}\n});\nconst data = await res.json();`;
  if (lang === "Python") return `import requests\nres = requests.${method.toLowerCase()}(\n  "${url}",\n  headers={"Authorization": f"Bearer {GLINTR_KEY}"}${method !== "GET" ? `,\n  json=${body || "{}"}` : ""}\n)\nprint(res.json())`;
  if (lang === "PHP") return `<?php\n$ch = curl_init("${url}");\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $GLINTR_KEY"]);\n$response = curl_exec($ch);`;
  if (lang === "Go") return `req, _ := http.NewRequest("${method}", "${url}", nil)\nreq.Header.Set("Authorization", "Bearer "+os.Getenv("GLINTR_KEY"))\nres, _ := http.DefaultClient.Do(req)`;
  return `// ${lang} snippet\n${method} ${url}`;
}

function PlaygroundPage() {
  const [endpoint, setEndpoint] = useState(ENDPOINTS[0]);
  const [body, setBody] = useState(`{\n  "name": "Q4 Launch",\n  "goal": "Generate 50 posts"\n}`);
  const [lang, setLang] = useState("cURL");
  const [response, setResponse] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ time: number; size: number } | null>(null);

  const run = () => {
    const started = Date.now();
    setTimeout(() => {
      const mock = { id: "proj_" + Math.random().toString(36).slice(2, 10), name: "Q4 Launch", status: "created", created_at: new Date().toISOString() };
      const text = JSON.stringify(mock, null, 2);
      setResponse(text);
      setMeta({ time: Date.now() - started + Math.floor(Math.random() * 120), size: text.length });
      toast.success("Request sent");
    }, 400);
  };

  return (
    <DeveloperShell>
      <div>
        <h2 className="text-2xl font-semibold">API Playground</h2>
        <p className="text-sm text-muted-foreground">Test endpoints interactively. Auto-generated code snippets in 8 languages.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 text-sm font-semibold">Request</div>
          <div className="flex gap-2">
            <select
              className="rounded-lg border bg-background px-3 py-2 text-sm"
              value={`${endpoint.m} ${endpoint.p}`}
              onChange={(e) => {
                const [m, p] = e.target.value.split(" ");
                setEndpoint({ m, p });
              }}
            >
              {ENDPOINTS.map((ep) => <option key={ep.m + ep.p}>{ep.m} {ep.p}</option>)}
            </select>
            <Button onClick={run}><Play className="mr-2 h-4 w-4" />Send</Button>
          </div>

          <div className="mt-4">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Authorization</div>
            <Input value="Bearer gk_test_••••••••••••" readOnly className="font-mono text-xs" />
          </div>
          <div className="mt-3">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Body</div>
            <Textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-xs" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Response</div>
            {meta && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary">200 OK</Badge>
                <span className="text-muted-foreground">{meta.time}ms · {meta.size}B</span>
              </div>
            )}
          </div>
          <pre className="mt-3 h-64 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100">
{response ?? "// Click Send to see the response"}
          </pre>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Code</div>
          <div className="flex flex-wrap gap-1">
            {LANGS.map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`rounded-md px-2.5 py-1 text-xs ${l === lang ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{l}</button>
            ))}
          </div>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100">
{snippet(lang, endpoint.m, endpoint.p, body)}
        </pre>
        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(snippet(lang, endpoint.m, endpoint.p, body)); toast.success("Copied"); }}>
            <Copy className="mr-2 h-3.5 w-3.5" />Copy
          </Button>
        </div>
      </Card>
    </DeveloperShell>
  );
}
