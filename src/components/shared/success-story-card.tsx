import * as React from "react";
import { Quote, TrendingUp } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface SuccessStoryCardProps {
  name: string;
  before: string;
  after: string;
  quote: string;
  metric: { label: string; value: string };
  avatar?: string;
  className?: string;
}

export function SuccessStoryCard({
  name,
  before,
  after,
  quote,
  metric,
  avatar,
  className,
}: SuccessStoryCardProps) {
  return (
    <article className={cn("card-elevated hover:card-elevated-hover p-6 flex flex-col gap-5", className)}>
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          {avatar ? <AvatarImage src={avatar} alt="" /> : null}
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-caption inline-flex items-center gap-1.5">
            <span>{before}</span>
            <TrendingUp className="size-3 text-success" />
            <span className="text-success font-semibold">{after}</span>
          </p>
        </div>
      </div>
      <div className="relative rounded-xl bg-primary-soft/50 p-4">
        <Quote className="size-4 text-primary mb-2" />
        <p className="text-sm text-pretty leading-relaxed">{quote}</p>
      </div>
      <div className="flex items-end justify-between border-t border-border pt-4">
        <span className="text-label">{metric.label}</span>
        <span className="text-gradient-brand font-display text-2xl font-bold">{metric.value}</span>
      </div>
    </article>
  );
}
