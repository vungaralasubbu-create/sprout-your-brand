import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { cn } from "@/lib/utils";

type LeadSource = "own" | "company";

interface State {
  price: number;
  sales: number;
  leadSource: LeadSource;
  salary: number;
}

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function computeShare(source: LeadSource) {
  return source === "own" ? 0.7 : 0.5;
}

export function IncomeCalculator() {
  const [state, setState] = React.useState<State>({
    price: 30000,
    sales: 5,
    leadSource: "own",
    salary: 25000,
  });
  const [compare, setCompare] = React.useState(false);

  const share = computeShare(state.leadSource);
  const revenue = state.price * state.sales;
  const earnings = Math.round(revenue * share);
  const diff = earnings - state.salary;
  const multiplier = state.salary > 0 ? earnings / state.salary : 0;

  const set = <K extends keyof State>(key: K, v: State[K]) =>
    setState((s) => ({ ...s, [key]: v }));

  return (
    <Section id="calculator" tone="surface" padding="lg">
      <Container>
        <SectionHeader
          title={<>What Could Your Sales Skills Earn?</>}
          description="Adjust the inputs to see what a revenue-share model could pay you."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Inputs */}
          <article className="rounded-2xl border border-border bg-card p-7 md:p-9 shadow-sm flex flex-col gap-6">
            <NumberField
              label="Average Program Price (₹)"
              value={state.price}
              onChange={(v) => set("price", v)}
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Number of Sales</Label>
                <span className="text-mono text-base font-semibold text-foreground">
                  {state.sales}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={state.sales}
                onChange={(e) => set("sales", Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Number of sales"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Lead Source</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <LeadOption
                  active={state.leadSource === "own"}
                  onClick={() => set("leadSource", "own")}
                  title="My Own Leads"
                  meta="Up to 70%"
                />
                <LeadOption
                  active={state.leadSource === "company"}
                  onClick={() => set("leadSource", "company")}
                  title="Company Supported"
                  meta="Up to 50%"
                />
              </div>
            </div>
          </article>

          {/* Results */}
          <article className="rounded-2xl border border-border bg-card p-7 md:p-9 shadow-sm">
            <p className="text-label">Estimated Earnings</p>
            <p className="mt-3 font-display text-5xl md:text-6xl font-bold tracking-tight text-gradient-brand">
              {INR.format(earnings)}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Based on {state.sales} sales at {INR.format(state.price)} each.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6">
              <div>
                <dt className="text-label">Total Sales Revenue</dt>
                <dd className="mt-1 text-mono text-lg font-semibold text-foreground">
                  {INR.format(revenue)}
                </dd>
              </div>
              <div>
                <dt className="text-label">Revenue Share</dt>
                <dd className="mt-1 text-mono text-lg font-semibold text-primary">
                  {(share * 100).toFixed(0)}%
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => setCompare((v) => !v)}
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
            >
              Compare With My Current Salary
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  compare && "rotate-180",
                )}
              />
            </button>

            {compare ? (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
                <NumberField
                  label="Current Monthly Salary (₹)"
                  value={state.salary}
                  onChange={(v) => set("salary", v)}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Difference</span>
                  <span className="text-mono font-semibold text-foreground">
                    {INR.format(Math.max(diff, 0))} extra
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Multiplier</span>
                  <span className="text-mono font-semibold text-primary">
                    {multiplier > 0 ? `${multiplier.toFixed(1)}×` : "—"}
                  </span>
                </div>
              </div>
            ) : null}

            <p className="mt-6 text-caption text-pretty">
              Estimates only. Actual earnings depend on verified enrollments,
              program terms, refunds, taxes and payout policies.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button variant="gradient" size="md" className="flex-1" asChild>
                <a href="/#three-models">Start Earning</a>
              </Button>
              <Button variant="outline" size="md" className="flex-1" asChild>
                <a href="/#programs">Explore Programs</a>
              </Button>
            </div>
          </article>
        </div>
      </Container>
    </Section>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="text-mono"
        inputMode="numeric"
      />
    </div>
  );
}

function LeadOption({
  active,
  onClick,
  title,
  meta,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  meta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary-soft ring-2 ring-primary/25"
          : "border-border hover:bg-accent",
      )}
    >
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <p className="text-caption mt-1">{meta}</p>
    </button>
  );
}
