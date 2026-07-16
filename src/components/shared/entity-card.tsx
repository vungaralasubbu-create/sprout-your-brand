import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlossaryEntry } from "@/data/glossary";

interface EntityCardProps {
  entry: GlossaryEntry;
  className?: string;
}

/**
 * Reusable entity card. Renders a glossary term as a small,
 * connectable knowledge-graph node used across the site.
 */
export function EntityCard({ entry, className }: EntityCardProps) {
  return (
    <Link
      to="/glossary/$slug"
      params={{ slug: entry.slug }}
      className={cn(
        "group rounded-2xl border p-5 bg-card hover:border-primary transition-colors block",
        className,
      )}
    >
      <div className="text-caption font-mono uppercase tracking-widest text-primary/80 mb-2">
        {entry.category}
      </div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display font-semibold text-lg leading-tight">
          {entry.term}
        </h3>
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {entry.short}
      </p>
      {(entry.relatedPrograms?.length || entry.relatedBlogs?.length) ? (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-wider text-muted-foreground/80 font-mono">
          {entry.relatedPrograms?.length ? (
            <span>{entry.relatedPrograms.length} program{entry.relatedPrograms.length > 1 ? "s" : ""}</span>
          ) : null}
          {entry.relatedBlogs?.length ? (
            <span>{entry.relatedBlogs.length} article{entry.relatedBlogs.length > 1 ? "s" : ""}</span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
