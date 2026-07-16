import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, Layers } from "lucide-react";

interface Crumb {
  name: string;
  href?: string;
}

export function TopicBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <Link to={c.href as any} className="hover:text-foreground">{c.name}</Link>
              ) : (
                <span className={last ? "text-foreground" : ""}>{c.name}</span>
              )}
              {!last && <span aria-hidden>›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function TopicMeta({
  updatedAt,
  readingMinutes,
  difficulty,
  category,
}: {
  updatedAt?: string;
  readingMinutes?: number;
  difficulty?: string;
  category?: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {updatedAt && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> Updated {new Date(updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      )}
      {typeof readingMinutes === "number" && (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {readingMinutes} min read
        </span>
      )}
      {difficulty && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5">
          {difficulty}
        </span>
      )}
      {category && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5">
          <Layers className="h-3.5 w-3.5" /> {category}
        </span>
      )}
    </div>
  );
}
