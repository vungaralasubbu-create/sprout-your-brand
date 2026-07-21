import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Glintr Badge system. Covers status, featured, and marketing labels.
 * Every color comes from semantic tokens — safe in light and dark mode.
 */
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-full border font-semibold",
    "text-[11px] leading-none tracking-wide uppercase",
    "px-2.5 py-1 whitespace-nowrap select-none",
    "transition-colors",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border-strong bg-transparent text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        primary: "border-transparent bg-primary-soft text-primary",
        success: "border-transparent bg-success-soft text-success",
        warning: "border-transparent bg-warning-soft text-warning",
        danger: "border-transparent bg-danger-soft text-danger",
        info: "border-transparent bg-info-soft text-info",
        featured:
          "border-transparent bg-gradient-brand text-primary-foreground shadow-sm",
        new: "border-transparent bg-brand-lime/20 text-brand-lime",
        popular: "border-transparent bg-brand-violet/20 text-brand-violet",
        bestseller: "border-transparent bg-warning-soft text-warning",
        trending: "border-transparent bg-brand-cyan/20 text-brand-cyan",
        certified: "border-transparent bg-info-soft text-info",
        premium:
          "border-transparent bg-gradient-violet text-primary-foreground shadow-sm",
        upcoming: "border-border-strong bg-surface-2 text-muted-foreground",
        live: "border-transparent bg-danger-soft text-danger",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-danger-soft text-danger",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-[11px] px-2.5 py-1",
        lg: "text-xs px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

function Badge({
  className,
  variant,
  size,
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot ? (
        <span
          className={cn(
            "inline-block size-1.5 rounded-full bg-current",
            pulse && "animate-pulse-ring",
          )}
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
