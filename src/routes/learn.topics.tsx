import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { buildPageHead } from "@/lib/seo-head";
import { collections, topics } from "@/data/learn";

export const Route = createFileRoute("/learn/topics")({
  head: () =>
    buildPageHead({
      path: "/learn/topics",
      title: "All Topics | Glintr Learn",
      description:
        "Every topic covered by Glintr Learn — AI, machine learning, VLSI, embedded systems, digital marketing and more.",
    }),
  component: TopicsIndex,
});

function TopicsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20">
      <header className="mb-12 max-w-2xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          All Topics
        </p>
        <h1 className="text-balance text-4xl font-black tracking-tight md:text-5xl">
          Every topic covered by Glintr Learn
        </h1>
        <p className="mt-4 text-muted-foreground">
          Organised by collection, tagged by level. Click any topic to see its guides and connected programs.
        </p>
      </header>

      {collections.map((c) => {
        const items = topics.filter((t) => t.collection === c.slug);
        if (!items.length) return null;
        return (
          <section key={c.slug} className="mb-14">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-black tracking-tight">{c.name}</h2>
              <Link
                to="/learn/collections/$slug"
                params={{ slug: c.slug }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Enter →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((t) => (
                <div
                  id={t.slug}
                  key={t.slug}
                  className={cn(
                    "group relative flex flex-col gap-2 overflow-hidden rounded-2xl border bg-background p-5 scroll-mt-40 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                  )}
                >
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-30 blur-2xl"
                    style={{ background: `oklch(0.85 0.14 ${t.accent})` }}
                    aria-hidden
                  />
                  <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <t.icon className="size-5" />
                  </div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{t.tagline}</p>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {t.level}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
