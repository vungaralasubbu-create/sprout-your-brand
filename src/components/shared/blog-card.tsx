import * as React from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BlogCardProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime?: string;
  thumbnail?: string;
  author?: { name: string; avatar?: string };
  className?: string;
}

export function BlogCard({
  title,
  excerpt,
  category,
  date,
  readTime,
  thumbnail,
  author,
  className,
}: BlogCardProps) {
  return (
    <article className={cn("card-elevated hover:card-elevated-hover group overflow-hidden flex flex-col", className)}>
      <div className="aspect-[16/10] overflow-hidden bg-surface-2 bg-gradient-brand-soft">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-3 text-caption">
          <span className="text-primary font-semibold">{category}</span>
          <span aria-hidden>·</span>
          <span>{date}</span>
          {readTime ? (
            <>
              <span aria-hidden>·</span>
              <span>{readTime}</span>
            </>
          ) : null}
        </div>
        <h3 className="font-display text-lg leading-snug font-semibold text-balance line-clamp-2">
          {title}
        </h3>
        <p className="text-caption text-pretty line-clamp-2">{excerpt}</p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          {author ? (
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-gradient-brand" aria-hidden />
              <span className="text-caption">{author.name}</span>
            </div>
          ) : <span />}
          <span className="story-link text-sm font-semibold text-primary inline-flex items-center gap-1">
            Read <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
