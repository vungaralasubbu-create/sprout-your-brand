import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { TicketPercent, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listCoupons, validateCoupon } from "@/lib/billing/billing.functions";
import { formatInr } from "@/components/billing/billing-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing/coupons")({
  component: CouponsPage,
});

function CouponsPage() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const lc = useServerFn(listCoupons);
  const vc = useServerFn(validateCoupon);
  const q = useQuery({ queryKey: ["billing-coupons"], queryFn: () => lc({}) });

  const check = useMutation({
    mutationFn: () => vc({ data: { code: code.trim() } }),
    onSuccess: (r) => {
      if (r.valid) toast.success(`✓ ${r.coupon?.code} is valid — apply it at checkout`);
      else toast.error(r.reason ?? "Invalid coupon");
    },
  });

  const coupons = q.data?.coupons ?? [];

  return (
    <div className="space-y-6">
      {/* Redeem card */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="text-sm font-semibold">Redeem a coupon</div>
        <p className="mt-1 text-xs text-muted-foreground">Enter a code to check if it's valid. Apply it during checkout on the Plans page.</p>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="ENTER CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm font-mono outline-none focus:border-primary"
          />
          <Button onClick={() => check.mutate()} disabled={!code || check.isPending}>
            {check.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
          </Button>
        </div>
      </div>

      {/* Available coupons */}
      <div className="rounded-2xl border bg-card">
        <div className="border-b p-5 text-sm font-semibold">Available coupons</div>
        {q.isLoading ? (
          <div className="h-32 animate-pulse bg-muted/40" />
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <TicketPercent className="h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No active coupons</div>
            <p className="mt-1 text-sm text-muted-foreground">When promotions run, valid coupons for your workspace will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {coupons.map((c: any) => {
              const label = c.kind === "percentage" ? `${c.percent_off}% off` : c.kind === "flat_amount" ? `${formatInr(c.amount_off_inr)} off` : `+${c.free_trial_days} trial days`;
              return (
                <div key={c.id} className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-lg font-bold tracking-wider">{c.code}</div>
                      <div className="mt-0.5 text-sm font-medium text-primary">{label}</div>
                      {c.expires_at && (
                        <div className="mt-1 text-xs text-muted-foreground">Expires {new Date(c.expires_at).toLocaleDateString()}</div>
                      )}
                      {c.max_redemptions && (
                        <div className="text-xs text-muted-foreground">{c.redemptions_used}/{c.max_redemptions} used</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(c.code);
                        setCopied(c.code);
                        toast.success("Copied");
                        setTimeout(() => setCopied(null), 2000);
                      }}
                      className="rounded-md border bg-background p-2 hover:bg-muted"
                    >
                      {copied === c.code ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
