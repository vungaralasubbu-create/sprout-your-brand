import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Section + Container primitives — every marketing/dashboard page uses these.
 * Enforces the 8pt spacing rhythm and max-width tiers.
 */

const sectionVariants = cva("relative w-full", {
  variants: {
    tone: {
      default: "bg-background text-foreground",
      surface: "bg-surface text-foreground",
      surface2: "bg-surface-2 text-foreground",
      inverse: "bg-secondary text-secondary-foreground",
      mesh: "bg-background bg-mesh text-foreground",
      gradient: "bg-gradient-brand text-primary-foreground",
    },
    padding: {
      none: "",
      sm: "py-10 md:py-14",
      md: "py-16 md:py-24",
      lg: "py-20 md:py-32",
      xl: "py-24 md:py-40",
    },
  },
  defaultVariants: {
    tone: "default",
    padding: "md",
  },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: "section" | "div" | "header" | "footer";
}

export function Section({
  className,
  tone,
  padding,
  as: Comp = "section",
  ...props
}: SectionProps) {
  return <Comp className={cn(sectionVariants({ tone, padding }), className)} {...props} />;
}

const containerVariants = cva("mx-auto w-full px-6 md:px-8", {
  variants: {
    size: {
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-6xl",
      xl: "max-w-7xl",
      full: "max-w-[1440px]",
    },
  },
  defaultVariants: { size: "xl" },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export function Container({ className, size, ...props }: ContainerProps) {
  return <div className={cn(containerVariants({ size }), className)} {...props} />;
}

interface SectionHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 max-w-3xl",
        align === "center" && "mx-auto text-center items-center",
        className,
      )}
    >
      {eyebrow ? <div className="text-label text-primary">{eyebrow}</div> : null}
      <h2 className="text-section text-balance">{title}</h2>
      {description ? <p className="text-subheading text-pretty">{description}</p> : null}
    </div>
  );
}
