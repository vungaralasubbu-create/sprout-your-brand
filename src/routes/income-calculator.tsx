import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, ArrowRight } from "lucide-react";

import { Section, Container, SectionHeader } from "@/components/shared/section";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/income-calculator")({
  head: () => ({
    meta: [
      { title: "Partner Income Calculator — Glintr" },
      {
        name: "description",
        content:
          "Calculate your Glintr Partner revenue share. Choose the 70% Revenue Model or the 50% Supported Model and see your share based on eligible revenue.",
      },
      { property: "og:title", content: "Partner Income Calculator — Glintr" },
      {
        property: "og:description",
        content:
          "Choose your Glintr Partner model and see your revenue share based on eligible revenue.",
      },
    ],
  }),
  component: IncomeCalculatorPage,
});

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function IncomeCalculatorPage() {
  const [model, setModel] = React.useState<"70" | "50">("70");
  const [revenue, setRevenue] = React.useState<number>(100000);

  const rate = model === "70" ? 0.7 : 0.5;
  const partnerShare = Math.max(0, Math.round(revenue * rate));
  const glintrShare = Math.max(0, Math.round(revenue * (1 - rate)));

  return (
    <>
      <SiteHeader />
      <main>
        <Section spacing="lg">
          <Container>
            <SectionHeader
              eyebrow="Partner Income Calculator"
              title="Calculate Your Revenue Share"
              description="Choose your Glintr Partner model and see your revenue share based on eligible revenue."
              align="center"
            />

            <div className="mx-auto mt-12 max-w-4xl">
              <Tabs value={model} onValueChange={(v) => setModel(v as "70" | "50")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="70">70% Revenue Model</TabsTrigger>
                  <TabsTrigger value="50">50% Supported Model</TabsTrigger>
                </TabsList>

                <TabsContent value="70" className="mt-8">
                  <CalculatorPanel
                    revenue={revenue}
                    setRevenue={setRevenue}
                    partnerShare={partnerShare}
                    glintrShare={glintrShare}
                    partnerPct={70}
                    glintrPct={30}
                  />
                </TabsContent>
                <TabsContent value="50" className="mt-8">
                  <CalculatorPanel
                    revenue={revenue}
                    setRevenue={setRevenue}
                    partnerShare={partnerShare}
                    glintrShare={glintrShare}
                    partnerPct={50}
                    glintrPct={50}
                  />
                </TabsContent>
              </Tabs>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/70-revenue-model">Explore 70% Model</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/50-supported-model">Explore 50% Supported Model</Link>
                </Button>
                <Button asChild>
                  <Link to="/earn">
                    Become A Partner <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <p className="mt-8 text-center text-caption text-muted-foreground">
                Illustrative calculation based on eligible revenue. Actual payouts are subject to
                verified enrollments, program eligibility, and applicable Glintr policies.
              </p>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

function CalculatorPanel({
  revenue,
  setRevenue,
  partnerShare,
  glintrShare,
  partnerPct,
  glintrPct,
}: {
  revenue: number;
  setRevenue: (v: number) => void;
  partnerShare: number;
  glintrShare: number;
  partnerPct: number;
  glintrPct: number;
}) {
  return (
    <Card>
      <CardContent className="p-6 md:p-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <Label htmlFor="revenue" className="text-sm font-medium">
              Eligible Revenue (₹)
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-muted-foreground" aria-hidden />
              <Input
                id="revenue"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={Number.isFinite(revenue) ? revenue : 0}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setRevenue(Number.isFinite(n) && n >= 0 ? n : 0);
                }}
              />
            </div>
            <p className="mt-2 text-caption text-muted-foreground">
              Enter eligible revenue to see your share.
            </p>

            <div className="mt-8 space-y-4" aria-live="polite">
              <Row label="Eligible Revenue" value={INR.format(revenue || 0)} />
              <Row
                label="Your Revenue Share"
                value={INR.format(partnerShare)}
                emphasized
              />
              <Row label="Glintr Share" value={INR.format(glintrShare)} />
            </div>
          </div>

          <div>
            <div className="rounded-2xl border bg-muted/30 p-6">
              <p className="text-caption uppercase tracking-wide text-muted-foreground">
                Revenue Split
              </p>
              <div className="mt-6 flex items-end justify-center gap-3">
                <SplitBlock label="Partner" pct={partnerPct} tone="primary" />
                <SplitBlock label="Glintr" pct={glintrPct} tone="muted" />
              </div>
              <p className="mt-6 text-center text-caption text-muted-foreground">
                {partnerPct === 70
                  ? "70% Revenue Model — you own your leads."
                  : "50% Supported Model — performance-based lead opportunities subject to qualification and availability."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b pb-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          emphasized
            ? "text-2xl font-semibold tracking-tight"
            : "text-base font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}

function SplitBlock({
  label,
  pct,
  tone,
}: {
  label: string;
  pct: number;
  tone: "primary" | "muted";
}) {
  const height = 40 + pct * 2; // 80 to 240
  return (
    <div className="flex flex-col items-center">
      <div
        className={
          tone === "primary"
            ? "w-24 rounded-t-xl bg-primary"
            : "w-24 rounded-t-xl bg-muted-foreground/30"
        }
        style={{ height }}
        aria-hidden
      />
      <div className="mt-2 text-2xl font-semibold">{pct}%</div>
      <div className="text-caption text-muted-foreground">{label}</div>
    </div>
  );
}
