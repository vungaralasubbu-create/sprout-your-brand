import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight, Linkedin, Quote, ShieldCheck, Star, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { BrandLogo } from "@/components/shared/brand-logo";
import { cn } from "@/lib/utils";
import { fetchSuccessStories, type SuccessStory } from "@/data/cms";

export function SuccessStoriesSection() {
  const { data = [] } = useQuery({
    queryKey: ["home", "success-stories"],
    queryFn: fetchSuccessStories,
  });

  const stories = data.filter((s) => s.published);
  if (stories.length === 0) return null;

  const desktopStories = stories.slice(0, 6);

  return (
    <Section id="stories" tone="surface" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Success stories"
          title={<>Real People. Real Growth.</>}
          description="Stories from partners, brand owners, and career-transition students."
        />

        {/* Desktop & Tablet grid */}
        <div className="mt-12 hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {desktopStories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>

        {/* Mobile: swipeable carousel */}
        <div className="mt-10 md:hidden">
          <MobileStoryCarousel stories={desktopStories} />
        </div>

        <div className="mt-12 flex justify-center">
          <Button variant="outline" size="lg" asChild>
            <a href="/success-stories">
              View All Success Stories <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "GL";
}

export function StoryCard({ story }: { story: SuccessStory }) {
  const rating = story.rating ?? 5;
  const displayName = story.name?.trim() || "Glintr Learner";
  const initials = initialsFor(displayName);
  const [imgOk, setImgOk] = React.useState<boolean>(Boolean(story.avatar));
  const brandPartner = story.company
    ? { name: story.company, slug: story.companySlug, domain: story.companyDomain }
    : null;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Header: rating + quote icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "size-3.5",
                i < rating ? "fill-warning text-warning" : "text-border",
              )}
            />
          ))}
        </div>
        <Quote className="size-5 text-primary/40" aria-hidden />
      </div>

      {/* Quote */}
      <blockquote className="mt-4 flex-1 text-[14.5px] leading-relaxed text-foreground/90">
        &ldquo;{story.quote}&rdquo;
      </blockquote>

      {/* Metric */}
      {(story.previous || story.current) && (
        <div className="mt-4 rounded-xl bg-primary-soft/40 px-3 py-2 text-[12.5px] leading-relaxed">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span>{story.previous}</span>
            <TrendingUp className="size-3 text-success" />
            <span className="font-semibold text-success">{story.current}</span>
          </span>
        </div>
      )}

      {/* Footer: avatar + identity + company logo */}
      <footer className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
        <Avatar className="size-11 ring-2 ring-primary/10">
          {story.avatar && imgOk ? (
            <AvatarImage
              src={story.avatar}
              alt={displayName}
              onError={() => setImgOk(false)}
            />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-[13px] font-semibold text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>


        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-display text-[14.5px] font-semibold">
            {displayName}
            {story.verified ? (
              <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />
            ) : null}
            {story.linkedin ? (
              <a
                href={story.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${displayName} on LinkedIn`}
                className="shrink-0 text-[oklch(0.55_0.18_240)] hover:opacity-80"
              >
                <Linkedin className="size-3.5" />
              </a>
            ) : null}
          </p>
          <p className="truncate text-[12px] text-muted-foreground">
            {story.role}
            {story.company ? ` · ${story.company}` : ""}
          </p>
          {story.course ? (
            <p className="mt-0.5 truncate text-[11px] uppercase tracking-wider text-muted-foreground/80">
              {story.course}
            </p>
          ) : null}
        </div>

        {brandPartner ? (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white px-1.5">
            <BrandLogo partner={brandPartner} />
          </div>
        ) : null}
      </footer>

      {/* Package badge */}
      {story.packageLabel ? (
        <div className="absolute -top-2 right-4">
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-success to-[oklch(0.7_0.18_155)] px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-white shadow-md">
            {story.packageLabel}
          </span>
        </div>
      ) : null}
    </article>
  );
}

function MobileStoryCarousel({ stories }: { stories: SuccessStory[] }) {
  const [active, setActive] = React.useState(0);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const pausedRef = React.useRef(false);
  const programmatic = React.useRef(false);

  // Sync scroll → active
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (programmatic.current) return;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      if (idx !== active && idx >= 0 && idx < stories.length) setActive(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [active, stories.length]);

  // Pause on user interaction
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const pause = () => {
      pausedRef.current = true;
    };
    const resumeSoon = () => {
      window.setTimeout(() => {
        pausedRef.current = false;
      }, 4000);
    };
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resumeSoon, { passive: true });
    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerup", resumeSoon);
    return () => {
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resumeSoon);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("pointerup", resumeSoon);
    };
  }, []);

  // Auto-scroll every 5s
  React.useEffect(() => {
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      const el = scrollerRef.current;
      if (!el) return;
      const next = (active + 1) % stories.length;
      programmatic.current = true;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
      setActive(next);
      window.setTimeout(() => {
        programmatic.current = false;
      }, 500);
    }, 5000);
    return () => window.clearInterval(id);
  }, [active, stories.length]);

  const goTo = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    programmatic.current = true;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    setActive(idx);
    window.setTimeout(() => {
      programmatic.current = false;
    }, 500);
  };

  return (
    <div>
      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {stories.map((s) => (
          <div key={s.id} className="w-full shrink-0 snap-center pr-3 last:pr-0">
            <StoryCard story={s} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(Math.max(0, active - 1))}
          disabled={active === 0}
          aria-label="Previous story"
          className="inline-flex size-8 items-center justify-center rounded-full border border-border/70 bg-white text-foreground shadow-sm transition disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {stories.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to story ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                active === i ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(Math.min(stories.length - 1, active + 1))}
          disabled={active === stories.length - 1}
          aria-label="Next story"
          className="inline-flex size-8 items-center justify-center rounded-full border border-border/70 bg-white text-foreground shadow-sm transition disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
