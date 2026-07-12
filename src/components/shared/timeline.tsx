import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TimelineStep {
  icon: LucideIcon;
  title: string;
  description: string;
  meta?: string;
}

export function Timeline({ steps, className }: { steps: TimelineStep[]; className?: string }) {
  return (
    <ol className={cn("relative flex flex-col gap-8", className)}>
      <span
        aria-hidden
        className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-brand-cyan via-brand-azure to-brand-royal opacity-40"
      />
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-5 pl-0">
          <div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-background border-2 border-primary/40 text-primary shadow-sm">
            <s.icon className="size-4" />
          </div>
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-3">
              <p className="text-label">Step {i + 1}</p>
              {s.meta ? <span className="text-caption">· {s.meta}</span> : null}
            </div>
            <h4 className="font-display text-lg font-semibold mt-0.5">{s.title}</h4>
            <p className="text-caption text-pretty mt-1 max-w-lg">{s.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function HowItWorks({
  steps,
  className,
}: {
  steps: TimelineStep[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-3 relative", className)}>
      {steps.map((s, i) => (
        <div key={i} className="card-elevated hover:card-elevated-hover p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-4xl font-bold text-gradient-brand leading-none">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <s.icon className="size-4" />
            </div>
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold">{s.title}</h4>
            <p className="text-caption text-pretty mt-1">{s.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
