import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getGlossaryEntry } from "@/data/glossary";
import { cn } from "@/lib/utils";

interface TermTooltipProps {
  slug: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Lightweight term hover tooltip. Underlines the child text, opens
 * a floating card on hover (desktop) or tap (mobile), and links to
 * the glossary page.
 */
export function TermTooltip({ slug, children, className }: TermTooltipProps) {
  const entry = getGlossaryEntry(slug);
  if (!entry) return <>{children ?? slug}</>;
  const label = children ?? entry.term;
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/glossary/$slug"
            params={{ slug: entry.slug }}
            className={cn(
              "underline decoration-dotted underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors",
              className,
            )}
          >
            {label}
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs rounded-xl border bg-popover text-popover-foreground p-4 shadow-lg"
        >
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary/80 mb-1">
            {entry.category}
          </div>
          <div className="font-display font-semibold text-sm">{entry.term}</div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {entry.short}
          </p>
          <div className="mt-2 text-xs text-primary">Read more →</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
