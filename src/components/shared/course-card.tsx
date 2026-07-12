import * as React from "react";
import { Clock, PlayCircle, Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CourseCardProps {
  title: string;
  category: string;
  instructor: string;
  price: string;
  originalPrice?: string;
  rating?: number;
  students?: number;
  duration?: string;
  lessons?: number;
  thumbnail?: string;
  badge?: { label: string; variant?: "certified" | "bestseller" | "live" | "default" };
  className?: string;
}

export function CourseCard({
  title,
  category,
  instructor,
  price,
  originalPrice,
  rating = 4.8,
  students,
  duration,
  lessons,
  thumbnail,
  badge,
  className,
}: CourseCardProps) {
  return (
    <article
      className={cn(
        "card-elevated hover:card-elevated-hover group overflow-hidden flex flex-col",
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2 bg-gradient-brand-soft">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="size-full grid place-items-center">
            <PlayCircle className="size-12 text-primary/60" />
          </div>
        )}
        {badge ? (
          <Badge
            variant={badge.variant as never}
            className="absolute left-3 top-3 shadow-sm"
          >
            {badge.label}
          </Badge>
        ) : null}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <p className="text-label">{category}</p>
        <h3 className="font-display text-[1.0625rem] leading-snug font-semibold text-balance line-clamp-2">
          {title}
        </h3>
        <p className="text-caption">by {instructor}</p>
        <div className="flex items-center gap-3 text-caption mt-auto pt-2">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-warning text-warning" />
            <span className="text-foreground font-medium">{rating.toFixed(1)}</span>
          </span>
          {students ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {students.toLocaleString()}
            </span>
          ) : null}
          {duration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {duration}
            </span>
          ) : null}
        </div>
        <div className="flex items-end justify-between border-t border-border pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-mono text-lg font-semibold">{price}</span>
            {originalPrice ? (
              <span className="text-caption line-through">{originalPrice}</span>
            ) : null}
          </div>
          {lessons ? <span className="text-caption">{lessons} lessons</span> : null}
        </div>
      </div>
    </article>
  );
}
