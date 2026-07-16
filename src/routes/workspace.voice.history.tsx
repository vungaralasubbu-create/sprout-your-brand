import { createFileRoute, Link } from "@tanstack/react-router";
import { useVoiceSessions, deleteSession } from "@/lib/voice/store";
import { getMode } from "@/lib/voice/modes";
import { Trash2, Play } from "lucide-react";
import { useState } from "react";

function HistoryPage() {
  const { sessions, refresh } = useVoiceSessions();
  const [query, setQuery] = useState("");
  const filtered = sessions.filter(
    (s) => !query || s.title.toLowerCase().includes(query.toLowerCase()) || s.mode.includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Voice history</h2>
          <p className="text-sm text-muted-foreground">All sessions live in this browser and stay private.</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sessions"
          className="rounded-full border border-border/60 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No voice sessions yet. Start one from{" "}
          <Link to="/workspace/voice" className="underline">
            Voice Home
          </Link>
          .
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((s) => {
            const mode = getMode(s.mode);
            const preview = s.turns[s.turns.length - 1]?.text ?? "";
            const durationMin = Math.max(1, Math.round((s.updatedAt - s.createdAt) / 60000));
            return (
              <li key={s.id} className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{mode?.label ?? s.mode}</p>
                    <h3 className="mt-1 truncate text-sm font-semibold">{s.title || "Untitled"}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{preview}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {s.turns.length} turns · ~{durationMin}m · {new Date(s.updatedAt).toLocaleString()}
                      {s.bookmarks.length > 0 && ` · ${s.bookmarks.length} bookmarked`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/workspace/voice/session/$mode"
                      params={{ mode: s.mode }}
                      search={{ sessionId: s.id }}
                      className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
                    >
                      <Play className="h-3 w-3" /> Resume
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this session?")) {
                          deleteSession(s.id);
                          refresh();
                        }
                      }}
                      className="rounded-full border border-border/60 p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const Route = createFileRoute("/workspace/voice/history")({
  component: HistoryPage,
});
