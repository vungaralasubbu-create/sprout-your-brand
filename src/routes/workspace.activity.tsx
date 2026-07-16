import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, EmptyState, Pill, SectionHeader } from "@/components/workspace/hub-shell";
import { useActivityFeed } from "@/lib/workspace/hub";

export const Route = createFileRoute("/workspace/activity")({
  component: ActivityPage,
});

const KIND_LABEL: Record<string, string> = {
  view: "Viewed",
  note: "Note",
  highlight: "Highlight",
  bookmark: "Bookmark",
  flashcard: "Flashcards",
  chat: "AI chat",
  notebook: "Notebook",
  mastery: "Mastery",
  revision: "Revision",
  export: "Export",
};

function ActivityPage() {
  const activity = useActivityFeed();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Recent activity"
        title="Everything you've done"
        description="A timeline of viewed pages, notes, highlights, bookmarks, AI chats and completed lessons."
      />
      {activity.length === 0 ? (
        <EmptyState title="No activity yet" hint="Your workspace timeline will appear here as you explore Glintr." />
      ) : (
        <div className="space-y-2">
          {activity.map((a) => {
            const inner = (
              <Card key={a.id} className="!p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <Pill>{KIND_LABEL[a.kind] ?? a.kind}</Pill>
                    <span className="truncate text-sm text-foreground">{a.label}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{new Date(a.at).toLocaleString()}</span>
                </div>
              </Card>
            );
            return a.href ? (
              <Link key={a.id} to={a.href} className="block">
                {inner}
              </Link>
            ) : (
              inner
            );
          })}
        </div>
      )}
    </div>
  );
}
