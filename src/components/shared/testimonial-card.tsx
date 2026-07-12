import * as React from "react";
import { Quote, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface TestimonialCardProps {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
  variant?: "default" | "glass";
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  role,
  company,
  avatar,
  rating = 5,
  variant = "default",
  className,
}: TestimonialCardProps) {
  return (
    <figure
      className={cn(
        "rounded-2xl p-6 flex flex-col gap-5 transition-all hover-lift",
        variant === "glass" ? "surface-glass" : "card-elevated",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "size-4",
                i < rating ? "fill-warning text-warning" : "text-border",
              )}
            />
          ))}
        </div>
        <Quote className="size-6 text-primary/40" aria-hidden />
      </div>
      <blockquote className="text-body text-pretty leading-relaxed">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-3 mt-auto">
        <Avatar className="size-10">
          {avatar ? <AvatarImage src={avatar} alt="" /> : null}
          <AvatarFallback>{author.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{author}</span>
          {(role || company) && (
            <span className="text-caption">
              {role}
              {role && company ? " · " : ""}
              {company}
            </span>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
