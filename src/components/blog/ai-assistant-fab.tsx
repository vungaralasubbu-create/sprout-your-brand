import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, BookOpen, ListChecks, Languages, HelpCircle, Wand2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating AI Learning Assistant.
 *
 * - Collapsed by default (compact circular FAB, bottom-right).
 * - Never blocks reading — the menu is positioned above the FAB and closes on
 *   backdrop click, Escape, or route change.
 * - Actions link into the existing workspace/mentor surfaces via query params
 *   so the assistant reuses the platform's tooling instead of rebuilding it.
 */
export function AiAssistantFab({ articleTitle, articleSlug }: { articleTitle: string; articleSlug: string }) {
  const [open, setOpen] = React.useState(false);
  const q = encodeURIComponent(articleTitle);
  const s = encodeURIComponent(articleSlug);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const actions: Array<{ label: string; desc: string; to: string; icon: React.ReactNode }> = [
    { label: "Explain this article", desc: "Break down the key ideas simply", to: `/workspace?source=blog&slug=${s}&intent=explain`, icon: <Wand2 className="size-4" /> },
    { label: "Summarize", desc: "Get a 5-bullet TL;DR", to: `/workspace?source=blog&slug=${s}&intent=summarize`, icon: <FileText className="size-4" /> },
    { label: "Quiz me", desc: "Test your understanding", to: `/workspace?source=blog&slug=${s}&intent=quiz`, icon: <ListChecks className="size-4" /> },
    { label: "Generate flashcards", desc: "Study on the go", to: `/workspace?source=blog&slug=${s}&intent=flashcards`, icon: <BookOpen className="size-4" /> },
    { label: "Translate", desc: "Read in your language", to: `/workspace?source=blog&slug=${s}&intent=translate`, icon: <Languages className="size-4" /> },
    { label: "Ask a question", desc: "Chat with the Glintr mentor", to: `/mentor?context=blog&slug=${s}&topic=${q}`, icon: <HelpCircle className="size-4" /> },
  ];

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm print:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <div className="fixed bottom-5 right-5 z-50 print:hidden">
        {open ? (
          <div
            role="dialog"
            aria-label="AI Learning Assistant"
            className={cn(
              "mb-3 w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right rounded-2xl border bg-card shadow-2xl",
              "animate-in fade-in-0 zoom-in-95",
            )}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-gradient-brand text-white">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">AI Learning Assistant</div>
                  <div className="text-[11px] text-muted-foreground">Powered by Glintr AI</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close AI Assistant"
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {actions.map((a) => (
                <li key={a.label}>
                  <Link
                    to={a.to}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted"
                  >
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {a.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{a.label}</span>
                      <span className="block text-xs text-muted-foreground">{a.desc}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close AI Learning Assistant" : "Open AI Learning Assistant"}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-3 text-white shadow-lg transition-all",
            "hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
            "min-h-11 min-w-11",
          )}
        >
          <Sparkles className="size-5" aria-hidden />
          <span className="hidden sm:inline text-sm font-semibold">Ask AI</span>
        </button>
      </div>
    </>
  );
}
