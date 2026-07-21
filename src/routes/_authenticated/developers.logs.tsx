import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DeveloperShell } from "@/components/developers/developer-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/developers/logs")({ component: LogsPage });

const LOGS = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  ts: `${i * 3 + 1}s ago`,
  method: ["GET","POST","PATCH","DELETE"][i % 4],
  endpoint: ["/v1/projects","/v1/ai/chat","/v1/campaigns","/v1/knowledge","/v1/templates"][i % 5],
  status: [200,200,201,200,400,429,500][i % 7],
  latency: 30 + (i * 17) % 400,
  tokens: [0,0,1240,0,890,0,0][i % 7],
  cost: (i % 7 === 2 ? 0.0031 : i % 7 === 4 ? 0.0018 : 0),
}));

function LogsPage() {
  const [q, setQ] = useState("");
  const filtered = LOGS.filter((l) => l.endpoint.toLowerCase().includes(q.toLowerCase()));
  return (
    <DeveloperShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Request Logs</h2>
          <p className="text-sm text-muted-foreground">Every API request — latency, tokens, cost, and full payload.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Filter endpoint…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Requests today","12,481"],["Avg latency","142ms"],["Errors","0.4%"],["Total tokens","1.2M"],
        ].map(([l, v]) => (
          <Card key={l} className="p-4"><div className="text-xs text-muted-foreground">{l}</div><div className="mt-1 text-2xl font-semibold">{v}</div></Card>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Endpoint</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Latency</th>
                <th className="px-4 py-3 text-left">Tokens</th>
                <th className="px-4 py-3 text-left">Cost</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.ts}</td>
                  <td className="px-4 py-2.5"><Badge variant="secondary" className="font-mono text-[10px]">{l.method}</Badge></td>
                  <td className="px-4 py-2.5 font-mono text-xs">{l.endpoint}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={l.status < 300 ? "default" : l.status < 500 ? "secondary" : "destructive"} className="font-mono text-[10px]">{l.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{l.latency}ms</td>
                  <td className="px-4 py-2.5 text-xs">{l.tokens || "—"}</td>
                  <td className="px-4 py-2.5 text-xs">{l.cost ? `$${l.cost.toFixed(4)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DeveloperShell>
  );
}
