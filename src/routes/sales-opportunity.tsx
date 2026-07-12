import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, ArrowDown, Users, Briefcase, Rocket, Clock, Network, Filter, LineChart, Wallet, Zap } from "lucide-react";

export const Route = createFileRoute("/sales-opportunity")({
  head: () => ({
    meta: [
      { title: "Sales Opportunity — Use Your Sales Skill Differently | Glintr" },
      { name: "description", content: "Sell eligible Glintr career programs on flexible terms. Earn revenue share from verified successful sales — up to 70% (Own Leads) or up to 50% (Supported Sales)." },
      { property: "og:title", content: "Your Sales Skills Should Create More Opportunities — Glintr" },
      { property: "og:description", content: "Choose eligible career programs, work flexibly, and earn revenue share from verified successful sales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SalesOpportunityPage,
});

const RATE_OWN = 0.7;
const RATE_SUPPORTED = 0.5;
const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n)));

function SalesOpportunityPage() {
  return (
    <main className="bg-white text-foreground">
      <Hero />
      <Calculator />
      <Example />
      <ThreeWays />
      <Flexible />
      <HowItWorks />
      <FinalCTA />
    </main>
  );
}

/* ============ 1. HERO ============ */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-[oklch(0.98_0.02_230)] via-white to-white">
      <div className="absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.9_0.15_215/0.35),transparent_70%)]" aria-hidden />
      <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-3xl">
          <Badge variant="primary" className="mb-5">For Sales Professionals</Badge>
          <h1 className="font-display font-semibold tracking-tight text-4xl md:text-6xl leading-[1.05]">
            Your Sales Skills Should<br />
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-700 bg-clip-text text-transparent">
              Create More Opportunities.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Choose eligible career programs, work flexibly and earn revenue share from verified successful sales.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild>
              <Link to="/join">Start Earning <ArrowRight className="size-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 max-w-xl">
            <RateCard tone="cyan" title="Own Leads" rate="Up to 70%" sub="Revenue share" />
            <RateCard tone="blue" title="Supported Sales" rate="Up to 50%" sub="Revenue share" />
          </div>
        </div>
      </div>
    </section>
  );
}

