import * as React from "react";
import { cn } from "@/lib/utils";
import mark from "@/assets/glintr-mark.png.asset.json";

export function GlintrLogo({
  className,
  showTagline = false,
  markOnly = false,
}: {
  className?: string;
  showTagline?: boolean;
  markOnly?: boolean;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src={mark.url}
        alt="Glintr"
        className="h-8 w-8 object-contain"
        aria-hidden={!markOnly}
      />
      {markOnly ? null : (
        <div className="flex flex-col leading-none">
          <span className="font-display text-xl font-bold tracking-tight">glintr</span>
          {showTagline ? (
            <span className="mt-0.5 text-[10px] font-medium tracking-wider text-muted-foreground">
              LAUNCH · SELL · GROW
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
