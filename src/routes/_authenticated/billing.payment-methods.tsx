import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Wallet, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listPaymentMethods } from "@/lib/billing/billing.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing/payment-methods")({
  component: PaymentMethodsPage,
});

function PaymentMethodsPage() {
  const get = useServerFn(listPaymentMethods);
  const q = useQuery({ queryKey: ["billing-methods"], queryFn: () => get({}) });
  const methods = q.data?.methods ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <div className="text-sm font-semibold">Saved payment methods</div>
            <p className="mt-0.5 text-xs text-muted-foreground">Cards, UPI, and net banking accounts saved for faster checkout.</p>
          </div>
          <Button
            onClick={() => toast.info("Add a payment method by completing a purchase — it'll be saved automatically after your first successful charge.")}
          >
            <Plus className="mr-1 h-4 w-4" /> Add method
          </Button>
        </div>
        {q.isLoading ? (
          <div className="h-32 animate-pulse bg-muted/40" />
        ) : methods.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-medium">No payment methods yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Your saved cards and UPI IDs will appear here once you complete your first payment.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {methods.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="capitalize">{m.method_type}</span>
                      {m.brand && <span className="text-sm text-muted-foreground">· {m.brand}</span>}
                      {m.last4 && <span className="text-sm text-muted-foreground">•••• {m.last4}</span>}
                      {m.upi_handle && <span className="text-sm text-muted-foreground">{m.upi_handle}</span>}
                      {m.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                          <Star className="h-3 w-3" /> Default
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {m.exp_month && m.exp_year ? `Expires ${String(m.exp_month).padStart(2, "0")}/${m.exp_year}` : `Provider: ${m.provider}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!m.is_default && (
                    <Button variant="outline" size="sm" onClick={() => toast.info("Coming soon")}><Star className="mr-1 h-3 w-3" /> Set default</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => toast.info("Coming soon")}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">🔒 Security</div>
        <p className="mt-1">
          We never store raw card data. All payment methods are tokenized by the payment provider (Cashfree by default) and referenced by a
          secure token. Payment method management follows PCI-DSS compliance guidelines.
        </p>
      </div>
    </div>
  );
}
