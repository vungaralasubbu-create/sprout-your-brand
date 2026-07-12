import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Quote, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { fetchSuccessStories, type SuccessStory } from "@/data/cms";

export function SuccessStoriesSection() {
  const { data = [] } = useQuery({
    queryKey: ["home", "success-stories"],
    queryFn: fetchSuccessStories,
  });

  const stories = data.filter((s) => s.published).slice(0, 3);

  // Hide entire section when no approved published stories exist.
  if (stories.length === 0) return null;

  return (
    <Section id="stories" tone="surface" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Success stories"
          title={<>Real People. Real Growth.</>}
          description="Stories from partners, brand owners, and career-transition students."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
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

function StoryCard({ story }: { story: SuccessStory }) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
      <Quote className="size-5 text-primary/70" />
      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground/90">
        {story.quote}
      </p>
      <div className="mt-6 border-t border-border pt-5">
        <p className="font-display text-base font-semibold text-foreground flex items-center gap-2">
          {story.name}
          {story.verified ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="size-3" /> Verified
            </span>
          ) : null}
        </p>
        <p className="text-caption mt-0.5">{story.role}</p>
        <div className="mt-3 flex flex-col gap-1 text-[13px] leading-relaxed">
          <p className="text-muted-foreground">
            <span className="text-label mr-1">Before</span>
            {story.previous}
          </p>
          <p className="text-foreground/85">
            <span className="text-label mr-1 text-primary">Now</span>
            {story.current}
          </p>
        </div>
      </div>
    </article>
  );
}
