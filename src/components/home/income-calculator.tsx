import * as React from "react";
import { Calculator, Sparkles, TrendingUp, Users, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { cn } from "@/lib/utils";

type LeadSource = "own" | "company";

interface State {
  salary: number;
  target: number;
  price: number;
  sales: number;
  leadSource: LeadSource;
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
    salary: 18000,
    target: 100000,
    price: 30000,
    sales: 5,
    leadSource: "own",
  });

  const share = computeShare(state.leadSource);
  const revenue = state.price * state.sales;
  const earnings = Math.round(revenue * share);
  const diff = earnings - state.salary;
  const multiplier = state.salary > 0 ? earnings / state.salary : 0;

  const set = <K extends keyof State>(key: K, v: State[K]) =>
    setState((s) => ({ ...s, [key]: v }));

  return (
    <Section id="income-calculator" tone="surface" padding="md">
      <Container>
        <SectionHeader
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <Calculator className="size-3.5" /> Live calculator
            </span>
          }
          title={
            <>
              Your target is ₹1 Lakh. But your salary is ₹18,000?{" "}
              <span className="text-gradient-brand">Let's do the math.</span>
            </>
          }
          description="Move the numbers to match your reality — see what your sales output could earn on a revenue-share model."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Inputs */}
          <article className="card-elevated p-6 md:p-8 flex flex-col gap-5">
            <NumberField
              label="Current Monthly Salary (₹)"
              value={state.salary}
              onChange={(v) => set("salary", v)}
              min={0}
            />
            <NumberField
              label="Current Monthly Sales Target (₹)"
              value={state.target}
              onChange={(v) => set("target", v)}
              min={0}
            />
            <NumberField
              label="Average Course Selling Price (₹)"
              value={state.price}
              onChange={(v) => set("price", v)}
              min={0}
            />
            <div className="flex flex-col gap-2">
              <Label>Expected Number of Sales</Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={state.sales}
                  onChange={(e) => set("sales", Number(e.target.value))}
                  className="flex-1 accent-primary"
                  aria-label="Expected Number of Sales"
                />
                <span className="text-mono text-lg font-semibold w-10 text-right">
                  {state.sales}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Lead Source</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <LeadOption
                  active={state.leadSource === "own"}
                  onClick={() => set("leadSource", "own")}
                  icon={Users}
                  title="I Bring My Own Leads"
                  meta="70% share"
                />
                <LeadOption
                  active={state.leadSource === "company"}
                  onClick={() => set("leadSource", "company")}
                  icon={Sparkles}
                  title="Company Provides Leads"
                  meta="50% share"
                />
              </div>
            </div>
          </article>

          {/* Results */}
          <article className="card-elevated p-6 md:p-8 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-24 -right-24 size-64 rounded-full bg-gradient-brand opacity-20 blur-3xl"
            />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-label">Estimated result</span>
                <Badge variant="certified">
                  {(share * 100).toFixed(0)}% Revenue Share
                </Badge>
              </div>
              <ResultRow label="Total Sales Revenue" value={INR.format(revenue)} />
              <ResultRow
                label="Revenue Share"
                value={`${(share * 100).toFixed(0)}%`}
                subtle
              />
              <div className="rounded-xl border border-primary/30 bg-primary-soft/60 p-5">
                <p className="text-label">Estimated Partner Earnings</p>
                <p className="font-display text-4xl md:text-5xl font-bold text-gradient-brand mt-1">
                  {INR.format(earnings)}
                </p>
                <p className="text-caption mt-1">
                  Based on {state.sales} verified sales at {INR.format(state.price)} each.
                </p>
              </div>
              <ResultRow label="Current Salary" value={INR.format(state.salary)} subtle />
              <ResultRow
                label="Potential Additional Earnings"
                value={INR.format(Math.max(diff, 0))}
                emphasis
              />
              <div className="flex items-center gap-3 rounded-lg bg-brand-lime/15 text-brand-lime border border-brand-lime/30 px-4 py-3">
                <TrendingUp className="size-5" />
                <p className="text-sm">
                  <span className="font-mono font-bold">
                    {multiplier > 0 ? `${multiplier.toFixed(1)}X` : "—"}
                  </span>{" "}
                  your current salary
                </p>
              </div>

              <p className="text-caption text-pretty">
                Earnings shown are estimates based on the sales and revenue-share inputs above.
                Actual earnings depend on successful verified enrollments, applicable program
                terms, cancellations, refunds, taxes, and payout policies.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button variant="gradient" size="md" className="flex-1" asChild>
                  <a href="#three-models">
                    <Wallet className="size-4" /> Start Earning With My Leads
                  </a>
                </Button>
                <Button variant="outline" size="md" className="flex-1" asChild>
                  <a href="#three-models">Need Leads? Explore 50% Model</a>
                </Button>
              </div>
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
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
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
  icon: Icon,
  title,
  meta,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  title: string;
  meta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border p-4 transition-all",
        active
          ? "border-primary bg-primary-soft ring-2 ring-primary/40"
          : "border-border hover:bg-accent",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-caption mt-1">{meta}</p>
    </button>
  );
}

function ResultRow({
  label,
  value,
  subtle,
  emphasis,
}: {
  label: string;
  value: string;
  subtle?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2">
      <span className={cn("text-sm", subtle ? "text-muted-foreground" : "text-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "text-mono font-semibold",
          emphasis ? "text-brand-lime text-lg" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
