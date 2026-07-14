import * as React from "react";
import { Users, Briefcase, GraduationCap, Building2 } from "lucide-react";

import { Section, Container } from "@/components/shared/section";
import { AnimatedCounter } from "@/components/shared/animated-counter";

const STATS = [
  { icon: Users, value: 30, suffix: "K+", label: "Students Assisted" },
  { icon: Briefcase, value: 8, suffix: "+", label: "Years of Experience" },
  { icon: GraduationCap, value: 100, suffix: "+", label: "Industry Experts" },
  { icon: Building2, value: 50, suffix: "+", label: "Partnered Companies" },
];

const MARQUEE_ITEMS = [
  "30K+ Students Assisted",
  "8+ Years of Experience",
  "100+ Industry Experts",
  "50+ Partnered Companies",
  "Career-Focused Learning",
];

export function CourseTrustStats() {
  return (
    <Section className="py-14 lg:py-20 border-y bg-gradient-to-b from-white to-surface-1/50">
      <Container>
        <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
          <span className="text-caption font-mono uppercase tracking-widest text-primary">
            Trusted Experience
          </span>
          <h2 className="mt-3 text-heading-xl lg:text-display-sm font-display font-semibold tracking-tight text-balance">
            Trusted Experience. Built For Career Growth.
          </h2>
          <p className="mt-4 text-muted-foreground text-balance">
            Practical learning, industry-focused programs and career preparation designed
            to help learners build skills that matter.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 lg:gap-y-0 lg:divide-x lg:divide-border/70">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex flex-col items-center text-center px-4 lg:px-6"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-[oklch(0.75_0.15_200)]/10 text-primary mb-3">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="font-display font-semibold tracking-tight text-[clamp(2rem,4vw,2.75rem)] leading-none bg-gradient-to-r from-primary to-[oklch(0.6_0.16_200)] bg-clip-text text-transparent">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-sm font-medium text-muted-foreground">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          30,000+ students assisted through practical, career-focused learning experiences.
        </p>
      </Container>

      <div
        className="mt-10 overflow-hidden border-y border-border/60 bg-surface-1/60 py-3.5"
        aria-hidden="true"
      >
        <div className="flex whitespace-nowrap animate-[glintr-marquee_38s_linear_infinite] motion-reduce:animate-none gap-10">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-10 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground"
            >
              {item}
              <span className="text-primary/60">•</span>
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}
