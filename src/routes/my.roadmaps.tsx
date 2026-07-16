import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { Panel } from "@/components/workspace/panel";
import { LEARNING_PATHS } from "@/data/learning-paths";
import {
  bumpGoalMetric,
  trackActivity,
  unlockAchievement,
  useRoadmaps,
} from "@/lib/workspace/storage";

export const Route = createFileRoute("/my/roadmaps")({
  component: RoadmapsPage,
});

function RoadmapsPage() {
  const { roadmaps, save, remove, toggleStep } = useRoadmaps();

  const savedSlugs = useMemo(() => new Set(roadmaps.map((r) => r.slug)), [roadmaps]);
  const suggestable = LEARNING_PATHS.filter((p) => !savedSlugs.has(p.slug)).slice(0, 6);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Roadmaps
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          My learning roadmaps
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Save any Glintr learning path and track your progress step-by-step. Completed steps count toward your weekly goals.
        </p>
      </header>

      {roadmaps.length === 0 ? (
        <Panel eyebrow="No roadmaps yet" title="Start with a learning path">
          <p className="mb-3 text-sm text-muted-foreground">
            Roadmaps organize glossary and programs into a sequenced learning journey.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {roadmaps.map((r) => {
            const path = LEARNING_PATHS.find((p) => p.slug === r.slug);
            const steps = path?.steps ?? [];
            const doneCount = r.completedSteps.length;
            const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
            const nextIdx = steps.findIndex((_, i) => !r.completedSteps.includes(i));

            return (
              <Panel
                key={r.slug}
                eyebrow={r.domain}
                title={r.title}
                action={
                  <button
                    type="button"
                    onClick={() => remove(r.slug)}
                    className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${r.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                }
              >
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    {doneCount}/{steps.length} steps ({pct}%)
                  </span>
                  {nextIdx >= 0 && steps[nextIdx] && (
                    <span className="text-muted-foreground">
                      Next: <span className="text-foreground">{steps[nextIdx].label}</span>
                    </span>
                  )}
                </div>
                <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <ol className="space-y-2">
                  {steps.map((s, i) => {
                    const done = r.completedSteps.includes(i);
                    return (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => {
                            toggleStep(r.slug, i);
                            if (!done) {
                              bumpGoalMetric("roadmap-steps");
                              trackActivity({ kind: "roadmap", label: `Completed step: ${s.label}` });
                            }
                          }}
                          className={
                            "flex w-full items-start gap-3 rounded-lg p-2 text-left text-sm transition-colors " +
                            (done ? "bg-primary/5 text-muted-foreground line-through" : "hover:bg-muted/50")
                          }
                        >
                          {done ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="min-w-0">
                            <span className="block font-semibold text-foreground">{s.label}</span>
                            <span className="block text-[11px] text-muted-foreground">
                              {s.description}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                {path && (
                  <Link
                    to={`/learning-paths/${path.slug}`}
                    className="mt-3 inline-flex text-xs font-semibold text-primary"
                  >
                    Open full learning path →
                  </Link>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      <Panel eyebrow="Explore" title="Add another roadmap">
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {suggestable.map((p) => (
            <li
              key={p.slug}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-card/50 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{p.title}</p>
                <p className="line-clamp-2 text-[11px] text-muted-foreground">{p.short}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  save({
                    slug: p.slug,
                    title: p.title,
                    domain: p.domain,
                    totalSteps: p.steps.length,
                  });
                  unlockAchievement("first-path");
                  trackActivity({ kind: "roadmap", label: `Saved roadmap: ${p.title}` });
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-card px-3 py-1.5 text-[11px] font-semibold hover:border-primary/40"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
