import * as React from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PricingCardProps {
  name: string;
  description?: string;
  price: string;
  period?: string;
  features: string[];
  cta?: { label: string; onClick?: () => void };
  featured?: boolean;
  badge?: string;
  className?: string;
}

export function PricingCard({
  name,
  description,
  price,
  period = "/mo",
  features,
  cta = { label: "Get started" },
  featured,
  badge,
  className,
}: PricingCardProps) {
  return (
    <article
      className={cn(
        "relative rounded-2xl p-7 flex flex-col gap-6 transition-all",
        featured
          ? "bg-gradient-brand text-primary-foreground shadow-xl ring-brand"
          : "card-elevated hover:card-elevated-hover",
        className,
      )}
    >
      {badge ? (
        <Badge
          className={cn(
            "absolute -top-3 right-6",
            featured ? "bg-background text-foreground" : "",
          )}
        >
          {badge}
        </Badge>
      ) : null}
      <div className="flex flex-col gap-2">
        <h3 className="text-dashboard-title">{name}</h3>
        {description ? (
          <p
            className={cn(
              "text-sm",
              featured ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold tracking-tight">{price}</span>
        <span
          className={cn(
            "text-sm",
            featured ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {period}
        </span>
      </div>
      <ul className="flex flex-col gap-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check
              className={cn(
                "size-4 mt-0.5 shrink-0",
                featured ? "text-primary-foreground" : "text-success",
              )}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={featured ? "secondary" : "gradient"}
        size="lg"
        className="mt-auto w-full"
        onClick={cta.onClick}
      >
        {cta.label}
      </Button>
    </article>
  );
}
