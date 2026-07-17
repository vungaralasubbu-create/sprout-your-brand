import * as React from "react";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Layers,
  Megaphone,
  Rocket,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Container, Section, SectionHeader } from "@/components/shared/section";

const features = [
  { icon: TrendingUp, title: "High Revenue Share", desc: "Flat 70% on eligible verified enrollments." },
  { icon: Wallet, title: "Fast Payout Processing", desc: "48-hour payout SLA for eligible earnings." },
  { icon: BookOpen, title: "Career-Focused Programs", desc: "Programs designed for outcomes, not vanity." },
  { icon: LayoutDashboard, title: "Partner Dashboard", desc: "Live sales, verification and payouts in one view." },
  { icon: Megaphone, title: "Marketing Support", desc: "Ready-to-use creatives, scripts and templates." },
  { icon: Layers, title: "White-Label Infrastructure", desc: "Launch your own brand on our full stack." },
  { icon: BarChart3, title: "Flexible Working Options", desc: "Part-time, full-time or as a brand owner." },
  { icon: Rocket, title: "Scalable Business Opportunity", desc: "From a side income to a full EdTech company." },
];

export function WhyChooseUsSection() {
  return (
    <Section tone="surface" padding="md">
      <Container>
        <SectionHeader
          eyebrow="Why Glintr"
          title={
            <>
              Built for sales professionals who want{" "}
              <span className="text-gradient-brand">more than a salary.</span>
            </>
          }
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <li key={f.title} className="card-elevated hover-lift p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
              <p className="text-caption mt-1 text-pretty">{f.desc}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
