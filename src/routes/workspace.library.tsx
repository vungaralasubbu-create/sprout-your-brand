import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BookOpen, Highlighter, BookmarkIcon, Layers3, CalendarDays, Download, FileDown } from "lucide-react";
import { Card, EmptyState, Pill, SectionHeader } from "@/components/workspace/hub-shell";
import {
  downloadFile,
  exportAll,
  useCalendar,
  useFlashcards,
  useHighlights,
  useHubBookmarks,
  useNotebooks,
  useNotes,
  pushActivity,
} from "@/lib/workspace/hub";

export const Route = createFileRoute("/workspace/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const { notebooks } = useNotebooks();
  const { allNotes } = useNotes();
  const { allHighlights } = useHighlights();
  const { allBookmarks } = useHubBookmarks();
  const { allFlashcards } = useFlashcards();
  const { events } = useCalendar();

  const stats = useMemo(
    () => [
      { label: "Notebooks", value: notebooks.length, icon: BookOpen, to: "/workspace/notebooks" },
      { label: "Notes", value: allNotes.length, icon: BookOpen, to: "/workspace/notebooks" },
      { label: "Highlights", value: allHighlights.length, icon: Highlighter, to: "/workspace/highlights" },
      { label: "Bookmarks", value: allBookmarks.length, icon: BookmarkIcon, to: "/workspace/bookmarks" },
      { label: "Flashcards", value: allFlashcards.length, icon: Layers3, to: "/workspace/flashcards" },
      { label: "Events", value: events.length, icon: CalendarDays, to: "/workspace/calendar" },
    ],
    [notebooks, allNotes, allHighlights, allBookmarks, allFlashcards, events],
  );

  const exportJson = () => {
    downloadFile(`glintr-workspace-${new Date().toISOString().slice(0, 10)}.json`, exportAll(), "application/json");
    pushActivity({ kind: "export", label: "Exported workspace (JSON)" });
  };
  const exportMarkdown = () => {
    const md = [
      `# Glintr Workspace Export`,
      `_Exported ${new Date().toLocaleString()}_`,
      "",
      "## Notebooks",
      ...notebooks.map((n) => `- ${n.emoji ?? "📘"} ${n.name}`),
      "",
      "## Notes",
      ...allNotes.map((n) => `### ${n.title}\n\n${n.body}\n`),
      "",
      "## Highlights",
      ...allHighlights.map((h) => `> "${h.text}"${h.comment ? `\n> — ${h.comment}` : ""}${h.source.title ? `\n> _(${h.source.title})_` : ""}\n`),
      "",
      "## Bookmarks",
      ...allBookmarks.map((b) => `- [${b.title}](${b.href})${b.folder ? ` — ${b.folder}` : ""}`),
      "",
      "## Flashcards",
      ...allFlashcards.map((c) => `**Q:** ${c.front}\n**A:** ${c.back}\n`),
    ].join("\n");
    downloadFile(`glintr-workspace-${new Date().toISOString().slice(0, 10)}.md`, md, "text/markdown");
    pushActivity({ kind: "export", label: "Exported workspace (Markdown)" });
  };
  const exportPlain = () => {
    const plain = [
      `Glintr Workspace Export — ${new Date().toLocaleString()}`,
      "",
      "NOTES",
      ...allNotes.map((n) => `[${n.title}]\n${n.body}\n`),
      "",
      "HIGHLIGHTS",
      ...allHighlights.map((h) => `"${h.text}"${h.comment ? ` — ${h.comment}` : ""}`),
    ].join("\n");
    downloadFile(`glintr-workspace-${new Date().toISOString().slice(0, 10)}.txt`, plain, "text/plain");
    pushActivity({ kind: "export", label: "Exported workspace (Text)" });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Knowledge Library"
        title="Your entire library"
        description="Everything stored in your workspace. Export anytime — your knowledge belongs to you."
      />

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to}>
            <Card className="!p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <Pill tone="primary">Export</Pill>
            <h2 className="mt-2 text-base font-semibold text-foreground">Take your knowledge with you</h2>
            <p className="mt-1 text-xs text-muted-foreground">Download your entire workspace as JSON, Markdown or plain text.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportMarkdown}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
            >
              <FileDown className="h-3.5 w-3.5" /> Markdown
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" /> JSON
            </button>
            <button
              type="button"
              onClick={exportPlain}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" /> Text
            </button>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          PDF export: use your browser's "Print → Save as PDF" on the Markdown export for a formatted document. Cloud sync will
          arrive when you sign in — your local data will migrate seamlessly.
        </p>
      </Card>

      {allNotes.length + allHighlights.length + allBookmarks.length + allFlashcards.length === 0 && (
        <EmptyState title="Library is empty" hint="Add notebooks, notes, highlights or bookmarks to build your library." />
      )}
    </div>
  );
}
