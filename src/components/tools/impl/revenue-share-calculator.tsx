import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ToolShell, ToolCard, FieldLabel, Disclaimer } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { getTool } from "@/data/tools";

const TOOL = getTool("revenue-share-calculator")!;

const MODELS = [
  { id: "70", label: "70% Own Leads", partner: 0.7, note: "You bring the lead. Glintr keeps 30% for operations, delivery and support." },
  { id: "50", label: "50% Supported", partner: 0.5, note: "Glintr provides a qualified lead. Revenue is split evenly under the 50% Supported Model policy." },
];

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.round(n));
}

export function RevenueShareCalculator() {
  const [modelId, setModelId] = React.useState<string>("70");
  const [sale, setSale] = React.useState<number>(30000);
  const [monthly, setMonthly] = React.useState<number>(4);

  const model = MODELS.find((m) => m.id === modelId)!;
  const perSale = sale * model.partner;
  const glintrShare = sale - perSale;
  const monthlyIllustrative = perSale * monthly;

  return (
    <ToolShell tool={TOOL} aiPrompt="Compare the 70% Own-Leads and 50% Supported models in plain language.">
      <ToolCard title="Inputs">
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <FieldLabel>Model</FieldLabel>
            <div className="mt-2 grid gap-2">
              {MODELS.map((m) => (
                <label key={m.id} className={"flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm " + (m.id === modelId ? "border-primary bg-primary/5" : "border-border")}>
                  <input type="radio" name="model" checked={m.id === modelId} onChange={() => setModelId(m.id)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="sale">Sample sale value (INR)</FieldLabel>
            <Input id="sale" type="number" min={1000} max={5_000_000} value={sale} onChange={(e) => setSale(Math.max(0, Number(e.target.value) || 0))} className="mt-2" />
          </div>
          <div>
            <FieldLabel htmlFor="monthly">Illustrative monthly sales</FieldLabel>
            <Input id="monthly" type="number" min={0} max={200} value={monthly} onChange={(e) => setMonthly(Math.max(0, Number(e.target.value) || 0))} className="mt-2" />
          </div>
        </div>
      </ToolCard>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Stat label="Partner share per sale" value={inr(perSale)} accent="from-[#00E6FF] to-[#2E5CFF]" />
        <Stat label="Glintr share per sale" value={inr(glintrShare)} accent="from-[#2E5CFF] to-[#7CFF6B]" />
        <Stat label={`Illustrative × ${monthly}/month`} value={inr(monthlyIllustrative)} accent="from-[#7CFF6B] to-[#00E6FF]" />
      </div>

      <ToolCard
        title="How this split works"
        footer={
          <Disclaimer>
            Examples only. No earnings are guaranteed. Actual splits, timing and eligibility follow the{" "}
            <Link to="/revenue-share-terms" className="underline">Revenue Share Terms</Link> and{" "}
            <Link to="/payout-policy" className="underline">Payout Policy</Link>.
          </Disclaimer>
        }
      >
        <p className="text-sm text-muted-foreground">{model.note}</p>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <Link to="/70-revenue-model" className="rounded-lg border border-border bg-background p-3 hover:border-primary">→ 70% Revenue Model page</Link>
          <Link to="/50-supported-model" className="rounded-lg border border-border bg-background p-3 hover:border-primary">→ 50% Supported Model page</Link>
          <Link to="/income-calculator" className="rounded-lg border border-border bg-background p-3 hover:border-primary">→ Full Income Calculator</Link>
          <Link to="/payout-system" className="rounded-lg border border-border bg-background p-3 hover:border-primary">→ Payout System</Link>
        </div>
      </ToolCard>
    </ToolShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-caption text-muted-foreground">{label}</div>
      <div className={"mt-2 bg-gradient-to-br bg-clip-text text-3xl font-black text-transparent " + accent}>{value}</div>
    </div>
  );
}
