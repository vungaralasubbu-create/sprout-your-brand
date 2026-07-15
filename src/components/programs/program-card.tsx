import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProgramGraphic } from "./category-visuals";
import { formatPrice } from "@/lib/programs";

export interface ProgramCardData {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  level: string | null;
  base_price: number | null;
  offer_price: number | null;
  currency: string | null;
  is_featured: boolean;
  category: { slug: string; name: string };
}

export function ProgramCard({
  course,
  index = 0,
  className,
  compact = false,
}: {
  course: ProgramCardData;
  index?: number;
  className?: string;
  compact?: boolean;
}) {
  const price = course.offer_price ?? course.base_price;
  return (
    <Link
      to="/programs/$category/$course"
      params={{ category: course.category.slug, course: course.slug }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:-translate-y-[3px] hover:border-border-strong hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:translate-y-0 active:scale-[0.995]",
        className,
      )}
    >
      <ProgramGraphic
        categorySlug={course.category.slug}
        seed={index * 7 + (course.name.length % 11)}
        className={cn("w-full", compact ? "h-24" : "h-32")}
      />
      <div className={cn("flex flex-col gap-3 p-5 flex-1", compact && "p-4 gap-2")}>
        <div className="flex items-center gap-2">
          {course.level ? (
            <Badge variant="outline" className="text-[11px]">{course.level}</Badge>
          ) : null}
          {course.is_featured ? (
            <Badge variant="certified" className="text-[11px]">Featured</Badge>
          ) : null}
        </div>
        <h3 className="font-display text-[1.05rem] leading-snug font-semibold line-clamp-2">
          {course.name}
        </h3>
        {!compact && course.short_description ? (
          <p className="text-caption text-muted-foreground line-clamp-2">
            {course.short_description}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between pt-3 border-t border-border/70">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Starts from</div>
            <div className="text-mono text-base font-semibold">
              {price != null ? formatPrice(price, course.currency ?? "INR") : "—"}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-caption text-muted-foreground transition-colors group-hover:text-primary">
            View
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
