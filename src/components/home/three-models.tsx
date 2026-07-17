import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/shared/section";

interface Model {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  featured?: boolean;
}

const MODELS: Model[] = [
  {
    eyebrow: "OWN LEADS · 70%",
    title: "Sell With Your Own Leads",
    description:
      "Use your own network to sell eligible career programs and earn revenue share on every successful sale.",
    cta: "Become A Sales Partner",
    href: "/partner/apply",
  },
  {
    eyebrow: "SUPPORTED SALES · UP TO 50%",
    title: "Sell With Supported Opportunities",
    description:
      "Work on eligible supported sales opportunities with CRM tools and sales resources when available.",
    cta: "Explore Supported Sales",
    href: "/sales-opportunity",
    featured: true,
  },
  {
    eyebrow: "YOUR BRAND",
    title: "Launch Your Own EdTech Brand",
    description:
      "Your brand, website, LMS and programs — powered by Glintr's learning and business infrastructure.",
    cta: "Launch My Brand",
    href: "/launch-your-brand",
  },
];

export function ThreeModelsSection() {
  return (
    <Section id="three-models" tone="surface" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="Three ways to grow"
          title={<>Choose How You Want To Grow</>}
          description="Pick the path that fits your ambition — sell with your own leads, get supported, or launch your own brand."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {MODELS.map((m) => (
            <ModelCard key={m.title} model={m} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function ModelCard({ model }: { model: Model }) {
  return (
    <article
      className={
        "group flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg " +
        (model.featured
          ? "border-primary/30 ring-1 ring-primary/10"
          : "border-border")
      }
    >
      <span className="inline-flex w-fit items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-bold tracking-wider text-primary">
        {model.eyebrow}
      </span>
      <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground">
        {model.title}
      </h3>
      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">
        {model.description}
      </p>
      <Button
        variant={model.featured ? "gradient" : "outline"}
        size="md"
        className="mt-8 w-full max-w-full min-w-0 h-auto min-h-10 py-2 px-3 whitespace-normal text-center leading-tight"
        asChild
      >
        <a href={model.href} className="inline-flex items-center justify-center gap-2 min-w-0">
          <span className="min-w-0 break-words">{model.cta}</span>
          <ArrowRight className="size-4 shrink-0" />
        </a>
      </Button>
    </article>
  );
}
