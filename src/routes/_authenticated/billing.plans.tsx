import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { listPlans, getBillingOverview, startCheckout, validateCoupon } from "@/lib/billing/billing.functions";
import { formatInr } from "@/components/billing/billing-shell";

export const Route = createFileRoute("/_authenticated/billing/plans")({
  component: Plans,
});

function Plans() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  const lp = useServerFn(listPlans);
  const ov = useServerFn(getBillingOverview);
  const co = useServerFn(startCheckout);
  const vc = useServerFn(validateCoupon);

  const plansQ = useQuery({ queryKey: ["billing-plans"], queryFn: () => lp({}) });
  const overviewQ = useQuery({ queryKey: ["billing-overview"], queryFn: () => ov({}) });

  const validateMut = useMutation({
    mutationFn: () => vc({ data: { code: coupon.trim() } }),
    onSuccess: (r) => {
      if (r.valid) { setAppliedCoupon(r.coupon); toast.success("Coupon applied"); }
      else { setAppliedCoupon(null); toast.error(r.reason ?? "Invalid coupon"); }
    },
  });

  const checkoutMut = useMutation({
    mutationFn: async (planCode: string) => {
      setSelecting(planCode);
      const origin = window.location.origin;
      return co({
        data: {
          planCode,
          billingCycle: cycle,
          couponCode: appliedCoupon?.code,
          provider: "cashfree",
          successUrl: `${origin}/billing`,
          cancelUrl: `${origin}/billing/plans`,
        },
      });
    },
    onSettled: () => setSelecting(null),
    onSuccess: (r: any) => {
      if (r.paymentUrl) window.location.href = r.paymentUrl;
      else if (r.paymentSessionId) {
        toast.success(`Order ${r.orderId} created. Complete payment in Cashfree checkout.`);
      } else {
        toast.info("Checkout initialized");
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Checkout failed"),
  });

  const currentPlan = (overviewQ.data as any)?.subscription?.bill_plans?.code ?? "free";
  const plans = plansQ.data?.plans ?? [];

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-2">
        <div className="inline-flex items-center rounded-full border bg-card p-1">
          {(["monthly", "yearly"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
                cycle === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
              {c === "yearly" && <span className="ml-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-600">Save 17%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Coupon */}
      <div className="mx-auto flex max-w-md items-center gap-2">
        <input
          type="text"
          placeholder="Coupon code"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <Button onClick={() => validateMut.mutate()} disabled={!coupon || validateMut.isPending} variant="outline">
          {validateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>

      {/* Plan grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {plansQ.isLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted/40" />)}
        {plans.map((p: any) => {
          const price = cycle === "yearly" ? Number(p.yearly_price_inr) : Number(p.monthly_price_inr);
          const isEnterprise = p.tier === "enterprise";
          const isCurrent = p.code === currentPlan;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 transition",
                p.is_recommended && "border-primary shadow-xl shadow-primary/10",
              )}
            >
              {p.is_recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow">
                  <Sparkles className="mr-1 inline h-3 w-3" /> Recommended
                </div>
              )}
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{p.tagline}</div>
              <div className="mt-4 flex items-baseline gap-1">
                {isEnterprise ? (
                  <div className="text-3xl font-semibold">Custom</div>
                ) : price === 0 ? (
                  <div className="text-3xl font-semibold">Free</div>
                ) : (
                  <>
                    <div className="text-3xl font-semibold">{formatInr(price)}</div>
                    <div className="text-xs text-muted-foreground">/{cycle === "yearly" ? "yr" : "mo"}</div>
                  </>
                )}
              </div>
              {p.trial_days > 0 && !isEnterprise && (
                <div className="mt-1 text-xs text-emerald-600">Includes {p.trial_days}-day free trial</div>
              )}
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {(p.features ?? []).map((f: string) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5 w-full"
                variant={isCurrent ? "outline" : p.is_recommended ? "primary" : "outline"}
                disabled={isCurrent || checkoutMut.isPending}
                onClick={() => {
                  if (isEnterprise) { window.location.href = "mailto:sales@glintr.com?subject=Enterprise%20plan"; return; }
                  if (price === 0) { toast.info("You're already on the free tier when you sign up."); return; }
                  checkoutMut.mutate(p.code);
                }}
              >
                {selecting === p.code ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isCurrent ? "Current plan" : isEnterprise ? "Contact sales" : price === 0 ? "Free forever" : "Upgrade"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
        <div className="border-b p-5 text-sm font-semibold">Plan comparison</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="p-3 text-left font-medium">Feature</th>
                {plans.map((p: any) => (
                  <th key={p.id} className="p-3 text-center font-medium">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { label: "Projects", key: "projects" },
                { label: "AI credits", key: "ai_credits" },
                { label: "Storage (GB)", key: "storage_gb" },
                { label: "Team members", key: "team_members" },
                { label: "Workspaces", key: "workspaces" },
              ].map((row) => (
                <tr key={row.key}>
                  <td className="p-3 text-muted-foreground">{row.label}</td>
                  {plans.map((p: any) => {
                    const v = p.limits?.[row.key];
                    return (
                      <td key={p.id} className="p-3 text-center font-medium">
                        {v === -1 ? "Unlimited" : v === undefined ? "—" : v.toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
