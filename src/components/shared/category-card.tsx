import * as React from "react";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CategoryCardProps {
  icon: LucideIcon;
  name: string;
  count?: number | string;
  accent?: "brand" | "lime" | "violet" | "cyan";
  className?: string;
  onClick?: () => void;
}

const accentMap = {
  brand: "from-brand-azure/20 to-brand-royal/20 text-brand-azure",
  lime: "from-brand-lime/25 to-brand-cyan/20 text-brand-lime",
  violet: "from-brand-violet/25 to-brand-royal/20 text-brand-violet",
  cyan: "from-brand-cyan/25 to-brand-azure/20 text-brand-cyan",
} as const;

export function CategoryCard({
  icon: Icon,
  name,
  count,
  accent = "brand",
  className,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "card-elevated hover:card-elevated-hover group relative overflow-hidden text-left p-5 flex items-center gap-4 w-full",
        className,
      )}
    >
      <div
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br",
          accentMap[accent],
        )}
        aria-hidden
      >
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{name}</p>
        {count !== undefined ? (
          <p className="text-caption">{count} courses</p>
        ) : null}
      </div>
      <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}
