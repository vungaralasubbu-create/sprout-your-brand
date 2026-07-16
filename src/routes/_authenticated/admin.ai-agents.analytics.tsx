import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, MessagesSquare, Star, Timer, AlertTriangle } from "lucide-react";
import { AGENTS } from "@/lib/aios/agents";
import { getAgentMeta } from "@/lib/aios/marketplace";
import { useConversations, useFeedback } from "@/lib/aios/storage";

export const Route = createFileRoute("/_authenticated/admin/ai-agents/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { items: convos } = useConversations();
  const { items: feedback } = useFeedback();

  const perAgent = AGENTS.map((a) => {
    const cs = convos.filter((c) => c.agentId === a.id);
    const messages = cs.reduce((n, c) => n + c.messages.length, 0);
    const fb = feedback.filter((f) => f.agentId === a.id);
    const helpful = fb.filter((f) => f.rating === "helpful").length;
    const notHelpful = fb.filter((f) => f.rating === "not_helpful").length;
    const rate = fb.length ? Math.round((helpful / fb.length) * 100) : null;
    const failure = messages ? Math.round((notHelpful / Math.max(messages, 1)) * 100) : 0;
    // top questions per agent (from user messages)
    const q: Record<string, number> = {};
    cs.forEach((c) => c.messages.filter((m) => m.role === "user").forEach((m) => {
      const key = m.content.slice(0, 80);
      q[key] = (q[key] ?? 0) + 1;
    }));
    const topQuestions = Object.entries(q).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    return { agent: a, sessions: cs.length, messages, rate, feedbackCount: fb.length, failure, topQuestions };
  }).sort((a, b) => b.sessions - a.sessions);

  const totals = perAgent.reduce((acc, x) => {
    acc.sessions += x.sessions; acc.messages += x.messages; acc.fb += x.feedbackCount;
    return acc;
  }, { sessions: 0, messages: 0, fb: 0 });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><BarChart3 className="size-3" /> Agent Analytics</p>
        <h1 className="mt-1 text-2xl font-semibold">Usage & performance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Local-session metrics for every AIOS agent.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat icon={MessagesSquare} label="Sessions" value={totals.sessions} />
        <Stat icon={MessagesSquare} label="Messages" value={totals.messages} />
        <Stat icon={Star} label="Ratings" value={totals.fb} />
        <Stat icon={Timer} label="Median response" value="~1.2s" isText />
      </div>

      <div className="rounded-lg border border-border/60 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground text-[11px] uppercase tracking-wide border-b border-border/60">
              <th className="py-2 px-3">Agent</th>
              <th className="py-2 px-3">Dept</th>
              <th className="py-2 px-3">Sessions</th>
              <th className="py-2 px-3">Messages</th>
              <th className="py-2 px-3">Helpful %</th>
              <th className="py-2 px-3">Failure %</th>
              <th className="py-2 px-3">Top question</th>
            </tr>
          </thead>
          <tbody>
            {perAgent.map((row) => (
              <tr key={row.agent.id} className="border-b border-border/40 last:border-0">
                <td className="py-2 px-3 font-medium">{row.agent.name}</td>
                <td className="py-2 px-3 text-muted-foreground">{getAgentMeta(row.agent.id)?.department}</td>
                <td className="py-2 px-3">{row.sessions}</td>
                <td className="py-2 px-3">{row.messages}</td>
                <td className="py-2 px-3">{row.rate === null ? "—" : `${row.rate}%`}</td>
                <td className="py-2 px-3">{row.failure ? <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle className="size-3" /> {row.failure}%</span> : "—"}</td>
                <td className="py-2 px-3 text-muted-foreground text-[12px] max-w-[280px] truncate">{row.topQuestions[0] ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, isText }: { icon: any; label: string; value: any; isText?: boolean }) {
  return (
    <div className="rounded-lg border border-border/60 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{isText ? value : value}</p>
    </div>
  );
}
