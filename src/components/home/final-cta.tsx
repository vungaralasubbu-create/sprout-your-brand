import * as React from "react";
import { ArrowRight, BookOpen, Handshake, Rocket, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/shared/section";

const paths = [
  {
    icon: BookOpen,
    title: "Explore Programs",
    desc: "Browse career-focused programs and pick your track.",
    href: "/programs",
    cta: "Explore",
  },
  {
    icon: Handshake,
    title: "Earn With My Own Leads",
    desc: "Sell to your network on the 70% revenue-share model.",
    href: "/earn/partner",
    cta: "Become a Partner",
  },
  {
    icon: Users,
    title: "Sell With Company Support",
    desc: "Join the supported sales model with company leads.",
    href: "/earn/company-leads",
    cta: "Join Supported",
  },
  {
    icon: Rocket,
    title: "Launch My Own Brand",
    desc: "White-label EdTech on our full technology stack.",
    href: "/launch",
    cta: "Launch Brand",
  },
];

export function FinalCtaSection() {
  return (
    <Section padding="lg" className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-brand-soft"
      />
      <Container className="relative">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-4">
          <h2 className="text-display text-balance">
            You can keep chasing targets.{" "}
            <span className="text-gradient-brand">
              Or start building something of your own.
            </span>
          </h2>
          <p className="text-subheading text-pretty">
            Choose the path that matches your goals. Every path is on the same platform.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paths.map((p) => (
            <a
              key={p.title}
              href={p.href}
              className="card-elevated hover:card-elevated-hover p-6 flex flex-col gap-3 group"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">
                <p.icon className="size-5" />
              </span>
              <h3 className="font-display text-lg font-semibold">{p.title}</h3>
              <p className="text-caption text-pretty flex-1">{p.desc}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {p.cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-caption max-w-2xl mx-auto">
            Your sales skills should build your income — and eventually, your own brand.
          </p>
          <div className="mt-4">
            <Button variant="gradient" size="lg" asChild>
              <a href="#income-calculator">Start with the Income Calculator</a>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
