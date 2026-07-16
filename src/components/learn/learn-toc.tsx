import * as React from "react";
import { cn } from "@/lib/utils";
import type { Heading } from "@/components/shared/article-markdown";

/**
 * Sticky Table of Contents + reading progress indicator.
 * Highlights the active section using IntersectionObserver.
 */
export function LearnToc({
  headings,
  className,
}: {
  headings: Heading[];
  className?: string;
}) {
  const [active, setActive] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (!headings.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-25% 0px -60% 0px" },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav
      aria-label="On this page"
      className={cn(
        "text-[13px]",
        className,
      )}
    >
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1.5">
        {headings.map((h) => {
          const isActive = active === h.id;
          return (
            <li key={h.id} className={cn(h.level === 3 && "pl-3")}>
              <a
                href={`#${h.id}`}
                className={cn(
                  "block truncate border-l-2 py-0.5 pl-3 leading-snug transition-colors",
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Fixed thin reading progress bar at the top of the article */
export function LearnReadingProgress({ target }: { target: React.RefObject<HTMLElement> }) {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    const onScroll = () => {
      const el = target.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(Math.min(100, (scrolled / Math.max(total, 1)) * 100));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [target]);
  return (
    <div className="sticky top-16 z-30 h-0.5 bg-transparent" aria-hidden>
      <div
        className="h-full bg-gradient-brand transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
