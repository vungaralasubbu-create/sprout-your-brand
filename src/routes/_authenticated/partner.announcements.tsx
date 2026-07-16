import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pin, Megaphone } from "lucide-react";
import { ANNOUNCEMENTS, ANNOUNCEMENT_TYPES, type Announcement } from "@/data/partner-announcements";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/partner/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Glintr Partner" }, { name: "robots", content: "noindex" }] }),
  component: AnnouncementsPage,
});

const TYPE_STYLES: Record<Announcement["type"], string> = {
  program: "text-emerald-700 bg-emerald-50 border-emerald-200",
  marketing: "text-cyan-700 bg-cyan-50 border-cyan-200",
  policy: "text-amber-700 bg-amber-50 border-amber-200",
  training: "text-violet-700 bg-violet-50 border-violet-200",
  platform: "text-slate-700 bg-slate-50 border-slate-200",
};

function AnnouncementsPage() {
  const [type, setType] = useState<Announcement["type"] | "all">("all");
  const items = useMemo(() => {
    const arr = [...ANNOUNCEMENTS].sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return b.publishedOn.localeCompare(a.publishedOn);
    });
    return type === "all" ? arr : arr.filter((a) => a.type === type);
  }, [type]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 text-caption font-mono uppercase tracking-widest text-primary">
          <Megaphone className="size-3.5" /> Updates
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground max-w-2xl">
          New programs, marketing drops, policy clarifications, and platform improvements — all in one feed.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <FilterPill label="All" active={type === "all"} onClick={() => setType("all")} />
        {ANNOUNCEMENT_TYPES.map((t) => (
          <FilterPill key={t.key} label={t.label} active={type === t.key} onClick={() => setType(t.key)} />
        ))}
      </div>

      <div className="space-y-3">
        {items.map((a) => (
          <article
            key={a.id}
            className={cn(
              "rounded-2xl border bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
              a.pinned && "ring-1 ring-primary/20",
            )}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border", TYPE_STYLES[a.type])}>
                  {ANNOUNCEMENT_TYPES.find((t) => t.key === a.type)?.label}
                </span>
                {a.pinned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-primary">
                    <Pin className="size-3" /> Pinned
                  </span>
                )}
              </div>
              <time className="text-xs text-muted-foreground">{formatDate(a.publishedOn)}</time>
            </div>
            <h2 className="font-display text-lg font-semibold tracking-tight mb-1.5">{a.title}</h2>
            <p className="text-sm text-muted-foreground mb-2">{a.summary}</p>
            <p className="text-sm leading-relaxed">{a.body}</p>
            {a.href && (
              <a href={a.href} className="mt-3 inline-flex text-sm text-primary hover:underline">
                Learn more →
              </a>
            )}
          </article>
        ))}
        {items.length === 0 && (
          <div className="text-center py-14 text-muted-foreground">No announcements in this category yet.</div>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 h-9 px-3.5 rounded-full text-sm border transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/80 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
