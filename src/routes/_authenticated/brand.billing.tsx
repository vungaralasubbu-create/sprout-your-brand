import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard, StatCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, HardDrive, Users } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/billing")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/billing", title: "Billing — Glintr", description: "White Label OS", noindex: true }),
  component: Billing,
});

const PLANS = [
  { id: "starter", label: "Starter", price: "₹9,999 / mo", features: ["Up to 100 learners", "Basic branding", "Community support"] },
  { id: "growth", label: "Growth", price: "₹24,000 / mo", features: ["Up to 500 learners", "Custom domain + SSL", "Priority support"] },
  { id: "scale", label: "Scale", price: "₹49,000 / mo", features: ["Unlimited learners", "Full white-label", "Dedicated CSM"] },
  { id: "enterprise", label: "Enterprise", price: "Custom", features: ["SAML SSO", "SLA & DPA", "Custom integrations"] },
] as const;

function Billing() {
  const [s, setS] = useState(loadState());
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);

  return (
    <>
      <BrandPageHeader eyebrow="Workspace" title="Billing" description="Plan, usage, invoices, and payment history." />
      <BrandBody>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Current plan" value={s.billing.plan.charAt(0).toUpperCase() + s.billing.plan.slice(1)} hint={`Renews ${new Date(s.billing.renewsOn).toLocaleDateString()}`} />
          <StatCard label="Team seats" value={`${s.team.length} / ${s.billing.seats}`} />
          <StatCard label="Storage" value={`${s.billing.storageGb} GB`} />
        </div>

        <GlassCard>
          <h3 className="font-display font-semibold mb-3">Plans</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((p) => (
              <div key={p.id} className={`rounded-xl border p-4 ${s.billing.plan === p.id ? "border-primary bg-primary/5" : "bg-white"}`}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.label}</div>
                  {s.billing.plan === p.id && <span className="text-[10px] font-mono uppercase tracking-widest text-primary">Current</span>}
                </div>
                <div className="mt-1 text-lg font-display font-semibold">{p.price}</div>
                <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {p.features.map((f) => <li key={f} className="flex gap-2"><CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />{f}</li>)}
                </ul>
                {s.billing.plan !== p.id && (
                  <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => updateState((x) => { x.billing.plan = p.id as any; })}>
                    {PLANS.findIndex((pp) => pp.id === s.billing.plan) < PLANS.findIndex((pp) => pp.id === p.id) ? "Upgrade" : "Switch"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display font-semibold mb-3">Invoices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <tr><th className="text-left px-3 py-2">Invoice</th><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Amount</th><th className="text-left px-3 py-2">Status</th></tr>
              </thead>
              <tbody>
                {s.billing.invoices.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="px-3 py-2 font-mono">{inv.id}</td>
                    <td className="px-3 py-2">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2 tabular-nums">₹{inv.amount.toLocaleString()}</td>
                    <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] capitalize ${inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </BrandBody>
    </>
  );
}
