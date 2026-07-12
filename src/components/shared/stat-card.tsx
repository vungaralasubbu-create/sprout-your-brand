import * as React from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  tone?: "default" | "brand" | "success" | "warning" | "danger";
  className?: string;
}

const toneMap = {
  default: "bg-card",
  brand: "bg-primary-soft",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
} as const;

const trendMap = {
  up: { icon: ArrowUpRight, cls: "text-success bg-success-soft" },
  down: { icon: ArrowDownRight, cls: "text-danger bg-danger-soft" },
  flat: { icon: ArrowUpRight, cls: "text-muted-foreground bg-muted" },
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  tone = "default",
  className,
}: StatCardProps) {
  const TrendIcon = trend ? trendMap[trend.direction].icon : null;
  return (
    <div
      className={cn(
        "card-elevated hover:card-elevated-hover p-5 flex flex-col gap-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-label">{label}</p>
        {Icon ? (
          <div
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-lg text-primary",
              toneMap[tone],
            )}
            aria-hidden
          >
            <Icon className="size-4" />
          </div>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-dashboard-title text-mono">{value}</div>
        {trend && TrendIcon ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              trendMap[trend.direction].cls,
            )}
          >
            <TrendIcon className="size-3" />
            {trend.value}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-caption">{hint}</p> : null}
    </div>
  );
}
