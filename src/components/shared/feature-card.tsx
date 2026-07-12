import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: "brand" | "lime" | "violet";
  className?: string;
}

const accentMap = {
  brand: "bg-gradient-brand",
  lime: "bg-gradient-lime",
  violet: "bg-gradient-violet",
} as const;

export function FeatureCard({
  icon: Icon,
  title,
  description,
  accent = "brand",
  className,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "card-elevated hover:card-elevated-hover group p-6 flex flex-col gap-4",
        className,
      )}
    >
      <div
        className={cn(
          "grid size-11 place-items-center rounded-xl text-primary-foreground shadow-sm",
          accentMap[accent],
        )}
        aria-hidden
      >
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-page-title text-[1.125rem]">{title}</h3>
        <p className="text-body text-muted-foreground text-[0.9375rem]">{description}</p>
      </div>
    </article>
  );
}