function RateCard({ tone, title, rate, sub }: { tone: "cyan" | "blue"; title: string; rate: string; sub: string }) {
  const bar = tone === "cyan" ? "from-cyan-400 to-cyan-500" : "from-blue-500 to-blue-700";
  return (
    <div className="relative rounded-xl border bg-white p-4 shadow-sm">
      <div className={`absolute inset-y-0 left-0 w-1 rounded-l-xl bg-gradient-to-b ${bar}`} />
      <div className="pl-3">
        <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">{title}</div>
        <div className="mt-1 font-display text-2xl font-semibold">{rate}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

/* ============ 2. CALCULATOR ============ */
function Calculator() {
  const [salary, setSalary] = useState(25000);
  const [target, setTarget] = useState(300000);
  const [price, setPrice] = useState(15000);
  const [sales, setSales] = useState(6);
  const [model, setModel] = useState<"own" | "supported">("own");

  const eligibleRevenue = price * sales;
  const rate = model === "own" ? RATE_OWN : RATE_SUPPORTED;
  const share = eligibleRevenue * rate;
  const diff = share - salary;

  return (
    <section id="calculator" className="border-b">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <div className="max-w-2xl">
          <Badge variant="muted" className="mb-3">Illustrative Example Only</Badge>
          <h2 className="font-display font-semibold tracking-tight text-3xl md:text-5xl leading-[1.1]">
            What Could Your Sales Effort<br />Look Like Differently?
          </h2>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          {/* Inputs */}
          <Card className="lg:col-span-2 p-6 space-y-5">
            <NumberField id="salary" label="Current Monthly Salary" prefix="₹" value={salary} onChange={setSalary} step={1000} />
            <NumberField id="target" label="Current Monthly Sales Target" prefix="₹" value={target} onChange={setTarget} step={10000} />
            <NumberField id="price" label="Program Selling Price" prefix="₹" value={price} onChange={setPrice} step={1000} />
            <NumberField id="sales" label="Number Of Successful Sales" value={sales} onChange={setSales} step={1} min={0} />
            <div className="space-y-2">
              <Label>Sales Model</Label>
              <RadioGroup value={model} onValueChange={(v) => setModel(v as any)} className="grid grid-cols-2 gap-2">
                <ModelRadio value="own" label="Own Leads" hint="Up to 70%" active={model === "own"} />
                <ModelRadio value="supported" label="Supported Sales" hint="Up to 50%" active={model === "supported"} />
              </RadioGroup>
            </div>
          </Card>

          {/* Results */}
          <Card className="lg:col-span-3 p-8 bg-gradient-to-br from-white to-[oklch(0.97_0.03_230)]">
            <div className="flex items-center justify-between">
              <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">Illustrative Comparison</div>
              <Badge variant="primary">{model === "own" ? "Own Leads · 70%" : "Supported · 50%"}</Badge>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ResultTile label="Current Salary" value={`₹${INR(salary)}`} tone="muted" />
              <ResultTile label="Current Sales Target" value={`₹${INR(target)}`} tone="muted" />
              <ResultTile label="Estimated Eligible Revenue" value={`₹${INR(eligibleRevenue)}`} tone="soft" />
              <ResultTile label="Illustrative Revenue Share" value={`₹${INR(share)}`} tone="accent" big />
            </div>

            <div className="mt-6 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/60 p-5">
              <div className="text-caption font-mono uppercase tracking-widest text-blue-700/80">
                Difference vs. Current Salary
              </div>
              <div className="mt-1 font-display text-3xl md:text-4xl font-semibold text-blue-900">
                {diff >= 0 ? "+" : "−"}₹{INR(Math.abs(diff))}
              </div>
              <p className="mt-1 text-xs text-blue-900/70">
                Based on {sales} successful sales at ₹{INR(price)} each.
              </p>
            </div>

            <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Disclaimer:</strong> Actual earnings depend on eligible verified sales,
              collected revenue, applicable revenue-share rules, refunds and partner terms. This is an illustrative
              example — not a guarantee of income.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild><Link to="/partner/apply">Start As Sales Partner <ArrowRight className="size-4" /></Link></Button>
              <Button variant="outline" asChild><Link to="/programs">Browse Eligible Programs</Link></Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function NumberField({ id, label, value, onChange, step, min = 0, prefix }: { id: string; label: string; value: number; onChange: (n: number) => void; step: number; min?: number; prefix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>}
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className={prefix ? "pl-7 font-mono" : "font-mono"}
        />
      </div>
    </div>
  );
}

function ModelRadio({ value, label, hint, active }: { value: string; label: string; hint: string; active: boolean }) {
  return (
    <label className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition ${active ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
      <RadioGroupItem value={value} />
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </div>
    </label>
  );
}

function ResultTile({ label, value, tone, big }: { label: string; value: string; tone: "muted" | "soft" | "accent"; big?: boolean }) {
  const bg = tone === "accent" ? "bg-white border-cyan-300" : tone === "soft" ? "bg-white" : "bg-transparent border-dashed";
  return (
    <div className={`rounded-lg border ${bg} p-4`}>
      <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display font-semibold ${big ? "text-3xl" : "text-xl"} ${tone === "accent" ? "bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent" : ""}`}>{value}</div>
    </div>
  );
}

/* ============ 3. EXAMPLE ============ */
function Example() {
  return (
    <section className="border-b bg-[oklch(0.98_0.005_240)]">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <div className="max-w-2xl mb-10">
          <Badge variant="muted" className="mb-3">Illustrative Comparison</Badge>
          <h2 className="font-display font-semibold tracking-tight text-3xl md:text-5xl leading-[1.1]">
            A Simple Picture Of<br />What Could Change.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] items-center">
          <Card className="p-6">
            <div className="text-caption font-mono uppercase tracking-widest text-muted-foreground">Your Current Role</div>
            <div className="mt-4 space-y-3">
              <Row label="Monthly Salary" value="₹18,000" />
              <Row label="Monthly Sales Target" value="₹1,00,000" />
              <Row label="Revenue Share" value="—" muted />
            </div>
          </Card>

          <div className="flex md:flex-col items-center justify-center gap-2 text-muted-foreground">
            <ArrowDown className="size-6 md:block hidden" />
            <ArrowRight className="size-6 md:hidden" />
          </div>

          <Card className="p-6 border-cyan-300 bg-gradient-to-br from-white to-cyan-50/40 relative">
            <Badge variant="primary" className="absolute -top-3 left-6">Glintr · Own Leads</Badge>
            <div className="text-caption font-mono uppercase tracking-widest text-blue-700">Sales Partner</div>
            <div className="mt-4 space-y-3">
              <Row label="Sell Eligible Programs" value="Yes" />
              <Row label="Work Schedule" value="Flexible" />
              <Row label="Potential Revenue Share" value={<span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent font-semibold">Up to 70%</span>} />
            </div>
          </Card>
        </div>

        <p className="mt-8 text-xs text-muted-foreground max-w-2xl">
          Use this only as an illustrative comparison. Earnings are calculated on verified successful sales and
          applicable revenue-share rules.
        </p>
      </div>
    </section>
  );
}

function Row({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed last:border-0 pb-2 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

/* ============ 4. THREE WAYS ============ */
function ThreeWays() {
  const ways = [
    {
      icon: Users,
      title: "Sell Glintr Programs",
      desc: "Choose eligible Glintr career programs and sell them using your own network.",
      cta: "Start As Sales Partner",
      to: "/partner/apply" as const,
      tone: "cyan",
    },
    {
      icon: Briefcase,
      title: "Use Supported Opportunities",
      desc: "Work on eligible assigned sales opportunities where available.",
      cta: "Explore Programs",
      to: "/programs" as const,
      tone: "blue",
    },
    {
      icon: Rocket,
      title: "Launch Your Own Brand",
      desc: "Build your own EdTech brand using Glintr infrastructure.",
      cta: "Launch My Brand",
      to: "/launch-your-brand" as const,
      tone: "royal",
    },
  ];
  return (
    <section className="border-b">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <div className="max-w-2xl mb-10">
          <Badge variant="muted" className="mb-3">Three Ways To Work</Badge>
          <h2 className="font-display font-semibold tracking-tight text-3xl md:text-5xl leading-[1.1]">
            Choose How You Want<br />To Use Your Skill.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {ways.map((w) => (
            <Card key={w.title} className="p-6 flex flex-col group hover:border-primary/50 transition">
              <div className={`size-11 rounded-lg flex items-center justify-center mb-4 ${
                w.tone === "cyan" ? "bg-cyan-100 text-cyan-700" :
                w.tone === "blue" ? "bg-blue-100 text-blue-700" :
                "bg-indigo-100 text-indigo-700"
              }`}>
                <w.icon className="size-5" />
              </div>
              <div className="font-display text-xl font-semibold leading-snug">{w.title}</div>
              <p className="mt-2 text-sm text-muted-foreground flex-1">{w.desc}</p>
              <Button variant="outline" className="mt-5 justify-between" asChild>
                <Link to={w.to as any}>{w.cta} <ArrowRight className="size-4" /></Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ 5. FLEXIBLE WORK ============ */
function Flexible() {
  const items = [
    { icon: Clock, label: "Sell Part-Time" },
    { icon: Zap, label: "Work Full-Time" },
    { icon: Network, label: "Use Your Existing Network" },
    { icon: Filter, label: "Choose Eligible Programs" },
    { icon: LineChart, label: "Track Sales" },
    { icon: LineChart, label: "Track Revenue Share" },
    { icon: Wallet, label: "Fast Payout Processing Workflow" },
  ];
  return (
    <section className="border-b bg-[oklch(0.98_0.005_240)]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <div className="max-w-2xl mb-10">
          <Badge variant="muted" className="mb-3">Flexibility</Badge>
          <h2 className="font-display font-semibold tracking-tight text-3xl md:text-5xl leading-[1.1]">
            Work Around Your Time.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Structure how, when and how much you sell — with tools that keep you in control.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div key={i.label} className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
              <div className="size-9 rounded-md bg-gradient-to-br from-cyan-100 to-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <i.icon className="size-4" />
              </div>
              <span className="text-sm font-medium">{i.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ 6. HOW IT WORKS ============ */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Join Glintr", desc: "Create your account and apply as a Sales Partner." },
    { n: "02", title: "Choose Your Sales Model", desc: "Own Leads (up to 70%) or Supported Sales (up to 50%)." },
    { n: "03", title: "Select Programs", desc: "Pick eligible career programs that match your network." },
    { n: "04", title: "Make Eligible Sales And Track Revenue Share", desc: "Verified successful sales become eligible revenue share." },
  ];
  return (
    <section id="how-it-works" className="border-b">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20 lg:py-24">
        <div className="max-w-2xl mb-10">
          <Badge variant="muted" className="mb-3">How It Works</Badge>
          <h2 className="font-display font-semibold tracking-tight text-3xl md:text-5xl leading-[1.1]">
            Four Steps To Start.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.n} className="p-6 relative overflow-hidden">
              <div className="font-mono text-xs text-muted-foreground">STEP {s.n}</div>
              <div className="mt-3 font-display text-lg font-semibold leading-snug">{s.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              <div className="absolute -right-4 -bottom-6 font-display text-[80px] leading-none font-semibold text-blue-50">{i + 1}</div>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button size="lg" asChild>
            <Link to="/join">Start Earning <ArrowRight className="size-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/earn">Learn More About Revenue Share</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ============ 7. FINAL CTA ============ */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.25_0.12_250)] via-[oklch(0.32_0.15_235)] to-[oklch(0.4_0.18_215)]" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,oklch(0.85_0.2_195/0.35),transparent_70%)]" aria-hidden />
      <div className="relative max-w-5xl mx-auto px-6 lg:px-8 py-24 lg:py-28 text-white">
        <h2 className="font-display font-semibold tracking-tight text-4xl md:text-6xl leading-[1.05] max-w-4xl">
          You Already Know How To Sell.
          <br />
          <span className="text-cyan-300">Now Choose How You Want To Use That Skill.</span>
        </h2>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button size="lg" variant="gradient" asChild>
            <Link to="/partner/apply">Become A Sales Partner <ArrowRight className="size-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
            <Link to="/launch-your-brand">Launch My Own Brand</Link>
          </Button>
        </div>
        <p className="mt-8 text-xs text-white/60 max-w-2xl">
          All earnings are based on verified successful sales, collected revenue, applicable revenue-share rules,
          refunds and partner terms. Glintr does not promise guaranteed income.
        </p>
      </div>
    </section>
  );
}
