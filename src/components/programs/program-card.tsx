import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Briefcase,
  Clock3,
  GraduationCap,
  Layers,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProgramGraphic } from "./category-visuals";
import { resolvePricingDisplay } from "@/lib/programs";

export interface ProgramCardData {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  level: string | null;
  duration: string | null;
  base_price: number | null;
  offer_price: number | null;
  currency: string | null;
  scholarship_available: boolean;
  pricing_notes: string | null;
  is_featured: boolean;
  is_popular?: boolean | null;
  is_bestseller?: boolean | null;
  is_trending?: boolean | null;
  // Optional enrichment — hidden when null:
  projects_count?: number | null;
  has_certificate?: boolean | null;
  has_internship?: boolean | null;
  has_placement?: boolean | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  enrolled_count?: number | null;
  published_at?: string | null;
  category: { slug: string; name: string };
}

function CtaLabel({ course }: { course: ProgramCardData }) {
  // Rotate CTAs to avoid generic "View" — deterministic per course.
  const options = ["Explore Program", "View Curriculum", "Learn More"] as const;
  const idx = Math.abs(hash(course.slug)) % options.length;
  return <>{options[idx]}</>;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
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
  const pricing = resolvePricingDisplay(course);

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
        <div className="flex flex-wrap items-center gap-1.5">
          {course.level ? (
            <Badge variant="outline" className="text-[11px]">
              <GraduationCap className="mr-1 size-3" /> {course.level}
            </Badge>
          ) : null}
          {course.is_bestseller ? (
            <Badge variant="certified" className="text-[11px]">Bestseller</Badge>
          ) : course.is_featured ? (
            <Badge variant="certified" className="text-[11px]">Featured</Badge>
          ) : course.is_popular ? (
            <Badge variant="primary" className="text-[11px]">Popular</Badge>
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

        {/* Meta strip — only render what's known, never fake */}
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {course.duration ? (
            <li className="inline-flex items-center gap-1">
              <Clock3 className="size-3" /> {course.duration}
            </li>
          ) : null}
          {course.projects_count ? (
            <li className="inline-flex items-center gap-1">
              <Layers className="size-3" /> {course.projects_count} Projects
            </li>
          ) : null}
          {course.rating_avg ? (
            <li className="inline-flex items-center gap-1">
              <Star className="size-3 text-amber-500" />
              {course.rating_avg.toFixed(1)}
              {course.rating_count ? <span className="text-muted-foreground/70">({course.rating_count})</span> : null}
            </li>
          ) : null}
          {course.enrolled_count ? (
            <li className="inline-flex items-center gap-1">
              <Users className="size-3" /> {formatCount(course.enrolled_count)} enrolled
            </li>
          ) : null}
        </ul>

        {/* Support badges (only render truthy) */}
        {course.has_certificate || course.has_internship || course.has_placement ? (
          <div className="flex flex-wrap gap-1.5">
            {course.has_certificate ? (
              <Badge variant="muted" className="text-[10px]">
                <Award className="mr-1 size-3" /> Certificate
              </Badge>
            ) : null}
            {course.has_internship ? (
              <Badge variant="muted" className="text-[10px]">
                <Briefcase className="mr-1 size-3" /> Internship
              </Badge>
            ) : null}
            {course.has_placement ? (
              <Badge variant="muted" className="text-[10px]">
                <GraduationCap className="mr-1 size-3" /> Placement
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            "mt-auto flex items-end justify-between gap-3 pt-3 border-t border-border/70",
            !pricing && "border-transparent pt-1",
          )}
        >
          {pricing ? (
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {pricing.label}
              </div>
              <div className="text-mono text-base font-semibold truncate">
                {pricing.value ?? <span className="text-sm font-medium text-foreground">Enquire</span>}
              </div>
            </div>
          ) : (
            <span aria-hidden />
          )}
          <span className="inline-flex items-center gap-1 text-caption font-medium text-primary/90 transition-colors group-hover:text-primary">
            <CtaLabel course={course} />
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}
