import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Sparkles,
  Award,
  TrendingUp,
  ScrollText,
  Search,
  Share2,
  Calculator,
  Info,
  CheckCircle2,
  Clock,
  Gift,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getAmbassadorCommissionStructure,
  getAmbassadorCommissionRuleDetails,
  estimateAmbassadorCommission,
  PRICING_PLANS,
  PRICING_PLAN_LABELS,
  type PricingPlan,
  type ProgramCommissionCard,
  type CommissionRule,
  type BonusCampaign,
} from "@/lib/campus-ambassador/commission-structure.functions";

export const Route = createFileRoute("/_authenticated/ambassador/commission-structure")({
  head: () => ({
    meta: [
      { title: "Commission Structure — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommissionStructurePage,
});

function formatMoney(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function CommissionStructurePage() {
  const load = useServerFn(getAmbassadorCommissionStructure);
  const query = useQuery({
    queryKey: ["ambassador", "commission-structure"],
    queryFn: () => load(),
  });

  return (
    <AmbassadorShell>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Header />
        <PremiumBanner rate={query.data?.summary.highestAvailableRate ?? 40} />

        {query.isLoading ? (
          <SummarySkeleton />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (
          <>
            <SummaryCards summary={query.data!.summary} />
            <EstimatorCard programs={query.data!.programs} />
            <ProgramSection programs={query.data!.programs} />
            <CampaignsSection campaigns={query.data!.campaigns} />
            <RatesTimelineSection allRules={query.data!.allRules} programs={query.data!.programs} />
          </>
        )}
      </div>
    </AmbassadorShell>
  );
}

function Header() {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">
        Campus Ambassador
      </div>
      <h1 className="font-display text-3xl lg:text-4xl font-semibold text-slate-900">
        Commission Structure
      </h1>
      <p className="text-slate-600 mt-1 text-sm max-w-2xl">
        View commission rates and bonus opportunities available for eligible Glintr programs.
        Commission rates may vary by program, pricing plan and active campaign.
      </p>
    </div>
  );
}

function PremiumBanner({ rate }: { rate: number }) {
  const display = Math.max(Math.round(rate), 40);
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700 text-white p-6 lg:p-8">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(6,182,212,0.6), transparent 40%), radial-gradient(circle at 80% 60%, rgba(163,230,53,0.4), transparent 40%)",
        }}
      />
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">
            <Sparkles className="h-3 w-3" /> Ambassador Rewards
          </div>
          <div className="font-display text-4xl lg:text-5xl font-bold mt-3">
            Earn Up To {display}% Commission
          </div>
          <p className="text-white/70 mt-2 text-sm max-w-xl">
            Commission rates may vary by program, pricing plan and active campaign. Actual rate is
            set per transaction from your active Commission Rule.
          </p>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-1 text-right">
          <Award className="h-16 w-16 text-lime-300" />
        </div>
      </div>
    </div>
  );
}

function SummaryCards({
  summary,
}: {
  summary: {
    eligibleProgramsCount: number;
    highestAvailableRate: number;
    activeCampaignsCount: number;
    commissionRulesCount: number;
  };
}) {
  const items = [
    {
      label: "Eligible Programs",
      value: summary.eligibleProgramsCount.toString(),
      icon: ScrollText,
    },
    {
      label: "Highest Available Rate",
      value: `${summary.highestAvailableRate.toFixed(0)}%`,
      icon: TrendingUp,
    },
    {
      label: "Active Bonus Campaigns",
      value: summary.activeCampaignsCount.toString(),
      icon: Gift,
    },
    {
      label: "Commission Rules Available",
      value: summary.commissionRulesCount.toString(),
      icon: Award,
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => (
        <Card key={it.label} className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">{it.label}</div>
            <it.icon className="h-4 w-4 text-slate-400" />
          </div>
          <div className="font-display text-2xl font-semibold mt-1">{it.value}</div>
        </Card>
      ))}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-16" />
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="p-10 text-center">
      <div className="font-display text-xl font-semibold">Unable To Load Commission Structure</div>
      <p className="text-slate-600 text-sm mt-1">Please try again in a moment.</p>
      <Button onClick={onRetry} className="mt-4" size="sm">
        Retry
      </Button>
    </Card>
  );
}

function ProgramSection({ programs }: { programs: ProgramCommissionCard[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<
    "all" | "highest" | "bonus" | "campaign" | "percentage" | "fixed"
  >("all");
  const [details, setDetails] = useState<{ slug: string; plan: PricingPlan } | null>(null);

  const filtered = useMemo(() => {
    let list = programs.slice();
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.program_name.toLowerCase().includes(s) ||
          (p.category ?? "").toLowerCase().includes(s),
      );
    }
    if (filter === "bonus" || filter === "campaign") list = list.filter((p) => p.has_bonus);
    if (filter === "percentage")
      list = list.filter((p) => p.best_rule?.commission_type === "percentage");
    if (filter === "fixed") list = list.filter((p) => p.best_rule?.commission_type === "fixed");
    if (filter === "highest")
      list = list.sort(
        (a, b) =>
          Number(b.best_rule?.commission_percentage ?? 0) -
          Number(a.best_rule?.commission_percentage ?? 0),
      );
    return list;
  }, [programs, q, filter]);

  if (!programs.length) {
    return (
      <Card className="p-10 text-center">
        <ScrollText className="h-10 w-10 mx-auto text-slate-300" />
        <div className="font-display text-xl font-semibold mt-3">
          No Commission Rates Available
        </div>
        <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
          Campus Ambassador commission rates will appear here when eligible program commission
          rules are published.
        </p>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold">Program Commission Rates</h2>
          <p className="text-xs text-slate-500">
            Actual rates come from active Commission Rules — read-only for Ambassadors.
          </p>
        </div>
        <div className="flex gap-2 items-center flex-1 lg:flex-none min-w-[240px]">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search programs"
              className="pl-8 h-9"
            />
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Eligible Programs</SelectItem>
              <SelectItem value="highest">Highest Commission</SelectItem>
              <SelectItem value="bonus">Bonus Available</SelectItem>
              <SelectItem value="campaign">Active Campaign</SelectItem>
              <SelectItem value="percentage">Percentage Commission</SelectItem>
              <SelectItem value="fixed">Fixed Commission</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <ProgramCard
            key={p.program_id}
            program={p}
            onView={(plan) => setDetails({ slug: p.program_slug, plan })}
          />
        ))}
      </div>

      <Dialog open={!!details} onOpenChange={(o) => !o && setDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {details && (
            <CommissionDetailsView slug={details.slug} plan={details.plan} />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ProgramCard({
  program,
  onView,
}: {
  program: ProgramCommissionCard;
  onView: (plan: PricingPlan) => void;
}) {
  const best = program.best_rule;
  const rateLabel =
    best?.commission_type === "fixed" && best.fixed_amount != null
      ? formatMoney(best.fixed_amount)
      : `${Number(best?.commission_percentage ?? 0).toFixed(0)}%`;

  const bestPlan =
    program.plans.find(
      (p) =>
        p.rule &&
        Number(p.rule.commission_percentage) ===
          Number(best?.commission_percentage ?? 0),
    ) ?? program.plans[program.plans.length - 1];

  return (
    <Card className="p-4 flex flex-col gap-3 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">
            {program.category ?? "Program"}
          </div>
          <div className="font-display font-semibold text-slate-900 truncate">
            {program.program_name}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{bestPlan.plan_label}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl font-semibold text-emerald-600 leading-none">
            {rateLabel}
          </div>
          <div className="text-[10px] uppercase text-slate-400 mt-1">
            {best?.commission_type === "fixed" ? "Per Enrollment" : "Commission"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {program.plans.map((p) =>
          p.rule ? (
            <Badge
              key={p.plan}
              variant="muted"
              className="text-[10px] font-medium"
            >
              {p.plan_label}: {p.rule.commission_type === "fixed" && p.rule.fixed_amount
                ? formatMoney(p.rule.fixed_amount)
                : `${Number(p.rule.commission_percentage).toFixed(0)}%`}
            </Badge>
          ) : null,
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1.5">
          {program.has_bonus && (
            <Badge className="bg-lime-100 text-lime-800 hover:bg-lime-100 text-[10px]">
              <Gift className="h-3 w-3 mr-1" /> Bonus Available
            </Badge>
          )}
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">
            Active
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const url = `${window.location.origin}/r/ca/${program.program_slug}`;
              navigator.clipboard.writeText(url);
              toast.success("Program link copied — share via your referral");
            }}
            className="h-8"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={() => onView(bestPlan.plan)} className="h-8">
            View Details <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CommissionDetailsView({ slug, plan }: { slug: string; plan: PricingPlan }) {
  const load = useServerFn(getAmbassadorCommissionRuleDetails);
  const [selPlan, setSelPlan] = useState<PricingPlan>(plan);
  const q = useQuery({
    queryKey: ["ambassador", "rule-details", slug, selPlan],
    queryFn: () => load({ data: { programSlug: slug, plan: selPlan } }),
  });

  if (q.isLoading) return <Skeleton className="h-64 w-full" />;
  if (q.isError || !q.data) return <div className="text-sm text-slate-600">Unable to load details.</div>;

  const { course, currentRule, upcoming, previous, relatedCampaigns, plans } = q.data;
  const eligibleBase = course.offer_price ?? 0;
  const percent = currentRule ? Number(currentRule.commission_percentage) : 0;
  const estimated =
    currentRule?.commission_type === "fixed" && currentRule.fixed_amount != null
      ? currentRule.fixed_amount
      : (eligibleBase * percent) / 100;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">{course.name}</DialogTitle>
        <DialogDescription>Commission Details · Read-only</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {plans.map((p) => (
            <button
              key={p.plan}
              onClick={() => setSelPlan(p.plan)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                p.plan === selPlan
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
              }`}
            >
              {p.plan_label} ·{" "}
              {p.rule
                ? p.rule.commission_type === "fixed" && p.rule.fixed_amount
                  ? formatMoney(p.rule.fixed_amount)
                  : `${Number(p.rule.commission_percentage).toFixed(0)}%`
                : "—"}
            </button>
          ))}
        </div>

        {currentRule ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Program" value={course.name} />
              <Field label="Pricing Plan" value={PRICING_PLAN_LABELS[selPlan]} />
              <Field
                label="Commission Type"
                value={
                  currentRule.commission_type === "fixed"
                    ? "Fixed Commission"
                    : currentRule.commission_type === "bonus"
                      ? "Bonus Commission"
                      : "Percentage Commission"
                }
              />
              <Field
                label="Commission Rate"
                value={
                  currentRule.commission_type === "fixed" && currentRule.fixed_amount != null
                    ? formatMoney(currentRule.fixed_amount)
                    : `${percent.toFixed(0)}%`
                }
              />
              <Field
                label="Commission Base"
                value={currentRule.base_definition.replaceAll("_", " ")}
              />
              <Field
                label="Effective From"
                value={new Date(currentRule.effective_from).toLocaleDateString()}
              />
              {currentRule.effective_to && (
                <Field
                  label="Effective Until"
                  value={new Date(currentRule.effective_to).toLocaleDateString()}
                />
              )}
              <Field label="Rule Status" value={currentRule.is_active ? "Active" : "Inactive"} />
              <Field label="Rule Version" value={`v${currentRule.version}`} />
              <Field label="Rule ID" value={currentRule.rule_code ?? currentRule.id.slice(0, 8)} />
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-100 rounded-xl p-4">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                How Your Commission Is Calculated · Example Only
              </div>
              {currentRule.commission_type === "fixed" ? (
                <div className="space-y-1 text-sm">
                  <Row k="Eligible Verified Enrollment" v="1" />
                  <Row k="Fixed Commission" v={formatMoney(currentRule.fixed_amount ?? 0)} />
                  <div className="border-t border-emerald-200 my-2" />
                  <Row
                    k="Estimated Commission"
                    v={formatMoney(currentRule.fixed_amount ?? 0)}
                    bold
                  />
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <Row
                    k="Eligible Commission Base"
                    v={eligibleBase ? formatMoney(eligibleBase) : "—"}
                  />
                  <Row k="Commission Rate" v={`${percent.toFixed(0)}%`} />
                  <div className="border-t border-emerald-200 my-2" />
                  <Row
                    k="Estimated Commission"
                    v={formatMoney(estimated)}
                    bold
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    {eligibleBase ? formatMoney(eligibleBase) : "₹0"} × {percent.toFixed(0)}% ={" "}
                    {formatMoney(estimated)}
                  </div>
                </div>
              )}
            </div>

            <EligibilityBlock rule={currentRule} />

            {relatedCampaigns.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                  Active Bonus Campaigns
                </div>
                <div className="flex gap-2 flex-wrap">
                  {relatedCampaigns.map((c: any) => (
                    <Badge key={c.id} className="bg-lime-100 text-lime-800 hover:bg-lime-100">
                      <Gift className="h-3 w-3 mr-1" /> {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <RateTimeline upcoming={upcoming} previous={previous} />
          </>
        ) : (
          <div className="text-sm text-slate-600 py-6 text-center">
            No published commission rule for this plan yet.
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className="text-sm text-slate-900 font-medium">{value}</div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-slate-600">{k}</div>
      <div className={bold ? "font-display text-lg font-semibold text-emerald-700" : "font-medium"}>
        {v}
      </div>
    </div>
  );
}

function EligibilityBlock({ rule }: { rule: CommissionRule }) {
  const conditions = [
    "Confirmed Referral Attribution",
    "Eligible Program",
    "Eligible Pricing Plan",
    "Payment Verification Required",
    "Enrollment Verification Required",
    "No Confirmed Refund",
    "No Payment Reversal",
    "Active Commission Rule",
  ];
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
        Eligibility Summary
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {conditions.map((c) => (
          <div key={c} className="flex items-center gap-1.5 text-xs text-slate-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            {c}
          </div>
        ))}
      </div>
      {rule.eligibility_notes && (
        <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">
          {rule.eligibility_notes}
        </div>
      )}
    </div>
  );
}

function RateTimeline({
  upcoming,
  previous,
}: {
  upcoming: CommissionRule[];
  previous: CommissionRule[];
}) {
  if (!upcoming.length && !previous.length) return null;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {upcoming.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            Upcoming Commission Rates
          </div>
          <div className="space-y-1">
            {upcoming.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs bg-blue-50 rounded p-2">
                <span>
                  {r.pricing_plan
                    ? PRICING_PLAN_LABELS[r.pricing_plan as PricingPlan] ?? r.pricing_plan
                    : "All Plans"}
                </span>
                <span className="font-semibold">
                  {r.commission_type === "fixed" && r.fixed_amount
                    ? formatMoney(r.fixed_amount)
                    : `${Number(r.commission_percentage).toFixed(0)}%`}{" "}
                  · {new Date(r.effective_from).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {previous.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            Previous Commission Rates
          </div>
          <div className="space-y-1">
            {previous.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs bg-slate-50 rounded p-2">
                <span>
                  {r.pricing_plan
                    ? PRICING_PLAN_LABELS[r.pricing_plan as PricingPlan] ?? r.pricing_plan
                    : "All Plans"}
                </span>
                <span>
                  {Number(r.commission_percentage).toFixed(0)}% · Expired
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RatesTimelineSection({
  allRules,
  programs,
}: {
  allRules: CommissionRule[];
  programs: ProgramCommissionCard[];
}) {
  const now = Date.now();
  const upcoming = allRules.filter(
    (r) => new Date(r.effective_from).getTime() > now && r.visibility === "published",
  );
  const previous = allRules.filter(
    (r) => r.effective_to && new Date(r.effective_to).getTime() < now,
  );
  const nameOf = (slug: string | null) =>
    slug ? programs.find((p) => p.program_slug === slug)?.program_name ?? slug : "All Programs";
  if (!upcoming.length && !previous.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">Rate History</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Upcoming Commission Rates
          </div>
          {upcoming.length ? (
            <div className="space-y-1.5">
              {upcoming.map((r) => (
                <div key={r.id} className="text-xs flex justify-between gap-2">
                  <span className="text-slate-700">
                    {nameOf(r.program_id)} ·{" "}
                    {r.pricing_plan
                      ? PRICING_PLAN_LABELS[r.pricing_plan as PricingPlan] ?? r.pricing_plan
                      : "All Plans"}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {Number(r.commission_percentage).toFixed(0)}% ·{" "}
                    {new Date(r.effective_from).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">No upcoming rate changes published.</div>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            Previous Commission Rates
          </div>
          {previous.length ? (
            <div className="space-y-1.5">
              {previous.map((r) => (
                <div key={r.id} className="text-xs flex justify-between gap-2">
                  <span className="text-slate-700">
                    {nameOf(r.program_id)} ·{" "}
                    {r.pricing_plan
                      ? PRICING_PLAN_LABELS[r.pricing_plan as PricingPlan] ?? r.pricing_plan
                      : "All Plans"}
                  </span>
                  <span className="text-slate-500">
                    {Number(r.commission_percentage).toFixed(0)}% · Expired
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">No previous rate changes recorded.</div>
          )}
        </Card>
      </div>
    </section>
  );
}

function CampaignsSection({ campaigns }: { campaigns: BonusCampaign[] }) {
  if (!campaigns.length) {
    return (
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Bonus Campaigns</h2>
        <Card className="p-8 text-center">
          <Gift className="h-8 w-8 mx-auto text-slate-300" />
          <div className="font-display text-lg font-semibold mt-2">
            No Active Bonus Campaigns
          </div>
          <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
            New Campus Ambassador bonus campaigns will appear here when available.
          </p>
        </Card>
      </section>
    );
  }
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl font-semibold">Active Bonus Campaigns</h2>
        <p className="text-xs text-slate-500">
          Extra rewards on top of your base commission — subject to campaign terms.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </section>
  );
}

function CampaignCard({ campaign }: { campaign: BonusCampaign }) {
  const isMilestone = campaign.campaign_type === "milestone_bonus" && campaign.milestones.length > 0;
  const bonusValue =
    campaign.campaign_type === "percentage_bonus" && campaign.bonus_percentage != null
      ? `+${Number(campaign.bonus_percentage).toFixed(0)}%`
      : campaign.campaign_type === "fixed_bonus" && campaign.fixed_bonus_amount != null
        ? `+${formatMoney(campaign.fixed_bonus_amount)}`
        : isMilestone
          ? "Milestone Rewards"
          : "Bonus";

  return (
    <Card className="p-4 border-lime-200 bg-gradient-to-br from-white to-lime-50/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Badge className="bg-lime-100 text-lime-800 hover:bg-lime-100 text-[10px]">
            {campaign.campaign_type.replaceAll("_", " ").toUpperCase()}
          </Badge>
          <div className="font-display font-semibold mt-1.5">{campaign.name}</div>
          {campaign.description && (
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{campaign.description}</p>
          )}
        </div>
        <div className="font-display text-xl font-semibold text-lime-700 shrink-0">
          {bonusValue}
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
        <span>{new Date(campaign.starts_at).toLocaleDateString()}</span>
        {campaign.ends_at && <span>→ {new Date(campaign.ends_at).toLocaleDateString()}</span>}
        <Badge variant="outline" className="text-[10px]">
          {campaign.status.toUpperCase()}
        </Badge>
      </div>
      {isMilestone && (
        <div className="mt-3 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">My Progress</div>
          {campaign.milestones.map((m) => {
            const pct = Math.min(100, (m.my_progress / m.threshold_value) * 100);
            const remaining = Math.max(0, m.threshold_value - m.my_progress);
            return (
              <div key={m.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700">
                    {m.achieved && <Trophy className="h-3 w-3 inline mr-1 text-lime-600" />}
                    {m.name} · {formatMoney(m.bonus_amount)}
                  </span>
                  <span className="text-slate-500">
                    {m.my_progress} / {m.threshold_value}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
                {!m.achieved && remaining > 0 && (
                  <div className="text-[11px] text-slate-500">
                    {remaining} more to reach the milestone
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function EstimatorCard({ programs }: { programs: ProgramCommissionCard[] }) {
  const [slug, setSlug] = useState<string>(programs[0]?.program_slug ?? "");
  const [plan, setPlan] = useState<PricingPlan>("career_pro");
  const [amount, setAmount] = useState<string>("");
  const run = useServerFn(estimateAmbassadorCommission);
  const m = useMutation({
    mutationFn: (v: { programSlug: string; plan: PricingPlan; exampleAmount?: number }) =>
      run({ data: v }),
  });

  const submit = () => {
    if (!slug) return;
    const parsed = amount.trim() ? Number(amount) : undefined;
    m.mutate({
      programSlug: slug,
      plan,
      exampleAmount: parsed && !Number.isNaN(parsed) ? parsed : undefined,
    });
  };

  return (
    <Card className="p-4 lg:p-5">
      <Tabs defaultValue="estimator">
        <div className="flex items-center justify-between mb-3">
          <TabsList>
            <TabsTrigger value="estimator">
              <Calculator className="h-3.5 w-3.5 mr-1.5" /> Commission Estimator
            </TabsTrigger>
            <TabsTrigger value="applicable">
              <Info className="h-3.5 w-3.5 mr-1.5" /> My Applicable Commission
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="estimator" className="mt-0">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-400">
                Program
              </label>
              <Select value={slug} onValueChange={setSlug}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.program_slug} value={p.program_slug}>
                      {p.program_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-400">
                Pricing Plan
              </label>
              <Select value={plan} onValueChange={(v: any) => setPlan(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICING_PLANS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRICING_PLAN_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-400">
                Eligible Amount (₹) · Optional
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Auto"
                className="h-9"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={submit} disabled={m.isPending || !slug} className="w-full h-9">
                {m.isPending ? "Calculating…" : "Estimate"}
              </Button>
            </div>
          </div>

          {m.data && (
            <div className="mt-4 rounded-xl bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-100 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  Estimate Only — Final commission uses your actual eligibility event
                </div>
                {m.data.rule?.rule_code && (
                  <Badge variant="outline" className="text-[10px]">
                    {m.data.rule.rule_code}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                <Field label="Program" value={m.data.programName} />
                <Field label="Plan" value={m.data.planLabel} />
                <Field
                  label="Eligible Base"
                  value={m.data.eligibleAmount ? formatMoney(m.data.eligibleAmount) : "—"}
                />
                <Field
                  label="Base Rate"
                  value={
                    m.data.rule?.commission_type === "fixed"
                      ? formatMoney(m.data.rule.fixed_amount ?? 0)
                      : `${m.data.baseRate.toFixed(0)}%`
                  }
                />
                {m.data.bonusRate > 0 && (
                  <Field label="Campaign Bonus" value={`+${m.data.bonusRate.toFixed(0)}%`} />
                )}
                {m.data.fixedBonus > 0 && (
                  <Field label="Fixed Bonus" value={`+${formatMoney(m.data.fixedBonus)}`} />
                )}
                {m.data.maxCap && (
                  <Field label="Max Cap" value={`${m.data.maxCap.toFixed(0)}%`} />
                )}
                <Field
                  label="Effective Rate"
                  value={`${m.data.effectiveRate.toFixed(0)}%`}
                />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-emerald-100 pt-3">
                <div className="text-sm text-slate-600">Estimated Commission</div>
                <div className="font-display text-2xl font-semibold text-emerald-700">
                  {formatMoney(m.data.estimatedCommission)}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="applicable" className="mt-0">
          <ApplicableCommission programs={programs} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function ApplicableCommission({ programs }: { programs: ProgramCommissionCard[] }) {
  const [slug, setSlug] = useState(programs[0]?.program_slug ?? "");
  const [plan, setPlan] = useState<PricingPlan>("career_pro");
  const program = programs.find((p) => p.program_slug === slug);
  const rule = program?.plans.find((p) => p.plan === plan)?.rule ?? null;

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <Select value={slug} onValueChange={setSlug}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {programs.map((p) => (
              <SelectItem key={p.program_slug} value={p.program_slug}>
                {p.program_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={plan} onValueChange={(v: any) => setPlan(v)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRICING_PLANS.map((p) => (
              <SelectItem key={p} value={p}>
                {PRICING_PLAN_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {rule ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl border p-4">
          <Field label="Program" value={program!.program_name} />
          <Field label="Plan" value={PRICING_PLAN_LABELS[plan]} />
          <Field
            label="Base Commission"
            value={
              rule.commission_type === "fixed" && rule.fixed_amount != null
                ? formatMoney(rule.fixed_amount)
                : `${Number(rule.commission_percentage).toFixed(0)}%`
            }
          />
          <Field
            label="Effective From"
            value={new Date(rule.effective_from).toLocaleDateString()}
          />
        </div>
      ) : (
        <div className="text-sm text-slate-500 py-6 text-center">
          No published commission rule for this program &amp; plan yet.
        </div>
      )}
      <div className="text-[11px] text-slate-500 flex items-start gap-1.5">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        Informational only. Final commission is calculated during your actual eligibility event using
        backend rule resolution.
      </div>
    </div>
  );
}
