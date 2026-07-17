import * as React from "react";
import {
  Award,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Linkedin,
  MapPin,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";

import { Container, Section, SectionHeader } from "@/components/shared/section";
import { BrandLogo } from "@/components/shared/brand-logo";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  initialsAvatarUrl,
  useSuccessStories,
  type SuccessStoryRow,
} from "@/lib/success-stories/hooks";

interface SuccessStoriesShowcaseProps {
  /** Filter to a single course category slug, e.g. "artificial-intelligence". */
  courseCategory?: string | null;
  /** Optional eyebrow / title / description overrides. */
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  /** Hide the top KPI metrics band. Defaults to `true` on course pages. */
  showMetrics?: boolean;
  /** Hide search + filters band. Defaults to `true`. */
  showFilters?: boolean;
  /** Cap the number of stories rendered on desktop. */
  maxItems?: number;
}

const ALL = "__all__";

export function SuccessStoriesShowcase({
  courseCategory = null,
  eyebrow = "Success stories",
  title = <>Real learners. Real placements.</>,
  description = "Every card is a real Glintr graduate — verified role, verified company, verified package.",
  showMetrics = true,
  showFilters = true,
  maxItems,
}: SuccessStoriesShowcaseProps) {
  const { data: allStories = [], isLoading } = useSuccessStories();

  const scoped = React.useMemo(() => {
    if (!courseCategory) return allStories;
    return allStories.filter((s) => s.course_category === courseCategory);
  }, [allStories, courseCategory]);

  // Fall back to full list if no stories match this course category yet — never show empty.
  const source = scoped.length > 0 ? scoped : allStories;

  const [q, setQ] = React.useState("");
  const [company, setCompany] = React.useState<string>(ALL);
  const [course, setCourse] = React.useState<string>(ALL);
  const [salary, setSalary] = React.useState<string>(ALL);
  const [location, setLocation] = React.useState<string>(ALL);
  const [year, setYear] = React.useState<string>(ALL);

  const companies = React.useMemo(
    () => Array.from(new Set(source.map((s) => s.company).filter(Boolean))).sort(),
    [source],
  );
  const courses = React.useMemo(
    () => Array.from(new Set(source.map((s) => s.course).filter(Boolean))).sort(),
    [source],
  );
  const locations = React.useMemo(
    () => Array.from(new Set(source.map((s) => s.location).filter(Boolean))) as string[],
    [source],
  );
  const years = React.useMemo(
    () =>
      Array.from(new Set(source.map((s) => s.graduation_year).filter(Boolean)))
        .sort((a, b) => (b as number) - (a as number)) as number[],
    [source],
  );

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return source.filter((s) => {
      if (needle) {
        const hay = `${s.name} ${s.company} ${s.course}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (company !== ALL && s.company !== company) return false;
      if (course !== ALL && s.course !== course) return false;
      if (location !== ALL && s.location !== location) return false;
      if (year !== ALL && String(s.graduation_year) !== year) return false;
      if (salary !== ALL) {
        const lpa = s.package_lpa ?? 0;
        if (salary === "0-8" && !(lpa < 8)) return false;
        if (salary === "8-15" && !(lpa >= 8 && lpa < 15)) return false;
        if (salary === "15-25" && !(lpa >= 15 && lpa < 25)) return false;
        if (salary === "25+" && !(lpa >= 25)) return false;
      }
      return true;
    });
  }, [source, q, company, course, location, year, salary]);

  const visible = maxItems ? filtered.slice(0, maxItems) : filtered;
  const activeFilters =
    (q ? 1 : 0) +
    (company !== ALL ? 1 : 0) +
    (course !== ALL ? 1 : 0) +
    (location !== ALL ? 1 : 0) +
    (year !== ALL ? 1 : 0) +
    (salary !== ALL ? 1 : 0);

  const resetFilters = () => {
    setQ("");
    setCompany(ALL);
    setCourse(ALL);
    setSalary(ALL);
    setLocation(ALL);
    setYear(ALL);
  };

  if (!isLoading && allStories.length === 0) return null;

  return (
    <Section id="success-stories" tone="surface" padding="lg">
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />

        {showMetrics ? <MetricsBand /> : null}

        {showFilters ? (
          <div className="mt-8 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-card/50">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search student, company or course"
                  className="pl-9"
                />
              </div>
              <FilterSelect
                value={company}
                onChange={setCompany}
                label="Company"
                options={companies}
              />
              <FilterSelect
                value={course}
                onChange={setCourse}
                label="Course"
                options={courses}
              />
              <Select value={salary} onValueChange={setSalary}>
                <SelectTrigger>
                  <SelectValue placeholder="Salary" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any salary</SelectItem>
                  <SelectItem value="0-8">Below ₹8 LPA</SelectItem>
                  <SelectItem value="8-15">₹8 – ₹15 LPA</SelectItem>
                  <SelectItem value="15-25">₹15 – ₹25 LPA</SelectItem>
                  <SelectItem value="25+">₹25 LPA +</SelectItem>
                </SelectContent>
              </Select>
              <FilterSelect
                value={location}
                onChange={setLocation}
                label="Location"
                options={locations}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={activeFilters === 0}
                onClick={resetFilters}
                className="justify-self-end"
              >
                <X className="size-4" /> Clear
              </Button>
            </div>
            {years.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Year
                </span>
                <Chip active={year === ALL} onClick={() => setYear(ALL)}>
                  All
                </Chip>
                {years.map((y) => (
                  <Chip
                    key={y}
                    active={year === String(y)}
                    onClick={() => setYear(String(y))}
                  >
                    {y}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Desktop / tablet grid */}
        <div className="mt-8 hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <StoryCardSkeleton key={i} />)
            : visible.map((s, i) => (
                <PremiumStoryCard key={s.id} story={s} index={i} />
              ))}
        </div>

        {/* Mobile swipeable carousel */}
        <div className="mt-8 md:hidden">
          {isLoading ? (
            <StoryCardSkeleton />
          ) : (
            <MobileStoryCarousel stories={visible} />
          )}
        </div>

        {!isLoading && visible.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card/50 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No stories match these filters yet.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4">
              Clear filters
            </Button>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

/* ---------------- Metrics band ---------------- */

function MetricsBand() {
  const metrics: Array<{
    label: string;
    value: number;
    suffix?: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { label: "Paid Learners", value: 100000, suffix: "+", icon: GraduationCap },
    { label: "Hiring Partners", value: 5000, suffix: "+", icon: Briefcase },
    { label: "Completion Rate", value: 95, suffix: "%", icon: Award },
    { label: "Programs", value: 120, suffix: "+", icon: Sparkles },
  ];
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:p-5"
          >
            <div className="absolute -right-6 -top-6 size-20 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4 text-primary" />
              <span className="text-[11px] uppercase tracking-wider">{m.label}</span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              <AnimatedCounter value={m.value} suffix={m.suffix} />
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Filter helpers ---------------- */

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-foreground/80 hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */

export function PremiumStoryCard({
  story,
  index = 0,
}: {
  story: SuccessStoryRow;
  index?: number;
}) {
  const name = story.name?.trim() || "Glintr Learner";
  const src = story.avatar_url || initialsAvatarUrl(name);
  const [imgSrc, setImgSrc] = React.useState<string>(src);

  const brandPartner = story.company
    ? {
        name: story.company,
        slug: story.company_slug ?? undefined,
        domain: story.company_domain ?? undefined,
      }
    : null;

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white/70 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_20px_40px_-12px_rgba(15,23,42,0.20)] animate-fade-in"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      {/* Glow ring on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-primary/25 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/10 blur-3xl transition-all duration-500 group-hover:bg-primary/20" />

      {/* Package badge */}
      {story.package_label ? (
        <div className="absolute right-4 top-4 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md">
            <TrendingUp className="size-3" />
            {story.package_label}
          </span>
        </div>
      ) : null}

      {/* Course badge */}
      {story.course ? (
        <div className="relative z-10 mb-4 flex flex-wrap items-center gap-1.5">
          <Badge variant="info" className="rounded-full bg-primary/10 text-[10.5px] font-medium uppercase tracking-wider text-primary hover:bg-primary/15">
            {story.course}
          </Badge>
          {story.batch ? (
            <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              {story.batch}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Rating */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-0.5" aria-label={`${story.rating} out of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "size-3.5",
                i < story.rating ? "fill-amber-400 text-amber-400" : "text-border",
              )}
            />
          ))}
        </div>
        <Quote className="size-5 text-primary/40" aria-hidden />
      </div>

      {/* Quote */}
      <blockquote className="relative z-10 mt-3 flex-1 text-[14.5px] leading-relaxed text-foreground/90">
        &ldquo;{story.quote}&rdquo;
      </blockquote>

      {/* Meta line */}
      {(story.location || story.graduation_year) ? (
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
          {story.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" /> {story.location}
            </span>
          ) : null}
          {story.graduation_year ? (
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="size-3" /> Class of {story.graduation_year}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Footer */}
      <footer className="relative z-10 mt-5 flex items-center gap-3 border-t border-border/50 pt-4">
        <img
          src={imgSrc}
          alt={name}
          onError={() => setImgSrc(initialsAvatarUrl(name))}
          className="size-11 shrink-0 rounded-full object-cover ring-2 ring-primary/10"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-display text-[14.5px] font-semibold">
            {name}
            <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />
            {story.linkedin_url ? (
              <a
                href={story.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} on LinkedIn`}
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
        </div>
        {brandPartner ? (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white p-1.5">
            <BrandLogo partner={brandPartner} />
          </div>
        ) : null}
      </footer>

      {story.story_url ? (
        <a
          href={story.story_url}
          className="relative z-10 mt-4 inline-flex items-center text-[12.5px] font-medium text-primary hover:underline"
        >
          View success story →
        </a>
      ) : null}
    </article>
  );
}

function StoryCardSkeleton() {
  return (
    <div className="h-[320px] animate-pulse rounded-2xl border border-border/60 bg-card/40" />
  );
}

/* ---------------- Mobile carousel ---------------- */

function MobileStoryCarousel({ stories }: { stories: SuccessStoryRow[] }) {
  const [active, setActive] = React.useState(0);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const pausedRef = React.useRef(false);
  const programmatic = React.useRef(false);

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

  React.useEffect(() => {
    if (stories.length <= 1) return;
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

  if (stories.length === 0) return null;

  return (
    <div>
      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {stories.map((s, i) => (
          <div key={s.id} className="w-full shrink-0 snap-center pr-3 last:pr-0">
            <PremiumStoryCard story={s} index={i} />
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
