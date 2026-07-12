import * as React from "react";
import {
  BriefcaseBusiness,
  Check,
  Clock,
  FileText,
  GraduationCap,
  HeartHandshake,
  LineChart,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { cn } from "@/lib/utils";

const partTime = {
  title: "Part-Time",
  eyebrow: "Flexible income",
  audiences: [
    "Working Professionals",
    "Existing Sales Employees",
    "Students",
    "Freelancers",
    "Affiliate Marketers",
    "People Looking for Additional Income",
  ],
  features: [
    { icon: Clock, label: "Flexible Schedule" },
    { icon: Users, label: "Sell During Free Time" },
    { icon: GraduationCap, label: "Choose Programs" },
    { icon: LineChart, label: "Track Earnings" },
    { icon: HeartHandshake, label: "Revenue Share Model" },
  ],
  cta: { label: "Start Part-Time", href: "/earn/part-time" },
};

const fullTime = {
  title: "Full-Time",
  eyebrow: "Structured career",
  audiences: ["Career sales professionals seeking structured employment"],
  features: [
    { icon: BriefcaseBusiness, label: "Monthly Salary Structure" },
    { icon: FileText, label: "Salary Slips, Offer & Experience Letters" },
    { icon: LineChart, label: "Performance Incentives" },
    { icon: HeartHandshake, label: "PF / ESIC Where Applicable" },
    { icon: GraduationCap, label: "Career Growth" },
  ],
  cta: { label: "Explore Full-Time Opportunities", href: "/earn/full-time" },
};

export function WorkModeSection() {
  return (
    <Section tone="surface" padding="md">
      <Container>
        <SectionHeader
          eyebrow="Part-time or full-time"
          title={
            <>
              Your time. <span className="text-gradient-brand">Your choice.</span>
            </>
          }
          description="Sell in your free hours, or join a structured full-time role. Same platform, different commitment."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card data={partTime} accent="brand" />
          <Card data={fullTime} accent="lime" />
        </div>

        <p className="text-caption text-pretty max-w-3xl mx-auto text-center mt-8">
          Employment benefits, PF, ESIC, salary structure and employment documentation depend
          on the selected role, employment agreement, eligibility and applicable laws.
        </p>
      </Container>
    </Section>
  );
}

function Card({
  data,
  accent,
}: {
  data: typeof partTime;
  accent: "brand" | "lime";
}) {
  return (
    <article className="card-elevated hover-lift p-6 md:p-8 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-label">{data.eyebrow}</span>
        <Badge variant={accent === "brand" ? "certified" : "bestseller"}>{data.title}</Badge>
      </div>
      <h3 className="font-display text-2xl font-semibold">
        <span className={accent === "brand" ? "text-gradient-brand" : "text-brand-lime"}>
          {data.title}
        </span>{" "}
        Path
      </h3>

      <div>
        <p className="text-label mb-2">Best for</p>
        <ul className="flex flex-wrap gap-2">
          {data.audiences.map((a) => (
            <li
              key={a}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-surface-2/50 text-muted-foreground"
            >
              {a}
            </li>
          ))}
        </ul>
      </div>

      <ul className="grid gap-2 border-t border-border pt-4">
        {data.features.map((f) => (
          <li key={f.label} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                "size-6 grid place-items-center rounded-full",
                accent === "brand"
                  ? "bg-gradient-brand text-primary-foreground"
                  : "bg-brand-lime/20 text-brand-lime",
              )}
            >
              <Check className="size-3" />
            </span>
            <f.icon className="size-4 text-muted-foreground" />
            <span>{f.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <Button
          variant={accent === "brand" ? "gradient" : "outline"}
          size="lg"
          className="w-full"
          asChild
        >
          <a href={data.cta.href}>{data.cta.label}</a>
        </Button>
      </div>
    </article>
  );
}
