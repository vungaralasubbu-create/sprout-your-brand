import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void };
  className?: string;
  variant?: "empty" | "error";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "empty",
}: EmptyStateProps) {
  const Fallback = variant === "error" ? AlertTriangle : Inbox;
  const RenderIcon = Icon ?? Fallback;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-4 py-14 px-6 rounded-xl border border-dashed border-border",
        className,
      )}
    >
      <div
        className={cn(
          "grid size-14 place-items-center rounded-2xl",
          variant === "error" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary",
        )}
        aria-hidden
      >
        <RenderIcon className="size-6" />
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description ? <p className="text-caption">{description}</p> : null}
      </div>
      {action ? (
        <Button variant="gradient" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingSkeleton({
  className,
  rows = 3,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-shimmer h-4 w-full rounded-md" />
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin",
        className,
      )}
    />
  );
}
