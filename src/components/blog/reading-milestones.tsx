import * as React from "react";
import { Check, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reading milestones — 10 / 25 / 50 / 75 / Completed.
 *
 * Renders as a small chip strip. Milestones light up as the user scrolls.
 * When completion is reached, a subtle animated badge appears once.
 */
const STEPS = [10, 25, 50, 75, 100] as const;

export function ReadingMilestones({ progress, className }: { progress: number; className?: string }) {
  const [celebrated, setCelebrated] = React.useState(false);
  React.useEffect(() => {
    if (progress >= 100 && !celebrated) {
      setCelebrated(true);
    }
  }, [progress, celebrated]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Reading progress milestones">
      {STEPS.map((step) => {
        const reached = progress >= step;
        const label = step === 100 ? "Completed" : `${step}%`;
        return (
          <span
            key={step}
            aria-current={reached ? "step" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-300 tabular-nums",
              reached
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {reached ? (
              step === 100 ? (
                <Trophy className="size-3.5" aria-hidden />
              ) : (
                <Check className="size-3.5" aria-hidden />
              )
            ) : (
              <span className="size-1.5 rounded-full bg-muted-foreground/40" aria-hidden />
            )}
            {label}
          </span>
        );
      })}

      {celebrated ? (
        <span
          role="status"
          aria-live="polite"
          className={cn(
            "ml-1 inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-3 py-1 text-[11px] font-semibold text-white shadow",
            "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95",
          )}
        >
          <Trophy className="size-3.5" aria-hidden /> Nice — article completed
        </span>
      ) : null}
    </div>
  );
}
