import { Container, Section, SectionHeader } from "@/components/shared/section";

const STEPS = [
  {
    n: "01",
    title: "Choose",
    body: "Select your earning or business model.",
  },
  {
    n: "02",
    title: "Sell",
    body: "Choose eligible career programs.",
  },
  {
    n: "03",
    title: "Earn",
    body: "Track verified enrollments and revenue.",
  },
  {
    n: "04",
    title: "Grow",
    body: "Get paid or build your own brand.",
  },
];

export function HowItWorksSection() {
  return (
    <Section id="how-it-works" tone="default" padding="lg">
      <Container>
        <SectionHeader
          eyebrow="How it works"
          title={<>Start. Sell. Earn. Grow.</>}
          description="A simple four-step path — from your first program to your own brand."
        />

        <ol className="relative mt-16 grid gap-8 md:grid-cols-4">
          {/* Rail */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-6 right-6 top-6 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.62 0.19 245 / 0.35), transparent)",
            }}
          />
          {STEPS.map((s) => (
            <li key={s.n} className="relative flex flex-col gap-4">
              <span className="grid size-12 place-items-center rounded-full border border-border bg-card text-mono text-sm font-semibold text-primary shadow-sm">
                {s.n}
              </span>
              <h3 className="font-display text-xl font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
