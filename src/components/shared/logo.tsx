import * as React from "react";
import { cn } from "@/lib/utils";

export function GlintrLogo({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className="relative grid size-8 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-md"
        aria-hidden
      >
        <span className="font-display text-lg font-bold leading-none">G</span>
        <span className="absolute -right-1 -bottom-1 size-2.5 rounded-full bg-brand-lime ring-2 ring-background" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-tight">glintr</span>
        {showTagline ? (
          <span className="text-[10px] font-medium text-muted-foreground tracking-wider mt-0.5">
            LAUNCH · SELL · GROW
          </span>
        ) : null}
      </div>
    </div>
  );
}
