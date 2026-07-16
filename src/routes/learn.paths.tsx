import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";
import { paths } from "@/data/learn";

export const Route = createFileRoute("/learn/paths")({
  head: () =>
    buildPageHead({
      path: "/learn/paths",
      title: "Learning Paths | Glintr Learn",
      description:
        "Structured learning journeys across AI, VLSI and digital marketing — the concepts in the exact order they build on each other.",
    }),
  component: LearningPathsIndex,
});

function LearningPathsIndex() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14 md:px-10 md:py-20">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        Learning Paths
      </p>
      <h1 className="text-balance text-4xl font-black tracking-tight md:text-5xl">
        Structured pathways from curiosity to capability
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Each path is a sequence of concepts, taught in the order they naturally build on each other. Every node opens a real page.
      </p>

      <div className="mt-14 space-y-14">
        {paths.map((p) => (
          <section key={p.slug} className="rounded-3xl border bg-background p-8 md:p-10">
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">{p.name}</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">{p.description}</p>

            <ol className="mt-8 space-y-4">
              {p.nodes.map((n, i) => (
                <li key={n.slug}>
                  <Link
                    to="/learn/$slug"
                    params={{ slug: n.slug }}
                    className="group flex flex-col rounded-2xl border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 md:flex-row md:items-center md:gap-6"
                  >
                    <div className="flex items-center gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
                        {i + 1}
                      </span>
                      <span className="text-lg font-bold">{n.label}</span>
                    </div>
                    <span className="mt-2 text-sm text-muted-foreground md:ml-auto md:mt-0 md:max-w-md">
                      {n.description}
                    </span>
                    <ArrowRight className="mt-2 size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 md:mt-0" />
                  </Link>
                  {i < p.nodes.length - 1 ? (
                    <div className="ml-5 h-4 w-px border-l border-dashed border-border" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
