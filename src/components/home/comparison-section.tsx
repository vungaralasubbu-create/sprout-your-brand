import * as React from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { cn } from "@/lib/utils";

const traditional = [
  "Fixed Salary",
  "₹18,000–₹30,000 Typical Pay",
  "₹1 Lakh+ Targets",
  "Small Incentives",
  "Monthly Salary Cycle",
  "Manager Pressure",
  "No Business Ownership",
  "Limited Flexibility",
];

const ours = [
  "Up to 70% Revenue Share",
  "Income Based on Sales",
  "Payout Within 48 Hours",
  "Work On Your Own Time",
  "No Joining Fee",
  "Choose Your Programs",
  "Track Earnings Live",
  "Launch Your Own Brand",
];

export function ComparisonSection() {
  return (
    <Section id="comparison" padding="md">
      <Container>
        <SectionHeader
          eyebrow="Old model vs new model"
          title="Traditional sales job vs the Glintr Partner Model"
          description="Same skill. Radically different outcomes."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Column
            title="Traditional Sales Job"
            items={traditional}
            tone="muted"
            icon={X}
          />
          <Column
            title="Our Sales Partner Model"
            items={ours}
            tone="brand"
            icon={Check}
            highlighted
          />
        </div>
        <div className="mt-10 text-center">
          <Button variant="gradient" size="lg" asChild>
            <a href="#income-calculator">Calculate What I Could Earn</a>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

function Column({
  title,
  items,
  tone,
  icon: Icon,
  highlighted,
}: {
  title: string;
  items: string[];
  tone: "muted" | "brand";
  icon: typeof Check;
  highlighted?: boolean;
}) {
  return (
    <article
      className={cn(
        "card-elevated p-6 md:p-8 relative overflow-hidden",
        highlighted && "ring-brand",
      )}
    >
      {highlighted ? (
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-56 rounded-full bg-gradient-brand opacity-20 blur-3xl"
        />
      ) : null}
      <p className="text-label">{highlighted ? "Recommended" : "Legacy"}</p>
      <h3
        className={cn(
          "font-display text-2xl font-semibold mt-2",
          highlighted && "text-gradient-brand",
        )}
      >
        {title}
      </h3>
      <ul className="mt-6 flex flex-col gap-3">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-3">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full",
                tone === "brand"
                  ? "bg-gradient-brand text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <span
              className={cn(
                "text-sm",
                tone === "muted" ? "text-muted-foreground line-through" : "text-foreground",
              )}
            >
              {it}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
