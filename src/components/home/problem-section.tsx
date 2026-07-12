import * as React from "react";
import {
  AlarmClock,
  ArrowRight,
  Ban,
  ClipboardX,
  Frown,
  Gauge,
  Lock,
  TrendingDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/shared/section";

const problems = [
  { icon: TrendingDown, title: "₹18,000–₹30,000 Salary", desc: "Below what your sales output actually generates." },
  { icon: Gauge, title: "₹1 Lakh+ Monthly Targets", desc: "High revenue expectations on a fixed pay slab." },
  { icon: AlarmClock, title: "Delayed Incentives", desc: "Payouts that arrive one or two cycles late." },
  { icon: Frown, title: "Constant Target Pressure", desc: "Monthly resets that erase last month's wins." },
  { icon: ClipboardX, title: "Limited Career Growth", desc: "Slow promotions, capped variable pay." },
  { icon: Ban, title: "No Ownership", desc: "You build the pipeline, someone else owns the customer." },
  { icon: Lock, title: "Income Controlled by Employer", desc: "Salary structure decides your ceiling — not effort." },
];

export function ProblemSection() {
  return (
    <Section tone="surface" padding="md">
      <Container>
        <SectionHeader
          eyebrow="The reality"
          title={
            <>
              You are already selling.{" "}
              <span className="text-gradient-brand">So why are you earning so little?</span>
            </>
          }
          description="Many talented sales professionals generate lakhs in revenue every month but receive a fixed salary and small incentives."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p) => (
            <li key={p.title} className="card-elevated p-5 hover-lift">
              <div className="size-10 grid place-items-center rounded-lg bg-danger/10 text-danger">
                <p.icon className="size-5" />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">{p.title}</h3>
              <p className="text-caption mt-1 text-pretty">{p.desc}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12 card-elevated p-8 md:p-10 text-center bg-gradient-brand-soft">
          <p className="text-display text-balance max-w-3xl mx-auto">
            You built the sales skill. You created the revenue.{" "}
            <span className="text-gradient-brand">
              It's time your income reflected your performance.
            </span>
          </p>
          <div className="mt-6">
            <Button variant="gradient" size="lg" asChild>
              <a href="#comparison">
                See A Better Way <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
