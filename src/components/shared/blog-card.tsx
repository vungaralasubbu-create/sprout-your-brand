import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Bookmark, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { BlogCover } from "@/components/shared/blog-cover";
import { formatPublished, type BlogPost } from "@/lib/blog";

interface BlogCardProps {
  post: BlogPost;
  variant?: "default" | "compact" | "wide";
  eager?: boolean;
  className?: string;
}

const STORAGE_KEY = "glintr:bookmarks:blog";

function readBookmarks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}
function writeBookmarks(set: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* noop */
  }
}

export function useBookmark(slug: string) {
  const [set, setSet] = React.useState<Set<string>>(() => readBookmarks());
  React.useEffect(() => {
    const onStorage = () => setSet(readBookmarks());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const bookmarked = set.has(slug);
  const toggle = React.useCallback(() => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      writeBookmarks(next);
      return next;
    });
  }, [slug]);
  return { bookmarked, toggle };
}

export function BlogCard({ post, variant = "default", eager = false, className }: BlogCardProps) {
  const { bookmarked, toggle } = useBookmark(post.slug);
  const category = post.topic?.name ?? post.category?.name ?? "Insights";
  const date = formatPublished(post.published_at);
  const aspect =
    variant === "wide"
      ? "aspect-[21/9]"
      : variant === "compact"
        ? "aspect-[16/10]"
        : "aspect-[16/10]";

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300",
        "hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none",
        className,
      )}
    >
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className={cn("relative block overflow-hidden", aspect)}
        aria-label={`Read ${post.title}`}
      >
        <BlogCover post={post} variant="card" eager={eager} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggle();
        }}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
        className={cn(
          "absolute top-3 right-3 z-10 rounded-full p-2 backdrop-blur-md transition-all",
          bookmarked
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-background/70 text-foreground hover:bg-background",
        )}
      >
        <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
      </button>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-caption">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
            {category}
          </span>
          {post.skill_level ? (
            <span className="text-xs text-muted-foreground">· {post.skill_level}</span>
          ) : null}
        </div>

        <h3 className="font-display text-lg font-semibold leading-snug text-balance line-clamp-2">
          <Link
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="hover:text-primary transition-colors"
          >
            {post.title}
          </Link>
        </h3>

        <p className="text-caption text-pretty line-clamp-2 text-muted-foreground">
          {post.short_summary}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-6 rounded-full bg-gradient-brand shrink-0" aria-hidden />
            <span className="text-caption truncate">{post.author_display_name}</span>
          </div>
          <div className="flex items-center gap-2 text-caption shrink-0">
            {post.reading_time_minutes ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> {post.reading_time_minutes}m
              </span>
            ) : null}
            <span aria-hidden>·</span>
            <span>{date}</span>
          </div>
        </div>

        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Read Article <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
