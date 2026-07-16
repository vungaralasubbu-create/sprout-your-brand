import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MessagesSquare, Pin, Trash2, Search } from "lucide-react";
import { useConversations } from "@/lib/aios/storage";
import { getAgent } from "@/lib/aios/agents";

export const Route = createFileRoute("/_authenticated/admin/aios/conversations")({
  component: ConversationsPage,
});

function ConversationsPage() {
  const { items, update, remove } = useConversations();
  const [q, setQ] = useState("");
  const filtered = items.filter((c) =>
    !q.trim() ||
    c.title.toLowerCase().includes(q.toLowerCase()) ||
    c.messages.some((m) => m.content.toLowerCase().includes(q.toLowerCase())),
  ).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><MessagesSquare className="size-3" /> History</p>
        <h1 className="mt-1 text-2xl font-semibold">Conversations</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search past sessions across every agent. Pin the ones you use most.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search conversations…"
          className="w-full rounded-full border border-border/60 bg-white pl-8 pr-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
        {filtered.map((c) => {
          const agent = getAgent(c.agentId);
          const last = c.messages[c.messages.length - 1];
          return (
            <div key={c.id} className="rounded-lg border border-border/60 bg-white p-3 flex items-start gap-3">
              <button
                type="button"
                onClick={() => update(c.id, { pinned: !c.pinned })}
                className={"rounded-full p-1 " + (c.pinned ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                title={c.pinned ? "Unpin" : "Pin"}
              ><Pin className="size-3.5" /></button>
              <Link
                to="/admin/aios/agents"
                search={{ agent: c.agentId, convo: c.id } as any}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold truncate">{c.title}</p>
                <p className="text-[11px] text-muted-foreground">{agent?.name ?? c.agentId} · {c.messages.length} messages · {new Date(c.updatedAt).toLocaleString()}</p>
                {last && <p className="mt-1 text-[12px] text-muted-foreground line-clamp-1">{last.content}</p>}
              </Link>
              <button
                type="button"
                onClick={() => { if (confirm("Delete conversation?")) remove(c.id); }}
                className="rounded-full p-1 text-muted-foreground hover:text-red-500"
              ><Trash2 className="size-3.5" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
