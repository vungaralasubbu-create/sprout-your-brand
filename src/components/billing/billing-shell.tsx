import { Link, useLocation } from "@tanstack/react-router";
import { CreditCard, Sparkles, BarChart3, Receipt, Wallet, History, TicketPercent } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/billing", label: "Overview", icon: CreditCard, exact: true },
  { to: "/billing/plans", label: "Plans", icon: Sparkles },
  { to: "/billing/usage", label: "Usage", icon: BarChart3 },
  { to: "/billing/invoices", label: "Invoices", icon: Receipt },
  { to: "/billing/payment-methods", label: "Payment methods", icon: Wallet },
  { to: "/billing/history", label: "History", icon: History },
  { to: "/billing/coupons", label: "Coupons", icon: TicketPercent },
] as const;

export function BillingShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Billing</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Subscription & usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your plan, credits, invoices, payment methods, and coupons.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b pb-2 overflow-x-auto">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to as any}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function formatInr(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}
